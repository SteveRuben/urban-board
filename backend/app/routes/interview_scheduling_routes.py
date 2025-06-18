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

scheduling_bp = Blueprint('scheduling', __name__, url_prefix='/api/scheduling')

UPDATABLE_FIELDS = [
    'scheduled_at', 
    'duration_minutes', 
    'timezone', 
    'mode', 
    'ai_assistant_id', 
    'predefined_questions'
]


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
        # Créer la planification avec le service modifié
        schedule = scheduling_service.create_schedule(
            organization_id=organization,
            recruiter_id=user_id,
            data=data
        )
        
        # Récupérer les infos complètes avec statut d'email
        schedule_info = scheduling_service.get_schedule_with_response_info(schedule.id)
        from ..services.avatar_service import get_avatar_service
        avatar_service = get_avatar_service()
        
        if schedule.mode in ['autonomous', 'collaborative'] and avatar_service:
            schedule_info['avatar'] = {
                'available': True,
                'status': 'scheduled',
                'mode': 'simulation' if avatar_service.simulation_mode else 'ai',
                'scheduled_launch': (schedule.scheduled_at - timedelta(minutes=2)).isoformat()
            }
            print(f"✅ Avatar ajouté à la réponse pour {schedule.id}")
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

# @scheduling_bp.route('/schedules/<schedule_id>', methods=['GET'])
# @token_required
# def get_schedule(schedule_id):
#     """Récupère les détails d'une planification"""
#     user_id = get_current_user_id()
    
#     if not schedule_id:
#         return jsonify({
#             'status': 'error',
#             'message': 'ID de planification requis'
#         }), 400
    
#     schedule = scheduling_service.get_schedule(schedule_id)
#     if not schedule:
#         return jsonify({
#             'status': 'error',
#             'message': 'Planification introuvable'
#         }), 404
    
#     # Vérifier que l'utilisateur a le droit d'accéder à cette planification
#     if schedule.recruiter_id != user_id:
#         # Vérifier si l'utilisateur est membre de l'organisation
#         from ..models.organization import OrganizationMember
#         is_member = OrganizationMember.query.filter_by(
#             organization_id=schedule.organization_id,
#             user_id=user_id
#         ).first() is not None
        
#         if not is_member:
#             return jsonify({
#                 'status': 'error',
#                 'message': 'Accès non autorisé'
#             }), 403
    
#     return jsonify({
#         'status': 'success',
#         'data': schedule.to_dict()
#     }), 200

@scheduling_bp.route('/schedules/<schedule_id>', methods=['GET'])
@token_required
def get_schedule(schedule_id):
    """Récupère les détails d'une planification AVEC infos avatar"""
    user_id = get_current_user_id()
    
    if not schedule_id:
        return jsonify({
            'status': 'error',
            'message': 'ID de planification requis'
        }), 400
    
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
    
    # NOUVEAU : Ajouter les infos avatar
    schedule_dict = schedule.to_dict()
    schedule_dict = add_avatar_info_to_schedule(schedule_dict)
    
    return jsonify({
        'status': 'success',
        'data': schedule_dict
    }), 200

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
        schedule_dict = add_avatar_info_to_schedule(schedule_dict)
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
        schedule_dict = add_avatar_info_to_schedule(schedule_dict)
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

def _get_meeting_instructions(schedule):
    """Génère les instructions pour le candidat"""
    if not schedule.has_valid_meeting():
        return {
            'message': 'Le lien de réunion sera disponible prochainement.',
            'fallback': 'Veuillez contacter le recruteur si vous ne recevez pas le lien.'
        }
    
    return {
        'message': 'Cliquez sur le lien Meet ci-dessous pour rejoindre l\'entretien.',
        'recommendations': [
            'Testez votre connexion internet et votre caméra avant l\'entretien',
            'Trouvez un endroit calme et bien éclairé',
            'Préparez vos documents (CV, portfolio, etc.)',
            'Connectez-vous 5 minutes avant l\'heure prévue'
        ]
    }

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
        

def add_avatar_info_to_schedule(schedule_dict):
    """Ajoute les infos avatar à un objet schedule"""
    try:
        from ..services.avatar_service import get_avatar_service
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            schedule_dict['avatar'] = {
                'available': False,
                'status': 'service_unavailable'
            }
            return schedule_dict
        
        schedule_id = schedule_dict.get('id')
        if not schedule_id:
            schedule_dict['avatar'] = {'available': False, 'status': 'no_id'}
            return schedule_dict
        
        # Récupérer le statut de l'avatar pour cet entretien
        avatar_status = avatar_service.get_avatar_status(schedule_id)
        
        schedule_dict['avatar'] = {
            'available': True,
            'status': avatar_status.get('status', 'not_scheduled'),
            'mode': schedule_dict.get('mode', 'unknown'),
            'browser_running': avatar_status.get('browser_running', False),
            'meeting_active': avatar_status.get('meeting_active', False),
            'scheduled_launch': avatar_status.get('scheduled_launch'),
            'launch_time': avatar_status.get('launch_time')
        }
        
        # Si actif, ajouter les infos de questions
        if avatar_status.get('status') == 'active' and 'questions_info' in avatar_status:
            q_info = avatar_status['questions_info']
            schedule_dict['avatar']['questions'] = {
                'total': q_info.get('total_questions', 0),
                'asked': q_info.get('asked_questions', 0),
                'current_question': q_info.get('current_question'),
                'next_in_seconds': q_info.get('next_question_in', None)
            }
        
        return schedule_dict
        
    except Exception as e:
        schedule_dict['avatar'] = {
            'available': False,
            'status': 'error',
            'error': str(e)
        }
        return schedule_dict
    
@scheduling_bp.route('/schedules/<schedule_id>/avatar/status', methods=['GET'])
@token_required
def get_avatar_status(schedule_id):
    """Récupère le statut détaillé de l'avatar pour cet entretien"""
    try:
        from app.services.avatar_service import get_avatar_service
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 503
        
        status = avatar_service.get_avatar_status(schedule_id)
        
        return jsonify({
            'success': True,
            'schedule_id': schedule_id,
            'avatar_status': status,
            
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/avatar/force-question', methods=['POST'])
@token_required
def force_avatar_question(schedule_id):
    """Force la prochaine question de l'avatar"""
    try:
        from app.services.avatar_service import get_avatar_service
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 503
        
        result = avatar_service.force_next_question(schedule_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/avatar/stop', methods=['POST'])
@token_required
def stop_interview_avatar(schedule_id):
    """Arrête l'avatar d'un entretien"""
    try:
        from app.services.avatar_service import get_avatar_service
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 503
        
        result = avatar_service.stop_avatar(schedule_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduling_bp.route('/schedules/<schedule_id>/avatar/force-launch', methods=['POST'])
@token_required
def force_launch_avatar(schedule_id):
    """Lance immédiatement l'avatar pour cet entretien (debug/test)"""
    try:
        from app.services.avatar_service import get_avatar_service
        
        # Récupérer l'entretien
        schedule = scheduling_service.get_schedule(schedule_id)
        if not schedule:
            return jsonify({
                'success': False,
                'error': 'Entretien introuvable'
            }), 404
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 503
        
        # Préparer les données
        interview_data = {
            'candidate_name': schedule.candidate_name,
            'position': schedule.position,
            'mode': schedule.mode,
            'meet_link': schedule.meet_link or 'https://meet.google.com/test-link'
        }
        
        result = avatar_service.force_avatar_launch(schedule_id, interview_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
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
        
@scheduling_bp.route('/avatar/debug/launch/<interview_id>', methods=['POST'])
@token_required
def force_avatar_launch_debug(interview_id):
    """🚀 LANCE UN AVATAR IMMÉDIATEMENT AVEC DEBUG COMPLET"""
    
    data = request.get_json() or {}
    
    # Données d'entretien de test
    interview_data = {
        'candidate_name': data.get('candidate_name', 'Test Avatar'),
        'position': data.get('position', 'développeur'),
        'mode': data.get('mode', 'autonomous'),
        'meet_link': data.get('meet_link')  # OBLIGATOIRE
    }
    
    if not interview_data['meet_link']:
        return jsonify({
            'success': False,
            'error': 'meet_link obligatoire pour le test'
        }), 400
    
    try:
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 500
        
        print(f"🚀 LANCEMENT AVATAR DEBUG pour {interview_id}")
        
        # Forcer le lancement immédiat
        result = avatar_service.force_avatar_launch(interview_id, interview_data)
        
        # Attendre 10 secondes pour les logs
        import time
        time.sleep(10)
        
        # Récupérer les logs de lancement
        logs = avatar_service.get_avatar_launch_logs(interview_id)
        
        # Statut actuel
        status = avatar_service.get_avatar_status(interview_id)
        
        return jsonify({
            'success': True,
            'launch_result': result,
            'logs': logs,
            'current_status': status,
            'debug_info': {
                'undetected_available': avatar_service.__dict__.get('UNDETECTED_AVAILABLE', False),
                'simulation_mode': avatar_service.simulation_mode,
                'active_avatars': len(avatar_service.active_avatars),
                'scheduled_launches': len(avatar_service.scheduled_launches)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'debug': f'Erreur dans force_avatar_launch_debug: {e}'
        }), 500

@scheduling_bp.route('/avatar/debug/status/<interview_id>', methods=['GET'])
@token_required
def get_detailed_avatar_status(interview_id):
    """🔍 STATUT AVATAR ULTRA-DÉTAILLÉ"""
    
    try:
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 500
        
        # Statut de base
        status = avatar_service.get_avatar_status(interview_id)
        
        # Logs de lancement si disponibles
        logs = avatar_service.get_avatar_launch_logs(interview_id)
        
        # Infos service
        service_info = avatar_service.get_service_info()
        
        # Vérification driver actif
        driver_active = interview_id in avatar_service.avatar_drivers
        meeting_url = None
        
        if driver_active:
            try:
                driver = avatar_service.avatar_drivers[interview_id]
                meeting_url = driver.current_url
                page_title = driver.title
            except:
                meeting_url = "Erreur récupération URL"
                page_title = "Erreur récupération titre"
        
        return jsonify({
            'success': True,
            'interview_id': interview_id,
            'avatar_status': status,
            'launch_logs': logs,
            'service_info': service_info,
            'driver_details': {
                'active': driver_active,
                'current_url': meeting_url,
                'page_title': page_title if driver_active else None
            },
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduling_bp.route('/avatar/debug/service', methods=['GET'])
@token_required
def get_avatar_service_debug():
    """📊 DEBUG COMPLET DU SERVICE AVATAR"""
    
    try:
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 500
        
        # Informations détaillées
        debug_info = {
            'service_running': avatar_service.running,
            'simulation_mode': avatar_service.simulation_mode,
            'ai_api_available': bool(avatar_service.ai_api_key),
            'active_avatars_count': len(avatar_service.active_avatars),
            'scheduled_launches_count': len(avatar_service.scheduled_launches),
            'browser_sessions_count': len(avatar_service.avatar_drivers),
            'avatar_timers_count': len(avatar_service.avatar_timers),
            
            # Détail des avatars actifs
            'active_avatars': list(avatar_service.active_avatars.keys()),
            'scheduled_interviews': list(avatar_service.scheduled_launches.keys()),
            'browser_sessions': list(avatar_service.avatar_drivers.keys()),
            
            # Prochains lancements
            'next_launches': []
        }
        
        # Calculer les prochains lancements
        now = datetime.utcnow()
        for interview_id, data in avatar_service.scheduled_launches.items():
            launch_time = data['launch_time']
            time_until = (launch_time - now).total_seconds()
            
            debug_info['next_launches'].append({
                'interview_id': interview_id,
                'launch_time': launch_time.isoformat(),
                'seconds_until': int(time_until),
                'status': data['status']
            })
        
        # Trier par proximité
        debug_info['next_launches'].sort(key=lambda x: x['seconds_until'])
        
        return jsonify({
            'success': True,
            'debug_info': debug_info,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduling_bp.route('/avatar/debug/test-meet', methods=['POST'])
@token_required  
def test_meet_access():
    """🧪 TESTE L'ACCÈS À GOOGLE MEET SANS AVATAR"""
    
    data = request.get_json()
    meet_link = data.get('meet_link')
    
    if not meet_link:
        return jsonify({
            'success': False,
            'error': 'meet_link requis'
        }), 400
    
    try:
        avatar_service = get_avatar_service()
        
        # Test d'accès basique
        import requests
        response = requests.get(meet_link, timeout=10)
        
        test_results = {
            'meet_link': meet_link,
            'http_status': response.status_code,
            'accessible': response.status_code == 200,
            'content_length': len(response.text),
            'has_meet_content': 'meet.google.com' in response.text,
            'service_available': avatar_service is not None,
            'undetected_available': getattr(avatar_service, 'UNDETECTED_AVAILABLE', False) if avatar_service else False
        }
        
        # Test rapide avec driver si possible
        try:
            driver = avatar_service._create_undetected_chrome_driver()
            if driver:
                driver.get(meet_link)
                current_url = driver.current_url
                page_title = driver.title
                
                test_results['driver_test'] = {
                    'success': True,
                    'final_url': current_url,
                    'page_title': page_title,
                    'blocked': 'not allowed' in page_title.lower() or 'non autorisé' in page_title.lower()
                }
                
                driver.quit()
            else:
                test_results['driver_test'] = {
                    'success': False,
                    'error': 'Driver non créé'
                }
                
        except Exception as e:
            test_results['driver_test'] = {
                'success': False,
                'error': str(e)
            }
        
        return jsonify({
            'success': True,
            'test_results': test_results,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scheduling_bp.route('/avatar/debug/cleanup/<interview_id>', methods=['DELETE'])
@token_required
def cleanup_avatar_debug(interview_id):
    """🧹 NETTOIE UN AVATAR EN FORCE"""
    
    try:
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 500
        
        # Nettoyage forcé
        avatar_service._cleanup_avatar(interview_id)
        
        return jsonify({
            'success': True,
            'message': f'Avatar {interview_id} nettoyé',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
@scheduling_bp.route('/avatar/debug/js/<interview_id>', methods=['GET'])
def debug_avatar_javascript(interview_id):
    """🔍 DEBUG JAVASCRIPT EN TEMPS RÉEL"""
    
    avatar_service = get_avatar_service()
    if not avatar_service:
        return jsonify({'error': 'Service non disponible'}), 500
    
    # Utiliser la fonction debug du service
    result = avatar_service.debug_avatar_javascript(interview_id)
    
    return jsonify(result)

@scheduling_bp.route('/avatar/test/manual-message/<interview_id>', methods=['POST'])
@token_required
def test_manual_message(interview_id):
    """🧪 TEST ENVOI MANUEL DANS MEET"""
    
    data = request.get_json() or {}
    test_message = data.get('message', '🤖 Test manuel ' + str(int(time.time())))
    
    avatar_service = get_avatar_service()
    if not avatar_service:
        return jsonify({'error': 'Service non disponible'}), 500
        
    result = avatar_service.test_manual_message_send(interview_id, test_message)
    
    return jsonify(result)

@scheduling_bp.route('/avatar/debug/screenshot/<interview_id>', methods=['GET'])
def take_debug_screenshot(interview_id):
    """📸 CAPTURE D'ÉCRAN DEBUG"""
    
    avatar_service = get_avatar_service()
    if not avatar_service or interview_id not in avatar_service.avatar_pages:
        return jsonify({'error': 'Page non trouvée'}), 404
    
    try:
        page = avatar_service.avatar_pages[interview_id]
        
        # Prendre une capture d'écran
        screenshot = page.screenshot()
        
        # Encoder en base64 pour le JSON
        import base64
        screenshot_b64 = base64.b64encode(screenshot).decode('utf-8')
        
        # Info de debug
        url = page.url
        title = page.title()
        
        return jsonify({
            'success': True,
            'url': url,
            'title': title,
            'screenshot_b64': f"data:image/png;base64,{screenshot_b64}",
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@scheduling_bp.route('/avatar/test/force-join/<interview_id>', methods=['POST'])
@token_required
def force_join_test(interview_id):
    """🎯 FORCE LE JOIN MEET MANUELLEMENT"""
    
    avatar_service = get_avatar_service()
    if not avatar_service or interview_id not in avatar_service.avatar_pages:
        return jsonify({'error': 'Page non trouvée'}), 404
    
    try:
        page = avatar_service.avatar_pages[interview_id]
        
        # Fonction de log simple
        def log_step(step, success, details):
            print(f"{'✅' if success else '❌'} {step}: {details}")
        
        # Screenshot avant
        page.screenshot(path=f'/tmp/before_force_join_{interview_id}.png')
        
        # Forcer le join
        join_success = avatar_service._force_join_meet_multiple_strategies(page, log_step)
        
        # Screenshot après
        page.wait_for_timeout(3000)
        page.screenshot(path=f'/tmp/after_force_join_{interview_id}.png')
        
        # Test chat si join réussi
        chat_success = False
        if join_success:
            chat_success = avatar_service._force_open_chat_and_test(page, log_step)
        
        return jsonify({
            'success': True,
            'join_success': join_success,
            'chat_success': chat_success,
            'is_in_meeting': avatar_service._is_in_meeting(page),
            'current_url': page.url,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scheduling_bp.route('/avatar/test/send-message/<interview_id>', methods=['POST'])
@token_required  
def test_send_now(interview_id):
    """📨 TESTE L'ENVOI D'UN MESSAGE MAINTENANT"""
    
    data = request.get_json() or {}
    message = data.get('message', f'🤖 Test immédiat {int(time.time())}')
    
    avatar_service = get_avatar_service()
    if not avatar_service or interview_id not in avatar_service.avatar_pages:
        return jsonify({'error': 'Page non trouvée'}), 404
    
    try:
        page = avatar_service.avatar_pages[interview_id]
        
        def log_step(step, success, details):
            print(f"{'✅' if success else '❌'} {step}: {details}")
        
        # Essayer d'envoyer le message
        success = avatar_service._test_send_message(page, message, log_step)
        
        return jsonify({
            'success': success,
            'message': message,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scheduling_bp.route('/avatar/diagnose/<interview_id>', methods=['GET'])
@token_required
def diagnose_meet_page(interview_id):
    """🔍 DIAGNOSTIC COMPLET DE LA PAGE MEET"""
    
    avatar_service = get_avatar_service()
    if not avatar_service or interview_id not in avatar_service.avatar_pages:
        return jsonify({'error': 'Page non trouvée'}), 404
    
    try:
        page = avatar_service.avatar_pages[interview_id]
        
        def log_step(step, success, details):
            print(f"{'✅' if success else '❌'} {step}: {details}")
        
        # Faire un diagnostic complet
        diagnosis = avatar_service._diagnose_meet_page(page, log_step)
        
        # Prendre une capture d'écran actuelle
        screenshot_path = f'/tmp/meet_diagnosis_{interview_id}_{int(time.time())}.png'
        page.screenshot(path=screenshot_path)
        
        # Ajouter infos techniques
        diagnosis.update({
            'screenshot_path': screenshot_path,
            'current_url': page.url,
            'page_title': page.title(),
            'viewport': page.viewport_size,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        return jsonify({
            'success': True,
            'diagnosis': diagnosis
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scheduling_bp.route('/avatar/page-content/<interview_id>', methods=['GET'])
@token_required
def get_page_content(interview_id):
    """📄 RÉCUPÈRE LE CONTENU HTML DE LA PAGE"""
    
    avatar_service = get_avatar_service()
    if not avatar_service or interview_id not in avatar_service.avatar_pages:
        return jsonify({'error': 'Page non trouvée'}), 404
    
    try:
        page = avatar_service.avatar_pages[interview_id]
        
        # Récupérer le HTML complet
        html_content = page.content()
        
        # Aussi récupérer juste le texte visible
        visible_text = page.evaluate('() => document.body.innerText')
        
        return jsonify({
            'success': True,
            'url': page.url,
            'title': page.title(),
            'html_length': len(html_content),
            'html_content': html_content[:5000],  # Premiers 5000 caractères
            'visible_text': visible_text[:2000],   # Premiers 2000 caractères
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@scheduling_bp.route('/avatar/screenshot/<interview_id>', methods=['POST'])
@token_required
def take_screenshot(interview_id):
    """📸 PREND UNE CAPTURE D'ÉCRAN IMMÉDIATE"""
    
    avatar_service = get_avatar_service()
    if not avatar_service or interview_id not in avatar_service.avatar_pages:
        return jsonify({'error': 'Page non trouvée'}), 404
    
    try:
        page = avatar_service.avatar_pages[interview_id]
        
        # Nom unique pour la capture
        timestamp = int(time.time())
        screenshot_path = f'/tmp/meet_manual_{interview_id}_{timestamp}.png'
        
        # Prendre la capture
        page.screenshot(path=screenshot_path)
        
        # Retourner les infos
        return jsonify({
            'success': True,
            'screenshot_path': screenshot_path,
            'url': page.url,
            'title': page.title(),
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scheduling_bp.route('/avatar/view-screenshot/<filename>', methods=['GET'])
@token_required
def serve_screenshot(filename):
    """🖼️ SERT LES CAPTURES D'ÉCRAN"""
    
    import os
    from flask import send_file
    
    # Sécurité : vérifier que c'est bien nos fichiers
    if not filename.startswith('meet_') or '..' in filename:
        return jsonify({'error': 'Fichier non autorisé'}), 403
    
    file_path = f'/tmp/{filename}'
    
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='image/png')
    else:
        return jsonify({'error': 'Fichier non trouvé'}), 404

@scheduling_bp.route('/avatar/create-test-meet', methods=['POST'])
@token_required
def create_test_meet():
    """🏗️ CRÉE UN LIEN MEET DE TEST VALIDE"""
    
    try:
        # Générer un ID de réunion unique
        import random
        import string
        
        # Format Google Meet : abc-def-ghi (3 groupes de 3 lettres/chiffres)
        def generate_meet_id():
            chars = string.ascii_lowercase + string.digits
            return '-'.join([''.join(random.choices(chars, k=3)) for _ in range(3)])
        
        meet_id = generate_meet_id()
        meet_link = f"https://meet.google.com/{meet_id}"
        
        return jsonify({
            'success': True,
            'meet_id': meet_id,
            'meet_link': meet_link,
            'created_at': datetime.utcnow().isoformat(),
            'note': 'Lien Meet généré - peut nécessiter une authentification Google pour être accessible'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scheduling_bp.route('/avatar/test-with-real-meet', methods=['POST'])
@token_required
def test_with_real_meet():
    """🧪 TEST COMPLET AVEC UN VRAI LIEN MEET"""
    
    try:
        # Créer un nouveau lien Meet
        import random
        import string
        
        chars = string.ascii_lowercase + string.digits
        meet_id = '-'.join([''.join(random.choices(chars, k=3)) for _ in range(3)])
        meet_link = f"https://meet.google.com/{meet_id}"
        
        # Lancer l'avatar avec ce lien
        interview_id = f"test-real-meet-{int(time.time())}"
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({'error': 'Service avatar non disponible'}), 503
        
        interview_data = {
            'meet_link': meet_link,
            'candidate_name': 'Test Real Meet',
            'position': 'Test Position',
            'mode': 'autonomous'
        }
        
        # Programmer le lancement immédiat
        launch_time = datetime.utcnow()
        result = avatar_service.schedule_avatar_launch(interview_id, launch_time, interview_data)
        
        return jsonify({
            'success': True,
            'interview_id': interview_id,
            'meet_link': meet_link,
            'meet_id': meet_id,
            'launch_result': result,
            'timestamp': datetime.utcnow().isoformat(),
            'note': 'Test lancé avec un nouveau lien Meet - surveillez les logs pour le diagnostic'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scheduling_bp.route('/avatar/test-instant/<meet_code>', methods=['POST'])
@token_required
def test_instant_meet(meet_code):
    """⚡ TEST INSTANTANÉ AVEC UN CODE MEET DONNÉ"""
    
    try:
        # Valider le format du code Meet
        if not meet_code or len(meet_code.split('-')) != 3:
            return jsonify({'error': 'Format code Meet invalide (doit être abc-def-ghi)'}), 400
        
        meet_link = f"https://meet.google.com/{meet_code}"
        interview_id = f"instant-{meet_code}-{int(time.time())}"
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({'error': 'Service avatar non disponible'}), 503
        
        interview_data = {
            'meet_link': meet_link,
            'candidate_name': f'Test Instant {meet_code}',
            'position': 'Test Position',
            'mode': 'autonomous'
        }
        
        # Lancement immédiat
        result = avatar_service.force_avatar_launch(interview_id, interview_data)
        
        return jsonify({
            'success': True,
            'interview_id': interview_id,
            'meet_link': meet_link,
            'meet_code': meet_code,
            'launch_result': result,
            'diagnostic_url': f'/api/scheduling/avatar/diagnose/{interview_id}',
            'screenshot_url': f'/api/scheduling/avatar/screenshot/{interview_id}',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500