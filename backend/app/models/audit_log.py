from datetime import datetime
import uuid
from flask_sqlalchemy import SQLAlchemy
from app import db

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Peut être null pour actions système
    action = db.Column(db.String(50), nullable=False)  # Type d'action (create, update, delete, etc.)
    entity_type = db.Column(db.String(50), nullable=False)  # Type d'entité concernée (user, interview, invitation, etc.)
    entity_id = db.Column(db.String(50), nullable=True)  # ID de l'entité concernée
    description = db.Column(db.Text, nullable=False)  # Description détaillée de l'action
    metadata = db.Column(db.JSON, nullable=True)  # Données supplémentaires au format JSON
    ip_address = db.Column(db.String(45), nullable=True)  # Adresse IP de l'utilisateur
    user_agent = db.Column(db.String(255), nullable=True)  # User-Agent du navigateur
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    organization = db.relationship('Organization', backref=db.backref('audit_logs', lazy=True))
    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))