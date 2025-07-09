
import os
import re
from uuid import UUID
from datetime import datetime, timezone
from flask import g, request, jsonify, abort, current_app, Blueprint
from app.routes.user import token_required
from app.services.coding_platform_service import CodingPlatformService
from werkzeug.utils import secure_filename
from app import db
from app.models.coding_platform import (
     Challenge, ChallengeStep, UserChallengeProgress, 
    ProgrammingLanguage
)
from ..services.interview_exercise_service import InterviewExerciseService

coding_platform_bp = Blueprint('coding_platform', __name__)

# Initialize service
coding_platform_service = CodingPlatformService()
exercise_service = InterviewExerciseService()


def get_current_user_id():
    """Retourne l'ID utilisateur actuel sous forme de string"""
    return str(g.current_user.id) if hasattr(g, 'current_user') and g.current_user else None

def get_session_identifier():
    """
    Get session identifier for anonymous users
    Can be session_token, user_id, or anonymous identifier
    """
    # First check if we have an authenticated user
    user_id = get_current_user_id()
    if user_id:
        return {'type': 'user_id', 'value': user_id}
    
    # Check for session token in headers
    session_token = request.headers.get('X-Session-Token')
    if session_token:
        return {'type': 'session_token', 'value': session_token}
    
    # Check for session token in query params (fallback)
    session_token = request.args.get('session_token')
    if session_token:
        return {'type': 'session_token', 'value': session_token}
    
    # Check for anonymous identifier (email, name, etc.)
    anonymous_id = request.headers.get('X-Anonymous-ID')
    if anonymous_id:
        return {'type': 'anonymous_id', 'value': anonymous_id}
    
    return None

# =============================================================================
# ADMIN ROUTES - EXERCISE MANAGEMENT
# =============================================================================

@coding_platform_bp.route('/admin/exercises', methods=['GET'])
@token_required
def get_exercises():
    """Récupère la liste des exercices avec filtrage et pagination"""
    user_id = get_current_user_id()
    
    # Paramètres de filtrage et pagination
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    language = request.args.get('language')
    difficulty = request.args.get('difficulty')
    
    try:
        exercises, total = coding_platform_service.get_exercises(
            page=page,
            per_page=per_page,
            language=language,
            difficulty=difficulty,
            user_id=user_id
        )
        
        result = {
            'data': [exercise.to_dict() for exercise in exercises],
            'pagination': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        }
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Erreur dans get_exercises route: {e}")
        return jsonify({"error": "Erreur lors de la récupération des exercices"}), 500

@coding_platform_bp.route('/admin/exercises', methods=['POST'])
@token_required
def create_exercise():
    """Crée un nouvel exercice"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Validation basique des champs obligatoires
    required_fields = ['title', 'language', 'difficulty']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
    
    try:
        exercise = coding_platform_service.create_exercise(user_id, data)
        return jsonify(exercise.to_dict()), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Erreur dans create_exercise route: {e}")
        return jsonify({"error": "Erreur lors de la création de l'exercice"}), 500

@coding_platform_bp.route('/admin/exercises/<exercise_id>', methods=['GET'])
@token_required
def get_exercise(exercise_id):
    """Récupère les détails d'un exercice spécifique"""
    user_id = get_current_user_id()
    try:
        exercise = coding_platform_service.get_exercise_by_id(exercise_id, user_id)
        print('/////////////////////////////////',user_id)

        result = exercise.to_dict()
        result['challenges'] = [challenge.to_dict() for challenge in exercise.challenges]
        return jsonify(result), 200
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans get_exercise route: {e}")
        return jsonify({"error": "Erreur lors de la récupération de l'exercice"}), 500

@coding_platform_bp.route('/admin/exercises/<exercise_id>', methods=['PUT'])
@token_required
def update_exercise(exercise_id):
    """Met à jour un exercice existant"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Validation de base
    if not data:
        return jsonify({"error": "Aucune donnée fournie"}), 400
    
    try:
        exercise = coding_platform_service.update_exercise(exercise_id, user_id, data)
        return jsonify(exercise.to_dict()), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans update_exercise route: {e}")
        return jsonify({"error": "Erreur lors de la mise à jour de l'exercice"}), 500

@coding_platform_bp.route('/admin/exercises/<exercise_id>', methods=['DELETE'])
@token_required
def delete_exercise(exercise_id):
    """Supprime un exercice et tous ses challenges"""
    user_id = get_current_user_id()
    
    try:
        coding_platform_service.delete_exercise(exercise_id, user_id)
        return jsonify({"message": "Exercice supprimé avec succès"}), 200
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans delete_exercise route: {e}")
        return jsonify({"error": "Erreur lors de la suppression de l'exercice"}), 500

# =============================================================================
# ADMIN ROUTES - CHALLENGE MANAGEMENT
# =============================================================================

@coding_platform_bp.route('/admin/challenges', methods=['GET'])
@token_required
def get_challenges():
    """Récupère la liste des challenges avec filtrage et pagination"""
    user_id = get_current_user_id()
    
    # Paramètres de filtrage et pagination
    exercise_id = request.args.get('exercise_id', type=int)
    status = request.args.get('status')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    
    try:
        challenges, total = coding_platform_service.get_challenges(
            exercise_id=exercise_id,
            status=status,
            page=page,
            per_page=per_page,
            user_id=user_id
        )
        
        result = {
            'data': [challenge.to_dict() for challenge in challenges],
            'pagination': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        }
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Erreur dans get_challenges route: {e}")
        return jsonify({"error": "Erreur lors de la récupération des challenges"}), 500

@coding_platform_bp.route('/admin/challenges', methods=['POST'])
@token_required
def create_challenge():
    """Crée un nouveau challenge"""
    data = request.get_json()
    
    # Validation basique des champs obligatoires
    required_fields = ['exercise_id', 'title', 'description']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
    
    try:
        challenge = coding_platform_service.create_challenge(data)
        return jsonify(challenge.to_dict()), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans create_challenge route: {e}")
        return jsonify({"error": "Erreur lors de la création du challenge"}), 500

@coding_platform_bp.route('/admin/challenges/<challenge_id>', methods=['GET'])
@token_required
def get_challenge(challenge_id):
    """Récupère les détails d'un challenge spécifique"""
    user_id = get_current_user_id()
    
    try:
        challenge = coding_platform_service.get_challenge_by_id(
            challenge_id, 
            user_id=user_id, 
            check_published=False
        )
        return jsonify(challenge.to_dict(include_steps=True)), 200
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans get_challenge route: {e}")
        return jsonify({"error": "Erreur lors de la récupération du challenge"}), 500

@coding_platform_bp.route('/admin/challenges/<challenge_id>', methods=['PUT'])
@token_required
def update_challenge(challenge_id):
    """Met à jour un challenge existant"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Validation de base
    if not data:
        return jsonify({"error": "Aucune donnée fournie"}), 400
    
    try:
        # Cas spécial : mise à jour du statut uniquement
        if 'status' in data and len(data) == 1:
            challenge = coding_platform_service.update_challenge(challenge_id, user_id, data)
            return jsonify(challenge.to_dict()), 200
        
        # Sinon, c'est une mise à jour complète
        challenge = coding_platform_service.update_challenge(challenge_id, user_id, data)
        return jsonify(challenge.to_dict()), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans update_challenge route: {e}")
        return jsonify({"error": "Erreur lors de la mise à jour du challenge"}), 500

@coding_platform_bp.route('/admin/challenges/<challenge_id>', methods=['DELETE'])
@token_required
def delete_challenge(challenge_id):
    """Supprime un challenge et toutes ses étapes"""
    user_id = get_current_user_id()
    
    try:
        coding_platform_service.delete_challenge(challenge_id, user_id)
        return jsonify({"message": "Challenge supprimé avec succès"}), 200
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans delete_challenge route: {e}")
        return jsonify({"error": "Erreur lors de la suppression du challenge"}), 500

# =============================================================================
# ADMIN ROUTES - STEP MANAGEMENT
# =============================================================================

@coding_platform_bp.route('/admin/challenges/<challenge_id>/steps', methods=['GET'])
@token_required
def get_challenge_steps(challenge_id):
    """Récupère toutes les étapes d'un challenge"""
    user_id = get_current_user_id()
    
    try:
        steps = coding_platform_service.get_challenge_steps(challenge_id, user_id)
        return jsonify([step.to_dict(include_testcases=True, include_solution=True) for step in steps]), 200
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans get_challenge_steps route: {e}")
        return jsonify({"error": "Erreur lors de la récupération des étapes"}), 500

@coding_platform_bp.route('/admin/challenges/<challenge_id>/steps', methods=['POST'])
@token_required
def create_challenge_step(challenge_id):
    """Crée une nouvelle étape de challenge"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Validation basique des champs obligatoires
    required_fields = ['title', 'instructions']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
    
    try:
        step = coding_platform_service.create_challenge_step(challenge_id, user_id, data)
        return jsonify(step.to_dict(include_solution=True)), 201
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans create_challenge_step route: {e}")
        return jsonify({"error": "Erreur lors de la création de l'étape"}), 500
    

@coding_platform_bp.route('/admin/steps/<step_id>', methods=['GET'])
@token_required
def get_step(step_id):
    """Récupère les détails d'une étape spécifique (Admin)"""
    user_id = get_current_user_id()
    
    try:
        step = coding_platform_service.get_step_by_id(step_id, user_id)
        return jsonify(step.to_dict(include_testcases=True, include_solution=True)), 200
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans get_step route: {e}")
        return jsonify({"error": "Erreur lors de la récupération de l'étape"}), 500

@coding_platform_bp.route('/admin/steps/<step_id>', methods=['PUT'])
@token_required
def update_step(step_id):
    """Met à jour une étape existante (Admin)"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Aucune donnée fournie"}), 400
    
    try:
        step = coding_platform_service.update_step(step_id, user_id, data)
        return jsonify(step.to_dict(include_solution=True)), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans update_step route: {e}")
        return jsonify({"error": "Erreur lors de la mise à jour de l'étape"}), 500

@coding_platform_bp.route('/admin/steps/<step_id>', methods=['DELETE'])
@token_required
def delete_step(step_id):
    """Supprime une étape et ses cas de test (Admin)"""
    user_id = get_current_user_id()
    
    try:
        coding_platform_service.delete_step(step_id, user_id)
        return jsonify({"message": "Étape supprimée avec succès"}), 200
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans delete_step route: {e}")
        return jsonify({"error": "Erreur lors de la suppression de l'étape"}), 500

# =============================================================================
# ADMIN ROUTES - TEST CASE MANAGEMENT
# =============================================================================

@coding_platform_bp.route('/admin/steps/<step_id>/testcases', methods=['POST'])
@token_required
def create_testcase(step_id):
    """Crée un nouveau cas de test"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    # Validation basique des champs obligatoires
    required_fields = ['input_data', 'expected_output']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
    
    try:
        testcase = coding_platform_service.create_testcase(step_id, user_id, data)
        return jsonify(testcase.to_dict(show_hidden=True)), 201
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans create_testcase route: {e}")
        return jsonify({"error": "Erreur lors de la création du cas de test"}), 500

@coding_platform_bp.route('/admin/steps/<step_id>/testcases/bulk', methods=['POST'])
@token_required
def bulk_import_testcases(step_id):
    """Import en lot de cas de test depuis JSON"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data or 'testcases' not in data:
        return jsonify({"error": "Le champ 'testcases' est obligatoire"}), 400
    
    try:
        created_testcases = coding_platform_service.bulk_create_testcases(
            step_id, user_id, data['testcases']
        )
        
        return jsonify({
            "message": f"Créé {len(created_testcases)} cas de test avec succès",
            "testcases": [tc.to_dict(show_hidden=True) for tc in created_testcases]
        }), 201
        
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans bulk_import_testcases route: {e}")
        return jsonify({"error": "Erreur lors de l'import en lot des cas de test"}), 500

# =============================================================================
# PUBLIC ROUTES - USER CHALLENGE DISCOVERY
# =============================================================================

@coding_platform_bp.route('/exercises', methods=['GET'])
def get_public_exercises():
    """Récupère les exercices publiés pour les utilisateurs"""
    # Paramètres de filtrage et pagination
    language = request.args.get('language')
    difficulty = request.args.get('difficulty')
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 20)), 100)
    
    try:
        exercises, total = coding_platform_service.get_exercises(
            page=page,
            per_page=per_page,
            language=language,
            difficulty=difficulty,
            user_id=None  # Public access
        )
        
        result = {
            'data': [exercise.to_dict() for exercise in exercises],
            'pagination': {
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }
        }
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Erreur dans get_public_exercises route: {e}")
        return jsonify({"error": "Erreur lors de la récupération des exercices"}), 500

@coding_platform_bp.route('/exercises/<exercise_id>/challenges', methods=['GET'])
def get_exercise_challenges(exercise_id):
    """Récupère les challenges publiés d'un exercice"""
    try:
        exercise = coding_platform_service.get_exercise_by_id(exercise_id)
        challenges, _ = coding_platform_service.get_challenges(
            exercise_id=exercise_id,
            user_id=None  # Public access
        )
        
        result = {
            'exercise': exercise.to_dict(),
            'challenges': [challenge.to_dict() for challenge in challenges]
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans get_exercise_challenges route: {e}")
        return jsonify({"error": "Erreur lors de la récupération des challenges"}), 500

@coding_platform_bp.route('/challenges/<challenge_id>', methods=['GET'])
def get_challenge_for_user(challenge_id):
    """Récupère les détails d'un challenge pour l'utilisateur (sans solutions)"""
    session_info = get_session_identifier()
    
    try:
        challenge = coding_platform_service.get_challenge_by_id(
            challenge_id, 
            check_published=True
        )
        
        result = challenge.to_dict(include_steps=True)
        
        # Ajouter les informations de progrès utilisateur si session disponible
        if session_info:
            user_challenge = coding_platform_service._find_user_challenge(challenge_id, session_info)
            if user_challenge:
                result['user_progress'] = user_challenge.to_dict()
                
                # Récupérer le progrès des étapes
                step_progress = {}
                for progress in user_challenge.progress_entries:
                    step_progress[progress.step_id] = progress.to_dict()
                result['step_progress'] = step_progress
        
        # Supprimer le code solution des étapes (les utilisateurs ne doivent pas le voir)
        for step in result.get('steps', []):
            step.pop('solution_code', None)
        
        return jsonify(result), 200
        
    except Exception as e:
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans get_challenge_for_user route: {e}")
        return jsonify({"error": "Erreur lors de la récupération du challenge"}), 500

# =============================================================================
# PUBLIC ROUTES - USER SESSION MANAGEMENT
# =============================================================================

@coding_platform_bp.route('/challenges/<challenge_id>/start', methods=['POST'])
def start_challenge(challenge_id):
    """Démarre ou reprend une session de challenge (supporte les utilisateurs anonymes)"""
    session_info = get_session_identifier()
    data = request.get_json() or {}
    anonymous_identifier = data.get('anonymous_identifier')
    
    try:
        user_challenge = coding_platform_service.start_challenge(
            challenge_id, 
            session_info, 
            anonymous_identifier
        )
        
        result = {
            'user_challenge': user_challenge.to_dict(),
            'session_token': user_challenge.session_token,
            'message': 'Session créée' if user_challenge.user_id is None else 'Session reprise'
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans start_challenge route: {e}")
        return jsonify({"error": "Erreur lors du démarrage du challenge"}), 500

@coding_platform_bp.route('/challenges/<challenge_id>/steps/<step_id>', methods=['GET'])
def get_challenge_step(challenge_id, step_id):
    """Récupère une étape spécifique de challenge avec les cas de test (visibles uniquement)"""
    session_info = get_session_identifier()
    if not session_info:
        return jsonify({"error": "Identifiant de session requis (utiliser l'en-tête X-Session-Token ou démarrer une session)"}), 400
    
    try:
        step = coding_platform_service.get_challenge_step(
            challenge_id, 
            step_id, 
            session_info=session_info
        )
        
        # Récupérer les cas de test visibles
        from app.models.coding_platform import ChallengeStepTestcase
        testcases = ChallengeStepTestcase.query.filter_by(
            step_id=step_id,
            is_hidden=False
        ).order_by(ChallengeStepTestcase.order_index).all()
        
        # Récupérer le progrès de l'utilisateur pour cette étape
        user_challenge = coding_platform_service._find_user_challenge(challenge_id, session_info)
        progress = None
        if user_challenge:
            from app.models.coding_platform import UserChallengeProgress
            progress = UserChallengeProgress.query.filter_by(
                user_challenge_id=user_challenge.id,
                step_id=step_id
            ).first()
        
        result = step.to_dict()
        result['testcases'] = [tc.to_dict() for tc in testcases]
        result['user_progress'] = progress.to_dict() if progress else None
        
        # Supprimer le code solution
        result.pop('solution_code', None)
        
        return jsonify(result), 200
        
    except Exception as e:
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans get_challenge_step route: {e}")
        return jsonify({"error": "Erreur lors de la récupération de l'étape"}), 500

# =============================================================================
# PUBLIC ROUTES - PROGRESS MANAGEMENT
# =============================================================================

# @coding_platform_bp.route('/challenges/<challenge_id>/steps/<step_id>/save', methods=['POST'])
# def save_step_progress(challenge_id, step_id):
#     """Sauvegarde le progrès de code d'une étape (autosave) - supporte les utilisateurs anonymes"""
#     session_info = get_session_identifier()
#     if not session_info:
#         return jsonify({"error": "Identifiant de session requis (utiliser l'en-tête X-Session-Token)"}), 400
    
#     data = request.get_json()
#     if not data or 'code' not in data or 'language' not in data:
#         return jsonify({"error": "Les champs 'code' et 'language' sont obligatoires"}), 400
    
#     try:
#         progress = coding_platform_service.save_step_progress(
#             challenge_id, 
#             step_id, 
#             session_info, 
#             data['code'], 
#             data['language']
#         )
        
#         return jsonify(progress.to_dict() if hasattr(progress, 'to_dict') else progress), 200
        
#     except ValueError as e:
#         return jsonify({"error": str(e)}), 400
#     except Exception as e:
#         if 'not found' in str(e).lower():
#             return jsonify({"error": str(e)}), 404
#         print(f"Erreur dans save_step_progress route: {e}")
#         return jsonify({"error": "Erreur lors de la sauvegarde du progrès"}), 500

@coding_platform_bp.route('/challenges/<challenge_id>/steps/<step_id>/load', methods=['GET'])
def load_step_progress(challenge_id, step_id):
    """Charge le progrès de code sauvegardé d'une étape - supporte les utilisateurs anonymes"""
    session_info = get_session_identifier()
    if not session_info:
        return jsonify({"error": "Identifiant de session requis (utiliser l'en-tête X-Session-Token)"}), 400
    
    try:
        progress = coding_platform_service.load_step_progress(
            challenge_id, 
            step_id, 
            session_info
        )
        
        if hasattr(progress, 'to_dict'):
            return jsonify(progress.to_dict()), 200
        else:
            return jsonify(progress), 200  # Pour la réponse du code de départ
        
    except Exception as e:
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans load_step_progress route: {e}")
        return jsonify({"error": "Erreur lors du chargement du progrès"}), 500

# =============================================================================
# PUBLIC ROUTES - CODE EXECUTION
# =============================================================================

# @coding_platform_bp.route('/challenges/<challenge_id>/steps/<step_id>/submit', methods=['POST'])
# def submit_code(challenge_id, step_id):
#     """Soumet le code pour évaluation contre les cas de test - supporte les utilisateurs anonymes"""
#     session_info = get_session_identifier()
#     if not session_info:
#         return jsonify({"error": "Identifiant de session requis (utiliser l'en-tête X-Session-Token)"}), 400
    
#     data = request.get_json()
#     if not data or 'code' not in data or 'language' not in data:
#         return jsonify({"error": "Les champs 'code' et 'language' sont obligatoires"}), 400
    
#     try:
#         response = coding_platform_service.submit_code(
#             challenge_id, 
#             step_id, 
#             session_info, 
#             data['code'], 
#             data['language']
#         )
#         print('ca c\'est la vraie sorcelerie')
#         return jsonify(response), 200
        
#     except ValueError as e:
#         return jsonify({"error": str(e)}), 400
#     except Exception as e:
#         if 'not found' in str(e).lower():
#             return jsonify({"error": str(e)}), 404
#         print(f"Erreur dans submit_code route: {e}")
#         return jsonify({"error": "Erreur lors de la soumission du code"}), 500

@coding_platform_bp.route('/challenges/<challenge_id>/steps/<step_id>/test', methods=['POST'])
def test_code(challenge_id, step_id):
    """Teste le code contre les cas de test visibles uniquement (pour le développement)"""
    session_info = get_session_identifier()
    if not session_info:
        return jsonify({"error": "Identifiant de session requis (utiliser l'en-tête X-Session-Token)"}), 400
    
    data = request.get_json()
    if not data or 'code' not in data or 'language' not in data:
        return jsonify({"error": "Les champs 'code' et 'language' sont obligatoires"}), 400
    
    try:
        response = coding_platform_service.test_code(
            challenge_id, 
            step_id, 
            session_info, 
            data['code'], 
            data['language']
        )
        
        return jsonify(response), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans test_code route: {e}")
        return jsonify({"error": "Erreur lors du test du code"}), 500
    
@coding_platform_bp.route('/admin/steps/<step_id>/test', methods=['POST'])
@token_required
def admin_test_code(step_id):
    """Teste le code contre les cas de test (contexte admin)"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data or 'code' not in data or 'language' not in data:
        return jsonify({"error": "Les champs 'code' et 'language' sont obligatoires"}), 400
    
    try:
        response = coding_platform_service.admin_test_code(
            step_id, 
            user_id, 
            data['code'], 
            data['language']
        )
        
        return jsonify(response), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans admin_test_code route: {e}")
        return jsonify({"error": "Erreur lors du test du code"}), 500

@coding_platform_bp.route('/admin/steps/<step_id>/validate', methods=['POST'])
@token_required
def admin_validate_code(step_id):
    """Valide le code contre tous les cas de test (contexte admin)"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data or 'code' not in data or 'language' not in data:
        return jsonify({"error": "Les champs 'code' et 'language' sont obligatoires"}), 400
    
    try:
        response = coding_platform_service.admin_validate_code(
            step_id, 
            user_id, 
            data['code'], 
            data['language']
        )
        
        return jsonify(response), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if 'not found' in str(e).lower() or 'access denied' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        print(f"Erreur dans admin_validate_code route: {e}")
        return jsonify({"error": "Erreur lors de la validation du code"}), 500

# Corrections pour les routes coding_platform_bp

@coding_platform_bp.route('/<access_token>/challenges/<challenge_id>/steps/<step_id>/submit', methods=['POST'])
def submit_code(challenge_id, step_id,access_token):
    """Soumet le code pour évaluation contre les cas de test - supporte les utilisateurs anonymes"""

    user_exercise = exercise_service.get_user_exercise_by_token(access_token)
    if not user_exercise or not user_exercise.is_accessible():
        return jsonify({'status': 'error', 'message': 'Accès non autorisé'}), 403
       
    session_info = {'type': 'anonymous_id', 'value': access_token}
        
    data = request.get_json()
    if not data or 'code' not in data or 'language' not in data:
        return jsonify({"error": "Les champs 'code' et 'language' sont obligatoires"}), 400
    
    try:
        print(f'🔍 DEBUG: Route submit_code appelée - Challenge: {challenge_id}, Step: {step_id}')
        print(f'🔍 DEBUG: Session info: {session_info}')
        
        response = coding_platform_service.submit_code(
            challenge_id, 
            step_id, 
            session_info, 
            data['code'], 
            data['language']
        )
        
        print(f'🔍 DEBUG: Response from service: {response}')
        return jsonify(response), 200
        
    except ValueError as e:
        print(f'🔍 DEBUG: ValueError in submit_code route: {e}')
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f'🔍 DEBUG: Exception in submit_code route: {e}')
        if 'not found' in str(e).lower():
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": "Erreur lors de la soumission du code"}), 500

# CORRECTION: Nouvelle route pour récupérer la progression d'une étape
@coding_platform_bp.route('/challenges/<challenge_id>/steps/<step_id>/progress', methods=['GET'])
def get_step_progress(challenge_id, step_id):
    """Récupère la progression d'une étape spécifique"""
    session_info = get_session_identifier()
    if not session_info:
        return jsonify({"error": "Identifiant de session requis"}), 400
    
    try:
        print(f'🔍 DEBUG: Récupération progression - Challenge: {challenge_id}, Step: {step_id}')
        
        user_challenge = coding_platform_service._find_user_challenge(challenge_id, session_info)
        if not user_challenge:
            return jsonify({"error": "Session de challenge non trouvée"}), 404
        
        # Récupérer la progression pour cette étape
        progress = UserChallengeProgress.query.filter_by(
            user_challenge_id=user_challenge.id,
            step_id=step_id
        ).first()
        
        if not progress:
            # Récupérer le starter code de l'étape
            step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
            if not step:
                return jsonify({"error": "Étape non trouvée"}), 404
                
            return jsonify({
                "step_id": step_id,
                "code": step.starter_code or "",
                "language": "python",  # Valeur par défaut
                "is_completed": False,
                "tests_passed": 0,
                "tests_total": 0,
                "last_edited": None
            }), 200
        
        response = {
            "step_id": step_id,
            "code": progress.code or "",
            "language": progress.language.value if progress.language else "python",
            "is_completed": progress.is_completed,
            "tests_passed": progress.tests_passed or 0,
            "tests_total": progress.tests_total or 0,
            "last_edited": progress.last_edited.isoformat() if progress.last_edited else None,
            "last_execution_result": progress.last_execution_result
        }
        
        print(f'🔍 DEBUG: Progress trouvé: {response}')
        return jsonify(response), 200
        
    except Exception as e:
        print(f'🔍 DEBUG: Erreur get_step_progress: {e}')
        return jsonify({"error": "Erreur lors de la récupération de la progression"}), 500

# CORRECTION: Route pour sauvegarder la progression
@coding_platform_bp.route('/challenges/<challenge_id>/steps/<step_id>/save', methods=['POST'])
def save_step_progress(challenge_id, step_id):
    """Sauvegarde la progression d'une étape"""
    session_info = get_session_identifier()
    if not session_info:
        return jsonify({"error": "Identifiant de session requis"}), 400
    
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({"error": "Le champ 'code' est obligatoire"}), 400
    
    try:
        print(f'🔍 DEBUG: Sauvegarde progression - Challenge: {challenge_id}, Step: {step_id}')
        
        user_challenge = coding_platform_service._find_user_challenge(challenge_id, session_info)
        if not user_challenge:
            return jsonify({"error": "Session de challenge non trouvée"}), 404
        
        # Récupérer ou créer la progression
        progress = UserChallengeProgress.query.filter_by(
            user_challenge_id=user_challenge.id,
            step_id=step_id
        ).first()
        
        if not progress:
            language_enum = ProgrammingLanguage(data.get('language', 'python'))
            progress = UserChallengeProgress(
                user_challenge_id=user_challenge.id,
                step_id=step_id,
                language=language_enum
            )
            db.session.add(progress)
        
        # Mettre à jour le code
        progress.code = data['code']
        if 'language' in data:
            progress.language = ProgrammingLanguage(data['language'])
        progress.last_edited = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            "message": "Progression sauvegardée avec succès",
            "last_saved": progress.last_edited.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'🔍 DEBUG: Erreur save_step_progress: {e}')
        return jsonify({"error": "Erreur lors de la sauvegarde"}), 500

