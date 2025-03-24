# backend/routes/collaboration_routes.py
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.collaboration_service import CollaborationService
from ..models.collaboration import InterviewShare, Comment, CollaborationActivity, Team, TeamMember, TeamInterviewAccess, TeamNote
from ..models.user import User
from ..models.interview import Interview
from ..middleware.auth_middleware import token_required
from app import db
from ..services.notification_service import NotificationService
from ..services.websocket_service import WebSocketService

collab_bp = Blueprint('collaboration', __name__)
collaboration_service = CollaborationService()
notification_service = NotificationService()
websocket_service = WebSocketService()

# ====== ROUTES POUR PARTAGE INDIVIDUEL D'ENTRETIENS ======

@collab_bp.route('/interviews/<int:interview_id>/share', methods=['POST'])
@jwt_required()
def share_interview(interview_id):
    """Partage un entretien avec un autre utilisateur"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('email'):
        return jsonify({
            'status': 'error',
            'message': 'L\'email est requis'
        }), 400
    
    permission_level = data.get('permission_level', 'viewer')
    expires_days = data.get('expires_days')
    
    try:
        share = collaboration_service.share_interview(
            interview_id, 
            user_id, 
            data['email'], 
            permission_level, 
            expires_days
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien partagé avec succès',
            'data': {
                'interview_id': share.interview_id,
                'shared_with': share.shared_with_id,
                'permission_level': share.permission_level,
                'expires_at': share.expires_at.isoformat() if share.expires_at else None
            }
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors du partage de l\'entretien'
        }), 500

@collab_bp.route('/interviews/<int:interview_id>/share/<int:shared_with_id>', methods=['DELETE'])
@jwt_required()
def remove_share(interview_id, shared_with_id):
    """Supprime le partage d'un entretien"""
    user_id = get_jwt_identity()
    
    try:
        collaboration_service.remove_share(interview_id, user_id, shared_with_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Partage supprimé avec succès'
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la suppression du partage'
        }), 500

@collab_bp.route('/shared-interviews', methods=['GET'])
@jwt_required()
def get_shared_interviews():
    """Récupère les entretiens partagés avec l'utilisateur"""
    user_id = get_jwt_identity()
    
    try:
        interviews = collaboration_service.get_shared_interviews(user_id)
        
        return jsonify({
            'status': 'success',
            'data': interviews
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des entretiens partagés'
        }), 500

# ====== ROUTES POUR COMMENTAIRES ======

@collab_bp.route('/interviews/<int:interview_id>/comments', methods=['POST'])
@jwt_required()
def add_comment(interview_id):
    """Ajoute un commentaire à un entretien"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('content'):
        return jsonify({
            'status': 'error',
            'message': 'Le contenu du commentaire est requis'
        }), 400
    
    timestamp = data.get('timestamp')
    
    try:
        comment = collaboration_service.add_comment(
            interview_id, 
            user_id, 
            data['content'], 
            timestamp
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Commentaire ajouté avec succès',
            'data': comment.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de l\'ajout du commentaire'
        }), 500

@collab_bp.route('/interviews/<int:interview_id>/comments', methods=['GET'])
@jwt_required()
def get_comments(interview_id):
    """Récupère tous les commentaires d'un entretien"""
    user_id = get_jwt_identity()
    
    try:
        comments = collaboration_service.get_comments(interview_id, user_id)
        
        return jsonify({
            'status': 'success',
            'data': comments
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des commentaires'
        }), 500

@collab_bp.route('/interviews/<int:interview_id>/activities', methods=['GET'])
@jwt_required()
def get_activities(interview_id):
    """Récupère toutes les activités d'un entretien"""
    user_id = get_jwt_identity()
    
    try:
        activities = collaboration_service.get_interview_activities(interview_id, user_id)
        
        return jsonify({
            'status': 'success',
            'data': activities
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des activités'
        }), 500

# ====== ROUTES POUR ÉQUIPES ======

@collab_bp.route('/teams', methods=['GET'])
@token_required
def get_user_teams():
    """Récupère toutes les équipes auxquelles l'utilisateur appartient"""
    user_id = g.current_user.id
    
    try:
        teams = collaboration_service.get_user_teams(user_id)
        
        return jsonify({
            'status': 'success',
            'data': teams
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des équipes'
        }), 500

@collab_bp.route('/teams', methods=['POST'])
@token_required
def create_team():
    """Crée une nouvelle équipe"""
    data = request.get_json()
    user_id = g.current_user.id
    
    if not data or 'name' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Le nom de l\'équipe est requis'
        }), 400
    
    try:
        team = collaboration_service.create_team(
            data['name'],
            data.get('description', ''),
            user_id
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Équipe créée avec succès',
            'data': {
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'created_at': team.created_at,
                'created_by': team.created_by
            }
        }), 201
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la création de l\'équipe'
        }), 500

