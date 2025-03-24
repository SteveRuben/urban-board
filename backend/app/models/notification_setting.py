# backend/app/models/notification_setting.py
import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, UniqueConstraint
from app import db

class NotificationSetting(db.Model):
    """
    Modèle pour stocker les paramètres de notification par type et catégorie.
    
    Ce modèle permet de définir pour chaque utilisateur si un type de notification
    spécifique est activé ou désactivé pour une catégorie donnée (email, application, mobile).
    """
    __tablename__ = 'notification_settings'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    category = Column(String(20), nullable=False)  # 'email', 'inApp', 'mobile'
    notification_type = Column(String(50), nullable=False)  # 'interview_completed', etc.
    enabled = Column(Boolean, default=True)
    created_at = Column(db.DateTime, default=datetime.datetime.now())
    updated_at = Column(db.DateTime, default=datetime.datetime.now(), onupdate=datetime.datetime.now())
    
    # Contrainte d'unicité pour éviter les doublons
    __table_args__ = (
        UniqueConstraint('user_id', 'category', 'notification_type', name='uix_user_category_type'),
    )
    
    def __repr__(self):
        return f"<NotificationSetting {self.id}: {self.category} - {self.notification_type} - {self.enabled}>"
    
    def to_dict(self):
        """
        Convertit l'objet en dictionnaire.
        
        Returns:
            dict: Représentation dictionnaire de l'objet
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category,
            'notification_type': self.notification_type,
            'enabled': self.enabled,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class NotificationPreference(db.Model):
    __tablename__ = 'notification_preferences'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    email_preferences = db.Column(db.Text, nullable=False, default='{}')
    push_preferences = db.Column(db.Text, nullable=False, default='{}')
    desktop_preferences = db.Column(db.Text, nullable=False, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    
    # Relation avec l'utilisateur
    user = db.relationship('User', backref=db.backref('notification_preferences', lazy=True))
    
    def __init__(self, user_id, email_preferences=None, push_preferences=None, desktop_preferences=None, created_at=None, updated_at=None):
        self.user_id = user_id
        self.email_preferences = email_preferences or {
            'newMessages': True,
            'interviewReminders': True,
            'weeklyReports': True,
            'marketingEmails': False
        }
        self.push_preferences = push_preferences or {
            'newMessages': True,
            'interviewReminders': True,
            'candidateUpdates': True,
            'teamNotifications': True
        }
        self.desktop_preferences = desktop_preferences or {
            'newMessages': True,
            'interviewReminders': True,
            'candidateUpdates': False,
            'teamNotifications': True
        }
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
    
    def to_dict(self):
        return {
            'email': self.email_preferences,
            'push': self.push_preferences,
            'desktop': self.desktop_preferences
        }
    
    @property
    def email_prefs(self):
        return json.loads(self.email_preferences)

    @email_prefs.setter
    def email_prefs(self, value):
        self.email_preferences = json.dumps(value)
        
