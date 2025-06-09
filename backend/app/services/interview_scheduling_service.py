# backend/services/interview_scheduling_service.py
from datetime import datetime, timedelta
import uuid

from ..services.teams_service import TeamsService
from ..models.interview_scheduling import InterviewSchedule
from ..services.notification_service import NotificationService
from ..services.email_service import EmailService
from ..services.audit_service import AuditService
from ..services.subscription_service import SubscriptionService
from ..services.meet_service import MeetService
from app import db

class InterviewSchedulingService:
    """Service pour gérer la planification des entretiens avec intégration Google Meet"""
    
    # Constantes pour les modes d'entretien
    VALID_MODES = ['collaborative', 'autonomous']
    VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show']
    
    # Constantes pour les modes d'entretien
    VALID_MODES = ['collaborative', 'autonomous']
    VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show']
    
    def __init__(self):
        self.notification_service = NotificationService()
        self.audit_service = AuditService()
        self.subscription_service = SubscriptionService()
        self.meet_service = MeetService()
        self.teams_service = TeamsService()

    
    def _validate_mode(self, mode):
        """Valide le mode d'entretien"""
        if mode not in self.VALID_MODES:
            raise ValueError(f"Mode d'entretien invalide. Modes autorisés: {', '.join(self.VALID_MODES)}")
    
    def _validate_status(self, status):
        """Valide le statut d'entretien"""
        if status not in self.VALID_STATUSES:
            raise ValueError(f"Statut invalide. Statuts autorisés: {', '.join(self.VALID_STATUSES)}")
    
    def _get_recruiter_email(self, recruiter_id):
        """Récupère l'email du recruteur"""
        from ..models.user import User
        recruiter = User.query.get(recruiter_id)
        return recruiter.email if recruiter else None
    
    def _create_or_update_meeting(self, schedule, is_update=False):
        """
        Crée ou met à jour le meeting Google Calendar
        
        Args:
            schedule: Objet InterviewSchedule
            is_update: Boolean indiquant si c'est une mise à jour
        
        Returns:
            Boolean indiquant le succès
        """
        if not self.meet_service.is_available():
            print("Service Google Meet non disponible - continuons sans meeting")
            schedule.calendar_sync_status = 'disabled'
            schedule.calendar_sync_error = 'Service Google Calendar non configuré'
            return False
        
        try:
            recruiter_email = self._get_recruiter_email(schedule.recruiter_id)
            if not recruiter_email:
                raise Exception("Email du recruteur introuvable")
            
            # Préparer les données pour le service Meet
            meet_data = {
                'schedule_id': schedule.id,
                'title': schedule.title,
                'description': schedule.description,
                'candidate_name': schedule.candidate_name,
                'candidate_email': schedule.candidate_email,
                'recruiter_email': recruiter_email,
                'scheduled_at': schedule.scheduled_at,
                'duration_minutes': schedule.duration_minutes,
                'timezone': schedule.timezone,
                'position': schedule.position,
                'mode': schedule.mode
            }
            
            if is_update and schedule.google_event_id:
                # Mise à jour d'un événement existant
                result = self.meet_service.update_meeting(schedule.google_event_id, meet_data)
            else:
                # Création d'un nouveau meeting
                result = self.meet_service.create_meeting(meet_data)
            
            # Mettre à jour l'objet schedule avec les informations du meeting
            schedule.google_event_id = result['event_id']
            schedule.meet_link = result['meet_link']
            schedule.calendar_link = result['html_link']
            schedule.calendar_sync_status = 'synced'
            schedule.calendar_sync_error = None
            
            return True
            
        except Exception as e:
            print(f"Erreur lors de la {'mise à jour' if is_update else 'création'} du meeting: {str(e)}")
            schedule.calendar_sync_status = 'error'
            schedule.calendar_sync_error = str(e)
            return False
    
    def _cancel_meeting(self, schedule, reason=None):
        """
        Annule le meeting Google Calendar
        
        Args:
            schedule: Objet InterviewSchedule
            reason: Raison de l'annulation
        
        Returns:
            Boolean indiquant le succès
        """
        if not schedule.google_event_id or not self.meet_service.is_available():
            return True  # Pas de meeting à annuler ou service non disponible
        
        try:
            success = self.meet_service.cancel_meeting(schedule.google_event_id, reason)
            if success:
                schedule.calendar_sync_status = 'synced'
                schedule.calendar_sync_error = None
            return success
        except Exception as e:
            print(f"Erreur lors de l'annulation du meeting: {str(e)}")
            schedule.calendar_sync_error = f"Erreur annulation: {str(e)}"
            return False
    
    def _validate_mode(self, mode):
        """Valide le mode d'entretien"""
        if mode not in self.VALID_MODES:
            raise ValueError(f"Mode d'entretien invalide. Modes autorisés: {', '.join(self.VALID_MODES)}")
    
    def _validate_status(self, status):
        """Valide le statut d'entretien"""
        if status not in self.VALID_STATUSES:
            raise ValueError(f"Statut invalide. Statuts autorisés: {', '.join(self.VALID_STATUSES)}")
    
    def create_schedule(self, organization_id, recruiter_id, data):
        """
        Crée une nouvelle planification d'entretien avec meeting Google Calendar
        
        Args:
            organization_id: ID de l'organisation
            recruiter_id: ID du recruteur
            data: Données de la planification
        
        Returns:
            L'objet InterviewSchedule créé
        """
        # Vérifier les limites d'entretiens du plan
        # if not self.subscription_service.check_interview_limit(recruiter_id):
        #     raise ValueError("Limite d'entretiens atteinte pour votre plan d'abonnement")
        
        # Valider le mode d'entretien
        mode = data.get('mode')
        if not mode:
            raise ValueError("Le mode d'entretien est requis")
        self._validate_mode(mode)
        
        # Validation des champs requis
        required_fields = ['candidate_name', 'candidate_email', 'title', 'position', 'scheduled_at']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"Le champ {field} est requis")
        
        # Validation de la date
        try:
            scheduled_at = datetime.fromisoformat(data.get('scheduled_at'))
            if scheduled_at <= datetime.now():
                raise ValueError("La date doit être dans le futur")
        except ValueError as e:
            if "futur" in str(e):
                raise e
            raise ValueError("Format de date invalide")
        
        # Valider le mode d'entretien
        mode = data.get('mode')
        if not mode:
            raise ValueError("Le mode d'entretien est requis")
        self._validate_mode(mode)
        # Validation des champs requis
        required_fields = ['candidate_name', 'candidate_email', 'title', 'position', 'scheduled_at']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"Le champ {field} est requis")
        # Validation de la date
        try:
            scheduled_at = datetime.fromisoformat(data.get('scheduled_at'))
            if scheduled_at <= datetime.now():
                raise ValueError("La date doit être dans le futur")
        except ValueError as e:
            if "futur" in str(e):
                raise e
            raise ValueError("Format de date invalide")
        # Créer la planification
        schedule = InterviewSchedule(
            organization_id=organization_id,
            recruiter_id=recruiter_id,
            candidate_name=data.get('candidate_name'),
            candidate_email=data.get('candidate_email'),
            candidate_phone=data.get('candidate_phone'),
            title=data.get('title'),
            description=data.get('description'),
            position=data.get('position'),
            scheduled_at=scheduled_at,
            duration_minutes=data.get('duration_minutes', 30),
            timezone=data.get('timezone', 'Africa/Douala'),
            mode=mode,
            ai_assistant_id=data.get('ai_assistant_id'),
            predefined_questions=data.get('predefined_questions'),
            status='scheduled',
            calendar_sync_status='pending'
        )
        
        # Sauvegarder d'abord pour avoir un ID
        db.session.add(schedule)
        db.session.flush()  # Pour obtenir l'ID sans commit complet
        
        # Créer le meeting Google Calendar
        meeting_success = self._create_or_update_meeting(schedule, is_update=False)
        
        # Commit final
        db.session.commit()
        
        # Enregistrer dans les logs d'audit
        self.audit_service.log_action(
            organization_id=organization_id,
            user_id=recruiter_id,
            action='create',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Entretien {mode} planifié avec {schedule.candidate_name} pour le {schedule.scheduled_at}" +
                        (f" - Meeting créé: {schedule.meet_link}" if meeting_success else " - Erreur création meeting")
        )
        
        print(f"Schedule créé avec access_token: {schedule.access_token}")
        if meeting_success:
            print(f"Meeting créé avec succès: {schedule.meet_link}")
        
        # Envoyer les notifications
        try:
            # Notification au recruteur
            self.notification_service.create_interview_scheduled_notification(
                recruiter_id=recruiter_id,
                schedule_data={
                    'candidate_name': schedule.candidate_name,
                    'scheduled_at': schedule.scheduled_at.strftime("%d/%m/%Y à %H:%M"),
                    'schedule_id': schedule.id,
                    'mode': mode,
                    'meet_link': schedule.meet_link
                }
            )
            # Email d'invitation au candidat
            self.notification_service.send_interview_invitation_email(schedule)
            
            # Email d'invitation au candidat avec lien Meet
            self.notification_service.send_interview_invitation_email(schedule)
            
        except Exception as e:
            print(f"Erreur lors de l'envoi des notifications: {str(e)}")
        
        return schedule
    
    def update_schedule(self, schedule_id, recruiter_id, data):
        """
        Met à jour une planification d'entretien et son meeting Google Calendar
        
        Args:
            schedule_id: ID de la planification
            recruiter_id: ID du recruteur qui fait la modification
            data: Nouvelles données
            
        Returns:
            L'objet InterviewSchedule mis à jour
        """
        schedule = InterviewSchedule.query.get(schedule_id)
        if not schedule:
            raise ValueError(f"Planification introuvable: {schedule_id}")
        
        # Vérifier que le recruteur a le droit de modifier
        if schedule.recruiter_id != recruiter_id:
            # Vérifier si le recruteur est admin dans l'organisation
            from ..models.organization import OrganizationMember
            is_admin = OrganizationMember.query.filter_by(
                organization_id=schedule.organization_id,
                user_id=recruiter_id,
                role='admin'
            ).first() is not None
            
            if not is_admin:
                raise ValueError("Vous n'avez pas la permission de modifier cet entretien")
        
        # Valider le mode si fourni
        if 'mode' in data and data['mode']:
            self._validate_mode(data['mode'])
        
        # Vérifier si des données importantes ont changé (nécessitant une mise à jour du meeting)
        meeting_update_needed = False
        date_changed = False
        
        if 'scheduled_at' in data and data['scheduled_at']:
            try:
                new_date = datetime.fromisoformat(data['scheduled_at'])
                if new_date <= datetime.now():
                    raise ValueError("La date doit être dans le futur")
                if new_date != schedule.scheduled_at:
                    date_changed = True
                    meeting_update_needed = True
            except ValueError as e:
                if "futur" in str(e):
                    raise e
                raise ValueError("Format de date invalide")
        
        # Autres champs qui nécessitent une mise à jour du meeting
        meeting_fields = ['title', 'description', 'candidate_name', 'candidate_email', 'duration_minutes', 'timezone']
        for field in meeting_fields:
            if field in data and data[field] != getattr(schedule, field):
                meeting_update_needed = True
                break
        
        # Mettre à jour les champs
        for field in ['candidate_name', 'candidate_email', 'candidate_phone', 
                      'title', 'description', 'position', 'duration_minutes', 
                      'timezone', 'mode', 'ai_assistant_id', 'predefined_questions', 'status']:
            if field in data and data[field] is not None:
                if field == 'status':
                    self._validate_status(data[field])
                setattr(schedule, field, data[field])
        
        if 'scheduled_at' in data and data['scheduled_at']:
            schedule.scheduled_at = datetime.fromisoformat(data['scheduled_at'])
        
        schedule.updated_at = datetime.utcnow()
        
        # Mettre à jour le meeting si nécessaire
        meeting_success = True
        if meeting_update_needed and schedule.calendar_sync_status != 'disabled':
            meeting_success = self._create_or_update_meeting(schedule, is_update=True)
        
        db.session.commit()
        
        # Enregistrer dans les logs d'audit
        self.audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=recruiter_id,
            action='update',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Modification de l'entretien {schedule.mode} avec {schedule.candidate_name}" +
                        (f" - Meeting mis à jour" if meeting_update_needed and meeting_success else "")
        )
        
        # Si la date a changé, envoyer des notifications
        if date_changed:
            try:
                # Notification au recruteur
                self.notification_service.create_interview_rescheduled_notification(
                    recruiter_id=schedule.recruiter_id,
                    schedule_data={
                        'candidate_name': schedule.candidate_name,
                        'scheduled_at': schedule.scheduled_at.strftime("%d/%m/%Y à %H:%M"),
                        'schedule_id': schedule.id,
                        'mode': schedule.mode,
                        'meet_link': schedule.meet_link
                    }
                )
                
                # Email au candidat avec nouveau lien Meet
                self.notification_service.send_interview_rescheduled_email(schedule)
                
            except Exception as e:
                print(f"Erreur lors de l'envoi des notifications: {str(e)}")
        
        return schedule
    
    def cancel_schedule(self, schedule_id, user_id, reason=None):
        """
        Annule une planification d'entretien et son meeting Google Calendar
        
        Args:
            schedule_id: ID de la planification
            user_id: ID de l'utilisateur qui annule
            reason: Raison de l'annulation (optionnel)
            
        Returns:
            L'objet InterviewSchedule mis à jour
        """
        schedule = InterviewSchedule.query.get(schedule_id)
        if not schedule:
            raise ValueError(f"Planification introuvable: {schedule_id}")
        
        # Vérifier que l'utilisateur a le droit d'annuler
        if schedule.recruiter_id != user_id:
            # Vérifier si l'utilisateur est admin dans l'organisation
            from ..models.organization import OrganizationMember
            is_admin = OrganizationMember.query.filter_by(
                organization_id=schedule.organization_id,
                user_id=user_id,
                role='admin'
            ).first() is not None
            
            if not is_admin:
                raise ValueError("Vous n'avez pas la permission d'annuler cet entretien")
        
        # Vérifier que l'entretien peut être annulé
        if schedule.status in ['completed', 'canceled']:
            raise ValueError(f"Impossible d'annuler un entretien avec le statut: {schedule.status}")
        
        # Annuler le meeting Google Calendar
        self._cancel_meeting(schedule, reason)
        
        # Mettre à jour le statut
        schedule.status = 'canceled'
        schedule.cancellation_reason = reason
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enregistrer dans les logs d'audit
        self.audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=user_id,
            action='cancel',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Annulation de l'entretien {schedule.mode} avec {schedule.candidate_name}" + 
                        (f" - Raison: {reason}" if reason else "") + " - Meeting annulé"
        )
        
        # Envoyer des notifications
        try:
            # Notification au recruteur
            self.notification_service.create_interview_canceled_notification(
                recruiter_id=schedule.recruiter_id,
                schedule_data={
                    'candidate_name': schedule.candidate_name,
                    'schedule_id': schedule.id,
                    'mode': schedule.mode
                }
            )
            
            # Email au candidat
            self.notification_service.send_interview_canceled_email(schedule, reason)
            
        except Exception as e:
            print(f"Erreur lors de l'envoi des notifications: {str(e)}")
        
        return schedule
    
    def get_schedule(self, schedule_id):
        """Récupère une planification par son ID"""
        return InterviewSchedule.query.get(schedule_id)
    
    def get_schedule_by_token(self, access_token):
        """Récupère une planification par son token d'accès"""
        return InterviewSchedule.query.filter_by(access_token=access_token).first()
    
    def get_user_schedules(self, user_id, status=None, from_date=None, to_date=None):
        """
        Récupère les planifications d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur (recruteur)
            status: Filtrer par statut (optionnel)
            from_date: Date de début pour filtrer (optionnel)
            to_date: Date de fin pour filtrer (optionnel)
            
        Returns:
            Liste des planifications
        """
        query = InterviewSchedule.query.filter_by(recruiter_id=user_id)
        
        if status:
            self._validate_status(status)
            query = query.filter_by(status=status)
        
        if from_date:
            query = query.filter(InterviewSchedule.scheduled_at >= from_date)
        
        if to_date:
            query = query.filter(InterviewSchedule.scheduled_at <= to_date)
        
        return query.order_by(InterviewSchedule.scheduled_at).all()
    
    def get_organization_schedules(self, organization_id, status=None, from_date=None, to_date=None):
        """
        Récupère les planifications d'une organisation
        
        Args:
            organization_id: ID de l'organisation
            status: Filtrer par statut (optionnel)
            from_date: Date de début pour filtrer (optionnel)
            to_date: Date de fin pour filtrer (optionnel)
            
        Returns:
            Liste des planifications
        """
        query = InterviewSchedule.query.filter_by(organization_id=organization_id)
        
        if status:
            self._validate_status(status)
            query = query.filter_by(status=status)
        
        if from_date:
            query = query.filter(InterviewSchedule.scheduled_at >= from_date)
        
        if to_date:
            query = query.filter(InterviewSchedule.scheduled_at <= to_date)
        
        return query.order_by(InterviewSchedule.scheduled_at).all()
    
    def retry_meeting_sync(self, schedule_id, user_id):
        """
        Réessaie la synchronisation du meeting Google Calendar
        
        Args:
            schedule_id: ID de la planification
            user_id: ID de l'utilisateur qui fait la demande
            
        Returns:
            L'objet InterviewSchedule mis à jour
        """
        schedule = self.get_schedule(schedule_id)
        if not schedule:
            raise ValueError(f"Planification introuvable: {schedule_id}")
        
        # Vérifier les permissions
        if schedule.recruiter_id != user_id:
            from ..models.organization import OrganizationMember
            is_admin = OrganizationMember.query.filter_by(
                organization_id=schedule.organization_id,
                user_id=user_id,
                role='admin'
            ).first() is not None
            
            if not is_admin:
                raise ValueError("Vous n'avez pas la permission de modifier cet entretien")
        
        # Réessayer la synchronisation
        meeting_success = self._create_or_update_meeting(schedule, is_update=bool(schedule.google_event_id))
        
        db.session.commit()
        
        # Log de l'action
        self.audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=user_id,
            action='retry_sync',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Nouvelle tentative de synchronisation du meeting - " +
                        ("Succès" if meeting_success else "Échec")
        )
        
        return schedule
    
    def send_reminders(self):   
        """
        Envoie des rappels pour les entretiens à venir
        Cette méthode est destinée à être exécutée par un job planifié
        
        Returns:
            Nombre de rappels envoyés
        """
        # Trouver les entretiens qui commencent dans les 24 heures et n'ont pas encore reçu de rappel
        now = datetime.utcnow()
        reminder_window = now + timedelta(hours=24)
        
        schedules = InterviewSchedule.query.filter(
            InterviewSchedule.status.in_(['scheduled', 'confirmed']),
            InterviewSchedule.scheduled_at >= now,
            InterviewSchedule.scheduled_at <= reminder_window,
            InterviewSchedule.reminder_sent == False
        ).all()
        
        count = 0
        for schedule in schedules:
            try:
                # Email de rappel au candidat avec lien Meet
                self.notification_service.send_interview_reminder_email(schedule)
                
                # Notification au recruteur
                self.notification_service.create_interview_reminder_notification(
                    recruiter_id=schedule.recruiter_id,
                    schedule_data={
                        'candidate_name': schedule.candidate_name,
                        'time': schedule.scheduled_at.strftime('%H:%M'),
                        'schedule_id': schedule.id,
                        'mode': schedule.mode,
                        'meet_link': schedule.meet_link
                    }
                )
                
                # Marquer comme rappel envoyé
                schedule.reminder_sent = True
                count += 1
            except Exception as e:
                print(f"Erreur lors de l'envoi du rappel pour {schedule.id}: {str(e)}")
        
        db.session.commit()
        return count
    
    def mark_as_started(self, schedule_id, interview_id):
        """
        Marque un entretien comme démarré et associe l'entretien réel
        
        Args:
            schedule_id: ID de la planification
            interview_id: ID de l'entretien réel
            
        Returns:
            L'objet InterviewSchedule mis à jour
        """
        schedule = self.get_schedule(schedule_id)
        if not schedule:
            raise ValueError(f"Planification introuvable: {schedule_id}")
        
        # Vérifier que l'entretien peut être démarré
        if schedule.status not in ['scheduled', 'confirmed']:
            raise ValueError(f"Impossible de démarrer un entretien avec le statut: {schedule.status}")
        
        schedule.status = 'in_progress'
        schedule.interview_id = interview_id
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        return schedule
    
    def mark_as_completed(self, schedule_id):
        """
        Marque un entretien comme terminé
        
        Args:
            schedule_id: ID de la planification
            
        Returns:
            L'objet InterviewSchedule mis à jour
        """
        schedule = self.get_schedule(schedule_id)
        if not schedule:
            raise ValueError(f"Planification introuvable: {schedule_id}")
        
        # Vérifier que l'entretien peut être terminé
        if schedule.status != 'in_progress':
            raise ValueError(f"Impossible de terminer un entretien avec le statut: {schedule.status}")
        
        schedule.status = 'completed'
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        return schedule
    
    def mark_as_no_show(self, schedule_id, user_id):
        """
        Marque un entretien comme absence du candidat
        
        Args:
            schedule_id: ID de la planification
            user_id: ID de l'utilisateur qui fait l'action
            
        Returns:
            L'objet InterviewSchedule mis à jour
        """
        schedule = self.get_schedule(schedule_id)
        if not schedule:
            raise ValueError(f"Planification introuvable: {schedule_id}")
        
        # Vérifier que l'entretien peut être marqué comme no-show
        if schedule.status not in ['scheduled', 'confirmed']:
            raise ValueError(f"Impossible de marquer comme absent un entretien avec le statut: {schedule.status}")
        
        schedule.status = 'no_show'
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enregistrer dans les logs d'audit
        self.audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=user_id,
            action='mark_no_show',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Absence du candidat {schedule.candidate_name} à l'entretien {schedule.mode}"
        )
        
        return schedule
    
    def get_mode_statistics(self, organization_id, from_date=None, to_date=None):
        """
        Obtient des statistiques sur les modes d'entretien
        
        Args:
            organization_id: ID de l'organisation
            from_date: Date de début (optionnel)
            to_date: Date de fin (optionnel)
            
        Returns:
            Dictionnaire avec les statistiques par mode
        """
        query = InterviewSchedule.query.filter_by(organization_id=organization_id)
        
        if from_date:
            query = query.filter(InterviewSchedule.scheduled_at >= from_date)
        
        if to_date:
            query = query.filter(InterviewSchedule.scheduled_at <= to_date)
        
        schedules = query.all()
        
        stats = {
            'collaborative': {'total': 0, 'completed': 0, 'canceled': 0, 'no_show': 0},
            'autonomous': {'total': 0, 'completed': 0, 'canceled': 0, 'no_show': 0}
        }
        
        for schedule in schedules:
            mode = schedule.mode
            if mode in stats:
                stats[mode]['total'] += 1
                if schedule.status == 'completed':
                    stats[mode]['completed'] += 1
                elif schedule.status == 'canceled':
                    stats[mode]['canceled'] += 1
                elif schedule.status == 'no_show':
                    stats[mode]['no_show'] += 1
        
        return stats
    
    def test_google_integration(self):
        """
        Teste l'intégration Google Calendar/Meet
        
        Returns:
            Dictionnaire avec le résultat du test
        """
        return self.meet_service.test_connection()
    
    def test_teams_integration(self) -> dict:
        """Tester l'intégration Teams"""
        return self.teams_service.test_teams_integration()
    
    
