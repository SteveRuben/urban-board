# backend/app/models/notification.py
from datetime import datetime
import json
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app import db

class Notification(db.Model):
    """
    Modèle représentant une notification dans le système.
    
    Cette classe gère les notifications envoyées aux utilisateurs
    pour différents événements dans l'application.
    """
    __tablename__ = 'notifications'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    reference_id = Column(String(36), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Notification {self.id}: {self.type} - {self.title[:20]}>"
    
    def to_dict(self):
        """
        Convertit l'objet en dictionnaire pour les réponses API.
        
        Returns:
            dict: Représentation dictionnaire de l'objet
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'reference_id': self.reference_id,
            'read': self.is_read,
            'date': self.created_at.isoformat() if self.created_at else None,
        }
    
    @staticmethod
    def from_dict(data):
        """
        Crée une instance à partir d'un dictionnaire.
        Utile pour les tests et le développement.
        
        Args:
            data (dict): Dictionnaire de données
            
        Returns:
            Notification: Nouvelle instance
        """
        created_at = data.get('created_at') or data.get('date')
        
        # Convertir les chaînes ISO en objets datetime
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except:
                created_at = datetime.now()
        
        return Notification(
            id=data.get('id'),
            user_id=data.get('user_id'),
            title=data.get('title'),
            message=data.get('message'),
            type=data.get('type'),
            link=data.get('link'),
            reference_id=data.get('reference_id'),
            is_read=data.get('is_read') or data.get('read', False),
            created_at=created_at
        )

    # Pour compatibilité avec le service existant
    @staticmethod
    def create_from_dict(db, data):
        """
        Crée et sauvegarde une notification à partir d'un dictionnaire.
        
        Args:
            db: Instance de la base de données
            data (dict): Données de la notification
            
        Returns:
            Notification: L'instance créée et sauvegardée
        """
        notification = Notification.from_dict(data)
        db.session.add(notification)
        db.session.commit()
        return notification

    # Types de notifications constants
    TYPE_INTERVIEW_COMPLETED = 'interview_completed'
    TYPE_INTERVIEW_SCHEDULED = 'interview_scheduled'
    TYPE_CANDIDATE_APPLICATION = 'candidate_application'
    TYPE_JOB_POSITION = 'job_position'
    TYPE_BIOMETRIC_ANALYSIS = 'biometric_analysis'
    TYPE_COLLABORATION = 'collaboration'
    TYPE_SUBSCRIPTION_RENEWAL = 'subscription_renewal'
    TYPE_SYSTEM = 'system'
    
    @staticmethod
    def get_notification_types():
        """
        Retourne la liste des types de notifications disponibles.
        
        Returns:
            list: Liste des types de notifications
        """
        return [
            Notification.TYPE_INTERVIEW_COMPLETED,
            Notification.TYPE_INTERVIEW_SCHEDULED,
            Notification.TYPE_CANDIDATE_APPLICATION,
            Notification.TYPE_JOB_POSITION,
            Notification.TYPE_BIOMETRIC_ANALYSIS,
            Notification.TYPE_COLLABORATION,
            Notification.TYPE_SUBSCRIPTION_RENEWAL,
            Notification.TYPE_SYSTEM
        ]