@collab_bp.route('/teams/<team_id>', methods=['GET'])
@token_required
def get_team_details(team_id):
    """Récupère les détails d'une équipe, y compris ses membres"""
    user_id = g.current_user.id
    
    try:
        team_details = collaboration_service.get_team_details(team_id, user_id)
        
        return jsonify({
            'status': 'success',
            'data': team_details
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 403
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des détails de l\'équipe'
        }), 500

@collab_bp.route('/teams/<team_id>/members', methods=['POST'])
@token_required
def add_team_member(team_id):
    """Ajoute un membre à une équipe"""
    data = request.get_json()
    user_id = g.current_user.id
    
    if not data or 'email' not in data:
        return jsonify({
            'status': 'error',
            'message': 'L\'email de l\'utilisateur est requis'
        }), 400
    
    try:
        role = data.get('role', 'member')
        new_member = collaboration_service.add_team_member(
            team_id,
            data['email'],
            role,
            user_id
        )
        
        # Récupérer l'utilisateur ajouté pour construire la réponse
        added_user = User.query.get(new_member.user_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Membre ajouté avec succès',
            'data': {
                'id': new_member.id,
                'team_id': team_id,
                'user_id': new_member.user_id,
                'user_name': f"{added_user.first_name} {added_user.last_name}" if added_user else "",
                'user_email': added_user.email if added_user else "",
                'role': new_member.role,
                'joined_at': new_member.joined_at
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
            'message': 'Une erreur s\'est produite lors de l\'ajout du membre'
        }), 500

@collab_bp.route('/teams/<team_id>/members/<int:user_id>', methods=['DELETE'])
@token_required
def remove_team_member(team_id, user_id):
    """Supprime un membre d'une équipe"""
    current_user_id = g.current_user.id
    
    try:
        collaboration_service.remove_team_member(team_id, user_id, current_user_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Membre supprimé avec succès'
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la suppression du membre'
        }), 500

@collab_bp.route('/teams/<team_id>/share-interview', methods=['POST'])
@token_required
def share_interview_with_team(team_id):
    """Partage un entretien avec une équipe"""
    data = request.get_json()
    user_id = g.current_user.id
    
    if not data or 'interview_id' not in data:
        return jsonify({
            'status': 'error',
            'message': 'L\'ID de l\'entretien est requis'
        }), 400
    
    try:
        interview_id = data['interview_id']
        permission_level = data.get('permission_level', 'viewer')
        expires_days = data.get('expires_days')
        message = data.get('message')
        
        team_access = collaboration_service.share_interview_with_team(
            team_id,
            interview_id,
            user_id,
            permission_level,
            expires_days,
            message
        )
        
        interview = Interview.query.get(interview_id)
        interview_title = interview.title or f"Entretien avec {interview.candidate_name}" if interview else "Entretien"
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien partagé avec l\'équipe avec succès',
            'data': {
                'team_id': team_id,
                'interview_id': interview_id,
                'interview_title': interview_title,
                'permission_level': team_access.permission_level,
                'granted_at': team_access.created_at,
                'expires_at': team_access.expires_at.isoformat() if team_access.expires_at else None
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
            'message': 'Une erreur s\'est produite lors du partage de l\'entretien avec l\'équipe'
        }), 500

@collab_bp.route('/teams/<team_id>/interviews/<int:interview_id>/notes', methods=['POST'])
@token_required
def add_team_note(team_id, interview_id):
    """Ajoute une note d'équipe à un entretien"""
    data = request.get_json()
    user_id = g.current_user.id
    
    if not data or 'content' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Le contenu de la note est requis'
        }), 400
    
    try:
        visibility = data.get('visibility', 'team')
        note = collaboration_service.add_team_note(
            team_id,
            interview_id,
            user_id,
            data['content'],
            visibility
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Note ajoutée avec succès',
            'data': note.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de l\'ajout de la note'
        }), 500

@collab_bp.route('/interviews/<int:interview_id>/team-notes', methods=['GET'])
@token_required
def get_team_notes(interview_id):
    """Récupère les notes d'équipe pour un entretien"""
    user_id = g.current_user.id
    
    try:
        notes = collaboration_service.get_team_notes(interview_id, user_id)
        
        return jsonify({
            'status': 'success',
            'data': notes
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Une erreur s\'est produite lors de la récupération des notes'
        }), 500