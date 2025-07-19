"""
Application Flask principale pour RecruteIA
Initialisation de l'application avec toutes les extensions et routes
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.database import db
from app.config import Config
import logging

def create_app(config_class=Config):
    """Factory pour créer l'application Flask"""
    
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(name)s %(message)s'
    )
    
    # Initialiser les extensions
    db.init_app(app)
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
    jwt = JWTManager(app)
    
    # Enregistrer les blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.interview_routes import interview_bp
    from app.routes.dashboard_routes import dashboard_bp
    from app.routes.coding_routes import coding_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(interview_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(coding_bp)
    
    # Route de santé
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'RecruteIA API is running'}
    
    # Gestionnaire d'erreurs JWT
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'message': 'Token has expired'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'message': 'Invalid token'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'message': 'Authorization token is required'}, 401
    
    return app