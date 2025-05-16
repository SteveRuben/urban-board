# backend/app/routes/integration_routes.py
import os
from flask import Blueprint, current_app, request, jsonify, g

from ..services.google_calendar_service import GoogleCalendarService
from ..models.user_integration import UserIntegration
from ..services.user_service import UserService
from ..middleware.auth_middleware import token_required
from ..middleware.rate_limit import standard_limit

integration_bp = Blueprint('integrations', __name__, url_prefix='/api/integrations')


@integration_bp.route('', methods=['GET'])
@token_required
@standard_limit
def get_integrations():
    """
    Récupère toutes les intégrations disponibles
    ---
    tags:
      - Intégrations
    security:
      - bearerAuth: []
    responses:
      200:
        description: Liste des intégrations disponibles
      401:
        description: Non authentifié
    """
    # Liste des intégrations disponibles (exemple statique)
    integrations = [
        { 
            "id": "calendar",
            "name": "Google Calendar",
            "description": "Synchronisez vos entretiens avec Google Calendar",
            "icon": "/icons/google-calendar.svg",
            "connected": UserIntegration.query.filter_by(
                user_id=g.current_user.user_id,
                service='google_calendar'
            ).first() is not None
        },
        { 
            "id": "microsoft",
            "name": "Microsoft 365",
            "description": "Intégrez vos entretiens avec Microsoft 365",
            "icon": "/icons/microsoft-365.svg",
            "connected": UserIntegration.query.filter_by(
                user_id=g.current_user.user_id,
                service='microsoft-365'
            ).first() is not None
        },
        { 
            "id": "ats",
            "name": "Lever ATS",
            "description": "Connectez votre système de suivi des candidatures",
            "icon": "/icons/lever.svg",
            "connected": UserIntegration.query.filter_by(
                user_id=g.current_user.user_id,
                service='lever'
            ).first() is not None
        },
        { 
            "id": "slack",
            "name": "Slack",
            "description": "Recevez des notifications sur Slack",
            "icon": "/icons/slack.svg",
            "connected": UserIntegration.query.filter_by(
                user_id=g.current_user.user_id,
                service='slack'
            ).first() is not None
        }
    ]
    
    # Dans une implémentation réelle, vous récupéreriez l'état de connexion pour l'utilisateur actuel
    # Ici, c'est juste un exemple
    
    return jsonify(integrations), 200

@integration_bp.route('/<string:integration_id>/auth-url', methods=['GET'])
@token_required
@standard_limit
def get_auth_url(integration_id):
    """
    Récupère l'URL d'authentification pour une intégration
    ---
    tags:
      - Intégrations
    parameters:
      - name: integration_id
        in: path
        required: true
        schema:
          type: string
    security:
      - bearerAuth: []
    responses:
      200:
        description: URL d'authentification générée
      400:
        description: Intégration non valide
      401:
        description: Non authentifié
    """
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    print(user_id)
    # Obtenir l'URL d'authentification
    auth_url, error = UserService.get_integration_auth_url(user_id, integration_id)
    
    if error:
        return jsonify({'message': error}), 400
    
    return jsonify({'authUrl': auth_url}), 200

