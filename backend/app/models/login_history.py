# backend/app/models/login_history.py
from .. import db
import datetime

class LoginHistory(db.Model):
    __tablename__ = 'login_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.now, nullable=False)
    ip_address = db.Column(db.String(50), nullable=True)
    device = db.Column(db.String(255), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='success')  # 'success', 'failed'
    
    # Relation avec l'utilisateur
    user = db.relationship('User', backref=db.backref('login_history', lazy=True))
    
    def __init__(self, user_id, ip_address=None, device=None, location=None, status='success', timestamp=None):
        self.user_id = user_id
        self.ip_address = ip_address
        self.device = device
        self.location = location
        self.status = status
        self.timestamp = timestamp or datetime.datetime.now()
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'timestamp': self.timestamp.isoformat(),
            'ip_address': self.ip_address,
            'device': self.device,
            'location': self.location,
            'status': self.status
        }