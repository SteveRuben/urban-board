# backend/app/__init__.py
import os
import logging
#import stripe
from logging.handlers import RotatingFileHandler
from flask import Flask, request
from flask_cors import CORS
from .config import config_by_name
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# Initialisez les extensions sans fournir l'application
socketio = SocketIO(cors_allowed_origins="*", async_mode='eventlet')
# Créer l'instance db avant de créer l'application
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_name='dev'):
    """
    Crée et configure l'application Flask.
    
    Args:
        config_name (str): Nom de la configuration à utiliser ('dev', 'test', ou 'prod')
        
    Returns:
        Flask: Application Flask configurée
    """
    app = Flask(__name__)
    
    # Charger la configuration
    config = config_by_name[config_name]
    app.config.from_object(config)
    
    # Initialiser l'application avec la configuration
    config.init_app(app)
    # Dossier pour les uploads
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # Initialiser les extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # Initialiser Stripe
    #stripe.api_key = app.config['STRIPE_SECRET_KEY']
    
    # Configurer la journalisation
    configure_logging(app)
    
    # Activer CORS pour permettre les requêtes depuis le frontend
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}}, supports_credentials=True)
    socketio.init_app(app, 
                      cors_allowed_origins="*", 
                      async_mode='eventlet',
                      logger=True,
                      engineio_logger=True)
    
    with app.app_context():
        # Enregistrer les blueprints
        register_blueprints(app)
        
        # Créer les tables si elles n'existent pas
        # db.create_all()
    
    # Initialiser les services
    initialize_services(app)
    
    # Enregistrer les hooks
    register_hooks(app)
    
    from .services.ai_interview_service import init_app as init_ai_service
    from .routes.ai_routes import init_app as init_ai_routes
    init_ai_service(app)
    init_ai_routes(app)

    # Route de vérification de santé
    @app.route('/health')
    def health_check():
        return {"status": "ok", "env": app.config['ENV']}
    
    return app

def register_blueprints(app):
    """
    Enregistre les blueprints de l'application.
    
    Args:
        app (Flask): Application Flask
    """
    from .routes import interview_bp, resume_bp, user_bp
    from .routes.notification import notification_bp
    from .routes.auth_routes import auth_bp
    from .routes.subscription_routes import subscription_bp
    from .routes.admin_routes import admin_bp
    from .routes.integration_routes import integration_bp
    
    app.register_blueprint(interview_bp, url_prefix='/api/interviews')
    app.register_blueprint(resume_bp, url_prefix='/api/resumes')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(subscription_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(integration_bp, url_prefix='/api/integrations')
    
def register_hooks(app):
    """
    Enregistre les hooks de l'application.
    
    Args:
        app (Flask): Application Flask
    """
    @app.before_request
    def log_request_info():
        """Journaliser les informations de la requête"""
        if app.debug:
            app.logger.debug(f"Request: {request.method} {request.path}")
    
    @app.after_request
    def add_security_headers(response):
        """Ajouter des en-têtes de sécurité à la réponse"""
        if not app.debug and not app.testing:
            response.headers['Content-Security-Policy'] = app.config['CONTENT_SECURITY_POLICY']
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'SAMEORIGIN'
            response.headers['X-XSS-Protection'] = '1; mode=block'
        return response

# Ajouter cette fonction pour émettre des notifications
def emit_notification(user_id, notification):
    socketio.emit(f'notification:{user_id}', notification)
    
def configure_logging(app):
    """
    Configure la journalisation de l'application.
    
    Args:
        app (Flask): Application Flask
    """
    log_level = getattr(logging, app.config['LOG_LEVEL'])
    
    # Configurer le format de journalisation
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )
    
    # Configurer le gestionnaire de fichier
    log_dir = os.path.dirname(app.config['LOG_FILE'])
    os.makedirs(log_dir, exist_ok=True)
    
    file_handler = RotatingFileHandler(
        app.config['LOG_FILE'],
        maxBytes=1024 * 1024 * 10,  # 10 MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(log_level)
    
    # Configurer le gestionnaire de console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    
    # Ajouter les gestionnaires à l'application
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)

def initialize_services(app):
    """Initialise les services de l'application."""
    # Importer et initialiser le service WebSocket
    from .services.websocket_service import WebSocketService
    websocket_service = WebSocketService()
    websocket_service.init_app(app)
    
    # Vous pouvez initialiser d'autres services ici