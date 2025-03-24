# backend/app/routes/integration_routes.py
from flask import Blueprint, request, jsonify, g
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
            "connected": False
        },
        { 
            "id": "microsoft",
            "name": "Microsoft 365",
            "description": "Intégrez vos entretiens avec Microsoft 365",
            "icon": "/icons/microsoft-365.svg",
            "connected": False
        },
        { 
            "id": "ats",
            "name": "Lever ATS",
            "description": "Connectez votre système de suivi des candidatures",
            "icon": "/icons/lever.svg",
            "connected": False
        },
        { 
            "id": "slack",
            "name": "Slack",
            "description": "Recevez des notifications sur Slack",
            "icon": "/icons/slack.svg",
            "connected": False
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
    
    # Obtenir l'URL d'authentification
    auth_url, error = UserService.get_integration_auth_url(integration_id)
    
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
    # Dans une implémentation réelle, vous devriez :
    # 1. Récupérer les paramètres de la requête (code, state, etc.)
    # 2. Échanger le code contre un token d'accès
    # 3. Sauvegarder le token pour l'utilisateur
    # 4. Rediriger l'utilisateur vers votre application
    
    # Exemple simple pour la démonstration
    if request.method == 'GET':
        code = request.args.get('code')
        state = request.args.get('state')
    else:  # POST
        data = request.get_json() or {}
        code = data.get('code')
        state = data.get('state')
    
    if not code:
        return jsonify({'success': False, 'message': 'Code d\'autorisation manquant'}), 400
    
    # Rediriger vers une page de confirmation dans l'application
    # Dans un cas réel, cela serait une redirection HTTP
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
                    '{request.host_url}'
                );
                // Fermer cette fenêtre
                window.close();
            }};
        </script>
    </head>
    <body>
        <h1>Intégration réussie!</h1>
        <p>Vous pouvez fermer cette fenêtre.</p>
    </body>
    </html>
    """
    
    return html_response

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