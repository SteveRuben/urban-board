# backend/models/question.py
from datetime import datetime
from app import db

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    original_text = db.Column(db.Text, nullable=False)  # Texte original de la question
    displayed_text = db.Column(db.Text, nullable=True)  # Texte affiché (peut être modifié)
    difficulty = db.Column(db.String(20), nullable=True)  # 'facile', 'moyenne', 'difficile'
    category = db.Column(db.String(50), nullable=True)  # Catégorie de la question
    reasoning = db.Column(db.Text, nullable=True)  # Pourquoi cette question est pertinente
    position = db.Column(db.Integer, nullable=False)  # Position dans la séquence de questions
    was_modified = db.Column(db.Boolean, default=False)  # Si la question a été modifiée
    modification_reason = db.Column(db.String(50), nullable=True)  # 'unclear', 'timeout', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    interview = db.relationship('Interview', backref='questions')
    responses = db.relationship('Response', backref='question', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'interview_id': self.interview_id,
            'original_text': self.original_text,
            'displayed_text': self.displayed_text or self.original_text,
            'difficulty': self.difficulty,
            'category': self.category,
            'reasoning': self.reasoning,
            'position': self.position,
            'was_modified': self.was_modified,
            'modification_reason': self.modification_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }