from models.invitation import Invitation
from models.organization import Organization, OrganizationMember
from models.user import User
from datetime import datetime
import uuid
from ..middleware.audit_middleware import audit_action
from app import db

class InvitationService:
    """Service pour gérer les invitations aux organisations"""
    
    @audit_action('create', 'invitation', 'Invitation envoyée à {email} avec le rôle {role}')
    def create_invitation(self, organization_id, email, role, created_by, message=None, expires_in_days=7):
        """
        Crée une invitation pour rejoindre une organisation
        
        Args:
            organization_id: ID de l'organisation
            email: Email de la personne invitée
            role: Rôle proposé (user, admin, owner)
            created_by: ID de l'utilisateur qui crée l'invitation
            message: Message personnalisé (optionnel)
            expires_in_days: Durée de validité en jours
            
        Returns:
            L'objet Invitation créé
        """
        # Vérifier que l'organisation existe
        organization = Organization.query.get(organization_id)
        if not organization:
            raise ValueError(f"Organisation introuvable: {organization_id}")
        
        # Vérifier que l'utilisateur n'est pas déjà membre
        existing_member = OrganizationMember.query.join(User).filter(
            OrganizationMember.organization_id == organization_id,
            User.email == email
        ).first()
        
        if existing_member:
            raise ValueError(f"L'utilisateur avec l'email {email} est déjà membre de l'organisation")
        
        # Vérifier si une invitation est déjà en cours pour cet email
        existing_invitation = Invitation.query.filter_by(
            organization_id=organization_id,
            email=email,
            status='pending'
        ).first()
        
        if existing_invitation:
            raise ValueError(f"Une invitation est déjà en cours pour {email}")
        
        # Vérifier les limites du plan
        if not self.subscription_service.check_member_limit(organization_id):
            raise ValueError("La limite de membres pour votre plan a été atteinte")
        
        # Générer un token unique
        token = str(uuid.uuid4())
        
        # Créer l'invitation
        invitation = Invitation(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            created_by=created_by,
            email=email.lower(),
            role=role,
            token=token,
            status='pending',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        # Enregistrer l'action dans les logs d'audit
        self.audit_service.log_action(
            organization_id=organization_id,
            user_id=created_by,
            action='create',
            entity_type='invitation',
            entity_id=invitation.id,
            description=f"Invitation envoyée à {email} avec le rôle {role}"
        )
        
        # Envoyer l'email d'invitation
        try:
            self.email_service.send_invitation_email(
                email=email,
                organization_name=organization.name,
                role=role,
                token=token,
                inviter_id=created_by,
                message=message
            )
        except Exception as e:
            # Enregistrer l'erreur mais ne pas annuler l'invitation
            print(f"Erreur lors de l'envoi de l'email d'invitation: {str(e)}")
        
        return invitation
    
    @audit_action('accept', 'invitation', 'Invitation acceptée par l\'utilisateur {user_id}')    
    def get_invitation_by_token(self, token):
        # Récupérer l'invitation et vérifier sa validité
        pass
    
    @audit_action('cancel', 'invitation', 'Invitation à {email} annulée par {canceled_by}')    
    def accept_invitation(self, token, user_id=None, user_data=None):
        """
        Accepte une invitation
        
        Args:
            token: Token de l'invitation
            user_id: ID de l'utilisateur qui accepte (si déjà inscrit)
            user_data: Données pour créer un nouvel utilisateur (si nouveau)
            
        Returns:
            L'objet OrganizationMember créé
        """
        invitation = self.get_invitation_by_token(token)
        if not invitation:
            raise ValueError("Invitation invalide ou expirée")
        
        if invitation.status != 'pending':
            raise ValueError("Cette invitation a déjà été traitée")
        
        # Si l'utilisateur existe déjà
        if user_id:
            user = User.query.get(user_id)
            if not user:
                raise ValueError(f"Utilisateur introuvable: {user_id}")
            
            # Vérifier que l'email correspond
            if user.email.lower() != invitation.email.lower():
                raise ValueError("Cette invitation n'est pas destinée à cet utilisateur")
        
        # Si c'est un nouvel utilisateur
        elif user_data:
            # Créer le nouvel utilisateur
            from services.user_service import UserService
            user_service = UserService()
            user = user_service.create_user(
                name=user_data.get('name'),
                email=invitation.email,  # Utiliser l'email de l'invitation
                password=user_data.get('password')
            )
            user_id = user.id
        else:
            raise ValueError("Informations utilisateur manquantes")
        
        # Ajouter l'utilisateur à l'organisation
        member = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=invitation.organization_id,
            user_id=user_id,
            role=invitation.role
        )
        
        db.session.add(member)
        
        # Marquer l'invitation comme acceptée
        invitation.status = 'accepted'
        invitation.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Enregistrer l'action dans les logs d'audit
        self.audit_service.log_action(
            organization_id=invitation.organization_id,
            user_id=user_id,
            action='accept',
            entity_type='invitation',
            entity_id=invitation.id,
            description=f"{user.email} a rejoint l'organisation avec le rôle {invitation.role}"
        )
        
        # Envoyer une notification à l'administrateur
        try:
            organization = Organization.query.get(invitation.organization_id)
            self.email_service.send_invitation_accepted_notification(
                organization_name=organization.name,
                admin_id=invitation.created_by,
                new_member_email=invitation.email,
                new_member_name=user.name,
                role=invitation.role
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de la notification: {str(e)}")
        
        return member
        
    @audit_action('cancel', 'invitation', 'Invitation à {email} annulée par {canceled_by}')    
    def cancel_invitation(self, invitation_id, canceled_by):
        """Annule une invitation"""
        invitation = Invitation.query.get(invitation_id)
        if not invitation:
            raise ValueError(f"Invitation introuvable: {invitation_id}")
        
        if invitation.status != 'pending':
            raise ValueError(f"Cette invitation ne peut pas être annulée car elle n'est pas en attente")
        
        # Vérifier les permissions (seul un admin ou le créateur peut annuler)
        organization = Organization.query.get(invitation.organization_id)
        is_admin = OrganizationMember.query.filter_by(
            organization_id=invitation.organization_id,
            user_id=canceled_by,
            role='admin'
        ).first() is not None
        
        if not is_admin and invitation.created_by != canceled_by:
            raise ValueError("Vous n'avez pas la permission d'annuler cette invitation")
        
        invitation.status = 'canceled'
        invitation.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enregistrer l'action dans les logs d'audit
        self.audit_service.log_action(
            organization_id=invitation.organization_id,
            user_id=canceled_by,
            action='cancel',
            entity_type='invitation',
            entity_id=invitation.id,
            description=f"Invitation à {invitation.email} annulée"
        )
        
        # Envoyer un email d'annulation (optionnel)
        try:
            self.email_service.send_invitation_canceled_email(
                email=invitation.email,
                organization_name=organization.name
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email d'annulation: {str(e)}")
        
        return invitation
        
    @audit_action('resend', 'invitation', 'Invitation à {email} renvoyée par {resent_by}')    
    def resend_invitation(self, invitation_id, resent_by):
        """Renvoie une invitation"""
        invitation = Invitation.query.get(invitation_id)
        if not invitation:
            raise ValueError(f"Invitation introuvable: {invitation_id}")
        
        if invitation.status != 'pending':
            raise ValueError(f"Cette invitation ne peut pas être renvoyée car elle n'est pas en attente")
        
        # Vérifier les permissions (seul un admin ou le créateur peut renvoyer)
        organization = Organization.query.get(invitation.organization_id)
        is_admin = OrganizationMember.query.filter_by(
            organization_id=invitation.organization_id,
            user_id=resent_by,
            role='admin'
        ).first() is not None
        
        if not is_admin and invitation.created_by != resent_by:
            raise ValueError("Vous n'avez pas la permission de renvoyer cette invitation")
        
        # Rafraîchir la date d'expiration
        invitation.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enregistrer l'action dans les logs d'audit
        self.audit_service.log_action(
            organization_id=invitation.organization_id,
            user_id=resent_by,
            action='resend',
            entity_type='invitation',
            entity_id=invitation.id,
            description=f"Invitation à {invitation.email} renvoyée"
        )
        
        # Renvoyer l'email d'invitation
        try:
            self.email_service.send_invitation_email(
                email=invitation.email,
                organization_name=organization.name,
                role=invitation.role,
                token=invitation.token,
                inviter_id=resent_by
            )
        except Exception as e:
            print(f"Erreur lors du renvoi de l'email d'invitation: {str(e)}")
        
        return invitation

    def create_bulk_invitations(self, organization_id, emails, role, created_by, message=None, expires_in_days=7):
        """
        Crée plusieurs invitations à la fois
        
        Args:
            organization_id: ID de l'organisation
            emails: Liste d'emails à inviter
            role: Rôle proposé (user, admin, owner)
            created_by: ID de l'utilisateur qui crée les invitations
            message: Message personnalisé (optionnel)
            expires_in_days: Durée de validité en jours
            
        Returns:
            Liste des invitations créées
        """
        if not emails:
            return []
        
        # Vérifier que l'organisation existe
        organization = Organization.query.get(organization_id)
        if not organization:
            raise ValueError(f"Organisation introuvable: {organization_id}")
        
        # Vérifier les limites du plan
        current_members = OrganizationMember.query.filter_by(organization_id=organization_id).count()
        current_invitations = Invitation.query.filter_by(organization_id=organization_id, status='pending').count()
        total_after = current_members + current_invitations + len(emails)
        
        plan_limits = self.subscription_service.get_plan_limits(
            self.subscription_service.get_user_plan(created_by)
        )
        
        if plan_limits['max_members'] > 0 and total_after > plan_limits['max_members']:
            raise ValueError(f"Cette opération dépasserait la limite de membres pour votre plan ({plan_limits['max_members']})")
        
        created_invitations = []
        failed_emails = []
        
        for email in emails:
            try:
                invitation = self.create_invitation(
                    organization_id=organization_id,
                    email=email,
                    role=role,
                    created_by=created_by,
                    message=message,
                    expires_in_days=expires_in_days
                )
                created_invitations.append(invitation)
            except Exception as e:
                failed_emails.append({"email": email, "error": str(e)})
        
        return {
            "created": created_invitations,
            "failed": failed_emails
        }
    
    def get_invitation_by_token(self, token):
        """Récupère une invitation à partir de son token"""
        return Invitation.query.filter_by(token=token).first()
    
    def get_organization_invitations(self, organization_id):
        """Récupère toutes les invitations en cours pour une organisation"""
        return Invitation.query.filter_by(
            organization_id=organization_id
        ).order_by(Invitation.created_at.desc()).all()
    
    def get_pending_invitations(self, organization_id):
        """Récupère les invitations en attente pour une organisation"""
        return Invitation.query.filter_by(
            organization_id=organization_id,
            status='pending'
        ).order_by(Invitation.created_at.desc()).all()
    