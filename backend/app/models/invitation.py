from datetime import datetime
import uuid
from flask_sqlalchemy import SQLAlchemy
from app import db

class Invitation(db.Model):
    __tablename__ = 'invitations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id= db.Column(db.String(36), db.ForeignKey('organization.id'), nullable=False)
    created_by= db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    email= db.Column(db.String(255), nullable=False)
    role= db.Column(db.String(50), nullable=False)  # 'user', 'admin', 'owner'
    token= db.Column(db.String(255), nullable=False)
    status= db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'accepted', 'declined'
    created_at= db.Column(db.DateTime, default=datetime.utcnow)
    updated_at= db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)