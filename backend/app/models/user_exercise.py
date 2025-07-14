# backend/models/user_exercise.py
import uuid
from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app import db
from datetime import datetime, timezone, timedelta

class UserExercise(db.Model):
    """
    Modèle pour gérer les exercices assignés aux candidats lors des entretiens
    """
    __tablename__ = 'user_exercises'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    interview_schedule_id = db.Column(db.Integer, db.ForeignKey('interview_schedules.id'), nullable=False)
    candidate_email = db.Column(db.String(255), nullable=False)
    candidate_name = db.Column(db.String(255), nullable=False)
    
    # Exercices sélectionnés (liste d'IDs)
    exercise_ids = db.Column(db.JSON, nullable=False) 
    
    # Token d'accès sécurisé pour le candidat
    access_token = db.Column(db.String(255), nullable=False, unique=True, default=lambda: str(uuid.uuid4()))
    
    # Statut de progression
    status = db.Column(db.String(50), default='not_started')  # not_started, in_progress, completed, expired
    
    # Métadonnées de l'entretien
    position = db.Column(db.String(255), nullable=False)
    job_keywords = db.Column(db.JSON)  # Mots-clés utilisés pour la recherche d'exercices
    
    # Dates importantes
    available_from = db.Column(db.DateTime, nullable=False)  # Quand le candidat peut commencer
    expires_at = db.Column(db.DateTime, nullable=False)  # Quand l'accès expire
    started_at = db.Column(db.DateTime, nullable=True)  # Quand le candidat a commencé
    completed_at = db.Column(db.DateTime, nullable=True)  # Quand le candidat a terminé
    
    # Paramètres de configuration
    time_limit_minutes = db.Column(db.Integer, default=120)  # Temps limite total
    max_attempts = db.Column(db.Integer, default=5)  # Nombre de tentatives autorisées
    current_attempts = db.Column(db.Integer, default=0)
    
    # Résultats globaux
    total_score = db.Column(db.Integer, default=0)
    exercises_completed = db.Column(db.Integer, default=0)
    total_exercises = db.Column(db.Integer, default=0)
    
    # Suivi administratif
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relations
    interview_schedule = db.relationship('InterviewSchedule', backref='user_exercises')
    
    def to_dict(self, include_token=False, include_detailed_progress=False):
        result = {
            'id': self.id,
            'interview_schedule_id': self.interview_schedule_id,
            'candidate_email': self.candidate_email,
            'candidate_name': self.candidate_name,
            'exercise_ids': self.exercise_ids,
            'status': self.status,
            'position': self.position,
            'job_keywords': self.job_keywords,
            'available_from': self.available_from.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'time_limit_minutes': self.time_limit_minutes,
            'max_attempts': self.max_attempts,
            'current_attempts': self.current_attempts,
            'total_score': self.total_score,
            'exercises_completed': self.exercises_completed,
            'total_exercises': self.total_exercises,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_token:
            result['access_token'] = self.access_token
            
        if include_detailed_progress and self.interview_schedule:
            result['interview_info'] = {
                'title': self.interview_schedule.title,
                'scheduled_at': self.interview_schedule.scheduled_at.isoformat(),
                'recruiter_name': getattr(self.interview_schedule.recruiter, 'first_name', 'Équipe RH') if self.interview_schedule.recruiter else 'Équipe RH'
            }
        
        return result
    
    def is_accessible(self):
        """Vérifie si le candidat peut accéder aux exercices"""
        print('confoiririiririri........')
        now = datetime.now(timezone.utc) 
        available_from = self.available_from
        expires_at = self.expires_at

        # Si les dates n'ont pas de timezone, on assume UTC
        if available_from.tzinfo is None:
            available_from = available_from.replace(tzinfo=timezone.utc)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        print(f'Vérification accès: now={now}, available_from={available_from}, expires_at={expires_at}')
        print(f'Status: {self.status}, attempts: {self.current_attempts}/{self.max_attempts}')

        # Vérifications avec une logique plus claire
        if (available_from <= now <= expires_at and 
            self.status not in ['completed', 'expired']):
            return True

        return False
    
    def is_expired(self):
        """Vérifie si l'accès a expiré"""
        expires_at = self.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        return datetime.now(timezone.utc) > expires_at
    
    def start_session(self):
        """Démarre une session d'exercices"""
        if not self.is_accessible():
            raise ValueError("Accès non autorisé aux exercices")
        
        if self.status == 'not_started':
            self.status = 'in_progress'
            self.started_at = datetime.now(timezone.utc)
            self.current_attempts += 1
            db.session.commit()
    
    def complete_session(self):
        """Marque la session comme terminée"""
        self.status = 'completed'
        self.completed_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def calculate_progress_percentage(self):
        """Calcule le pourcentage de progression"""
        if self.total_exercises == 0:
            return 0
        return round((self.exercises_completed / self.total_exercises) * 100, 2)