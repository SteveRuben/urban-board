from sqlalchemy import Column, Integer, String, Text
from app import db

class Challenge(db.Model):
    __tablename__ = 'challenges'

    id = db.Column(Integer, primary_key=True)
    title = db.Column(String(255), nullable=False)
    description = db.Column(Text)
    status = db.Column(String(50), default='draft')
