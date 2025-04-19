# backend/services/interview_scheduling_service.py
from datetime import datetime, timedelta
import uuid
from models.interview_scheduling import InterviewSchedule
from services.notification_service import NotificationService
from services.email_service import EmailService
from services.audit_service import AuditService
from services.subscription_service import SubscriptionService
from app import db

class InterviewSchedulingService:
    """Service pour gérer la planification des entretiens"""
    
    def __init__(self):
        self.notification_service = NotificationService()
        self.email_service = EmailService()
        self.audit_service = AuditService()
        self.subscription_service = SubscriptionService()
    
    def create_schedule(self, organization_id, recruiter_id, data):
        """
        Crée une nouvelle planification d'entretien
        
        Args:
            organization_id: ID de l'organisation
            recruiter_id: ID du recruteur
            data: Données de la planification
        
        Returns:
            L'objet InterviewSchedule créé
        """
        # Vérifier les limites d'entretiens du plan
        if not self.subscription_service.check_interview_limit(recruiter_id):
            raise ValueError("Limite d'entretiens atteinte pour votre plan d'abonnement")
        
        # Créer la planification
        schedule = InterviewSchedule(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            recruiter_id=recruiter_id,
            candidate_name=data.get('candidate_name'),
            candidate_email=data.get('candidate_email'),
            candidate_phone=data.get('candidate_phone'),
            title=data.get('title'),
            description=data.get('description'),
            position=data.get('position'),
            scheduled_at=datetime.fromisoformat(data.get('scheduled_at')),
            duration_minutes=data.get('duration_minutes', 30),
            timezone=data.get('timezone', 'Europe/Paris'),
            mode=data.get('mode'),
            ai_assistant_id=data.get('ai_assistant_id'),
            predefined_questions=data.get('predefined_questions'),
            access_token=str(uuid.uuid4()),
            status='scheduled'
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        # Enregistrer dans les logs d'audit
        self.audit_service.log_action(
            organization_id=organization_id,
            user_id=recruiter_id,
            action='create',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Entretien planifié avec {schedule.candidate_name} pour le {schedule.scheduled_at}"
        )
        
        # Envoyer les notifications
        try:
            # Notification au recruteur
            self.notification_service.send_notification(
                user_id=recruiter_id,
                title="Nouvel entretien planifié",
                message=f"Vous avez planifié un entretien avec {schedule.candidate_name} pour le {schedule.scheduled_at}",
                type="interview_scheduled",
                data={"schedule_id": schedule.id}
            )
            
            # Email au candidat
            self.email_service.send_interview_invitation(
                email=schedule.candidate_email,
                candidate_name=schedule.candidate_name,
                interview_title=schedule.title,
                recruiter_name=schedule.recruiter.name,
                scheduled_at=schedule.scheduled_at,
                duration_minutes=schedule.duration_minutes,
                timezone=schedule.timezone,
                access_token=schedule.access_token,
                description=schedule.description
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi des notifications: {str(e)}")
        
        return schedule
    
    def update_schedule(self, schedule_id, recruiter_id, data):
        """
        Met à jour une planification d'entretien
        
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
            from models.organization import OrganizationMember
            is_admin = OrganizationMember.query.filter_by(
                organization_id=schedule.organization_id,
                user_id=recruiter_id,
                role='admin'
            ).first() is not None
            
            if not is_admin:
                raise ValueError("Vous n'avez pas la permission de modifier cet entretien")
        
        # Vérifier si la date a changé
        date_changed = False
        if 'scheduled_at' in data and data['scheduled_at']:
            new_date = datetime.fromisoformat(data['scheduled_at'])
            date_changed = new_date != schedule.scheduled_at
        
        # Mettre à jour les champs
        for field in ['candidate_name', 'candidate_email', 'candidate_phone', 
                      'title', 'description', 'position', 'duration_minutes', 
                      'timezone', 'mode', 'ai_assistant_id', 'predefined_questions', 'status']:
            if field in data and data[field] is not None:
                setattr(schedule, field, data[field])
        
        if 'scheduled_at' in data and data['scheduled_at']:
            schedule.scheduled_at = datetime.fromisoformat(data['scheduled_at'])
        
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enregistrer dans les logs d'audit
        self.audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=recruiter_id,
            action='update',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Modification de l'entretien avec {schedule.candidate_name}"
        )
        
        # Si la date a changé, envoyer des notifications
        if date_changed:
            try:
                # Notification au recruteur
                self.notification_service.send_notification(
                    user_id=schedule.recruiter_id,
                    title="Entretien reprogrammé",
                    message=f"L'entretien avec {schedule.candidate_name} a été reprogrammé pour le {schedule.scheduled_at}",
                    type="interview_rescheduled",
                    data={"schedule_id": schedule.id}
                )
                
                # Email au candidat
                self.email_service.send_interview_rescheduled(
                    email=schedule.candidate_email,
                    candidate_name=schedule.candidate_name,
                    interview_title=schedule.title,
                    recruiter_name=schedule.recruiter.name,
                    scheduled_at=schedule.scheduled_at,
                    duration_minutes=schedule.duration_minutes,
                    timezone=schedule.timezone,
                    access_token=schedule.access_token
                )
            except Exception as e:
                print(f"Erreur lors de l'envoi des notifications: {str(e)}")
        
        return schedule
    
    def cancel_schedule(self, schedule_id, user_id, reason=None):
        """
        Annule une planification d'entretien
        
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
            from models.organization import OrganizationMember
            is_admin = OrganizationMember.query.filter_by(
                organization_id=schedule.organization_id,
                user_id=user_id,
                role='admin'
            ).first() is not None
            
            if not is_admin:
                raise ValueError("Vous n'avez pas la permission d'annuler cet entretien")
        
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
            description=f"Annulation de l'entretien avec {schedule.candidate_name}" + 
                        (f" - Raison: {reason}" if reason else "")
        )
        
        # Envoyer des notifications
        try:
            # Notification au recruteur
            self.notification_service.send_notification(
                user_id=schedule.recruiter_id,
                title="Entretien annulé",
                message=f"L'entretien avec {schedule.candidate_name} a été annulé",
                type="interview_canceled",
                data={"schedule_id": schedule.id}
            )
            
            # Email au candidat
            self.email_service.send_interview_canceled(
                email=schedule.candidate_email,
                candidate_name=schedule.candidate_name,
                interview_title=schedule.title,
                recruiter_name=schedule.recruiter.name,
                reason=reason
            )
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
            query = query.filter_by(status=status)
        
        if from_date:
            query = query.filter(InterviewSchedule.scheduled_at >= from_date)
        
        if to_date:
            query = query.filter(InterviewSchedule.scheduled_at <= to_date)
        
        return query.order_by(InterviewSchedule.scheduled_at).all()
    
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
            InterviewSchedule.status == 'scheduled',
            InterviewSchedule.scheduled_at >= now,
            InterviewSchedule.scheduled_at <= reminder_window,
            InterviewSchedule.reminder_sent == False
        ).all()
        
        count = 0
        for schedule in schedules:
            try:
                # Email au candidat
                self.email_service.send_interview_reminder(
                    email=schedule.candidate_email,
                    candidate_name=schedule.candidate_name,
                    interview_title=schedule.title,
                    recruiter_name=schedule.recruiter.name,
                    scheduled_at=schedule.scheduled_at,
                    duration_minutes=schedule.duration_minutes,
                    timezone=schedule.timezone,
                    access_token=schedule.access_token
                )
                
                # Notification au recruteur
                self.notification_service.send_notification(
                    user_id=schedule.recruiter_id,
                    title="Rappel d'entretien",
                    message=f"Rappel: Vous avez un entretien avec {schedule.candidate_name} demain à {schedule.scheduled_at.strftime('%H:%M')}",
                    type="interview_reminder",
                    data={"schedule_id": schedule.id}
                )
                
                # Marquer comme rappel envoyé
                schedule.reminder_sent = True
                count += 1
            except Exception as e:
                print(f"Erreur lors de l'envoi du rappel: {str(e)}")
        
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
            description=f"Absence du candidat {schedule.candidate_name} à l'entretien"
        )
        
        return schedule