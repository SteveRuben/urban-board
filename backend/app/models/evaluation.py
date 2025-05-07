# backend/models/evaluation.py
from datetime import datetime
from app import db

class Evaluation(db.Model):
    __tablename__ = 'evaluations'
    
    id = db.Column(db.Integer, primary_key=True)
    response_id = db.Column(db.Integer, db.ForeignKey('interview_responses.id'), nullable=False, unique=True)
    exactitude = db.Column(db.Float, nullable=True)  # Score sur 5
    clarte = db.Column(db.Float, nullable=True)  # Score sur 5
    profondeur = db.Column(db.Float, nullable=True)  # Score sur 5
    score_global = db.Column(db.Float, nullable=True)  # Score global sur 5
    feedback = db.Column(db.Text, nullable=True)  # Commentaire global sur la réponse
    points_forts = db.Column(db.JSON, nullable=True)  # ["Point fort 1", "Point fort 2", ...]
    axes_amelioration = db.Column(db.JSON, nullable=True)  # ["Axe 1", "Axe 2", ...]
    ai_model = db.Column(db.String(50), nullable=True)  # 'claude', 'gpt4', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'response_id': self.response_id,
            'exactitude': self.exactitude,
            'clarte': self.clarte,
            'profondeur': self.profondeur,
            'score_global': self.score_global,
            'feedback': self.feedback,
            'points_forts': self.points_forts,
            'axes_amelioration': self.axes_amelioration,
            'ai_model': self.ai_model,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class InterviewSummary(db.Model):
    __tablename__ = 'interview_summaries'
    
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False, unique=True)
    synthese = db.Column(db.Text, nullable=True)  # Synthèse globale de l'entretien
    competences_techniques = db.Column(db.JSON, nullable=True)  # {"dev": 4, "design": 3, ...}
    points_forts = db.Column(db.JSON, nullable=True)  # ["Point fort 1", ...]
    axes_amelioration = db.Column(db.JSON, nullable=True)  # ["Axe 1", ...]
    adequation_poste = db.Column(db.JSON, nullable=True)  # {"score": 4, "justification": "..."}
    recommandation = db.Column(db.String(50), nullable=True)  # 'embaucher', 'considérer', 'rejeter'
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Utilisateur qui a généré le résumé
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    interview = db.relationship('Interview', backref='summary', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'interview_id': self.interview_id,
            'synthese': self.synthese,
            'competences_techniques': self.competences_techniques,
            'points_forts': self.points_forts,
            'axes_amelioration': self.axes_amelioration,
            'adequation_poste': self.adequation_poste,
            'recommandation': self.recommandation,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }