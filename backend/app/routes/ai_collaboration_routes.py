# backend/routes/ai_collaboration_routes.py

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.ai_collaboration_service import AICollaborationService
from ..models.collaboration import AIAssistant, TeamAIAssistant, AIGeneratedContent
from ..middleware.auth_middleware import token_required
from app import db

ai_collab_bp = Blueprint('ai_collaboration', __name__)
ai_collab_service = AICollaborationService()

# ====== ROUTES POUR GESTION DES ASSISTANTS IA ======

@ai_collab_bp.route('/ai-assistants', methods=['GET'])
@token_required
def get_user_ai_assistants():
    """Récupère les assistants IA créés par l'utilisateur"""
    user_id = g.current_user.id
    
    try:
        assistants = ai_collab_service.get_user_ai_assistants(user_id)
        
        return jsonify({
            'status': 'success',
            'data': assistants
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des assistants IA'
        }), 500

@ai_collab_bp.route('/ai-assistants', methods=['POST'])
@token_required
def create_ai_assistant():
    """Crée un nouvel assistant IA"""
    user_id = g.current_user.id
    data = request.get_json()
    
    if not data or 'name' not in data or 'assistant_type' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Le nom et le type d\'assistant sont requis'
        }), 400
    
    try:
        ai_assistant = ai_collab_service.create_ai_assistant(
            name=data['name'],
            assistant_type=data['assistant_type'],
            created_by=user_id,
            capabilities=data.get('capabilities'),
            model_version=data.get('model_version')
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Assistant IA créé avec succès',
            'data': {
                'id': ai_assistant.id,
                'name': ai_assistant.name,
                'assistant_type': ai_assistant.assistant_type,
                'capabilities': ai_assistant.capabilities,
                'model_version': ai_assistant.model_version,
                'created_at': ai_assistant.created_at
            }
        }), 201
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la création de l\'assistant IA'
        }), 500

@ai_collab_bp.route('/ai-assistants/<assistant_id>', methods=['GET'])
@token_required
def get_ai_assistant_details(assistant_id):
    """Récupère les détails d'un assistant IA"""
    user_id = g.current_user.id
    
    try:
        assistant = AIAssistant.query.get(assistant_id)
        
        if not assistant:
            return jsonify({
                'status': 'error',
                'message': 'Assistant IA non trouvé'
            }), 404
        
        # Vérifier que l'utilisateur est le créateur
        if assistant.created_by != user_id and g.current_user.role != 'admin':
            return jsonify({
                'status': 'error',
                'message': 'Non autorisé à accéder à cet assistant IA'
            }), 403
        
        # Compter les équipes qui utilisent cet assistant
        teams = TeamAIAssistant.query.filter_by(
            ai_assistant_id=assistant.id,
            is_active=True
        ).all()
        
        team_details = []
        for team_ai in teams:
            team = Team.query.get(team_ai.team_id)
            if team:
                team_details.append({
                    'id': team.id,
                    'name': team.name,
                    'role': team_ai.role,
                    'added_at': team_ai.added_at
                })
        
        return jsonify({
            'status': 'success',
            'data': {
                'id': assistant.id,
                'name': assistant.name,
                'assistant_type': assistant.assistant_type,
                'capabilities': assistant.capabilities,
                'model_version': assistant.model_version,
                'created_at': assistant.created_at,
                'created_by': assistant.created_by,
                'teams': team_details
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des détails de l\'assistant IA'
        }), 500

# ====== ROUTES POUR GESTION DES IA DANS LES ÉQUIPES ======

@ai_collab_bp.route('/teams/<team_id>/ai-assistants', methods=['GET'])
@token_required
def get_team_ai_assistants(team_id):
    """Récupère tous les assistants IA d'une équipe"""
    user_id = g.current_user.id
    
    # Vérifier que l'utilisateur est membre de l'équipe
    team_member = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    if not team_member:
        return jsonify({
            'status': 'error',
            'message': 'Vous n\'êtes pas membre de cette équipe'
        }), 403
    
    try:
        assistants = ai_collab_service.get_active_team_ai_assistants(team_id)
        
        return jsonify({
            'status': 'success',
            'data': assistants
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des assistants IA de l\'équipe'
        }), 500

@ai_collab_bp.route('/teams/<team_id>/ai-assistants', methods=['POST'])
@token_required
def add_ai_to_team(team_id):
    """Ajoute un assistant IA à une équipe"""
    user_id = g.current_user.id
    data = request.get_json()
    
    if not data or 'ai_assistant_id' not in data:
        return jsonify({
            'status': 'error',
            'message': 'L\'ID de l\'assistant IA est requis'
        }), 400
    
    try:
        role = data.get('role', 'assistant')
        team_ai = ai_collab_service.add_ai_to_team(
            team_id=team_id,
            ai_assistant_id=data['ai_assistant_id'],
            role=role,
            added_by=user_id
        )
        
        # Récupérer les détails de l'assistant pour la réponse
        assistant = AIAssistant.query.get(team_ai.ai_assistant_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Assistant IA ajouté à l\'équipe avec succès',
            'data': {
                'team_id': team_id,
                'ai_assistant_id': assistant.id,
                'ai_assistant_name': assistant.name,
                'assistant_type': assistant.assistant_type,
                'role': team_ai.role,
                'added_at': team_ai.added_at
            }
        }), 201
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de l\'ajout de l\'assistant IA à l\'équipe'
        }), 500

