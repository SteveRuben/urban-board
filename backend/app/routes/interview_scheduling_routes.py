# backend/routes/interview_scheduling_routes.py
import time
from ..services.avatar_service import get_avatar_service
from ..models.interview_scheduling import InterviewSchedule
from flask import Blueprint, request, jsonify, g
from app.routes.user import token_required
from ..services.interview_scheduling_service import InterviewSchedulingService
from ..services.organization_service import OrganizationService
from ..services.audit_service import AuditService
from datetime import datetime, timedelta
from app import db
from ..services.interview_exercise_service import InterviewExerciseService
from ..models.coding_platform import UserChallenge, UserChallengeProgress
from ..models.coding_platform import Exercise

scheduling_bp = Blueprint('scheduling', __name__, url_prefix='/api/scheduling')

UPDATABLE_FIELDS = [
    'scheduled_at', 
    'duration_minutes', 
    'timezone', 
    'mode', 
    'ai_assistant_id', 
    'predefined_questions'
]

exercise_service = InterviewExerciseService()
scheduling_service = InterviewSchedulingService()
organization_service = OrganizationService()
audit_service = AuditService()

# Constantes pour la validation
VALID_INTERVIEW_MODES = ['collaborative', 'autonomous']
VALID_STATUSES = ['scheduled', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show']

def get_current_user_id():
    """Retourne l'ID utilisateur actuel sous forme de string"""
    return str(g.current_user.user_id)

def validate_interview_data(data, is_update=False):
    """Valide les données d'entretien"""
    errors = {}
    
    # Validation du mode d'entretien
    if 'mode' in data:
        if not data['mode'] or data['mode'] not in VALID_INTERVIEW_MODES:
            errors['mode'] = f"Le mode doit être l'un des suivants: {', '.join(VALID_INTERVIEW_MODES)}"
    elif not is_update:  # Requis seulement pour la création
        errors['mode'] = "Le mode d'entretien est requis"
    
    # Validation des champs requis pour la création
    if not is_update:
        required_fields = ['candidate_name', 'candidate_email', 'title', 'position', 'scheduled_at']
        for field in required_fields:
            if not data.get(field):
                errors[field] = f"Le champ {field} est requis"
    
    # Validation de l'email
    if 'candidate_email' in data and data['candidate_email']:
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['candidate_email']):
            errors['candidate_email'] = "Format d'email invalide"
    
    # Validation de la date
    if 'scheduled_at' in data and data['scheduled_at']:
        try:
            scheduled_date = datetime.fromisoformat(data['scheduled_at'])
            if scheduled_date <= datetime.now():
                errors['scheduled_at'] = "La date doit être dans le futur"
        except ValueError:
            errors['scheduled_at'] = "Format de date invalide"
    
    # Validation de la durée
    if 'duration_minutes' in data and data['duration_minutes']:
        if  int(data['duration_minutes']) < 15 or int(data['duration_minutes']) > 480:
            errors['duration_minutes'] = "La durée doit être entre 15 minutes et 8 heures"
    
    return errors

def validate_interview_update_data(data):
    """Valide les données d'entretien pour la mise à jour (champs limités)"""
    errors = {}
    
    # Validation du mode d'entretien (si fourni)
    if 'mode' in data and data['mode']:
        if data['mode'] not in VALID_INTERVIEW_MODES:
            errors['mode'] = f"Le mode doit être l'un des suivants: {', '.join(VALID_INTERVIEW_MODES)}"
    
    # Validation de la date (si fournie)
    if 'scheduled_at' in data and data['scheduled_at']:
        try:
            scheduled_date = datetime.fromisoformat(data['scheduled_at'])
            if scheduled_date <= datetime.now():
                errors['scheduled_at'] = "La date doit être dans le futur"
        except ValueError:
            errors['scheduled_at'] = "Format de date invalide"
    
    # Validation de la durée (si fournie)
    if 'duration_minutes' in data and data['duration_minutes'] is not None:
        if not isinstance(data['duration_minutes'], int) or data['duration_minutes'] < 15 or data['duration_minutes'] > 480:
            errors['duration_minutes'] = "La durée doit être entre 15 minutes et 8 heures"
    
    # Validation du fuseau horaire (si fourni)
    if 'timezone' in data and data['timezone']:
        valid_timezones = ['Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles']
        if data['timezone'] not in valid_timezones:
            errors['timezone'] = f"Fuseau horaire non supporté. Valeurs autorisées: {', '.join(valid_timezones)}"
    
    # Validation des questions prédéfinies (si fournies)
    if 'predefined_questions' in data and data['predefined_questions'] is not None:
        if not isinstance(data['predefined_questions'], list):
            errors['predefined_questions'] = "Les questions prédéfinies doivent être une liste"
        else:
            for i, question in enumerate(data['predefined_questions']):
                if not isinstance(question, str):
                    errors['predefined_questions'] = f"La question {i+1} doit être une chaîne de caractères"
                    break
                if len(question.strip()) > 500:
                    errors['predefined_questions'] = f"La question {i+1} est trop longue (max 500 caractères)"
                    break
    
    return errors

