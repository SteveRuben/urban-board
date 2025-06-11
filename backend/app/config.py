# backend/app/config.py
import os
from datetime import timedelta
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
load_dotenv()

class Config:
    """Configuration de base"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'ma_cle_secrete_par_defaut')
    DEBUG = False
    TESTING = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ENV = os.getenv('FLASK_ENV', 'production')
    
    # Configuration de l'API LLM (GPT/Claude)
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'openai')  # 'openai' ou 'anthropic'
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    
    # Configuration de la base de données
    DATABASE_URI = os.getenv('DATABASE_URI', 'sqlite:///recrute_ia.db')
    
    # Configuration des chemins de données
    DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
    ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
    
    # Configuration de l'API
    API_RATE_LIMIT = '100/hour'
    API_TIMEOUT = 60  # secondes
    
    # Configuration JWT pour l'authentification
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Configuration Stripe
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY') or 'sk_test_votreclestripeprivee'
    STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY') or 'pk_test_votreclestripepublique'
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET') or 'whsec_votresecretwebhook'

    # Configuration email
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'no-reply@recrute-ia.com')
    SENDER_NAME = os.getenv('SENDER_NAME', 'RecruteIA')
    
    # URL du frontend pour les liens dans les emails et les redirections
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    # URL du l'api
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000/api')
    
    # Configuration des notifications
    NOTIFICATION_EXPIRY_DAYS = 30  # Durée de conservation des notifications en jours
    NOTIFICATION_DATA_FILE = os.path.join(DATA_DIR, 'notifications.json')
    EMAIL_NOTIFICATIONS_ENABLED = os.getenv('EMAIL_NOTIFICATIONS_ENABLED', 'true').lower() == 'true'
    
    # Configuration websocket pour les notifications en temps réel
    WEBSOCKET_ENABLED = os.getenv('WEBSOCKET_ENABLED', 'false').lower() == 'true'
    WEBSOCKET_URL = os.getenv('WEBSOCKET_URL', 'ws://localhost:8765')
    WEBSOCKET_AUTH_REQUIRED = True
    
    # Configuration d'entretien
    INTERVIEW_DEFAULT_DURATION = 45  # minutes
    INTERVIEW_MAX_QUESTIONS = 20
    INTERVIEW_DATA_FILE = os.path.join(DATA_DIR, 'interviews.json')
    
    # Configuration CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'app.log')
    
    # Configuration de sécurité
    CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Configuration Google OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/integrations/calendar/callback')
    GOOGLE_SCOPES = os.getenv('GOOGLE_SCOPES', 'https://www.googleapis.com/auth/calendar.readonly').split(',')
    GOOGLE_CALENDAR_ID = os.getenv('GOOGLE_CALENDAR_ID', 'primary')

    # Chemin pour stocker les tokens (ajoutez aussi dans init_app)
    GOOGLE_TOKENS_DIR = os.path.join(DATA_DIR, 'google_tokens')
    GOOGLE_CLIENT_SECRETS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'client_secret.json')
    CANDIDATE_RESPONSE_SECRET = os.environ.get('CANDIDATE_RESPONSE_SECRET')
    CANDIDATE_RESPONSE_EXPIRY_HOURS = int(os.environ.get('CANDIDATE_RESPONSE_EXPIRY_HOURS', '48'))
    
    @staticmethod
    def init_app(app):
        """Initialisation de l'application avec cette configuration"""
        # Créer les répertoires nécessaires
        os.makedirs(Config.DATA_DIR, exist_ok=True)
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.GOOGLE_TOKENS_DIR, exist_ok=True)  # Nouveau
        os.makedirs(os.path.dirname(Config.LOG_FILE), exist_ok=True)


class DevelopmentConfig(Config):
    """Configuration de développement"""
    DEBUG = True
    ENV = 'development'
    TESTING = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///development.db'
    # Désactiver certaines fonctionnalités de sécurité en développement
    SESSION_COOKIE_SECURE = False
    
    # Configuration d'un serveur SMTP fictif pour le développement
    EMAIL_NOTIFICATIONS_ENABLED = os.getenv('EMAIL_NOTIFICATIONS_ENABLED', 'false').lower() == 'true'
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        app.logger.info('Application démarrée en mode développement')


class TestingConfig(Config):
    """Configuration de test"""
    DEBUG = True
    TESTING = True
    ENV = 'testing'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///testing.db'
    # Utiliser une base de données en mémoire pour les tests
    DATABASE_URI = 'sqlite:///:memory:'
    
    # Désactiver les notifications par email en mode test
    EMAIL_NOTIFICATIONS_ENABLED = False
    
    # Fichiers de données spécifiques pour les tests
    NOTIFICATION_DATA_FILE = os.path.join(Config.DATA_DIR, 'test_notifications.json')
    INTERVIEW_DATA_FILE = os.path.join(Config.DATA_DIR, 'test_interviews.json')
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        app.logger.info('Application démarrée en mode test')


class ProductionConfig(Config):
    """Configuration de production"""
    DEBUG = False
    ENV = 'production'
    SQLALCHEMY_DATABASE_URI = 'postgresql://user:password@localhost/recruteai'
    # En production, assurez-vous que SECRET_KEY est défini dans les variables d'environnement
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    
    # Configuration de sécurité renforcée
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        assert Config.GOOGLE_CLIENT_ID and Config.GOOGLE_CLIENT_SECRET, \
        "Google OAuth credentials must be configured in production"
        # Vérification des configurations critiques
        assert Config.SECRET_KEY != 'ma_cle_secrete_par_defaut', (
            "ERREUR: La clé secrète par défaut est utilisée en production. "
            "Définissez SECRET_KEY dans les variables d'environnement."
        )
        
        if not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
            app.logger.warning(
                "Configuration email incomplète. Les notifications par email ne fonctionneront pas."
            )
        
        app.logger.info('Application démarrée en mode production')


# Dictionnaire de mapping des configurations
config_by_name = {
    'dev': DevelopmentConfig,
    'test': TestingConfig,
    'prod': ProductionConfig
}