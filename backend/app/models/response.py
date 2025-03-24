# backend/models/response.py
from datetime import datetime
from app import db

class Response(db.Model):
    __tablename__ = 'responses'
    
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)  # Texte de la réponse
    audio_url = db.Column(db.String(255), nullable=True)  # URL de l'enregistrement audio
    transcription_method = db.Column(db.String(50), nullable=True)  # 'whisper', 'openai-api', 'manual'
    response_time = db.Column(db.Integer, nullable=True)  # Temps de réponse en secondes
    was_edited = db.Column(db.Boolean, default=False)  # Si le texte a été édité manuellement
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    interview = db.relationship('Interview', backref='responses')
    evaluation = db.relationship('Evaluation', backref='response', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'interview_id': self.interview_id,
            'text': self.text,
            'audio_url': self.audio_url,
            'transcription_method': self.transcription_method,
            'response_time': self.response_time,
            'was_edited': self.was_edited,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'evaluation': self.evaluation.to_dict() if self.evaluation else None
        }