# CORRECTION: Route pour récupérer le statut global d'un challenge
@coding_platform_bp.route('/challenges/<challenge_id>/status', methods=['GET'])
def get_challenge_status(challenge_id):
    """Récupère le statut global d'un challenge pour un utilisateur"""
    session_info = get_session_identifier()
    if not session_info:
        return jsonify({"error": "Identifiant de session requis"}), 400
    
    try:
        print(f'🔍 DEBUG: Récupération statut challenge: {challenge_id}')
        
        user_challenge = coding_platform_service._find_user_challenge(challenge_id, session_info)
        if not user_challenge:
            return jsonify({"error": "Session de challenge non trouvée"}), 404
        
        # Récupérer la progression de toutes les étapes
        challenge = Challenge.query.get(challenge_id)
        if not challenge:
            return jsonify({"error": "Challenge non trouvé"}), 404
        
        steps_progress = []
        total_completed = 0
        total_steps = len(challenge.steps)
        
        for step in challenge.steps:
            progress = UserChallengeProgress.query.filter_by(
                user_challenge_id=user_challenge.id,
                step_id=step.id
            ).first()
            
            step_data = {
                "step_id": step.id,
                "step_order": step.order_index,
                "step_title": step.title,
                "is_completed": progress.is_completed if progress else False,
                "tests_passed": progress.tests_passed if progress else 0,
                "tests_total": progress.tests_total if progress else len(step.testcases) if step.testcases else 0,
                "has_code": bool(progress and progress.code) if progress else False
            }
            
            if progress and progress.is_completed:
                total_completed += 1
                
            steps_progress.append(step_data)
        
        response = {
            "challenge_id": challenge_id,
            "user_challenge": {
                "id": user_challenge.id,
                "status": user_challenge.status.value,
                "current_step_id": user_challenge.current_step_id,
                "attempt_count": user_challenge.attempt_count,
                "started_at": user_challenge.started_at.isoformat() if user_challenge.started_at else None,
                "completed_at": user_challenge.completed_at.isoformat() if user_challenge.completed_at else None
            },
            "progress_summary": {
                "total_steps": total_steps,
                "completed_steps": total_completed,
                "completion_rate": round((total_completed / total_steps * 100), 2) if total_steps > 0 else 0
            },
            "steps_progress": steps_progress
        }
        
        print(f'🔍 DEBUG: Statut challenge: {response}')
        return jsonify(response), 200
        
    except Exception as e:
        print(f'🔍 DEBUG: Erreur get_challenge_status: {e}')
        return jsonify({"error": "Erreur lors de la récupération du statut"}), 500

# CORRECTION: Route pour recalculer les statistiques
@coding_platform_bp.route('/recalculate-stats', methods=['POST'])
def recalculate_stats():
    """Recalcule les statistiques pour un candidat (route de debug/maintenance)"""
    session_info = get_session_identifier()
    if not session_info:
        return jsonify({"error": "Identifiant de session requis"}), 400
    
    try:
        from ..services.interview_exercise_service import InterviewExerciseService
        interview_service = InterviewExerciseService()
        
        # Récupérer le token de session
        access_token = None
        if session_info['type'] == 'session_token':
            access_token = session_info['value']
        elif session_info['type'] == 'anonymous_id':
            access_token = session_info['value']
        
        if not access_token:
            return jsonify({"error": "Token d'accès requis pour recalculer les stats"}), 400
        
        stats = interview_service.recalculate_candidate_stats(access_token)
        
        return jsonify({
            "message": "Statistiques recalculées avec succès",
            "stats": stats
        }), 200
        
    except Exception as e:
        print(f'🔍 DEBUG: Erreur recalculate_stats: {e}')
        return jsonify({"error": "Erreur lors du recalcul des statistiques"}), 500