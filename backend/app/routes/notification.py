# backend/app/routes/notification_routes.py
import uuid
from flask import Blueprint, request, jsonify, current_app, g
from ..models.notification import Notification
from ..models.notification_setting import NotificationSetting, NotificationPreference
from ..services.notification_service import NotificationService
from ..middleware.auth_middleware import token_required
from ..middleware.auth_middleware import get_current_user

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

# Correction pour l'initialisation du service de notification
# Récupérer la db depuis Flask-SQLAlchemy de manière correcte
try:
    from flask import current_app
    from flask_sqlalchemy import SQLAlchemy
    
    # Vérifier si l'application est initialisée
    if current_app:
        # Si nous sommes dans le contexte d'une application
        db = current_app.extensions.get('sqlalchemy')
    else:
        # Sinon, définir db à None pour le mode fichier
        db = None
except:
    # En cas d'erreur, utiliser le mode fichier
    db = None


# Initialisation du service de notification
# Initialisation du service de notification
notification_service = NotificationService(
    db=db,
    logger=current_app.logger if current_app else None
)



@notification_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    """
    Récupère les notifications pour l'utilisateur connecté.
    
    Query params:
        limit (int, optional): Nombre maximum de notifications à retourner
        unread_only (bool, optional): Si True, retourne uniquement les notifications non lues
        type (str, optional): Filtre par type de notification
    
    Returns:
        JSON: Liste des notifications pour l'utilisateur
    """
    try:
        limit = request.args.get('limit')
        if limit:
            try:
                limit = int(limit)
            except ValueError:
                return jsonify({"error": "Le paramètre limit doit être un entier"}), 400
                
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        type_filter = request.args.get('type')
        
        notifications = notification_service.get_user_notifications(
            user_id=g.current_user.user_id,
            limit=limit or 50,
            filter_type=type_filter,
            filter_read=False if unread_only else None
        )
        
        return jsonify(notifications), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching notifications: {str(e)}")
        return jsonify({"error": "Failed to fetch notifications"}), 500

@notification_bp.route('/api/notifications/<notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(notification_id):
    """
    Marque une notification comme lue.
    
    Path params:
        notification_id (str): Identifiant de la notification
        
    Returns:
        JSON: Message de succès ou d'erreur
    """
    try:
        success = notification_service.mark_notification_read(notification_id, g.user_id)
        
        if success:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"error": "Notification not found"}), 404
    except Exception as e:
        current_app.logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({"error": "Failed to mark notification as read"}), 500

@notification_bp.route('/api/notifications/mark-multiple', methods=['PUT'])
@token_required
def mark_multiple_as_read():
    """
    Marque plusieurs notifications comme lues.
    
    Body:
        ids (list): Liste des identifiants des notifications à marquer comme lues
        
    Returns:
        JSON: Message de succès ou d'erreur
    """
    try:
        notification_ids = request.json.get('ids', [])
        if not notification_ids:
            return jsonify({"error": "No notification IDs provided"}), 400
            
        success_count = 0
        for notification_id in notification_ids:
            if notification_service.mark_notification_read(notification_id, g.user_id):
                success_count += 1
            
        return jsonify({"success": True, "updated_count": success_count}), 200
    except Exception as e:
        current_app.logger.error(f"Error marking multiple notifications as read: {str(e)}")
        return jsonify({"error": "Failed to mark notifications as read"}), 500

@notification_bp.route('/api/notifications/mark-all-read', methods=['PUT'])
@token_required
def mark_all_as_read():
    """
    Marque toutes les notifications de l'utilisateur comme lues.
    
    Returns:
        JSON: Nombre de notifications mises à jour
    """
    try:
        count = notification_service.mark_all_as_read(g.user_id)
        
        return jsonify({"success": True, "updated_count": count}), 200
    except Exception as e:
        current_app.logger.error(f"Error marking all notifications as read: {str(e)}")
        return jsonify({"error": "Failed to mark notifications as read"}), 500

@notification_bp.route('/api/notifications/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    """
    Supprime une notification.
    
    Path params:
        notification_id (str): Identifiant de la notification
        
    Returns:
        JSON: Message de succès ou d'erreur
    """
    try:
        # Vérifier que la notification appartient à l'utilisateur
        notification = notification_service.get_notification_by_id(notification_id)
        
        if not notification:
            return jsonify({"error": "Notification not found"}), 404
            
        if notification.user_id != g.user_id and not g.user.is_admin:
            return jsonify({"error": "Access denied"}), 403
        
        success = notification_service.delete_notification(notification_id)
        
        if success:
            return jsonify({"success": True}), 200
        else:
            return jsonify({"error": "Failed to delete notification"}), 500
    except Exception as e:
        current_app.logger.error(f"Error deleting notification: {str(e)}")
        return jsonify({"error": "Failed to delete notification"}), 500

@notification_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count():
    """
    Récupère le nombre de notifications non lues pour l'utilisateur connecté.
    
    Returns:
        JSON: Nombre de notifications non lues
    """
    try:
        user = get_current_user() 
        count = notification_service.get_unread_count(user.id)
        return jsonify({"unread_count": count}), 200
    except Exception as e:
        current_app.logger.error(f"Error getting unread count: {str(e)}")
        return jsonify({"error": "Failed to get unread count"}), 500

@notification_bp.route('/api/notifications/test', methods=['POST'])
@token_required
def create_test_notification():
    """
    Crée une notification de test.
    Utile pour le développement et les tests du système de notifications.
    
    Body:
        type (str, optional): Type de notification (défaut: 'test')
        
    Returns:
        JSON: La notification créée
    """
    if current_app.config.get('ENV') != 'development':
        return jsonify({"error": "Cette route n'est disponible qu'en environnement de développement"}), 403
    
    try:
        data = request.json or {}
        notification_type = data.get('type', 'test')
        
        # Créer une notification de test selon le type demandé
        if notification_type == 'interview_completed':
            notification = notification_service.create_interview_completed_notification(
                user_id=g.user_id,
                interview_data={
                    'id': 'test-int-123',
                    'candidate_name': 'Candidat Test',
                    'job_role': 'Développeur Test',
                    'score': 8.5
                }
            )
        elif notification_type == 'interview_scheduled':
            notification = notification_service.create_interview_scheduled_notification(
                user_id=g.user_id,
                interview_data={
                    'id': 'test-int-123',
                    'candidate_name': 'Candidat Test',
                    'job_role': 'Développeur Test',
                    'date': '2025-04-01T14:30:00Z'
                }
            )
        elif notification_type == 'candidate_application':
            notification = notification_service.create_candidate_application_notification(
                user_id=g.user_id,
                candidate_data={
                    'id': 'test-cand-123',
                    'name': 'Candidat Test',
                    'job_role': 'Développeur Test'
                }
            )
        elif notification_type == 'biometric_analysis':
            notification = notification_service.create_biometric_analysis_notification(
                user_id=g.user_id,
                analysis_data={
                    'interview_id': 'test-int-123',
                    'candidate_name': 'Candidat Test'
                }
            )
        elif notification_type == 'collaboration':
            notification = notification_service.create_collaboration_notification(
                user_id=g.user_id,
                collaboration_data={
                    'interview_id': 'test-int-123',
                    'action_type': 'comment',
                    'author_name': 'Collègue Test',
                    'candidate_name': 'Candidat Test'
                }
            )
        elif notification_type == 'subscription_renewal':
            notification = notification_service.create_subscription_notification(
                user_id=g.user_id,
                subscription_data={
                    'action_type': 'renewal_reminder',
                    'plan_name': 'Plan Test Pro',
                    'days_left': 7
                }
            )
        elif notification_type == 'system':
            notification = notification_service.create_system_notification(
                user_id=g.user_id,
                system_data={
                    'action_type': 'maintenance',
                    'message': 'Une maintenance test est prévue pour le système.'
                }
            )
        else:
            # Notification générique de test
            notification = notification_service.create_notification(
                user_id=g.user_id,
                title="Notification de test",
                message="Ceci est une notification de test pour le développement.",
                type="test",
                reference_id="test-123"
            )
        
        if notification:
            return jsonify(notification.to_dict()), 201
        else:
            return jsonify({"error": "Failed to create test notification"}), 500
    except Exception as e:
        current_app.logger.error(f"Error creating test notification: {str(e)}")
        return jsonify({"error": f"Failed to create test notification: {str(e)}"}), 500

@notification_bp.route('/api/notifications/settings', methods=['GET'])
@token_required
def get_notification_settings():
    """
    Récupère les paramètres de notification de l'utilisateur.
    
    Returns:
        JSON: Paramètres de notification
    """
    try:
        # Récupérer les paramètres pour chaque catégorie
        email_settings = NotificationSetting.query.filter_by(user_id=g.user_id, category='email').all()
        in_app_settings = NotificationSetting.query.filter_by(user_id=g.user_id, category='inApp').all()
        mobile_settings = NotificationSetting.query.filter_by(user_id=g.user_id, category='mobile').all()
        
        # Récupérer les préférences générales
        preferences = NotificationPreference.query.filter_by(user_id=g.user_id).first()
        
        if not preferences:
            # Créer des préférences par défaut si elles n'existent pas
            preferences = NotificationPreference(
                id=str(uuid.uuid4()),
                user_id=g.user_id
            )
            current_app.extensions['sqlalchemy'].db.session.add(preferences)
            current_app.extensions['sqlalchemy'].db.session.commit()
        
        # Formatter la réponse
        notification_types = [
            'interview_completed', 'interview_scheduled', 'candidate_application',
            'job_position', 'biometric_analysis', 'collaboration',
            'subscription_renewal', 'system'
        ]
        
        response = {
            'email': {},
            'inApp': {},
            'mobile': {},
            'preferences': {
                'emailDigest': preferences.email_digest,
                'emailTime': preferences.email_time,
                'desktopNotifications': preferences.desktop_notifications,
                'soundAlerts': preferences.sound_alerts
            }
        }
        
        # Remplir les paramètres par type de notification
        for notification_type in notification_types:
            # Par défaut, toutes les notifications sont activées
            response['email'][notification_type] = True
            response['inApp'][notification_type] = True
            response['mobile'][notification_type] = True
        
        # Mettre à jour avec les paramètres réels
        for setting in email_settings:
            response['email'][setting.notification_type] = setting.enabled
        
        for setting in in_app_settings:
            response['inApp'][setting.notification_type] = setting.enabled
        
        for setting in mobile_settings:
            response['mobile'][setting.notification_type] = setting.enabled
        
        return jsonify(response), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching notification settings: {str(e)}")
        return jsonify({"error": "Failed to fetch notification settings"}), 500

@notification_bp.route('/api/notifications/settings', methods=['PUT'])
@token_required
def update_notification_settings():
    """
    Met à jour les paramètres de notification de l'utilisateur.
    
    Body:
        email (dict): Paramètres email par type de notification
        inApp (dict): Paramètres application par type de notification
        mobile (dict): Paramètres mobile par type de notification
        preferences (dict): Préférences générales
    
    Returns:
        JSON: Message de succès ou d'erreur
    """
    try:
        settings_data = request.json
        db = current_app.extensions['sqlalchemy'].db
        
        # Mettre à jour les préférences
        preferences = NotificationPreference.query.filter_by(user_id=g.user_id).first()
        
        if not preferences:
            preferences = NotificationPreference(
                id=str(uuid.uuid4()),
                user_id=g.user_id
            )
            db.session.add(preferences)
        
        preferences_data = settings_data.get('preferences', {})
        preferences.email_digest = preferences_data.get('emailDigest', 'daily')
        preferences.email_time = preferences_data.get('emailTime', '09:00')
        preferences.desktop_notifications = preferences_data.get('desktopNotifications', True)
        preferences.sound_alerts = preferences_data.get('soundAlerts', False)
        
        # Mettre à jour les paramètres par catégorie et type
        categories = ['email', 'inApp', 'mobile']
        notification_types = [
            'interview_completed', 'interview_scheduled', 'candidate_application',
            'job_position', 'biometric_analysis', 'collaboration',
            'subscription_renewal', 'system'
        ]
        
        for category in categories:
            category_settings = settings_data.get(category, {})
            
            for notification_type in notification_types:
                # Vérifier si le paramètre existe déjà
                setting = NotificationSetting.query.filter_by(
                    user_id=g.user_id,
                    category=category,
                    notification_type=notification_type
                ).first()
                
                enabled = category_settings.get(notification_type, True)
                
                if setting:
                    # Mettre à jour le paramètre existant
                    setting.enabled = enabled
                else:
                    # Créer un nouveau paramètre
                    new_setting = NotificationSetting(
                        id=str(uuid.uuid4()),
                        user_id=g.user_id,
                        category=category,
                        notification_type=notification_type,
                        enabled=enabled
                    )
                    db.session.add(new_setting)
        
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        current_app.logger.error(f"Error updating notification settings: {str(e)}")
        if 'sqlalchemy' in current_app.extensions:
            current_app.extensions['sqlalchemy'].db.session.rollback()
        return jsonify({"error": "Failed to update notification settings"}), 500