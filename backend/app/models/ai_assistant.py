# backend/app/models/ai_assistant.py
from datetime import datetime
import uuid
from sqlalchemy import CHAR, TypeDecorator
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship
from cryptography.fernet import Fernet
import os

from app import db
from ..models.organization import GUID


class AIAssistant(db.Model):
    """Modèle pour les assistants IA configurables"""
    __tablename__ = 'ai_assistants'

    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(GUID(), db.ForeignKey('users.id'), nullable=False)
    organization_id = db.Column(GUID(), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    
    # Informations de base
    name = db.Column(db.String(100), nullable=False)
    assistant_type = db.Column(db.String(50), nullable=False)  # 'general', 'recruiter', 'evaluator', etc.
    description = db.Column(db.Text, nullable=True)
    avatar = db.Column(db.String(255), nullable=True, default='/images/ai-assistant-default.png')
    model = db.Column(db.String(50), nullable=False, default='claude-3-7-sonnet')
    capabilities = db.Column(db.JSON, nullable=True)  # Fonctionnalités disponibles pour cette IA
    
    # Clé d'API chiffrée
    api_key_encrypted = db.Column(db.Text, nullable=True)
    api_provider = db.Column(db.String(50), nullable=True)  # 'openai', 'anthropic', 'google', etc.
    api_key_last_updated = db.Column(db.DateTime, nullable=True)
    
    # Classification
    industry = db.Column(db.String(50), nullable=True)
    job_role = db.Column(db.String(50), nullable=True)
    seniority = db.Column(db.String(50), nullable=True)
    interview_mode = db.Column(db.String(20), nullable=False, default='collaborative')
    
    # Configuration avancée
    personality = db.Column(JSON, nullable=False, default={
        'friendliness': 3,
        'formality': 3,
        'technicalDepth': 3,
        'followUpIntensity': 3
    })
    
    base_knowledge = db.Column(JSON, nullable=False, default={
        'technicalSkills': True,
        'softSkills': True,
        'companyValues': False,
        'industryTrends': False
    })
    
    capabilities = db.Column(JSON, nullable=False, default={
        'generateQuestions': True,
        'evaluateResponses': True,
        'provideFeedback': True,
        'suggestFollowUps': True,
        'realTimeCoaching': False,
        'biometricIntegration': False
    })
    
    custom_prompt = db.Column(db.Text, nullable=True)
    question_bank = db.Column(JSON, nullable=True)
    
    # Métadonnées
    is_template = db.Column(db.Boolean, default=False)
    template_id = db.Column(GUID(), nullable=True)  # Si cloné à partir d'un modèle
    
    # Statistiques d'utilisation
    usage_count = db.Column(db.Integer, default=0)
    last_used = db.Column(db.DateTime, nullable=True)
    
    # Horodatage
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    user = relationship('User', back_populates='ai_assistants')
    documents = relationship('AIAssistantDocument', back_populates='assistant', cascade='all, delete-orphan')
    interviews = relationship(
        'Interview', 
        back_populates='ai_assistant',
        lazy='dynamic'  # Allows querying like assistant.interviews.filter(...)
    )   
    organization = relationship("Organization", back_populates="ai_assistants")
    team_associations = db.relationship(
        'TeamAIAssistant',
        back_populates='ai_assistant',
        foreign_keys='TeamAIAssistant.ai_assistant_id'
    )
    
    def __repr__(self):
        return f'<AIAssistant {self.name}>'
    
    def _get_encryption_key(self):
        """Récupère la clé de chiffrement depuis les variables d'environnement"""
        key = os.getenv('API_KEY_ENCRYPTION_KEY')
        print('lssssslsllksksksk')
        if not key:
            # Générer une clé par défaut en développement (à ne pas faire en production)
            key = Fernet.generate_key()
            os.environ['API_KEY_ENCRYPTION_KEY'] = key.decode()
            print('lssssslsllksksksk1')
        if isinstance(key, str):
            print('lssssslsllksksksk3')
            key = key.encode()
        return key
    
    def set_api_key(self, api_key, provider=None):
        """
        Chiffre et stocke la clé d'API
        
        Args:
            api_key (str): Clé d'API en clair
            provider (str, optional): Fournisseur de l'API
        """
        if api_key:
            print('Ajout de cle.............>>>>>>>>>>>1')
            fernet = Fernet(self._get_encryption_key())
            print('Ajout de cle.............>>>>>>>>>>>2')
            self.api_key_encrypted = fernet.encrypt(api_key.encode()).decode()
            print('Ajout de cle.............>>>>>>>>>>>3')
            self.api_key_last_updated = datetime.utcnow()
            print('Ajout de cle.............>>>>>>>>>>>4')
            if provider:
                print('Ajout de cle.............>>>>>>>>>>>5')
                self.api_provider = provider
        else:
            self.api_key_encrypted = None
            self.api_key_last_updated = None
    
    def get_api_key(self):
        """
        Déchiffre et retourne la clé d'API
        
        Returns:
            str: Clé d'API en clair ou None
        """
        if not self.api_key_encrypted:
            return None
        
        try:
            fernet = Fernet(self._get_encryption_key())
            return fernet.decrypt(self.api_key_encrypted.encode()).decode()
        except Exception:
            return None
    
    def has_api_key(self):
        """
        Vérifie si l'assistant a une clé d'API configurée
        
        Returns:
            bool: True si une clé d'API est configurée
        """
        return self.api_key_encrypted is not None
    
    def get_masked_api_key(self):
        """
        Retourne une version masquée de la clé d'API pour l'affichage
        
        Returns:
            str: Clé d'API masquée ou None
        """
        if not self.api_key_encrypted:
            return None
        
        api_key = self.get_api_key()
        if not api_key:
            return None
        
        # Masquer la clé en ne montrant que les 4 premiers et 4 derniers caractères
        if len(api_key) <= 8:
            return "***"
        
        return f"{api_key[:4]}{'*' * (len(api_key) - 8)}{api_key[-4:]}"
    
    def to_dict(self, include_api_key=False):
        """
        Convertit l'assistant en dictionnaire pour l'API
        
        Args:
            include_api_key (bool): Si True, inclut la clé d'API masquée
        """
        result = {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'assistant_type': self.assistant_type,
            'avatar': self.avatar,
            'model': self.model,
            'industry': self.industry,
            'jobRole': self.job_role,
            'seniority': self.seniority,
            'interviewMode': self.interview_mode,
            'personality': self.personality,
            'baseKnowledge': self.base_knowledge,
            'capabilities': self.capabilities,
            'customPrompt': self.custom_prompt,
            'questionBank': self.question_bank,
            'isTemplate': self.is_template,
            'usageCount': self.usage_count,
            'lastUsed': self.last_used.isoformat() if self.last_used else None,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'hasApiKey': self.has_api_key(),
            'apiProvider': self.api_provider,
            'apiKeyLastUpdated': self.api_key_last_updated.isoformat() if self.api_key_last_updated else None
        }
        
        if include_api_key:
            result['apiKeyMasked'] = self.get_masked_api_key()
        
        return result


class AIAssistantDocument(db.Model):
    """Modèle pour les documents associés aux assistants IA"""
    __tablename__ = 'ai_assistant_documents'

    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    assistant_id = db.Column(GUID(), db.ForeignKey('ai_assistants.id'), nullable=False)
    
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # Taille en octets
    file_type = db.Column(db.String(100), nullable=False)  # MIME type
    
    document_type = db.Column(db.String(50), nullable=False)  # company_values, job_description, etc.
    description = db.Column(db.Text, nullable=True)
    
    vector_index_status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    
    # Horodatage
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    assistant = relationship('AIAssistant', back_populates='documents')
    
    def __repr__(self):
        return f'<AIAssistantDocument {self.original_filename}>'
    
    def to_dict(self):
        """Convertit le document en dictionnaire pour l'API"""
        return {
            'id': str(self.id),
            'assistantId': str(self.assistant_id),
            'filename': self.filename,
            'originalFilename': self.original_filename,
            'fileSize': self.file_size,
            'fileType': self.file_type,
            'documentType': self.document_type,
            'description': self.description,
            'vectorIndexStatus': self.vector_index_status,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }


class TeamAIAssistant(db.Model):
    """Association entre une équipe et un assistant IA"""
    __tablename__ = 'team_ai_assistants'
     
    team_id = db.Column(GUID(), db.ForeignKey('teams.id'), primary_key=True)
    ai_assistant_id = db.Column(GUID(), db.ForeignKey('ai_assistants.id'), primary_key=True)
    role = db.Column(db.String(20), nullable=False, default='assistant') # 'assistant', 'evaluator', 'analyzer'
    added_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships - use back_populates instead of backref
    team = db.relationship('Team', back_populates='team_ai_assistant_associations')
    ai_assistant = db.relationship('AIAssistant', back_populates='team_associations')
    adder = db.relationship('User', back_populates='team_ai_assistant_additions')
    
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
    data = db.Column(db.JSON, nullable=True)  # Informations supplémentaires sur la génération
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
            'data': self.data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }