from sqlalchemy import UUID, Integer, String, Text
# from app.models.user import User
from app import db

class Challenge(db.Model):
    __tablename__ = 'challenges'

    id = db.Column(Integer, primary_key=True)
    title = db.Column(String(255), nullable=False)
    description = db.Column(Text)
    status = db.Column(String(50), default='draft')
    
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    owner = db.relationship('User', backref='challenges')