@integration_bp.route('/<string:integration_id>/callback', methods=['GET', 'POST'])
def integration_callback(integration_id):
    """
    Endpoint de callback pour l'authentification OAuth
    ---
    tags:
      - Intégrations
    parameters:
      - name: integration_id
        in: path
        required: true
        schema:
          type: string
    responses:
      200:
        description: Authentification réussie
      400:
        description: Erreur d'authentification
    """
    # Cette route est appelée par le service tiers après l'authentification OAuth
    
    try:
        # Récupérer les paramètres de la requête
        if request.method == 'GET':
            code = request.args.get('code')
            state = request.args.get('state')
        else:  # POST
            data = request.get_json() or {}
            code = data.get('code')
            state = data.get('state')
        
        if not code:
            return jsonify({'success': False, 'message': 'Code d\'autorisation manquant'}), 400
        
        if not state:
            return jsonify({'success': False, 'message': 'État de session manquant'}), 400
        
        # Traiter le callback selon le type d'intégration
        if integration_id == 'calendar':
            success, error = GoogleCalendarService.handle_callback(code, state)
        elif integration_id == 'microsoft':
            # Implémentez le traitement pour Microsoft 365
            success, error = False, "Microsoft 365 n'est pas encore pris en charge"
        elif integration_id == 'slack':
            # Implémentez le traitement pour Slack
            success, error = False, "Slack n'est pas encore pris en charge"
        else:
            success, error = False, f"Type d'intégration non pris en charge: {integration_id}"
        
        if not success:
            current_app.logger.error(f"Callback error for {integration_id}: {error}")
            
            # Renvoyer une page HTML avec un message d'erreur
            html_response = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Erreur d'intégration</title>
                <script type="text/javascript">
                    window.onload = function() {{
                        window.opener.postMessage(
                            {{ 
                                type: 'INTEGRATION_ERROR', 
                                integrationId: '{integration_id}',
                                message: '{error}'
                            }}, 
                            '*'
                        );
                        setTimeout(function() {{ window.close(); }}, 5000);
                    }};
                </script>
                <style>
                    body {{ font-family: Arial, sans-serif; text-align: center; padding: 40px; }}
                    .error {{ color: #e53e3e; margin-bottom: 20px; }}
                    .message {{ margin-bottom: 30px; }}
                    .closing {{ font-size: 0.8em; color: #718096; }}
                </style>
            </head>
            <body>
                <h1 class="error">Erreur d'intégration</h1>
                <p class="message">{error}</p>
                <p class="closing">Cette fenêtre se fermera automatiquement dans quelques secondes...</p>
            </body>
            </html>
            """
            
            return html_response, 400
        
        # Succès : renvoyer une page HTML qui se ferme automatiquement
        html_response = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Intégration réussie</title>
            <script type="text/javascript">
                window.onload = function() {{
                    // Envoyer un message à la fenêtre parente
                    window.opener.postMessage(
                        {{ 
                            type: 'INTEGRATION_CONNECTED', 
                            integrationId: '{integration_id}',
                            success: true 
                        }}, 
                        '*'  // Utiliser '*' est plus sûr pour le développement, mais idéalement utilisez l'origine exacte en production
                    );
                    // Fermer cette fenêtre après un court délai
                    setTimeout(function() {{ window.close(); }}, 2000);
                }};
            </script>
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 40px; }}
                .success {{ color: #38a169; margin-bottom: 20px; }}
                .message {{ margin-bottom: 30px; }}
                .closing {{ font-size: 0.8em; color: #718096; }}
            </style>
        </head>
        <body>
            <h1 class="success">Intégration réussie!</h1>
            <p class="message">Votre compte a été connecté avec succès.</p>
            <p class="closing">Cette fenêtre se fermera automatiquement...</p>
        </body>
        </html>
        """
        
        return html_response
        
    except Exception as e:
        current_app.logger.error(f"Unexpected error in callback: {str(e)}")
        return jsonify({'success': False, 'message': 'Une erreur inattendue est survenue'}), 500

@integration_bp.route('/<string:integration_id>', methods=['DELETE'])
@token_required
@standard_limit
def disconnect_integration(integration_id):
    """
    Déconnecte une intégration
    ---
    tags:
      - Intégrations
    parameters:
      - name: integration_id
        in: path
        required: true
        schema:
          type: string
    security:
      - bearerAuth: []
    responses:
      200:
        description: Intégration déconnectée
      400:
        description: Erreur lors de la déconnexion
      401:
        description: Non authentifié
    """
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Déconnecter l'intégration
    success, message = UserService.disconnect_integration(user_id, integration_id)
    
    if not success:
        return jsonify({'message': message}), 400
    
    return jsonify({'success': True, 'message': message}), 200

@integration_bp.route('/calendar/events', methods=['GET'])
@token_required
@standard_limit
def get_calendar_events():
    """Récupère les événements du calendrier"""
    user_id = g.current_user.user_id
    events, error = GoogleCalendarService.get_events(user_id)
    
    if error:
        return jsonify({'message': error}), 400
    
    return jsonify(events), 200