@scheduling_bp.route('/schedules', methods=['POST'])
@token_required
def create_schedule():
    """Crée une nouvelle planification d'entretien avec email interactif"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data:
        return jsonify({
            'status': 'error',
            'message': 'Aucune donnée fournie'
        }), 400
    
    # Valider les données
    validation_errors = validate_interview_data(data)
    if validation_errors:
        return jsonify({
            'status': 'error',
            'message': 'Données invalides',
            'errors': validation_errors
        }), 400
    
    # Récupérer l'organisation de l'utilisateur
    organization = g.current_user.current_organization_id
    
    try:
        print('debut programmtion...................1')
        # Créer la planification avec le service modifié
        schedule = scheduling_service.create_schedule(
            organization_id=organization,
            recruiter_id=user_id,
            data=data
        )
        print('debut programmtion...................2')
        # Récupérer les infos complètes avec statut d'email
        schedule_info = scheduling_service.get_schedule_with_response_info(schedule.id)
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien planifié avec succès. Email d\'invitation envoyé au candidat.',
            'data': schedule_info
        }), 201
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

def filter_updatable_data(data):
    """Filtre les données pour ne garder que les champs modifiables"""
    return {key: value for key, value in data.items() if key in UPDATABLE_FIELDS}

@scheduling_bp.route('/schedules/<schedule_id>', methods=['PUT'])
@token_required
def update_schedule(schedule_id):
    """Met à jour une planification d'entretien avec notification candidat si reprogrammation"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data:
        return jsonify({
            'status': 'error',
            'message': 'Aucune donnée fournie'
        }), 400
    
    # Filtrer les données pour ne garder que les champs modifiables
    filtered_data = filter_updatable_data(data)
    
    if not filtered_data:
        return jsonify({
            'status': 'error',
            'message': f'Aucun champ modifiable fourni. Champs autorisés: {", ".join(UPDATABLE_FIELDS)}'
        }), 400
    
    # Valider les données filtrées
    validation_errors = validate_interview_update_data(filtered_data)
    if validation_errors:
        return jsonify({
            'status': 'error',
            'message': 'Données invalides',
            'errors': validation_errors
        }), 400
    
    try:
        # Détecter si la date change
        old_schedule = scheduling_service.get_schedule(schedule_id)
        date_changed = False
        if 'scheduled_at' in filtered_data:
            from datetime import datetime
            new_date = datetime.fromisoformat(filtered_data['scheduled_at'])
            date_changed = new_date != old_schedule.scheduled_at
        
        # Mettre à jour avec le service modifié
        schedule = scheduling_service.update_schedule(
            schedule_id=schedule_id,
            recruiter_id=user_id,
            data=filtered_data
        )
        
        # Récupérer les infos complètes
        schedule_info = scheduling_service.get_schedule_with_response_info(schedule.id)
        
        message = 'Entretien modifié avec succès'
        if date_changed:
            message += '. Email de reprogrammation envoyé au candidat.'
        
        return jsonify({
            'status': 'success',
            'message': message,
            'data': schedule_info
        }), 200
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/cancel', methods=['POST'])
@token_required
def cancel_schedule(schedule_id):
    """Annule une planification d'entretien"""
    user_id = get_current_user_id()
    data = request.get_json() or {}
    reason = data.get('reason')
    
    try:
        schedule = scheduling_service.cancel_schedule(
            schedule_id=schedule_id,
            user_id=user_id,
            reason=reason
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien annulé avec succès',
            'data': schedule.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/me', methods=['GET'])
@token_required
def get_my_schedules():
    """Récupère les planifications de l'utilisateur connecté"""
    user_id = get_current_user_id()
    
    # Récupérer les paramètres de filtrage
    status = request.args.get('status')
    
    # Validation du statut
    if status and status not in VALID_STATUSES and status != 'all':
        return jsonify({
            'status': 'error',
            'message': f'Statut invalide. Valeurs autorisées: {", ".join(VALID_STATUSES + ["all"])}'
        }), 400
    
    from_date = None
    if 'from_date' in request.args:
        try:
            from_date = datetime.fromisoformat(request.args.get('from_date'))
        except ValueError:
            return jsonify({
                'status': 'error',
                'message': 'Format de date invalide pour from_date'
            }), 400
    
    to_date = None
    if 'to_date' in request.args:
        try:
            to_date = datetime.fromisoformat(request.args.get('to_date'))
        except ValueError:
            return jsonify({
                'status': 'error',
                'message': 'Format de date invalide pour to_date'
            }), 400
    
    schedules = scheduling_service.get_user_schedules(
        user_id=user_id,
        status=status if status != 'all' else None,
        from_date=from_date,
        to_date=to_date
    )
    
    schedules_with_avatar = []
    for schedule in schedules:
        schedule_dict = schedule.to_dict()
        schedules_with_avatar.append(schedule_dict)
    
    
    return jsonify({
        'status': 'success',
        'data': [schedule.to_dict() for schedule in schedules]
    }), 200

@scheduling_bp.route('/organizations/current/schedules', methods=['GET'])
@token_required
def get_organization_schedules():
    """Récupère les planifications de l'organisation"""
    user_id = get_current_user_id()
    
    # Récupérer l'organisation de l'utilisateur
    organization = organization_service.get_user_organization(user_id)
    if not organization:
        return jsonify({
            'status': 'error',
            'message': 'Aucune organisation trouvée pour cet utilisateur'
        }), 404
    
    # Vérifier que l'utilisateur est membre de l'organisation
    is_member = organization_service.is_member(organization.id, user_id)
    
    if not is_member:
        return jsonify({
            'status': 'error',
            'message': 'Accès non autorisé'
        }), 403
    
    # Récupérer les paramètres de filtrage
    status = request.args.get('status')
    
    # Validation du statut
    if status and status not in VALID_STATUSES and status != 'all':
        return jsonify({
            'status': 'error',
            'message': f'Statut invalide. Valeurs autorisées: {", ".join(VALID_STATUSES + ["all"])}'
        }), 400
    
    from_date = None
    if 'from_date' in request.args:
        try:
            from_date = datetime.fromisoformat(request.args.get('from_date'))
        except ValueError:
            return jsonify({
                'status': 'error',
                'message': 'Format de date invalide pour from_date'
            }), 400
    
    to_date = None
    if 'to_date' in request.args:
        try:
            to_date = datetime.fromisoformat(request.args.get('to_date'))
        except ValueError:
            return jsonify({
                'status': 'error',
                'message': 'Format de date invalide pour to_date'
            }), 400
    
    schedules = scheduling_service.get_organization_schedules(
        organization_id=organization.id,
        status=status if status != 'all' else None,
        from_date=from_date,
        to_date=to_date
    )
    
    schedules_with_avatar = []
    for schedule in schedules:
        schedule_dict = schedule.to_dict()
        schedules_with_avatar.append(schedule_dict)
    
    return jsonify({
        'status': 'success',
        'data': [schedule.to_dict() for schedule in schedules]
    }), 200

@scheduling_bp.route('/schedules/access/<access_token>', methods=['GET'])
def get_schedule_by_token(access_token):
    """Récupère les détails d'une planification par son token d'accès (pour le candidat)"""
    if not access_token:
        return jsonify({
            'status': 'error',
            'message': 'Token d\'accès requis'
        }), 400
    print('5..........5.....................')
    schedule = scheduling_service.get_schedule_by_token(access_token)
    if not schedule:
        return jsonify({
            'status': 'error',
            'message': 'Lien d\'entretien invalide ou expiré'
        }), 404
    print('6..........6.....................')

    # Vérifier si l'entretien n'est pas déjà passé
    if schedule.status not in ['scheduled', 'confirmed']:
        return jsonify({
            'status': 'error',
            'message': f'Cet entretien est {schedule.status}'
        }), 400
    print('7..........7.....................')

    # Pour le candidat, on ne renvoie que les informations nécessaires
    return jsonify({
        'status': 'success',
        'data': {
            'id': schedule.id,
            'title': schedule.title,
            'description': schedule.description,
            'position': schedule.position,
            'candidate_name': schedule.candidate_name,
            'scheduled_at': schedule.scheduled_at.isoformat(),
            'duration_minutes': schedule.duration_minutes,
            'timezone': schedule.timezone,
            'recruiter_name': schedule.recruiter.first_name if schedule.recruiter else None,
            'organization_name': schedule.organization.name if schedule.organization else None,
            'access_token': schedule.access_token,
            'mode': schedule.mode
        }
    }), 200

@scheduling_bp.route('/schedules/<schedule_id>/confirm', methods=['POST'])
@token_required
def confirm_schedule(schedule_id):
    """Confirme une planification d'entretien"""
    user_id = get_current_user_id()
    
    schedule = scheduling_service.get_schedule(schedule_id)
    if not schedule:
        return jsonify({
            'status': 'error',
            'message': 'Planification introuvable'
        }), 404
    
    # Vérifier que l'utilisateur a le droit de confirmer cet entretien
    if schedule.recruiter_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Vous n\'êtes pas autorisé à confirmer cet entretien'
        }), 403
    
    # Vérifier que l'entretien peut être confirmé
    if schedule.status not in ['scheduled']:
        return jsonify({
            'status': 'error',
            'message': f'Impossible de confirmer un entretien avec le statut: {schedule.status}'
        }), 400
    
    try:
        # Mettre à jour le statut
        schedule.status = 'confirmed'
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Enregistrer dans les logs
        audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=user_id,
            action='confirm',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Confirmation de l'entretien avec {schedule.candidate_name}"
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien confirmé avec succès',
            'data': schedule.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/no-show', methods=['POST'])
@token_required
def mark_no_show(schedule_id):
    """Marque un candidat comme absent à l'entretien"""
    user_id = get_current_user_id()
    
    try:
        schedule = scheduling_service.mark_as_no_show(
            schedule_id=schedule_id,
            user_id=user_id
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Candidat marqué comme absent',
            'data': schedule.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/start', methods=['POST'])
@token_required
def start_interview(schedule_id):
    """Démarre un entretien planifié"""
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data or 'interview_id' not in data:
        return jsonify({
            'status': 'error',
            'message': 'ID de l\'entretien manquant'
        }), 400
    
    interview_id = data['interview_id']
    
    try:
        schedule = scheduling_service.mark_as_started(
            schedule_id=schedule_id,
            interview_id=interview_id
        )
        
        # Enregistrer dans les logs
        audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=user_id,
            action='start',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Début de l'entretien {schedule.mode} avec {schedule.candidate_name}"
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien démarré avec succès',
            'data': schedule.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/complete', methods=['POST'])
@token_required
def complete_interview(schedule_id):
    """Marque un entretien comme terminé"""
    user_id = get_current_user_id()
    
    try:
        schedule = scheduling_service.mark_as_completed(schedule_id)
        
        # Enregistrer dans les logs
        audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=user_id,
            action='complete',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Fin de l'entretien {schedule.mode} avec {schedule.candidate_name}"
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien marqué comme terminé',
            'data': schedule.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

# Route utilitaire pour obtenir les modes d'entretien disponibles
@scheduling_bp.route('/modes', methods=['GET'])
def get_interview_modes():
    """Retourne la liste des modes d'entretien disponibles"""
    modes = [
        {
            'value': 'collaborative',
            'label': 'Collaboratif',
            'description': 'Entretien avec assistant IA et interaction directe avec le recruteur'
        },
        {
            'value': 'autonomous',
            'label': 'Autonome',
            'description': 'Entretien autonome géré entièrement par l\'assistant IA'
        }
    ]
    
    return jsonify({
        'status': 'success',
        'data': modes
    }), 200
    
@scheduling_bp.route('/test-google', methods=['GET'])
@token_required
def test_google_integration():
    """Test de l'intégration Google Calendar/Meet"""
    try:
        result = scheduling_service.test_google_integration()
        return jsonify({
            'status': 'success' if result['success'] else 'error',
            'data': result
        }), 200 if result['success'] else 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors du test Google: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/retry-sync', methods=['POST'])
@token_required
def retry_meeting_sync(schedule_id):
    """Réessaie la synchronisation du meeting Google Calendar"""
    user_id = get_current_user_id()
    
    try:
        schedule = scheduling_service.retry_meeting_sync(schedule_id, user_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Synchronisation relancée avec succès',
            'data': {
                'schedule_id': schedule.id,
                'sync_status': schedule.calendar_sync_status,
                'meet_link': schedule.meet_link,
                'calendar_link': schedule.calendar_link,
                'sync_error': schedule.calendar_sync_error
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
            'message': f'Une erreur est survenue: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/meeting-info', methods=['GET'])
@token_required
def get_meeting_info(schedule_id):
    """Récupère les informations du meeting Google Calendar"""
    user_id = get_current_user_id()
    
    schedule = scheduling_service.get_schedule(schedule_id)
    if not schedule:
        return jsonify({
            'status': 'error',
            'message': 'Planification introuvable'
        }), 404
    
    # Vérifier les permissions
    if schedule.recruiter_id != user_id:
        from ..models.organization import OrganizationMember
        is_member = OrganizationMember.query.filter_by(
            organization_id=schedule.organization_id,
            user_id=user_id
        ).first() is not None
        
        if not is_member:
            return jsonify({
                'status': 'error',
                'message': 'Accès non autorisé'
            }), 403
    
    meeting_info = schedule.get_meeting_info()
    
    return jsonify({
        'status': 'success',
        'data': {
            'has_meeting': schedule.has_valid_meeting(),
            'meeting_info': meeting_info,
            'sync_status': schedule.calendar_sync_status,
            'sync_error': schedule.calendar_sync_error
        }
    }), 200

@scheduling_bp.route('/schedules/access/<access_token>/meeting', methods=['GET'])
def get_candidate_meeting_info(access_token):
    """Récupère les informations du meeting pour le candidat via son token d'accès"""
    if not access_token:
        return jsonify({
            'status': 'error',
            'message': 'Token d\'accès requis'
        }), 400
    
    schedule = scheduling_service.get_schedule_by_token(access_token)
    if not schedule:
        return jsonify({
            'status': 'error',
            'message': 'Lien d\'entretien invalide ou expiré'
        }), 404
    
    # Vérifier si l'entretien n'est pas déjà passé
    if schedule.status not in ['scheduled', 'confirmed']:
        return jsonify({
            'status': 'error',
            'message': f'Cet entretien est {schedule.status}'
        }), 400
    
    return jsonify({
        'status': 'success',
        'data': {
            'schedule_id': schedule.id,
            'title': schedule.title,
            'scheduled_at': schedule.scheduled_at.isoformat(),
            'duration_minutes': schedule.duration_minutes,
            'meet_link': schedule.meet_link,
            'calendar_link': schedule.calendar_link,
            'has_meeting': schedule.has_valid_meeting(),
            'sync_status': schedule.calendar_sync_status,
            'instructions': self._get_meeting_instructions(schedule)
        }
    }), 200


@scheduling_bp.route('/organization/meeting-stats', methods=['GET'])
@token_required
def get_meeting_statistics():
    """Récupère les statistiques des meetings de l'organisation"""
    user_id = get_current_user_id()
    
    # Récupérer l'organisation de l'utilisateur
    organization = organization_service.get_user_organization(user_id)
    if not organization:
        return jsonify({
            'status': 'error',
            'message': 'Aucune organisation trouvée pour cet utilisateur'
        }), 404
    
    # Vérifier que l'utilisateur est membre de l'organisation
    is_member = organization_service.is_member(organization.id, user_id)
    if not is_member:
        return jsonify({
            'status': 'error',
            'message': 'Accès non autorisé'
        }), 403
    
    try:
        # Calculer les statistiques
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        # Derniers 30 jours
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Requête pour les statistiques
        schedules = InterviewSchedule.query.filter(
            InterviewSchedule.organization_id == organization.id,
            InterviewSchedule.created_at >= thirty_days_ago
        ).all()
        
        stats = {
            'total_interviews': len(schedules),
            'with_meeting': len([s for s in schedules if s.has_valid_meeting()]),
            'sync_status': {
                'synced': len([s for s in schedules if s.calendar_sync_status == 'synced']),
                'pending': len([s for s in schedules if s.calendar_sync_status == 'pending']),
                'error': len([s for s in schedules if s.calendar_sync_status == 'error']),
                'disabled': len([s for s in schedules if s.calendar_sync_status == 'disabled'])
            },
            'by_mode': {
                'collaborative': len([s for s in schedules if s.mode == 'collaborative']),
                'autonomous': len([s for s in schedules if s.mode == 'autonomous'])
            }
        }
        
        # Calculer le taux de succès
        if stats['total_interviews'] > 0:
            stats['success_rate'] = round((stats['with_meeting'] / stats['total_interviews']) * 100, 1)
        else:
            stats['success_rate'] = 0
        
        return jsonify({
            'status': 'success',
            'data': stats,
            'period': '30 derniers jours'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors du calcul des statistiques: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/candidate-responses', methods=['GET'])
@token_required
def get_candidate_responses(schedule_id):
    """Récupère l'historique des réponses du candidat"""
    user_id = get_current_user_id()
    
    schedule = scheduling_service.get_schedule(schedule_id)
    if not schedule:
        return jsonify({
            'status': 'error',
            'message': 'Planification introuvable'
        }), 404
    
    # Vérifier que l'utilisateur a le droit d'accéder à cette planification
    if schedule.recruiter_id != user_id:
        from ..models.organization import OrganizationMember
        is_member = OrganizationMember.query.filter_by(
            organization_id=schedule.organization_id,
            user_id=user_id
        ).first() is not None
        
        if not is_member:
            return jsonify({
                'status': 'error',
                'message': 'Accès non autorisé'
            }), 403
    
    try:
        # Récupérer les informations complètes
        schedule_info = scheduling_service.get_schedule_with_response_info(schedule_id)
        
        return jsonify({
            'status': 'success',
            'data': {
                'schedule_id': schedule_id,
                'candidate_name': schedule.candidate_name,
                'candidate_email': schedule.candidate_email,
                'current_status': schedule.status,
                'can_candidate_respond': schedule_info['can_candidate_respond'],
                'response_history': schedule_info['response_history'],
                'was_confirmed_by_candidate': schedule_info['was_confirmed_by_candidate'],
                'was_canceled_by_candidate': schedule_info['was_canceled_by_candidate'],
                'cancellation_reason': schedule.cancellation_reason
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la récupération des réponses: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/resend-invitation', methods=['POST'])
@token_required
def resend_invitation(schedule_id):
    """Renvoie l'email d'invitation avec boutons de réponse"""
    user_id = get_current_user_id()
    
    try:
        success = scheduling_service.resend_invitation_with_buttons(schedule_id, user_id)
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Invitation renvoyée avec succès',
                'data': {
                    'schedule_id': schedule_id,
                    'email_sent': True
                }
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Échec lors de l\'envoi de l\'invitation'
            }), 500
            
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors du renvoi de l\'invitation: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/email-preview', methods=['GET'])
@token_required
def get_email_preview(schedule_id):
    """Récupère un aperçu de l'email d'invitation"""
    user_id = get_current_user_id()
    
    schedule = scheduling_service.get_schedule(schedule_id)
    if not schedule:
        return jsonify({
            'status': 'error',
            'message': 'Planification introuvable'
        }), 404
    
    # Vérifier les permissions
    if schedule.recruiter_id != user_id:
        from ..models.organization import OrganizationMember
        is_member = OrganizationMember.query.filter_by(
            organization_id=schedule.organization_id,
            user_id=user_id
        ).first() is not None
        
        if not is_member:
            return jsonify({
                'status': 'error',
                'message': 'Accès non autorisé'
            }), 403
    
    try:
        # Générer les URLs de réponse pour l'aperçu
        from .candidate_response_routes import generate_candidate_response_urls
        import os
        
        base_url = os.getenv('APP_BASE_URL', 'https://votre-domaine.com')
        response_urls = generate_candidate_response_urls(schedule.access_token, base_url)
        
        preview_data = {
            'schedule': schedule.to_dict(),
            'email_data': {
                'candidate_name': schedule.candidate_name,
                'candidate_email': schedule.candidate_email,
                'interview_title': schedule.title,
                'interview_position': schedule.position,
                'scheduled_at': schedule.scheduled_at,
                'duration_minutes': schedule.duration_minutes,
                'timezone': schedule.timezone,
                'mode': schedule.mode,
                'description': schedule.description,
                'recruiter_name': schedule.recruiter.first_name if schedule.recruiter else 'Équipe RH',
                'organization_name': schedule.organization.name if schedule.organization else 'Notre entreprise',
                'meet_link': schedule.meet_link,
                'calendar_link': schedule.calendar_link,
                'confirm_url': response_urls['confirm_url'],
                'cancel_url': response_urls['cancel_url'],
                'access_token': schedule.access_token
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': preview_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur lors de la génération de l\'aperçu: {str(e)}'
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/response-status', methods=['GET'])
@token_required
def get_response_status(schedule_id):
    """Récupère le statut de réponse candidat simplifié"""
    user_id = get_current_user_id()
    
    try:
        schedule_info = scheduling_service.get_schedule_with_response_info(schedule_id)
        if not schedule_info:
            return jsonify({
                'status': 'error',
                'message': 'Planification introuvable'
            }), 404
        
        # Vérifier les permissions
        schedule = scheduling_service.get_schedule(schedule_id)
        if schedule.recruiter_id != user_id:
            from ..models.organization import OrganizationMember
            is_member = OrganizationMember.query.filter_by(
                organization_id=schedule.organization_id,
                user_id=user_id
            ).first() is not None
            
            if not is_member:
                return jsonify({
                    'status': 'error',
                    'message': 'Accès non autorisé'
                }), 403
        
        return jsonify({
            'status': 'success',
            'data': {
                'schedule_id': schedule_id,
                'current_status': schedule_info['status'],
                'can_candidate_respond': schedule_info['can_candidate_respond']['can_respond'],
                'response_reason': schedule_info['can_candidate_respond']['reason'],
                'confirmed_by_candidate': schedule_info['was_confirmed_by_candidate'],
                'canceled_by_candidate': schedule_info['was_canceled_by_candidate'],
                'cancellation_reason': schedule_info.get('cancellation_reason'),
                'last_response_date': schedule_info.get('updated_at')
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erreur: {str(e)}'
        }), 500
        
@scheduling_bp.route('/interview-questions/preview', methods=['POST'])
@token_required
def preview_interview_questions():
    """Prévisualise les questions pour un type de poste"""
    try:
        data = request.get_json()
        position = data.get('position', '')
        
        from app.services.avatar_service import get_avatar_service
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 503
        
        questions_data = avatar_service._get_questions_for_position(position)
        
        return jsonify({
            'success': True,
            'position': position,
            'mode': 'simulation' if avatar_service.simulation_mode else 'ai',
            'introduction': questions_data['introduction'],
            'questions': [
                {
                    'question': q['question'],
                    'timing_minutes': q['timing'] // 60,
                    'timing_seconds': q['timing']
                }
                for q in questions_data['questions']
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    
@scheduling_bp.route('/exercises/suggestions', methods=['POST'])
@token_required
def get_exercise_suggestions():
    """
    Récupère les exercices suggérés pour un poste donné
    
    Body:
        position: Titre du poste
        description: Description du poste (optionnel)
        difficulty: Niveau de difficulté (optionnel)
        
    Returns:
        Liste des exercices pertinents
    """
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data or not data.get('position'):
        return jsonify({
            'status': 'error',
            'message': 'Le poste est requis'
        }), 400
    
    try:
        suggestions = scheduling_service.get_available_exercises_for_position(
            position=data['position'],
            description=data.get('description', ''),
            difficulty= data.get('difficulty','any')
        )
        
        return jsonify({
            'status': 'success',
            'data': suggestions
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des suggestions d'exercices: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

#  Récupérer les détails d'un entretien avec exercices
@scheduling_bp.route('/schedules/<schedule_id>', methods=['GET'])
@token_required
def get_schedule_details(schedule_id):
    """
    Récupère les détails complets d'un entretien avec les exercices assignés
    
    Args:
        schedule_id: ID de l'entretien
        
    Returns:
        Détails complets de l'entretien
    """
    user_id = get_current_user_id()
    
    try:
        schedule_info = scheduling_service.get_schedule_with_response_info(schedule_id)
        
        # Vérifier les permissions (l'utilisateur doit être le créateur ou de la même organisation)
        schedule = InterviewSchedule.query.get(schedule_id)
        if not schedule:
            return jsonify({
                'status': 'error',
                'message': 'Entretien non trouvé'
            }), 404
        
        organization = g.current_user.current_organization_id
        if schedule.organization_id != organization:
            return jsonify({
                'status': 'error',
                'message': 'Accès non autorisé'
            }), 403
        
        return jsonify({
            'status': 'success',
            'data': schedule_info
        }), 200
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 404
    except Exception as e:
        print(f"Erreur lors de la récupération des détails d'entretien: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

#  Assigner manuellement des exercices à un entretien
@scheduling_bp.route('/schedules/<schedule_id>/exercises', methods=['POST'])
@token_required
def assign_exercises_to_interview(schedule_id):
    """
    Assigne manuellement des exercices à un entretien existant
    
    Body:
        exercise_ids: Liste des IDs d'exercices à assigner
        time_limit_minutes: Temps limite en minutes (optionnel)
        
    Returns:
        Session d'exercices créée
    """
    user_id = get_current_user_id()
    data = request.get_json()
    
    if not data or not data.get('exercise_ids'):
        return jsonify({
            'status': 'error',
            'message': 'La liste d\'exercices est requise'
        }), 400
    
    try:
        # Vérifier que l'entretien existe et appartient à l'utilisateur
        schedule = InterviewSchedule.query.get(schedule_id)
        if not schedule:
            return jsonify({
                'status': 'error',
                'message': 'Entretien non trouvé'
            }), 404
        
        organization = g.current_user.current_organization_id
        if schedule.organization_id != organization:
            return jsonify({
                'status': 'error',
                'message': 'Accès non autorisé'
            }), 403
        
        # Vérifier s'il y a déjà des exercices assignés
        from ..models.user_exercise import UserExercise
        existing_exercise = UserExercise.query.filter_by(
            interview_schedule_id=schedule_id
        ).first()
        
        if existing_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Des exercices sont déjà assignés à cet entretien'
            }), 400
        
        # Créer la session d'exercices
        user_exercise = exercise_service.create_user_exercise_session(
            interview_schedule_id=schedule_id,
            candidate_email=schedule.candidate_email,
            candidate_name=schedule.candidate_name,
            position=schedule.position,
            scheduled_at=schedule.scheduled_at,
            description=schedule.description,
            custom_exercise_ids=data['exercise_ids'],
            time_limit_minutes=data.get('time_limit_minutes', 120)
        )
        
        # Envoyer un email avec le lien vers les exercices
        try:
            from flask import current_app
            base_url = current_app.config.get('FRONTEND_URL', 'https://recruteai.com')
            coding_link = f"{base_url}/candidate/coding/{user_exercise.access_token}"
            
            # Envoyer l'email de rappel des exercices
            scheduling_service.notification_service.email_service.send_coding_exercises_reminder(
                email=schedule.candidate_email,
                candidate_name=schedule.candidate_name,
                interview_title=schedule.title,
                coding_link=coding_link,
                coding_exercises_count=len(user_exercise.exercise_ids),
                scheduled_at=schedule.scheduled_at
            )
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email d'exercices: {e}")
        
        return jsonify({
            'status': 'success',
            'message': f'{len(data["exercise_ids"])} exercices assignés avec succès',
            'data': user_exercise.to_dict(include_token=True)
        }), 201
        
    except Exception as e:
        print(f"Erreur lors de l'assignation d'exercices: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500

#  Voir les résultats des exercices d'un candidat
@scheduling_bp.route('/schedules/<schedule_id>/exercises/results', methods=['GET'])
@token_required
def get_candidate_exercise_results(schedule_id):
    """
    Récupère les résultats des exercices d'un candidat pour un entretien
    
    Args:
        schedule_id: ID de l'entretien
        
    Returns:
        Résultats détaillés des exercices
    """
    user_id = get_current_user_id()
    
    try:
        # Vérifier que l'entretien existe et appartient à l'utilisateur
        
        schedule = InterviewSchedule.query.get(schedule_id)
        print(schedule)
        if not schedule:
            return jsonify({
                'status': 'error',
                'message': 'Entretien non trouvé'
            }), 404
        
        organization = g.current_user.current_organization_id
        
        if schedule.organization_id != organization:
            return jsonify({
                'status': 'error',
                'message': 'Accès non autorisé'
            }), 403
        
        # Récupérer les exercices assignés
        from ..models.user_exercise import UserExercise
        user_exercise = UserExercise.query.filter_by(
            interview_schedule_id=schedule_id
        ).first()
        
        if not user_exercise:
            return jsonify({
                'status': 'error',
                'message': 'Aucun exercice assigné à cet entretien'
            }), 404

        detailed_results = []
        for exercise_id in user_exercise.exercise_ids:
            # Récupérer l'exercice
            print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.55555',schedule_id)

            exercise = Exercise.query.get(exercise_id)
            if not exercise:
                print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.11')
                continue
            
            print(exercise)
            exercise_result = {
                'exercise': exercise.to_dict(),
                'challenges_results': []
            }
            
            # Récupérer les résultats pour chaque challenge
            for challenge in exercise.challenges:
                user_challenge = UserChallenge.query.filter_by(
                    challenge_id=challenge.id
                ).filter(
                    UserChallenge.session_token.like(f'%{user_exercise.candidate_email}%')
                ).first()
                print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.12')
                print(user_challenge)
                if user_challenge:
                    # Récupérer le progrès détaillé
                    progress_entries = UserChallengeProgress.query.filter_by(
                        user_challenge_id=user_challenge.id
                    ).all()
                    
                    challenge_result = {
                        'challenge': challenge.to_dict(),
                        'user_challenge': user_challenge.to_dict(),
                        'steps_progress': [p.to_dict() for p in progress_entries]
                    }
                    exercise_result['challenges_results'].append(challenge_result)
                    print('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.13')
                    print(challenge_result)
            detailed_results.append(exercise_result)
        
        return jsonify({
            'status': 'success',
            'data': {
                'user_exercise': user_exercise.to_dict(include_detailed_progress=True),
                'detailed_results': detailed_results
            }
        }), 200
        
    except Exception as e:
        print(f"Erreur lors de la récupération des résultats: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Une erreur inattendue est survenue'
        }), 500