# backend/models/interview_scheduling.py
from datetime import datetime
import uuid
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import job_posting
from app import db

class InterviewSchedule(db.Model):
    __tablename__ = 'interview_schedules'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    # Informations sur le recruteur
    recruiter_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    
    # Informations sur le candidat
    candidate_name = db.Column(db.String(255), nullable=False)
    candidate_email = db.Column(db.String(255), nullable=False)
    candidate_phone = db.Column(db.String(50), nullable=True)
    
    # Détails de l'entretien
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    position = db.Column(db.String(255), nullable=True)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=30)
    timezone = db.Column(db.String(50), default="Africa/Douala")
    
    # Mode d'entretien
    mode = db.Column(db.Enum('autonomous', 'collaborative', name='interview_mode'), nullable=False)
    
    # Si un assistant IA spécifique est sélectionné
    ai_assistant_id = db.Column(db.String(36), db.ForeignKey("ai_assistants.id"), nullable=True)
    
    # Questions prédéfinies (stockées en JSON)
    predefined_questions = db.Column(db.JSON, nullable=True)
    
    # Statut et suivi
    status = db.Column(db.Enum(
        'scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show',
        name='interview_status'), default='scheduled')
    reminder_sent = db.Column(db.Boolean, default=False)
    cancellation_reason = db.Column(db.Text, nullable=True)
    
    # Lien de l'entretien (accessible par le candidat)
    access_token = db.Column(db.String(100), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    
    # Résultat de l'entretien (lien vers l'entretien réalisé)
    interview_id = db.Column(db.String(36), db.ForeignKey("interviews.id"), nullable=True)
    
    # Métadonnées
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    organization = relationship("Organization")
    recruiter = relationship("User", foreign_keys=[recruiter_id])
    ai_assistant = relationship("AIAssistant")
    interview = relationship("Interview")
    # Ajouter ce champ à models/interview_scheduling.py dans la classe InterviewSchedule
    job_posting_id = db.Column(db.String(36), db.ForeignKey("job_postings.id"), nullable=True)
    job_posting = relationship("JobPosting", back_populates="interview_schedules")
    
    def __repr__(self):
        return f"<InterviewSchedule {self.candidate_name} - {self.scheduled_at}>"
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'recruiter_id': self.recruiter_id,
            'recruiter_name': self.recruiter.name if self.recruiter else None,
            'candidate_name': self.candidate_name,
            'candidate_email': self.candidate_email,
            'candidate_phone': self.candidate_phone,
            'title': self.title,
            'description': self.description,
            'position': self.position,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'duration_minutes': self.duration_minutes,
            'timezone': self.timezone,
            'mode': self.mode,
            'ai_assistant_id': self.ai_assistant_id,
            'ai_assistant_name': self.ai_assistant.name if self.ai_assistant else None,
            'predefined_questions': self.predefined_questions,
            'status': self.status,
            'reminder_sent': self.reminder_sent,
            'cancellation_reason': self.cancellation_reason,
            'access_token': self.access_token,
            'interview_id': self.interview_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }