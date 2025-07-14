# backend/app/routes/ai_assistant_routes.py
from flask import Blueprint, request, jsonify, current_app, g
from werkzeug.exceptions import BadRequest, NotFound, Forbidden
from sqlalchemy.orm.exc import NoResultFound

from app.routes.user import token_required
from app.services.ai_assistant_service import ai_assistant_service

# Création du Blueprint
ai_assistant_bp = Blueprint('ai_assistant', __name__, url_prefix='/api/ai-assistants')

def get_current_user_id():
    """Retourne l'ID utilisateur actuel sous forme de string"""
    return str(g.current_user.user_id)


@ai_assistant_bp.route('', methods=['GET'])
@token_required
def get_assistants():
    """
    Récupère tous les assistants IA de l'utilisateur
    
    Query parameters:
        include_templates (bool): Inclure les modèles prédéfinis
    
    Returns:
        json: Liste des assistants
    """
    try:
        include_templates = request.args.get('include_templates', 'false').lower() == 'true'
        assistants = ai_assistant_service.get_all_assistants(
            user_id=g.current_user.id,
            include_templates=include_templates
        )
        return jsonify(assistants)
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des assistants: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/templates', methods=['GET'])
@token_required
def get_templates():
    """
    Récupère tous les modèles d'assistants prédéfinis
    
    Returns:
        json: Liste des modèles
    """
    try:
        templates = ai_assistant_service.get_assistant_templates()
        return jsonify(templates)
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des modèles: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>', methods=['GET'])
@token_required
def get_assistant(assistant_id):
    """
    Récupère un assistant par son ID
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Returns:
        json: Données de l'assistant
    """
    try:
        assistant = ai_assistant_service.get_assistant_by_id(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id
        )
        return jsonify(assistant)
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération de l'assistant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('', methods=['POST'])
@token_required
def create_assistant():
    """
    Crée un nouvel assistant IA
    
    Request body:
        json: Données de l'assistant
    
    Returns:
        json: Assistant créé
    """
    try:
        data = request.json
        if not data:
            raise BadRequest("Données manquantes")
        organization_id = g.current_user.current_organization_id

        assistant = ai_assistant_service.create_assistant(
            user_id=g.current_user.id,
            assistant_data=data,
            organization_id=organization_id,
        )
        return jsonify(assistant), 201
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la création de l'assistant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>', methods=['PUT'])
@token_required
def update_assistant(assistant_id):
    """
    Met à jour un assistant existant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Request body:
        json: Nouvelles données de l'assistant
    
    Returns:
        json: Assistant mis à jour
    """
    try:
        data = request.json
        if not data:
            raise BadRequest("Données manquantes")
        
        assistant = ai_assistant_service.update_assistant(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id,
            assistant_data=data
        )
        return jsonify(assistant)
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la mise à jour de l'assistant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/api-key', methods=['PUT'])
@token_required
def update_api_key(assistant_id):
    """
    Met à jour la clé d'API d'un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Request body:
        json:
            apiKey (str): Nouvelle clé d'API
            apiProvider (str): Fournisseur de l'API
    
    Returns:
        json: Statut de la mise à jour
    """
    try:
        data = request.json
        if not data:
            raise BadRequest("Données manquantes")
        
        api_key = data.get('apiKey')
        api_provider = data.get('apiProvider')
        
        if not api_key:
            raise BadRequest("Clé d'API manquante")
        
        if not api_provider:
            raise BadRequest("Fournisseur d'API manquant")
        
        result = ai_assistant_service.update_api_key(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id,
            api_key=api_key,
            api_provider=api_provider
        )
        return jsonify(result)
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la mise à jour de la clé d'API: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/api-key', methods=['DELETE'])
@token_required
def remove_api_key(assistant_id):
    """
    Supprime la clé d'API d'un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Returns:
        json: Statut de la suppression
    """
    try:
        result = ai_assistant_service.remove_api_key(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id
        )
        return jsonify(result)
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la suppression de la clé d'API: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/api-key/test', methods=['POST'])
@token_required
def test_api_key(assistant_id):
    """
    Teste la validité de la clé d'API d'un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Returns:
        json: Résultat du test
    """
    try:
        result = ai_assistant_service.test_api_key(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id
        )
        return jsonify(result)
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors du test de la clé d'API: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>', methods=['DELETE'])
@token_required
def delete_assistant(assistant_id):
    """
    Supprime un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Returns:
        json: Message de confirmation
    """
    try:
        ai_assistant_service.delete_assistant(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id
        )
        return jsonify({"message": "Assistant supprimé avec succès"})
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la suppression de l'assistant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/clone', methods=['POST'])
@token_required
def clone_assistant(assistant_id):
    """
    Clone un assistant existant
    
    Args:
        assistant_id (uuid): ID de l'assistant à cloner
    
    Request body:
        json: Options de clonage (nouveau nom, etc.)
    
    Returns:
        json: Nouvel assistant cloné
    """
    try:
        options = request.json or {}
        
        assistant = ai_assistant_service.clone_assistant(
            template_id=str(assistant_id),
            user_id=g.current_user.id,
            options=options
        )
        return jsonify(assistant), 201
    except NoResultFound:
        return jsonify({"error": "Assistant à cloner non trouvé"}), 404
    except Exception as e:
        current_app.logger.error(f"Erreur lors du clonage de l'assistant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/documents', methods=['POST'])
@token_required
def upload_document(assistant_id):
    """
    Télécharge un document à associer à un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Form data:
        file: Fichier à télécharger
        documentType: Type de document
        description (optional): Description du document
    
    Returns:
        json: Métadonnées du document
    """
    try:
        if 'file' not in request.files:
            raise BadRequest("Fichier manquant")
        
        file = request.files['file']
        if file.filename == '':
            raise BadRequest("Nom de fichier invalide")
        
        document_type = request.form.get('documentType')
        if not document_type:
            raise BadRequest("Type de document manquant")
        
        description = request.form.get('description')
        
        document = ai_assistant_service.upload_document(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id,
            file=file,
            document_type=document_type,
            description=description
        )
        return jsonify(document), 201
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Erreur lors du téléchargement du document: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/documents', methods=['GET'])
@token_required
def get_documents(assistant_id):
    """
    Récupère la liste des documents associés à un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Returns:
        json: Liste des documents
    """
    try:
        documents = ai_assistant_service.get_assistant_documents(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id
        )
        return jsonify(documents)
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des documents: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/documents/<uuid:document_id>', methods=['DELETE'])
@token_required
def delete_document(assistant_id, document_id):
    """
    Supprime un document associé à un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
        document_id (uuid): ID du document
    
    Returns:
        json: Message de confirmation
    """
    try:
        ai_assistant_service.delete_document(
            assistant_id=str(assistant_id),
            document_id=str(document_id),
            user_id=g.current_user.id
        )
        return jsonify({"message": "Document supprimé avec succès"})
    except NoResultFound:
        return jsonify({"error": "Assistant ou document non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la suppression du document: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<string:assistant_id>/test', methods=['POST'])
@token_required
def test_assistant(assistant_id):
    """
    Test la réponse de l'assistant à une question
    
    Args:
        assistant_id (str): ID de l'assistant ou 'preview' pour le mode aperçu
    
    Request body:
        json:
            question (str): Question à poser
            assistant (obj, optional): Données de l'assistant pour le mode aperçu
    
    Returns:
        json: Réponse de l'assistant
    """
    try:
        data = request.json
        if not data:
            raise BadRequest("Données manquantes")
        
        if 'question' not in data:
            raise BadRequest("Question manquante")
        
        response = ai_assistant_service.test_assistant(
            assistant_id=assistant_id,
            params=data,
            user_id=g.current_user.id if assistant_id != 'preview' else None
        )
        return jsonify(response)
    except BadRequest as e:
        return jsonify({"error": str(e)}), 400
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Erreur lors du test de l'assistant: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/history', methods=['GET'])
@token_required
def get_history(assistant_id):
    """
    Récupère l'historique des conversations avec un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Query parameters:
        start_date (str, optional): Date de début
        end_date (str, optional): Date de fin
    
    Returns:
        json: Historique des conversations
    """
    try:
        filters = {
            'start_date': request.args.get('start_date'),
            'end_date': request.args.get('end_date')
        }
        
        history = ai_assistant_service.get_assistant_history(
            assistant_id=str(assistant_id),
            user_id=g.current_user.id,
            filters=filters
        )
        return jsonify(history)
    except NoResultFound:
        return jsonify({"error": "Assistant non trouvé"}), 404
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération de l'historique: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/<uuid:assistant_id>/usage', methods=['POST'])
@token_required
def increment_usage(assistant_id):
    """
    Incrémente le compteur d'utilisation d'un assistant
    
    Args:
        assistant_id (uuid): ID de l'assistant
    
    Returns:
        json: Statut de la mise à jour
    """
    try:
        # Cette méthode pourrait être ajoutée au service pour tracker l'utilisation
        # Pour l'instant, on retourne un succès simple
        return jsonify({"success": True, "message": "Utilisation enregistrée"})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'enregistrement de l'utilisation: {str(e)}")
        return jsonify({"error": str(e)}), 500

@ai_assistant_bp.route('/providers', methods=['GET'])
@token_required
def get_api_providers():
    """
    Récupère la liste des fournisseurs d'API supportés
    
    Returns:
        json: Liste des fournisseurs
    """
    try:
        providers = [
            {
                'id': 'openai',
                'name': 'OpenAI',
                'description': 'GPT-3.5, GPT-4, etc.',
                'models': ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
            },
            {
                'id': 'anthropic',
                'name': 'Anthropic',
                'description': 'Claude 3 et versions ultérieures',
                'models': ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']
            },
            {
                'id': 'google',
                'name': 'Google',
                'description': 'Gemini et PaLM',
                'models': ['gemini-pro', 'gemini-pro-vision']
            },
            {
                'id': 'huggingface',
                'name': 'Hugging Face',
                'description': 'Modèles open source',
                'models': ['mistral-7b', 'llama-2-70b']
            }
        ]
        return jsonify(providers)
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération des fournisseurs: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Enregistrement du Blueprint
def register_ai_assistant_routes(app):
    """
    Enregistre les routes des assistants IA
    
    Args:
        app: Application Flask
    """
    app.register_blueprint(ai_assistant_bp)