# backend/app/models/two_factor_auth.py
from .. import db
import datetime

class TwoFactorAuth(db.Model):
    __tablename__ = 'two_factor_auth'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    secret_key = db.Column(db.String(255), nullable=False)
    method = db.Column(db.String(20), nullable=False, default='app')  # 'app', 'sms', 'email'
    is_enabled = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    
    # Relation avec l'utilisateur
    user = db.relationship('User', backref=db.backref('two_factor_auth', lazy=True))
    
    def __init__(self, user_id, secret_key, method='app', is_enabled=False, created_at=None, updated_at=None):
        self.user_id = user_id
        self.secret_key = secret_key
        self.method = method
        self.is_enabled = is_enabled
        self.created_at = created_at or datetime.datetime.now()
        self.updated_at = updated_at or datetime.datetime.now()
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'method': self.method,
            'is_enabled': self.is_enabled,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }