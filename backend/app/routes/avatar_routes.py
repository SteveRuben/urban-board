# backend/app/routes/avatar_routes.py - VERSION SIMPLIFIÉE
from flask import Blueprint, request, jsonify, render_template
from app.services.avatar_service import get_avatar_service
import logging

avatar_bp = Blueprint('avatar', __name__)
logger = logging.getLogger(__name__)

@avatar_bp.route('/dashboard', methods=['GET'])
def avatar_dashboard():
    """Dashboard de monitoring des avatars"""
    return render_template('dashboard-avatar.html')

@avatar_bp.route('/status', methods=['GET'])
def get_service_status():
    """Statut global du service avatar - SANS authentification pour monitoring"""
    try:
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 503
        
        service_info = avatar_service.get_service_info()
        
        return jsonify({
            'success': True,
            'status': 'running' if service_info['service_running'] else 'stopped',
            'mode': service_info['mode'],
            'active_avatars': service_info['active_count'],
            'scheduled_avatars': service_info['scheduled_count'],
            'browser_sessions': service_info['browser_sessions']
        })
        
    except Exception as e:
        logger.error(f"Erreur statut service: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@avatar_bp.route('/interview/<interview_id>/status', methods=['GET'])
def get_interview_avatar_status(interview_id):
    """Statut d'un avatar pour un entretien spécifique - SANS auth pour monitoring"""
    try:
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({
                'success': False,
                'error': 'Service avatar non disponible'
            }), 503
        
        status = avatar_service.get_avatar_status(interview_id)
        
        return jsonify({
            'success': True,
            'interview_id': interview_id,
            'avatar_status': status
        })
        
    except Exception as e:
        logger.error(f"Erreur statut avatar: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ROUTES DE DEBUG (à supprimer en production)
@avatar_bp.route('/debug/force-launch', methods=['POST'])
def debug_force_launch():
    """Force le lancement d'un avatar - UNIQUEMENT POUR DEBUG"""
    try:
        data = request.get_json()
        
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        result = avatar_service.force_avatar_launch(
            data['interview_id'],
            data['interview_data']
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@avatar_bp.route('/debug/stop/<interview_id>', methods=['POST'])
def debug_stop_avatar(interview_id):
    """Arrête un avatar - UNIQUEMENT POUR DEBUG"""
    try:
        avatar_service = get_avatar_service()
        if not avatar_service:
            return jsonify({'success': False, 'error': 'Service non disponible'}), 503
        
        result = avatar_service.stop_avatar(interview_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500