@ai_collab_bp.route('/teams/<team_id>/ai-assistants/<ai_assistant_id>', methods=['DELETE'])
@token_required
def remove_ai_from_team(team_id, ai_assistant_id):
    """Retire un assistant IA d'une équipe"""
    user_id = g.current_user.id
    
    try:
        ai_collab_service.remove_ai_from_team(
            team_id=team_id,
            ai_assistant_id=ai_assistant_id,
            removed_by=user_id
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Assistant IA retiré de l\'équipe avec succès'
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors du retrait de l\'assistant IA de l\'équipe'
        }), 500

# ====== ROUTES POUR CONTENU GÉNÉRÉ PAR IA ======

@ai_collab_bp.route('/interviews/<int:interview_id>/ai-contents', methods=['GET'])
@token_required
def get_ai_contents(interview_id):
    """Récupère le contenu généré par IA pour un entretien"""
    user_id = g.current_user.id
    
    # Paramètres optionnels
    team_id = request.args.get('team_id')
    content_type = request.args.get('content_type')
    
    try:
        # Vérifier que l'utilisateur a accès à l'entretien
        if not ai_collab_service.collab_service._user_can_access_interview(interview_id, user_id):
            return jsonify({
                'status': 'error',
                'message': 'Vous n\'êtes pas autorisé à accéder à cet entretien'
            }), 403
        
        contents = ai_collab_service.get_ai_contents(
            interview_id=interview_id,
            team_id=team_id,
            content_type=content_type
        )
        
        return jsonify({
            'status': 'success',
            'data': contents
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération du contenu IA'
        }), 500

@ai_collab_bp.route('/teams/<team_id>/interviews/<int:interview_id>/ai-contents', methods=['POST'])
@token_required
def generate_ai_content(team_id, interview_id):
    """Demande la génération de contenu par une IA"""
    user_id = g.current_user.id
    data = request.get_json()
    
    if not data or 'ai_assistant_id' not in data or 'content_type' not in data:
        return jsonify({
            'status': 'error',
            'message': 'L\'ID de l\'assistant IA et le type de contenu sont requis'
        }), 400
    
    try:
        # Si c'est une demande d'analyse, utiliser l'endpoint dédié
        if data['content_type'] == 'analysis':
            if 'analysis_type' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Le type d\'analyse est requis pour une demande d\'analyse'
                }), 400
            
            result = ai_collab_service.request_ai_analysis(
                team_id=team_id,
                interview_id=interview_id,
                ai_assistant_id=data['ai_assistant_id'],
                analysis_type=data['analysis_type'],
                parameters=data.get('parameters'),
                requested_by=user_id
            )
            
            return jsonify({
                'status': 'success',
                'message': 'Analyse IA générée avec succès',
                'data': result
            }), 200
        
        # Pour les autres types de contenu
        if 'content' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Le contenu est requis'
            }), 400
        
        ai_content = ai_collab_service.generate_ai_content(
            team_id=team_id,
            interview_id=interview_id,
            ai_assistant_id=data['ai_assistant_id'],
            content_type=data['content_type'],
            content=data['content'],
            metadata=data.get('metadata'),
            requested_by=user_id
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Contenu IA généré avec succès',
            'data': ai_content.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la génération du contenu IA'
        }), 500

@ai_collab_bp.route('/teams/<team_id>/interviews/<int:interview_id>/ai-analysis', methods=['POST'])
@token_required
def request_ai_analysis(team_id, interview_id):
    """Demande une analyse spécifique à une IA"""
    user_id = g.current_user.id
    data = request.get_json()
    
    if not data or 'ai_assistant_id' not in data or 'analysis_type' not in data:
        return jsonify({
            'status': 'error',
            'message': 'L\'ID de l\'assistant IA et le type d\'analyse sont requis'
        }), 400
    
    try:
        result = ai_collab_service.request_ai_analysis(
            team_id=team_id,
            interview_id=interview_id,
            ai_assistant_id=data['ai_assistant_id'],
            analysis_type=data['analysis_type'],
            parameters=data.get('parameters'),
            requested_by=user_id
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Analyse IA demandée avec succès',
            'data': result
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la demande d\'analyse IA'
        }), 500

# Imports supplémentaires nécessaires
from ..models.collaboration import Team, TeamMember