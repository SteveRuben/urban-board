# backend/routes/candidate_exercise_routes.py
from flask import Blueprint, request, jsonify, abort
from ..services.interview_exercise_service import InterviewExerciseService
from ..services.coding_platform_service import CodingPlatformService
from datetime import datetime, timezone
from app import db

candidate_exercise_bp = Blueprint('candidate_exercise', __name__, url_prefix='/api/candidate')

exercise_service = InterviewExerciseService()
coding_service = CodingPlatformService()

@candidate_exercise_bp.route('/coding/<access_token>', methods=['GET'])
def get_candidate_exercises(access_token):
    """
    Récupère les exercices assignés à un candidat via son token d'accès
    
    Args:
        access_token: Token d'accès unique du candidat
        
    Returns:
        Exercices et informations de session
    """
    try:
        exercises_data = exercise_service.get_exercises_for_candidate(access_token)
        
        return jsonify({
            'status': 'success',
            'data': exercises_data
        }), 200
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Erreur lors de la récupération des exercices candidat: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

@candidate_exercise_bp.route('/coding/<access_token>/start', methods=['POST'])
def start_candidate_session(access_token):
    """
    Démarre la session d'exercices pour un candidat
    
    Args:
        access_token: Token d'accès unique du candidat
        
    Returns:
        Confirmation du démarrage de session
    """
    try:
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Session d\'exercices non trouvée'
            }), 404
        
        if not user_exercise.is_accessible():
            if user_exercise.is_expired():
                return jsonify({
                    'status': 'error',
                    'message': 'La session d\'exercices a expiré'
                }), 403
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Accès non autorisé aux exercices'
                }), 403
        
        # Démarrer la session
        user_exercise.start_session()
        
        return jsonify({
            'status': 'success',
            'message': 'Session démarrée avec succès',
            'data': user_exercise.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Erreur lors du démarrage de session: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

@candidate_exercise_bp.route('/coding/<access_token>/exercises/<exercise_id>/challenges', methods=['GET'])
def get_exercise_challenges_for_candidate(access_token, exercise_id):
    """
    Récupère les challenges d'un exercice spécifique pour un candidat
    
    Args:
        access_token: Token d'accès unique du candidat
        exercise_id: ID de l'exercice
        
    Returns:
        Challenges de l'exercice
    """
    try:
        # Vérifier l'accès
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Session d\'exercices non trouvée'
            }), 404
        
        if exercise_id not in user_exercise.exercise_ids:
            return jsonify({
                'status': 'error',
                'message': 'Exercice non assigné à cette session'
            }), 403
        
        if not user_exercise.is_accessible():
            return jsonify({
                'status': 'error',
                'message': 'Session expirée ou non accessible'
            }), 403
        
        # Récupérer les challenges publiés de l'exercice
        challenges, _ = coding_service.get_challenges(
            exercise_id=exercise_id,
            user_id=None  # Accès public
        )
        
        return jsonify({
            'status': 'success',
            'data': [challenge.to_dict() for challenge in challenges]
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des challenges: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

@candidate_exercise_bp.route('/coding/<access_token>/challenges/<challenge_id>', methods=['GET'])
def get_challenge_for_candidate_session(access_token, challenge_id):
    """
    Récupère un challenge spécifique pour un candidat
    
    Args:
        access_token: Token d'accès unique du candidat
        challenge_id: ID du challenge
        
    Returns:
        Challenge avec ses étapes
    """
    try:
        # Vérifier l'accès
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Session d\'exercices non trouvée'
            }), 404
        
        if not user_exercise.is_accessible():
            return jsonify({
                'status': 'error',
                'message': 'Session expirée ou non accessible'
            }), 403
        
        # Récupérer le challenge
        challenge = coding_service.get_challenge_by_id(
            challenge_id, 
            check_published=True
        )
        
        # Vérifier que le challenge appartient à un exercice assigné
        if challenge.exercise_id not in user_exercise.exercise_ids:
            return jsonify({
                'status': 'error',
                'message': 'Challenge non autorisé pour cette session'
            }), 403
        
        result = challenge.to_dict(include_steps=True)
        
        # Supprimer les solutions des étapes
        for step in result.get('steps', []):
            step.pop('solution_code', None)
        
        return jsonify({
            'status': 'success',
            'data': result
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération du challenge: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

@candidate_exercise_bp.route('/coding/<access_token>/challenges/<challenge_id>/start', methods=['POST'])
def start_challenge_for_candidate(access_token, challenge_id):
    """
    Démarre un challenge pour un candidat dans sa session
    
    Args:
        access_token: Token d'accès unique du candidat
        challenge_id: ID du challenge à démarrer
        
    Returns:
        Session de challenge démarrée
    """
    try:
        # Vérifier l'accès
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Session d\'exercices non trouvée'
            }), 404
        
        if not user_exercise.is_accessible():
            return jsonify({
                'status': 'error',
                'message': 'Session expirée ou non accessible'
            }), 403
        
        # Utiliser l'email du candidat comme identifiant de session
        session_info = {
            'type': 'anonymous_id',
            'value': user_exercise.candidate_email
        }
        
        # Démarrer le challenge avec le service de coding platform
        user_challenge = coding_service.start_challenge(
            challenge_id,
            session_info,
            user_exercise.candidate_email  # Utiliser l'email, pas le nom
        )
        
        return jsonify({
            'status': 'success',
            'data': user_challenge.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Erreur lors du démarrage du challenge: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

@candidate_exercise_bp.route('/coding/<access_token>/progress', methods=['GET'])
def get_candidate_progress(access_token):
    """
    Récupère le progrès global du candidat
    
    Args:
        access_token: Token d'accès unique du candidat
        
    Returns:
        Progrès détaillé du candidat
    """
    try:
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Session d\'exercices non trouvée'
            }), 404
        print('nous etionsnobreux.............1')
        # Calculer le temps restant
        now = datetime.now(timezone.utc)
        expires_at = user_exercise.expires_at
        
        # S'assurer que expires_at a un timezone pour éviter l'erreur de soustraction
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        time_remaining_seconds = (expires_at - now).total_seconds()
        time_remaining_minutes = max(0, int(time_remaining_seconds / 60))
        
        print(f'Calcul temps restant: expires_at={expires_at}, now={now}, minutes_restantes={time_remaining_minutes}')
        time_remaining = None
        if user_exercise.expires_at:
            time_remaining = max(0, int(time_remaining_seconds / 60))  # en minutes
        print('nous etionsnobreux.............2')
        progress_data = {
            'session': user_exercise.to_dict(include_detailed_progress=True),
            'time_remaining_minutes': time_remaining,
            'can_continue': user_exercise.is_accessible(),
            'progress_percentage': user_exercise.calculate_progress_percentage(),
            'session_active': user_exercise.status == 'in_progress'
        }
        
        return jsonify({
            'status': 'success',
            'data': progress_data
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération du progrès: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

@candidate_exercise_bp.route('/coding/<access_token>/complete', methods=['POST'])
def complete_candidate_session(access_token):
    """
    Marque la session d'exercices comme terminée
    
    Args:
        access_token: Token d'accès unique du candidat
        
    Returns:
        Confirmation de completion
    """
    try:
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Session d\'exercices non trouvée'
            }), 404
        
        if user_exercise.status == 'completed':
            return jsonify({
                'status': 'success',
                'message': 'Session déjà terminée',
                'data': user_exercise.to_dict()
            }), 200
        
        # Marquer comme terminé
        user_exercise.complete_session()
        
        return jsonify({
            'status': 'success',
            'message': 'Session terminée avec succès',
            'data': user_exercise.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la completion de session: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

# Routes proxy pour les fonctionnalités de coding platform
@candidate_exercise_bp.route('/coding/<access_token>/challenges/<challenge_id>/steps/<step_id>', methods=['GET'])
def get_challenge_step_for_candidate(access_token, challenge_id, step_id):
    """Proxy vers get_challenge_step avec vérification d'accès candidat"""
    try:
        # Vérifier l'accès candidat
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise or not user_exercise.is_accessible():
            return jsonify({'status': 'error', 'message': 'Accès non autorisé'}), 403
        
        # Utiliser l'email comme session pour le service de coding
        session_info = {'type': 'anonymous_id', 'value': user_exercise.candidate_email}
        
        # Appeler le service de coding platform
        step = coding_service.get_challenge_step(challenge_id, step_id, session_info=session_info)
        
        return jsonify({'status': 'success', 'data': step.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@candidate_exercise_bp.route('/coding/<access_token>/exercise/<exercise_id>/challenges/<challenge_id>/steps/<step_id>/submit', methods=['POST'])
def submit_code_for_candidate(access_token, exercise_id, challenge_id, step_id):
    """Proxy vers submit_code avec vérification d'accès candidat"""
    try:
        # Vérifier l'accès candidat
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise or not user_exercise.is_accessible():
            return jsonify({'status': 'error', 'message': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        if not data or 'code' not in data or 'language' not in data:
            return jsonify({'status': 'error', 'message': 'Code et langage requis'}), 400
        
        # Utiliser l'email comme session pour le service de coding
        session_info = {'type': 'anonymous_id', 'value': user_exercise.candidate_email}
        
        # Soumettre le code
        response = coding_service.submit_code(
            challenge_id, step_id, session_info, data['code'], data['language']
        )
        
        # Mettre à jour le progrès si l'étape est complétée
        if response.get('summary', {}).get('all_passed', False):
            exercise_service.update_exercise_progress(
                access_token, exercise_id, completed=True, 
                score=response.get('summary', {}).get('passed', 0)
            )
        
        return jsonify({'status': 'success', 'data': response}), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@candidate_exercise_bp.route('/coding/<access_token>/challenges/<challenge_id>/steps/<step_id>/test', methods=['POST'])
def test_code_for_candidate(access_token, challenge_id, step_id):
    """Proxy vers test_code avec vérification d'accès candidat"""
    try:
        # Vérifier l'accès candidat
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise or not user_exercise.is_accessible():
            return jsonify({'status': 'error', 'message': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        if not data or 'code' not in data or 'language' not in data:
            return jsonify({'status': 'error', 'message': 'Code et langage requis'}), 400
        
        # Utiliser l'email comme session pour le service de coding
        session_info = {'type': 'anonymous_id', 'value': user_exercise.candidate_email}
        
        # Tester le code
        response = coding_service.test_code(
            challenge_id, step_id, session_info, data['code'], data['language']
        )
        
        return jsonify({'status': 'success', 'data': response}), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@candidate_exercise_bp.route('/coding/<access_token>/challenges/<challenge_id>/steps/<step_id>/save', methods=['POST'])
def save_progress_for_candidate(access_token, challenge_id, step_id):
    """Proxy vers save_step_progress avec vérification d'accès candidat"""
    try:
        # Vérifier l'accès candidat
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise or not user_exercise.is_accessible():
            return jsonify({'status': 'error', 'message': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        if not data or 'code' not in data or 'language' not in data:
            return jsonify({'status': 'error', 'message': 'Code et langage requis'}), 400
        
        # Utiliser l'email comme session pour le service de coding
        session_info = {'type': 'anonymous_id', 'value': user_exercise.candidate_email}
        
        # Sauvegarder le progrès
        progress = coding_service.save_step_progress(
            challenge_id, step_id, session_info, data['code'], data['language']
        )
        
        return jsonify({'status': 'success', 'data': progress.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
@candidate_exercise_bp.route('/coding/<access_token>/challenges/<challenge_id>/steps/<step_id>/load', methods=['GET'])
def load_progress_for_candidate(access_token, challenge_id, step_id):
    """Proxy vers load_step_progress avec vérification d'accès candidat"""
    try:
        # Vérifier l'accès candidat
        user_exercise = exercise_service.get_user_exercise_by_token(access_token)
        if not user_exercise or not user_exercise.is_accessible():
            return jsonify({'status': 'error', 'message': 'Accès non autorisé'}), 403
        
        # Utiliser l'email comme session pour le service de coding
        session_info = {'type': 'anonymous_id', 'value': user_exercise.candidate_email}
        
        # Charger le progrès
        progress = coding_service.load_step_progress(
            challenge_id, step_id, session_info
        )
        
        return jsonify({'status': 'success', 'data': progress}), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500