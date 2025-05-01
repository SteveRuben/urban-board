from datetime import datetime
import uuid
from flask_sqlalchemy import SQLAlchemy
from app import db

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Peut être null pour actions système
    action = db.Column(db.String(50), nullable=False)  # Type d'action (create, update, delete, etc.)
    entity_type = db.Column(db.String(50), nullable=False)  # Type d'entité concernée (user, interview, invitation, etc.)
    entity_id = db.Column(db.String(50), nullable=True)  # ID de l'entité concernée
    description = db.Column(db.Text, nullable=False)  # Description détaillée de l'action
    data = db.Column(db.JSON, nullable=True)  # Données supplémentaires au format JSON
    ip_address = db.Column(db.String(45), nullable=True)  # Adresse IP de l'utilisateur
    user_agent = db.Column(db.String(255), nullable=True)  # User-Agent du navigateur
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    organization = db.relationship('Organization', backref=db.backref('audit_logs', lazy=True))
    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour l'API"""
        return {
            'id': self.id,
            'organization_id': self.organization_id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'description': self.description,
            'data': self.data,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat(),
            'user': {
                'id': self.user.id,
                'name': self.user.name,
                'email': self.user.email
            } if self.user else None
        }