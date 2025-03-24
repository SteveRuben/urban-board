# backend/models/collaboration.py
from datetime import datetime
from app import db

class InterviewShare(db.Model):
    __tablename__ = 'interview_shares'
    
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    shared_with_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    permission_level = db.Column(db.String(20), nullable=False, default='viewer')  # viewer, commenter, editor
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # Optionnel, pour partage temporaire
    
    interview = db.relationship('Interview', backref='shares')
    owner = db.relationship('User', foreign_keys=[owner_id], backref='shared_interviews')
    shared_with = db.relationship('User', foreign_keys=[shared_with_id], backref='interviews_shared_with_me')

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Integer, nullable=True)  # Position dans l'entretien (en secondes)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    interview = db.relationship('Interview', backref='comments')
    user = db.relationship('User', backref='comments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'interview_id': self.interview_id,
            'user_id': self.user_id,
            'user_name': f"{self.user.first_name} {self.user.last_name}",
            'content': self.content,
            'timestamp': self.timestamp,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CollaborationActivity(db.Model):
    __tablename__ = 'collaboration_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)  # view, comment, edit, rate
    details = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    interview = db.relationship('Interview', backref='activities')
    user = db.relationship('User', backref='interview_activities')

# Nouveaux modèles pour la gestion d'équipes

class Team(db.Model):
    """Modèle représentant une équipe de recruteurs"""
    __tablename__ = 'teams'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relations
    members = db.relationship('TeamMember', back_populates='team', cascade='all, delete-orphan')
    creator = db.relationship('User', backref='created_teams')
    
    def __repr__(self):
        return f"<Team {self.name}>"

class TeamMember(db.Model):
    """Modèle représentant un membre d'une équipe"""
    __tablename__ = 'team_members'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='member')  # 'admin', 'member', 'observer'
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    team = db.relationship('Team', back_populates='members')
    user = db.relationship('User', backref='team_memberships')
    
    # Contrainte d'unicité pour éviter les doublons
    __table_args__ = (db.UniqueConstraint('team_id', 'user_id', name='unique_team_member'),)
    
    def __repr__(self):
        return f"<TeamMember {self.user_id} in {self.team_id}>"

class TeamInterviewAccess(db.Model):
    """Modèle pour gérer l'accès d'une équipe à un entretien"""
    __tablename__ = 'team_interview_access'
    
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id'), nullable=False)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    permission_level = db.Column(db.String(20), nullable=False, default='viewer')  # viewer, commenter, editor
    granted_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # Optionnel, pour accès temporaire
    
    # Relations
    team = db.relationship('Team', backref='interview_access')
    interview = db.relationship('Interview', backref='team_access')
    grantor = db.relationship('User', backref='granted_team_access')
    
    # Contrainte d'unicité pour éviter les doublons
    __table_args__ = (db.UniqueConstraint('team_id', 'interview_id', name='unique_team_interview'),)
    
    def __repr__(self):
        return f"<TeamInterviewAccess Team:{self.team_id} Interview:{self.interview_id}>"

class TeamNote(db.Model):
    """Modèle pour les notes collaboratives d'équipe sur un entretien"""
    __tablename__ = 'team_notes'
    
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id'), nullable=False)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    visibility = db.Column(db.String(20), default='team')  # 'team', 'private'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    team = db.relationship('Team', backref='notes')
    interview = db.relationship('Interview', backref='team_notes')
    author = db.relationship('User', backref='team_notes')
    
    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'interview_id': self.interview_id,
            'author_id': self.author_id,
            'author_name': f"{self.author.first_name} {self.author.last_name}",
            'content': self.content,
            'visibility': self.visibility,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Ajouter à la fin du fichier collaboration.py

class AIAssistant(db.Model):
    """Modèle représentant un assistant IA pouvant être membre d'une équipe"""
    __tablename__ = 'ai_assistants'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    assistant_type = db.Column(db.String(50), nullable=False)  # 'general', 'recruiter', 'evaluator', etc.
    capabilities = db.Column(db.JSON, nullable=True)  # Fonctionnalités disponibles pour cette IA
    model_version = db.Column(db.String(50), nullable=True)  # Version du modèle d'IA
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    creator = db.relationship('User', backref='created_assistants')
    
    def __repr__(self):
        return f"<AIAssistant {self.name} ({self.assistant_type})>"


class TeamAIAssistant(db.Model):
    """Association entre une équipe et un assistant IA"""
    __tablename__ = 'team_ai_assistants'
    
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id'), primary_key=True)
    ai_assistant_id = db.Column(db.String(36), db.ForeignKey('ai_assistants.id'), primary_key=True)
    role = db.Column(db.String(20), nullable=False, default='assistant')  # 'assistant', 'evaluator', 'analyzer'
    added_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relations
    team = db.relationship('Team', backref='ai_assistants')
    ai_assistant = db.relationship('AIAssistant', backref='teams')
    adder = db.relationship('User', backref='added_ai_assistants')
    
    def __repr__(self):
        return f"<TeamAIAssistant {self.ai_assistant_id} in {self.team_id}>"


class AIGeneratedContent(db.Model):
    """Contenu généré par une IA dans le cadre d'une équipe"""
    __tablename__ = 'ai_generated_contents'
    
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.String(36), db.ForeignKey('teams.id'), nullable=False)
    interview_id = db.Column(db.Integer, db.ForeignKey('interviews.id'), nullable=False)
    ai_assistant_id = db.Column(db.String(36), db.ForeignKey('ai_assistants.id'), nullable=False)
    content_type = db.Column(db.String(50), nullable=False)  # 'comment', 'analysis', 'summary', 'question', 'evaluation'
    content = db.Column(db.Text, nullable=False)
    metadata = db.Column(db.JSON, nullable=True)  # Informations supplémentaires sur la génération
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    team = db.relationship('Team', backref='ai_contents')
    interview = db.relationship('Interview', backref='ai_contents')
    ai_assistant = db.relationship('AIAssistant', backref='generated_contents')
    
    def to_dict(self):
        return {
            'id': self.id,
            'team_id': self.team_id,
            'interview_id': self.interview_id,
            'ai_assistant_id': self.ai_assistant_id,
            'ai_assistant_name': self.ai_assistant.name,
            'content_type': self.content_type,
            'content': self.content,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }