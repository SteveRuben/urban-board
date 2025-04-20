# backend/routes/interview_scheduling_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.interview_scheduling_service import InterviewSchedulingService
from services.organization_service import OrganizationService
from services.audit_service import AuditService
from datetime import datetime
from . import scheduling_bp
from app import db



scheduling_service = InterviewSchedulingService()
organization_service = OrganizationService()
audit_service = AuditService()

@scheduling_bp.route('/schedules', methods=['POST'])
@jwt_required()
def create_schedule():
    """Crée une nouvelle planification d'entretien"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Récupérer l'organisation de l'utilisateur
    organization = organization_service.get_user_organization(user_id)
    if not organization:
        return jsonify({
            'status': 'error',
            'message': 'Aucune organisation trouvée pour cet utilisateur'
        }), 404
    
    try:
        schedule = scheduling_service.create_schedule(
            organization_id=organization.id,
            recruiter_id=user_id,
            data=data
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Entretien planifié avec succès',
            'data': schedule.to_dict()
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

@scheduling_bp.route('/schedules/<schedule_id>', methods=['GET'])
@jwt_required()
def get_schedule(schedule_id):
    """Récupère les détails d'une planification"""
    user_id = get_jwt_identity()
    
    schedule = scheduling_service.get_schedule(schedule_id)
    if not schedule:
        return jsonify({
            'status': 'error',
            'message': 'Planification introuvable'
        }), 404
    
    # Vérifier que l'utilisateur a le droit d'accéder à cette planification
    if schedule.recruiter_id != user_id:
        # Vérifier si l'utilisateur est membre de l'organisation
        from models.organization import OrganizationMember
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
        'data': schedule.to_dict()
    }), 200

@scheduling_bp.route('/schedules/<schedule_id>', methods=['PUT'])
@jwt_required()
def update_schedule(schedule_id):
    """Met à jour une planification d'entretien"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        schedule = scheduling_service.update_schedule(
            schedule_id=schedule_id,
            recruiter_id=user_id,
            data=data
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Planification mise à jour avec succès',
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

@scheduling_bp.route('/schedules/<schedule_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_schedule(schedule_id):
    """Annule une planification d'entretien"""
    user_id = get_jwt_identity()
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
@jwt_required()
def get_my_schedules():
    """Récupère les planifications de l'utilisateur connecté"""
    user_id = get_jwt_identity()
    
    # Récupérer les paramètres de filtrage
    status = request.args.get('status')
    
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
        status=status,
        from_date=from_date,
        to_date=to_date
    )
    
    return jsonify({
        'status': 'success',
        'data': [schedule.to_dict() for schedule in schedules]
    }), 200

@scheduling_bp.route('/organizations/current/schedules', methods=['GET'])
@jwt_required()
def get_organization_schedules():
    """Récupère les planifications de l'organisation"""
    user_id = get_jwt_identity()
    
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
        status=status,
        from_date=from_date,
        to_date=to_date
    )
    
    return jsonify({
        'status': 'success',
        'data': [schedule.to_dict() for schedule in schedules]
    }), 200

@scheduling_bp.route('/schedules/access/<access_token>', methods=['GET'])
def get_schedule_by_token(access_token):
    """Récupère les détails d'une planification par son token d'accès (pour le candidat)"""
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
            'recruiter_name': schedule.recruiter.name if schedule.recruiter else None,
            'organization_name': schedule.organization.name if schedule.organization else None,
            'access_token': schedule.access_token,
            'mode': schedule.mode
        }
    }), 200

@scheduling_bp.route('/schedules/<schedule_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_schedule(schedule_id):
    """Confirme une planification d'entretien"""
    user_id = get_jwt_identity()
    
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
@jwt_required()
def mark_no_show(schedule_id):
    """Marque un candidat comme absent à l'entretien"""
    user_id = get_jwt_identity()
    
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
@jwt_required()
def start_interview(schedule_id):
    """Démarre un entretien planifié"""
    user_id = get_jwt_identity()
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
            description=f"Début de l'entretien avec {schedule.candidate_name}"
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
@jwt_required()
def complete_interview(schedule_id):
    """Marque un entretien comme terminé"""
    user_id = get_jwt_identity()
    
    try:
        schedule = scheduling_service.mark_as_completed(schedule_id)
        
        # Enregistrer dans les logs
        audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=user_id,
            action='complete',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Fin de l'entretien avec {schedule.candidate_name}"
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