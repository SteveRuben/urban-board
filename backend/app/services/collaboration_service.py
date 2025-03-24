# backend/services/collaboration_service.py
from flask import current_app
from ..models.collaboration import InterviewShare, Comment, CollaborationActivity, Team, TeamMember, TeamInterviewAccess, TeamNote
from ..models.user import User
from ..models.interview import Interview
from app import db
from datetime import datetime, timedelta
from ..services.notification_service import NotificationService
from ..services.websocket_service import WebSocketService
import uuid

class CollaborationService:
    def __init__(self):
        self.notification_service = NotificationService()
        self.websocket_service = WebSocketService()
    
    # ====== MÉTHODES DE PARTAGE INDIVIDUEL D'ENTRETIEN ======
    
    def share_interview(self, interview_id, owner_id, email, permission_level, expires_days=None):
        """
        Partage un entretien avec un autre utilisateur
        
        Args:
            interview_id (int): ID de l'entretien
            owner_id (int): ID du propriétaire
            email (str): Email de l'utilisateur avec qui partager
            permission_level (str): Niveau de permission (viewer, commenter, editor)
            expires_days (int, optional): Nombre de jours avant expiration
            
        Returns:
            InterviewShare: Le partage créé
        """
        # Vérifier que l'entretien existe et que l'utilisateur est le propriétaire
        interview = Interview.query.get(interview_id)
        if not interview:
            raise ValueError("Entretien non trouvé")
        
        if interview.recruiter_id != owner_id:
            # Vérifier si l'utilisateur est admin
            owner = User.query.get(owner_id)
            if not owner or owner.role != 'admin':
                raise ValueError("Vous n'êtes pas autorisé à partager cet entretien")
        
        # Trouver l'utilisateur avec qui partager
        shared_with_user = User.query.filter_by(email=email).first()
        if not shared_with_user:
            raise ValueError(f"Aucun utilisateur trouvé avec l'email {email}")
        
        # Vérifier si l'entretien est déjà partagé avec cet utilisateur
        existing_share = InterviewShare.query.filter_by(
            interview_id=interview_id,
            shared_with_id=shared_with_user.id
        ).first()
        
        # Calculer la date d'expiration si demandée
        expires_at = None
        if expires_days and expires_days > 0:
            expires_at = datetime.utcnow() + timedelta(days=expires_days)
        
        if existing_share:
            # Mettre à jour le partage existant
            existing_share.permission_level = permission_level
            existing_share.expires_at = expires_at
            db.session.commit()
            share = existing_share
        else:
            # Créer un nouveau partage
            share = InterviewShare(
                interview_id=interview_id,
                owner_id=owner_id,
                shared_with_id=shared_with_user.id,
                permission_level=permission_level,
                expires_at=expires_at
            )
            
            db.session.add(share)
            db.session.commit()
        
        # Enregistrer l'activité
        activity = CollaborationActivity(
            interview_id=interview_id,
            user_id=owner_id,
            activity_type='share',
            details={
                'shared_with_id': shared_with_user.id,
                'permission_level': permission_level,
                'expires_at': expires_at.isoformat() if expires_at else None
            }
        )
        db.session.add(activity)
        db.session.commit()
        
        # Envoyer une notification à l'utilisateur
        notification_data = {
            'type': "interview_shared",
            'title': "Entretien partagé avec vous",
            'message': f"Un entretien a été partagé avec vous par {User.query.get(owner_id).first_name} {User.query.get(owner_id).last_name}",
            'link': f"/interviews/{interview_id}/view",
            'data': {
                "interview_id": interview_id,
                "interview_title": interview.title or f"Entretien avec {interview.candidate_name}",
                "permission_level": permission_level,
                "shared_by": owner_id
            }
        }
        self.notification_service.create_notification(shared_with_user.id, notification_data)
        
        # Notification WebSocket en temps réel
        self.websocket_service.emit_notification(shared_with_user.id, {
            'type': 'interview_shared',
            'interviewId': interview_id,
            'interviewTitle': interview.title or f"Entretien avec {interview.candidate_name}",
            'sharedBy': f"{User.query.get(owner_id).first_name} {User.query.get(owner_id).last_name}"
        })
        
        return share
    
    def remove_share(self, interview_id, owner_id, shared_with_id):
        """
        Supprime le partage d'un entretien
        
        Args:
            interview_id (int): ID de l'entretien
            owner_id (int): ID du propriétaire
            shared_with_id (int): ID de l'utilisateur avec qui le partage est révoqué
            
        Returns:
            bool: True si succès
        """
        share = InterviewShare.query.filter_by(
            interview_id=interview_id,
            shared_with_id=shared_with_id
        ).first()
        
        if not share:
            raise ValueError("Partage non trouvé")
        
        if share.owner_id != owner_id:
            # Vérifier si l'utilisateur est admin
            owner = User.query.get(owner_id)
            if not owner or owner.role != 'admin':
                raise ValueError("Vous n'êtes pas autorisé à supprimer ce partage")
        
        # Récupérer des informations avant suppression
        interview = Interview.query.get(interview_id)
        interview_title = interview.title or f"Entretien avec {interview.candidate_name}" if interview else "Entretien"
        
        db.session.delete(share)
        
        # Enregistrer l'activité
        activity = CollaborationActivity(
            interview_id=interview_id,
            user_id=owner_id,
            activity_type='unshare',
            details={
                'shared_with_id': shared_with_id
            }
        )
        db.session.add(activity)
        db.session.commit()
        
        # Envoyer une notification
        notification_data = {
            'type': "access_revoked",
            'title': "Accès révoqué",
            'message': f"Votre accès à l'entretien '{interview_title}' a été révoqué",
            'data': {
                "interview_id": interview_id
            }
        }
        self.notification_service.create_notification(shared_with_id, notification_data)
        
        return True
    
    def get_shared_interviews(self, user_id):
        """
        Récupère les entretiens partagés avec l'utilisateur
        
        Args:
            user_id (int): ID de l'utilisateur
            
        Returns:
            list: Liste des entretiens partagés
        """
        # Entretiens partagés directement avec l'utilisateur
        shares = InterviewShare.query.filter_by(shared_with_id=user_id).all()
        
        # Équipes dont l'utilisateur est membre
        team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
        team_ids = [tm.team_id for tm in team_memberships]
        
        # Entretiens partagés avec les équipes
        team_shares = TeamInterviewAccess.query.filter(
            TeamInterviewAccess.team_id.in_(team_ids) if team_ids else False
        ).all()
        
        result = []
        
        # Traiter les partages directs
        for share in shares:
            # Vérifier si le partage n'a pas expiré
            if share.expires_at and share.expires_at < datetime.utcnow():
                continue
                
            # Récupérer les détails de l'entretien
            interview = Interview.query.get(share.interview_id)
            owner = User.query.get(share.owner_id)
            
            if interview and owner:
                result.append({
                    'interview_id': interview.id,
                    'title': interview.title or f"Entretien avec {interview.candidate_name}",
                    'candidate_name': interview.candidate_name,
                    'status': interview.status,
                    'shared_type': 'direct',
                    'owner': {
                        'id': owner.id,
                        'name': f"{owner.first_name} {owner.last_name}",
                        'email': owner.email
                    },
                    'permission_level': share.permission_level,
                    'created_at': share.created_at,
                    'expires_at': share.expires_at
                })
        
        # Traiter les partages d'équipe
        for share in team_shares:
            # Vérifier si le partage n'a pas expiré
            if share.expires_at and share.expires_at < datetime.utcnow():
                continue
                
            # Récupérer les détails de l'entretien et de l'équipe
            interview = Interview.query.get(share.interview_id)
            team = Team.query.get(share.team_id)
            
            if interview and team:
                result.append({
                    'interview_id': interview.id,
                    'title': interview.title or f"Entretien avec {interview.candidate_name}",
                    'candidate_name': interview.candidate_name,
                    'status': interview.status,
                    'shared_type': 'team',
                    'team': {
                        'id': team.id,
                        'name': team.name
                    },
                    'permission_level': share.permission_level,
                    'created_at': share.created_at,
                    'expires_at': share.expires_at
                })
        
        return result
    
    # ====== MÉTHODES DE COMMENTAIRES ======
    
    def add_comment(self, interview_id, user_id, content, timestamp=None):
        """
        Ajoute un commentaire à un entretien
        
        Args:
            interview_id (int): ID de l'entretien
            user_id (int): ID de l'utilisateur
            content (str): Contenu du commentaire
            timestamp (int, optional): Position dans l'entretien en secondes
            
        Returns:
            Comment: Le commentaire créé
        """
        # Vérifier que l'utilisateur a accès à l'entretien
        interview = Interview.query.get(interview_id)
        if not interview:
            raise ValueError("Entretien non trouvé")
        
        has_access = False
        if interview.recruiter_id == user_id:
            has_access = True
        else:
            # Vérifier partage direct
            share = InterviewShare.query.filter_by(
                interview_id=interview_id,
                shared_with_id=user_id
            ).first()
            if share and share.permission_level in ['commenter', 'editor']:
                if not share.expires_at or share.expires_at >= datetime.utcnow():
                    has_access = True
            
            # Vérifier partage via équipe
            if not has_access:
                team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
                team_ids = [tm.team_id for tm in team_memberships]
                
                if team_ids:
                    team_access = TeamInterviewAccess.query.filter(
                        TeamInterviewAccess.interview_id == interview_id,
                        TeamInterviewAccess.team_id.in_(team_ids),
                        TeamInterviewAccess.permission_level.in_(['commenter', 'editor'])
                    ).first()
                    
                    if team_access and (not team_access.expires_at or team_access.expires_at >= datetime.utcnow()):
                        has_access = True
        
        if not has_access:
            # Vérifier si l'utilisateur est admin
            user = User.query.get(user_id)
            if not user or user.role != 'admin':
                raise ValueError("Vous n'êtes pas autorisé à commenter cet entretien")
        
        comment = Comment(
            interview_id=interview_id,
            user_id=user_id,
            content=content,
            timestamp=timestamp
        )
        
        db.session.add(comment)
        
        # Enregistrer l'activité
        activity = CollaborationActivity(
            interview_id=interview_id,
            user_id=user_id,
            activity_type="comment",
            details={"timestamp": timestamp}
        )
        db.session.add(activity)
        
        db.session.commit()
        
        # Notifier le propriétaire de l'entretien si ce n'est pas lui qui commente
        if interview.recruiter_id != user_id:
            notification_data = {
                'type': "new_comment",
                'title': "Nouveau commentaire",
                'message': f"Nouveau commentaire sur votre entretien avec {interview.candidate_name}",
                'link': f"/interviews/{interview_id}/view",
                'data': {
                    "interview_id": interview_id,
                    "comment_id": comment.id,
                    "commenter_id": user_id
                }
            }
            self.notification_service.create_notification(interview.recruiter_id, notification_data)
            
            # Notification WebSocket
            user = User.query.get(user_id)
            self.websocket_service.emit_notification(interview.recruiter_id, {
                'type': 'new_comment',
                'interviewId': interview_id,
                'interviewTitle': interview.title or f"Entretien avec {interview.candidate_name}",
                'commenterId': user_id,
                'commenterName': f"{user.first_name} {user.last_name}" if user else "Utilisateur inconnu"
            })
            
        
        # Notifier les autres personnes avec qui l'entretien est partagé
        self._notify_others_about_comment(interview_id, comment.id, user_id)
        
        return comment
    
    def get_comments(self, interview_id, user_id):
        """
        Récupère tous les commentaires d'un entretien
        
        Args:
            interview_id (int): ID de l'entretien
            user_id (int): ID de l'utilisateur
            
        Returns:
            list: Liste des commentaires
        """
        # Vérifier que l'utilisateur a accès à l'entretien
        if not self._user_can_access_interview(interview_id, user_id):
            raise ValueError("Vous n'êtes pas autorisé à voir les commentaires de cet entretien")
        
        comments = Comment.query.filter_by(interview_id=interview_id).order_by(Comment.timestamp, Comment.created_at).all()
        
        # Enregistrer l'activité de visualisation
        activity = CollaborationActivity(
            interview_id=interview_id,
            user_id=user_id,
            activity_type="view_comments"
        )
        db.session.add(activity)
        db.session.commit()
        
        return [comment.to_dict() for comment in comments]
    
    # ====== MÉTHODES D'ÉQUIPE ======
    
    def create_team(self, name, description, user_id):
        """
        Crée une nouvelle équipe
        
        Args:
            name (str): Nom de l'équipe
            description (str): Description de l'équipe
            user_id (int): ID de l'utilisateur créateur
            
        Returns:
            Team: L'équipe créée
        """
        team = Team(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            created_by=user_id
        )
        
        # Ajouter le créateur comme admin
        team_member = TeamMember(
            id=str(uuid.uuid4()),
            team=team,
            user_id=user_id,
            role='admin'
        )
        
        db.session.add(team)
        db.session.add(team_member)
        db.session.commit()
        
        return team
    
    def get_user_teams(self, user_id):
        """
        Récupère les équipes d'un utilisateur
        
        Args:
            user_id (int): ID de l'utilisateur
            
        Returns:
            list: Liste des équipes
        """
        team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
        
        result = []
        for membership in team_memberships:
            team = Team.query.get(membership.team_id)
            if team:
                members_count = TeamMember.query.filter_by(team_id=team.id).count()
                interviews_count = TeamInterviewAccess.query.filter_by(team_id=team.id).count()
                
                result.append({
                    'id': team.id,
                    'name': team.name,
                    'description': team.description,
                    'created_at': team.created_at,
                    'created_by': team.created_by,
                    'members_count': members_count,
                    'interviews_count': interviews_count,
                    'user_role': membership.role
                })
        
        return result
    
    def get_team_details(self, team_id, user_id):
        """
        Récupère les détails d'une équipe
        
        Args:
            team_id (str): ID de l'équipe
            user_id (int): ID de l'utilisateur
            
        Returns:
            dict: Détails de l'équipe
        """
        # Vérifier que l'utilisateur est membre de l'équipe
        membership = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
        if not membership:
            raise ValueError("Vous n'êtes pas membre de cette équipe")
        
        team = Team.query.get(team_id)
        if not team:
            raise ValueError("Équipe non trouvée")
        
        # Récupérer les membres
        members_data = []
        members = TeamMember.query.filter_by(team_id=team_id).all()
        
        for member in members:
            user = User.query.get(member.user_id)
            if user:
                members_data.append({
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'role': member.role,
                    'joined_at': member.joined_at
                })
        
        # Récupérer les entretiens
        interviews_data = []
        team_interviews = TeamInterviewAccess.query.filter_by(team_id=team_id).all()
        
        for access in team_interviews:
            interview = Interview.query.get(access.interview_id)
            if interview:
                interviews_data.append({
                    'id': interview.id,
                    'title': interview.title or f"Entretien avec {interview.candidate_name}",
                    'candidate_name': interview.candidate_name,
                    'status': interview.status,
                    'permission_level': access.permission_level,
                    'granted_at': access.created_at,
                    'expires_at': access.expires_at
                })
        
        return {
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'created_at': team.created_at,
            'created_by': team.created_by,
            'user_role': membership.role,
            'members': members_data,
            'interviews': interviews_data
        }
    
    def add_team_member(self, team_id, email, role, added_by):
        """
        Ajoute un membre à une équipe
        
        Args:
            team_id (str): ID de l'équipe
            email (str): Email de l'utilisateur à ajouter
            role (str): Rôle dans l'équipe (admin, member, observer)
            added_by (int): ID de l'utilisateur qui ajoute
            
        Returns:
            TeamMember: Le membre ajouté
        """
        # Vérifier que l'équipe existe
        team = Team.query.get(team_id)
        if not team:
            raise ValueError("Équipe non trouvée")
        
        # Vérifier que l'utilisateur qui ajoute est admin
        admin_check = TeamMember.query.filter_by(
            team_id=team_id, 
            user_id=added_by,
            role='admin'
        ).first()
        
        if not admin_check:
            raise ValueError("Seuls les administrateurs peuvent ajouter des membres")
        
        # Trouver l'utilisateur par email
        user_to_add = User.query.filter_by(email=email).first()
        if not user_to_add:
            raise ValueError(f"Aucun utilisateur trouvé avec l'email {email}")
        
        # Vérifier s'il est déjà membre
        existing = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=user_to_add.id
        ).first()
        
        if existing:
            raise ValueError("L'utilisateur est déjà membre de cette équipe")
        
        # Valider le rôle
        if role not in ['admin', 'member', 'observer']:
            role = 'member'  # Rôle par défaut
        
        # Ajouter le membre
        new_member = TeamMember(
            id=str(uuid.uuid4()),
            team_id=team_id,
            user_id=user_to_add.id,
            role=role
        )
        
        db.session.add(new_member)
        db.session.commit()
        
        # Envoyer notification
        notification_data = {
            'type': "team_invitation",
            'title': "Vous avez été ajouté à une équipe",
            'message': f"Vous avez été ajouté à l'équipe {team.name} en tant que {role}",
            'link': f"/teams/{team_id}",
            'data': {
                "team_id": team_id,
                "role": role
            }
        }
        self.notification_service.create_notification(user_to_add.id, notification_data)
        
        # Notification WebSocket
        self.websocket_service.emit_notification(user_to_add.id, {
            'type': 'team_invitation',
            'teamId': team_id,
            'teamName': team.name,
            'role': role
        })
        
        return new_member
    
    def remove_team_member(self, team_id, user_id, removed_by):
        """
        Supprime un membre d'une équipe
        
        Args:
            team_id (str): ID de l'équipe
            user_id (int): ID de l'utilisateur à supprimer
            removed_by (int): ID de l'utilisateur qui effectue la suppression
            
        Returns:
            bool: True si succès
        """
        # Vérifier que l'équipe existe
        team = Team.query.get(team_id)
        if not team:
            raise ValueError("Équipe non trouvée")
        
        # Vérifier que l'utilisateur qui supprime est admin ou se supprime lui-même
        admin_check = TeamMember.query.filter_by(
            team_id=team_id, 
            user_id=removed_by,
            role='admin'
        ).first()
        
        if not admin_check and removed_by != user_id:
            raise ValueError("Seuls les administrateurs peuvent supprimer des membres")
        
        # Empêcher la suppression du dernier admin
        if removed_by != user_id:  # Si on ne se supprime pas soi-même
            admin_count = TeamMember.query.filter_by(
                team_id=team_id,
                role='admin'
            ).count()
            
            is_admin = TeamMember.query.filter_by(
                team_id=team_id,
                user_id=user_id,
                role='admin'
            ).first() is not None
            
            if admin_count <= 1 and is_admin:
                raise ValueError("Impossible de supprimer le dernier administrateur")
        
        # Supprimer le membre
        member = TeamMember.query.filter_by(
            team_id=team_id,
            user_id=user_id
        ).first()
        
        if not member:
            raise ValueError("Utilisateur non membre de cette équipe")
        
        db.session.delete(member)
        db.session.commit()
        
        # Envoyer notification
        notification_data = {
            'type': "team_removal",
            'title': "Vous avez été retiré d'une équipe",
            'message': f"Vous avez été retiré de l'équipe {team.name}",
            'data': {
                "team_id": team_id
            }
        }
        self.notification_service.create_notification(user_id, notification_data)
        
        return True
    
    def share_interview_with_team(self, team_id, interview_id, user_id, permission_level='viewer', expires_days=None, message=None):
        """
        Partage un entretien avec une équipe
        
        Args:
            team_id (str): ID de l'équipe
            interview_id (int): ID de l'entretien
            user_id (int): ID de l'utilisateur qui partage
            permission_level (str): Niveau de permission
            expires_days (int, optional): Nombre de jours avant expiration
            message (str, optional): Message de partage
            
        Returns:
            TeamInterviewAccess: L'accès créé
        """
        # Vérifier que l'équipe existe
        team = Team.query.get(team_id)
        if not team:
            raise ValueError("Équipe non trouvée")
        
        # Vérifier que l'utilisateur est membre de l'équipe
        membership = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
        if not membership:
            raise ValueError("Vous n'êtes pas membre de cette équipe")
        
        # Vérifier que l'entretien existe
        interview = Interview.query.get(interview_id)
        if not interview:
            raise ValueError("Entretien non trouvé")
        
        # Vérifier que l'utilisateur a le droit de partager cet entretien
        if interview.recruiter_id != user_id:
            user = User.query.get(user_id)
            if not user or user.role != 'admin':
                raise ValueError("Vous n'êtes pas autorisé à partager cet entretien")
        
        # Vérifier si l'entretien est déjà partagé avec cette équipe
        existing = TeamInterviewAccess.query.filter_by(
            team_id=team_id,
            interview_id=interview_id
        ).first()
        
        # Définir la date d'expiration si demandée
        expires_at = None
        if expires_days and expires_days > 0:
            expires_at = datetime.utcnow() + timedelta(days=expires_days)
        
        if existing:
            # Mettre à jour l'accès existant
            existing.permission_level = permission_level
            existing.expires_at = expires_at
            db.session.commit()
            team_access = existing
        else:
            # Créer un nouvel accès
            team_access = TeamInterviewAccess(
                team_id=team_id,
                interview_id=interview_id,
                permission_level=permission_level,
                granted_by=user_id,
                expires_at=expires_at
            )
            
            db.session.add(team_access)
            
            # Enregistrer l'activité
            activity = CollaborationActivity(
                interview_id=interview_id,
                user_id=user_id,
                activity_type='team_share',
                details={
                    'team_id': team_id,
                    'message': message or ''
                }
            )
            db.session.add(activity)
            db.session.commit()
            
            # Notifier tous les membres de l'équipe
            self._notify_team_about_interview(team_id, interview_id, user_id)
        
        return team_access
    
    def add_team_note(self, team_id, interview_id, user_id, content, visibility='team'):
        """
        Ajoute une note d'équipe à un entretien
        
        Args:
            team_id (str): ID de l'équipe
            interview_id (int): ID de l'entretien
            user_id (int): ID de l'auteur
            content (str): Contenu de la note
            visibility (str): Visibilité (team, private)
            
        Returns:
            TeamNote: La note créée
        """
        # Vérifier que l'utilisateur est membre de l'équipe
        membership = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
        if not membership:
            raise ValueError("Vous n'êtes pas membre de cette équipe")
        
        # Vérifier que l'équipe a accès à l'entretien
        team_access = TeamInterviewAccess.query.filter_by(
            team_id=team_id,
            interview_id=interview_id
        ).first()
        
        if not team_access:
            raise ValueError("Cette équipe n'a pas accès à cet entretien")
        
        # Vérifier la validité de la visibilité
        if visibility not in ['team', 'private']:
            visibility = 'team'
        
        # Créer la note
        note = TeamNote(
            team_id=team_id,
            interview_id=interview_id,
            author_id=user_id,
            content=content,
            visibility=visibility
        )
        
        db.session.add(note)
        
        # Enregistrer l'activité
        activity = CollaborationActivity(
            interview_id=interview_id,
            user_id=user_id,
            activity_type='team_note',
            details={
                'team_id': team_id,
                'note_id': note.id,
                'visibility': visibility
            }
        )
        db.session.add(activity)
        db.session.commit()
        
        # Si la note est visible par l'équipe, notifier les autres membres
        if visibility == 'team':
            self._notify_team_about_note(team_id, interview_id, note.id, user_id)
        
        return note
    
    def get_team_notes(self, interview_id, user_id):
        """
        Récupère les notes d'équipe visibles par un utilisateur
        
        Args:
            interview_id (int): ID de l'entretien
            user_id (int): ID de l'utilisateur
            
        Returns:
            list: Liste des notes d'équipe
        """
        # Récupérer les équipes dont l'utilisateur est membre
        team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
        team_ids = [tm.team_id for tm in team_memberships]
        
        if not team_ids:
            return []
        
        # Récupérer les notes visibles
        notes = []
        
        # Notes d'équipe pour les équipes dont l'utilisateur est membre
        team_notes = TeamNote.query.filter(
            TeamNote.interview_id == interview_id,
            TeamNote.team_id.in_(team_ids),
            TeamNote.visibility == 'team'
        ).all()
        notes.extend(team_notes)
        
        # Notes privées de l'utilisateur
        private_notes = TeamNote.query.filter(
            TeamNote.interview_id == interview_id,
            TeamNote.author_id == user_id,
            TeamNote.visibility == 'private'
        ).all()
        notes.extend(private_notes)
        
        return [note.to_dict() for note in notes]
    
    def get_interview_activities(self, interview_id, user_id):
        """
        Récupère toutes les activités d'un entretien
        
        Args:
            interview_id (int): ID de l'entretien
            user_id (int): ID de l'utilisateur
            
        Returns:
            list: Liste des activités
        """
        # Vérifier que l'utilisateur a accès à l'entretien
        if not self._user_can_access_interview(interview_id, user_id):
            raise ValueError("Vous n'êtes pas autorisé à voir les activités de cet entretien")
        
        activities = CollaborationActivity.query.filter_by(
            interview_id=interview_id
        ).order_by(CollaborationActivity.created_at.desc()).all()
        
        result = []
        for activity in activities:
            user = User.query.get(activity.user_id)
            
            activity_data = {
                'id': activity.id,
                'user_id': activity.user_id,
                'user_name': f"{user.first_name} {user.last_name}" if user else "Utilisateur inconnu",
                'activity_type': activity.activity_type,
                'details': activity.details,
                'created_at': activity.created_at.isoformat()
            }
            
            # Enrichir les détails selon le type d'activité
            if activity.activity_type == 'comment':
                comment_id = activity.details.get('comment_id')
                if comment_id:
                    comment = Comment.query.get(comment_id)
                    if comment:
                        activity_data['comment'] = comment.to_dict()
            
            elif activity.activity_type == 'team_note':
                note_id = activity.details.get('note_id')
                if note_id:
                    note = TeamNote.query.get(note_id)
                    if note:
                        activity_data['note'] = note.to_dict()
            
            elif activity.activity_type in ['share', 'unshare']:
                shared_with_id = activity.details.get('shared_with_id')
                if shared_with_id:
                    shared_with = User.query.get(shared_with_id)
                    if shared_with:
                        activity_data['shared_with'] = {
                            'id': shared_with.id,
                            'name': f"{shared_with.first_name} {shared_with.last_name}"
                        }
            
            elif activity.activity_type == 'team_share':
                team_id = activity.details.get('team_id')
                if team_id:
                    team = Team.query.get(team_id)
                    if team:
                        activity_data['team'] = {
                            'id': team.id,
                            'name': team.name
                        }
            
            result.append(activity_data)
        
        return result
    
    # ====== MÉTHODES UTILITAIRES ======
    
    def _user_can_access_interview(self, interview_id, user_id):
        """
        Vérifie si un utilisateur a accès à un entretien
        
        Args:
            interview_id (int): ID de l'entretien
            user_id (int): ID de l'utilisateur
            
        Returns:
            bool: True si l'utilisateur a accès, False sinon
        """
        interview = Interview.query.get(interview_id)
        if not interview:
            return False
        
        # Si l'utilisateur est le propriétaire
        if interview.recruiter_id == user_id:
            return True
        
        # Si l'utilisateur est un admin
        user = User.query.get(user_id)
        if user and user.role == 'admin':
            return True
        
        # Vérifier partage direct
        share = InterviewShare.query.filter_by(
            interview_id=interview_id,
            shared_with_id=user_id
        ).first()
        
        if share:
            if not share.expires_at or share.expires_at >= datetime.utcnow():
                return True
        
        # Vérifier partage via équipe
        team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
        team_ids = [tm.team_id for tm in team_memberships]
        
        if team_ids:
            team_access = TeamInterviewAccess.query.filter(
                TeamInterviewAccess.interview_id == interview_id,
                TeamInterviewAccess.team_id.in_(team_ids)
            ).first()
            
            if team_access:
                if not team_access.expires_at or team_access.expires_at >= datetime.utcnow():
                    return True
        
        return False
    
    def _notify_others_about_comment(self, interview_id, comment_id, except_user_id):
        """
        Notifie les personnes ayant accès à l'entretien d'un nouveau commentaire
        
        Args:
            interview_id (int): ID de l'entretien
            comment_id (int): ID du commentaire
            except_user_id (int): ID de l'utilisateur à ne pas notifier
        """
        interview = Interview.query.get(interview_id)
        if not interview:
            return
        
        comment = Comment.query.get(comment_id)
        if not comment:
            return
        
        commenter = User.query.get(except_user_id)
        commenter_name = f"{commenter.first_name} {commenter.last_name}" if commenter else "Un utilisateur"
        
        # Trouver tous les utilisateurs avec accès direct
        shares = InterviewShare.query.filter_by(interview_id=interview_id).all()
        for share in shares:
            if share.shared_with_id != except_user_id and share.shared_with_id != interview.recruiter_id:
                # Vérifier que le partage n'a pas expiré
                if share.expires_at and share.expires_at < datetime.utcnow():
                    continue
                
                notification_data = {
                    'type': "new_comment",
                    'title': "Nouveau commentaire",
                    'message': f"{commenter_name} a ajouté un commentaire sur l'entretien '{interview.title or f'Entretien avec {interview.candidate_name}'}'",
                    'link': f"/interviews/{interview_id}/view",
                    'data': {
                        "interview_id": interview_id,
                        "comment_id": comment_id,
                        "commenter_id": except_user_id
                    }
                }
                self.notification_service.create_notification(share.shared_with_id, notification_data)
                
                # Notification WebSocket
                self.websocket_service.emit_notification(share.shared_with_id, {
                    'type': 'new_comment',
                    'interviewId': interview_id,
                    'interviewTitle': interview.title or f"Entretien avec {interview.candidate_name}",
                    'commenterId': except_user_id,
                    'commenterName': commenter_name
                })
    
    def _notify_team_about_interview(self, team_id, interview_id, except_user_id):
        """
        Notifie les membres d'une équipe du partage d'un entretien
        
        Args:
            team_id (str): ID de l'équipe
            interview_id (int): ID de l'entretien
            except_user_id (int): ID de l'utilisateur à ne pas notifier
        """
        team = Team.query.get(team_id)
        interview = Interview.query.get(interview_id)
        
        if not team or not interview:
            return
        
        members = TeamMember.query.filter_by(team_id=team_id).all()
        
        for member in members:
            if member.user_id != except_user_id:
                notification_data = {
                    'type': "team_interview_share",
                    'title': "Nouvel entretien partagé",
                    'message': f"Un entretien a été partagé avec votre équipe {team.name}",
                    'link': f"/interviews/{interview_id}/view",
                    'data': {
                        "team_id": team_id,
                        "interview_id": interview_id
                    }
                }
                self.notification_service.create_notification(member.user_id, notification_data)
                
                # Notification WebSocket
                self.websocket_service.emit_notification(member.user_id, {
                    'type': 'team_interview_share',
                    'teamId': team_id,
                    'teamName': team.name,
                    'interviewId': interview_id,
                    'interviewTitle': interview.title or f"Entretien avec {interview.candidate_name}"
                })
    
    def _notify_team_about_note(self, team_id, interview_id, note_id, except_user_id):
        """
        Notifie les membres d'une équipe d'une nouvelle note
        
        Args:
            team_id (str): ID de l'équipe
            interview_id (int): ID de l'entretien
            note_id (int): ID de la note
            except_user_id (int): ID de l'utilisateur à ne pas notifier
        """
        team = Team.query.get(team_id)
        interview = Interview.query.get(interview_id)
        note = TeamNote.query.get(note_id)
        
        if not team or not interview or not note:
            return
        
        user = User.query.get(except_user_id)
        user_name = f"{user.first_name} {user.last_name}" if user else "Un membre de l'équipe"
        
        members = TeamMember.query.filter_by(team_id=team_id).all()
        
        for member in members:
            if member.user_id != except_user_id:
                notification_data = {
                    'type': "team_note",
                    'title': "Nouvelle note d'équipe",
                    'message': f"{user_name} a ajouté une note sur l'entretien '{interview.title or f'Entretien avec {interview.candidate_name}'}'",
                    'link': f"/interviews/{interview_id}/team-notes",
                    'data': {
                        "team_id": team_id,
                        "interview_id": interview_id,
                        "note_id": note_id
                    }
                }
                self.notification_service.create_notification(member.user_id, notification_data)
                
                # Notification WebSocket
                self.websocket_service.emit_notification(member.user_id, {
                    'type': 'team_note',
                    'teamId': team_id,
                    'teamName': team.name,
                    'interviewId': interview_id,
                    'interviewTitle': interview.title or f"Entretien avec {interview.candidate_name}",
                    'noteId': note_id,
                    'authorName': user_name
                })