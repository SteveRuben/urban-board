# backend/app/models/user.py
from datetime import datetime
import uuid
from flask_sqlalchemy import SQLAlchemy
from app import db  # Importez l'instance db créée dans votre app/__init__.py

class User(db.Model):
    """
    Modèle SQLAlchemy pour représenter un utilisateur dans le système
    """
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), default='user')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.now)
    last_login = db.Column(db.DateTime)
    
    # Champs supplémentaires
    job_title = db.Column(db.String(100))
    department = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    profile_image = db.Column(db.String(255))
    preferences = db.Column(db.JSON, default=lambda: {})
    
    """
    Modèle pour représenter un utilisateur dans le système
    """
    def __init__(self, id=None, email=None, password=None, first_name=None, 
                 last_name=None, role="user", is_active=True, created_at=None, 
                 updated_at=None, last_login=None):
        """
        Initialise un utilisateur.
        
        Args:
            id (str): Identifiant unique de l'utilisateur
            email (str): Email de l'utilisateur (unique)
            password (str): Mot de passe haché
            first_name (str): Prénom
            last_name (str): Nom de famille
            role (str): Rôle de l'utilisateur (admin, recruiter, user, etc.)
            is_active (bool): État du compte (actif/inactif)
            created_at (datetime): Date de création du compte
            updated_at (datetime): Date de dernière mise à jour
            last_login (datetime): Date de dernière connexion
        """
        self.id = id or str(uuid.uuid4())
        self.email = email
        self.password = password
        self.first_name = first_name
        self.last_name = last_name
        self.role = role
        self.is_active = is_active
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at
        self.last_login = last_login
        
        # Champs supplémentaires pour RecruteIA
        self.job_title = None
        self.department = None
        self.phone = None
        self.profile_image = None
        self.preferences = {}
        self.permissions = []
    
    @property
    def full_name(self):
        """
        Renvoie le nom complet de l'utilisateur
        
        Returns:
            str: Nom complet formaté
        """
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self):
        """
        Convertit l'objet utilisateur en dictionnaire pour la sérialisation.
        
        Returns:
            dict: Représentation de l'utilisateur sous forme de dictionnaire
        """
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'job_title': self.job_title,
            'department': self.department,
            'phone': self.phone,
            'profile_image': self.profile_image,
            'preferences': self.preferences,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """
        Crée une instance de User à partir d'un dictionnaire.
        
        Args:
            data (dict): Dictionnaire contenant les données de l'utilisateur
            
        Returns:
            User: Instance de User créée
        """
        # Convertir les dates si nécessaire
        created_at = data.get('created_at')
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
            
        updated_at = data.get('updated_at')
        if isinstance(updated_at, str) and updated_at:
            updated_at = datetime.fromisoformat(updated_at)
            
        last_login = data.get('last_login')
        if isinstance(last_login, str) and last_login:
            last_login = datetime.fromisoformat(last_login)
        
        # Créer l'instance
        user = cls(
            id=data.get('id'),
            email=data.get('email'),
            password=data.get('password'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            role=data.get('role', 'user'),
            is_active=data.get('is_active', True),
            created_at=created_at,
            updated_at=updated_at,
            last_login=last_login
        )
        
        # Ajouter les champs supplémentaires
        user.job_title = data.get('job_title')
        user.department = data.get('department')
        user.phone = data.get('phone')
        user.profile_image = data.get('profile_image')
        user.preferences = data.get('preferences', {})
        user.permissions = data.get('permissions', [])
        
        return user
    
    @staticmethod
    def has_permission(user, permission):
        """
        Vérifie si un utilisateur a une permission spécifique.
        
        Args:
            user (User): Utilisateur à vérifier
            permission (str): Permission requise
            
        Returns:
            bool: True si l'utilisateur a la permission, False sinon
        """
        # Les admins ont toutes les permissions
        if user.role == 'admin':
            return True
            
        # Vérifier dans les permissions explicites
        if permission in user.permissions:
            return True
            
        # Vérifier les permissions basées sur le rôle
        role_permissions = {
            'recruiter': ['view_candidates', 'manage_interviews', 'view_reports'],
            'manager': ['view_candidates', 'manage_interviews', 'view_reports', 'manage_team'],
            'user': ['view_own_profile']
        }
        
        return permission in role_permissions.get(user.role, [])
