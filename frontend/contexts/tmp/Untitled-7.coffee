# backend/app/routes/notification.py
from flask import request, jsonify, current_app, g
from . import notification_bp
from ..services.notification_service import NotificationService
from ..middleware.auth_middleware import token_required
from ..models.notification_setting import NotificationSetting, NotificationPreference
from ..services.notification_service import get_user_notifications, mark_notification_read

# Initialisation du service de notification
notification_service = NotificationService()

@notification_bp.route('/', methods=['GET'])
@token_required
def get_notifications():
    """
    Récupère les notifications pour un utilisateur.
    
    Query params:
        user_id (str): Identifiant de l'utilisateur
        limit (int, optional): Nombre maximum de notifications à retourner
        unread_only (bool, optional): Si True, retourne uniquement les notifications non lues
    
    Returns:
        JSON: Liste des notifications pour l'utilisateur
    """
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Le paramètre user_id est requis"}), 400
    
     # Si user_id est fourni, vérifier qu'il correspond à l'utilisateur connecté ou qu'il est admin
    if user_id and user_id != str(g.user.id) and not g.user.is_admin:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    limit = request.args.get('limit')
    if limit:
        try:
            limit = int(limit)
        except ValueError:
            return jsonify({"error": "Le paramètre limit doit être un entier"}), 400
    
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    notifications = notification_service.get_notifications(
        user_id=user_id,
        limit=limit,
        unread_only=unread_only
    )
    
    return jsonify([notification.to_dict() for notification in notifications])

@notification_bp.route('/unread-count', methods=['GET'])
@token_required
def get_unread_count():
    """
    Récupère le nombre de notifications non lues pour un utilisateur.
    
    Query params:
        user_id (str): Identifiant de l'utilisateur
        
    Returns:
        JSON: Nombre de notifications non lues
    """
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Le paramètre user_id est requis"}), 400
    
    if user_id and user_id != str(g.user.id) and not g.user.is_admin:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    count = notification_service.get_unread_count(user_id)
    
    return jsonify({"unread_count": count})

@notification_bp.route('/<notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(notification_id):
    """
    Marque une notification comme lue.
    
    Path params:
        notification_id (str): Identifiant de la notification
        
    Returns:
        JSON: Message de succès ou d'erreur
    """
    notification = notification_service.get_notification_by_id(notification_id)
    if not notification:
        return jsonify({"error": "Notification non trouvée"}), 404
    
    if notification.user_id != str(g.user.id) and not g.user.is_admin:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    success = notification_service.mark_as_read(notification_id)
    
    if success:
        return jsonify({"message": "Notification marquée comme lue"})
    else:
        return jsonify({"error": "Notification non trouvée"}), 404

@notification_bp.route('/mark-all-read', methods=['PUT'])
@token_required
def mark_all_as_read():
    """
    Marque toutes les notifications d'un utilisateur comme lues.
    
    Query params:
        user_id (str): Identifiant de l'utilisateur
        
    Returns:
        JSON: Nombre de notifications mises à jour
    """
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Le paramètre user_id est requis"}), 400
    
    # Si user_id est fourni, vérifier qu'il correspond à l'utilisateur connecté ou qu'il est admin
    if user_id and user_id != str(g.user.id) and not g.user.is_admin:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    count = notification_service.mark_all_as_read(user_id)
    
    return jsonify({"updated_count": count})

@notification_bp.route('/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    """
    Supprime une notification.
    
    Path params:
        notification_id (str): Identifiant de la notification
        
    Returns:
        JSON: Message de succès ou d'erreur
    """
    notification = notification_service.get_notification_by_id(notification_id)
    if not notification:
        return jsonify({"error": "Notification non trouvée"}), 404
    
    if notification.user_id != str(g.user.id) and not g.user.is_admin:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    success = notification_service.delete_notification(notification_id)
    
    if success:
        return jsonify({"message": "Notification supprimée"})
    else:
        return jsonify({"error": "Notification non trouvée"}), 404

@notification_bp.route('/test', methods=['POST'])
@token_required
def create_test_notification():
    """
    Crée une notification de test (utile pour le développement)
    
    Body params:
        user_id (str): Identifiant de l'utilisateur destinataire
        
    Returns:
        JSON: La notification créée
    """
    if current_app.config['ENV'] != 'development':
        return jsonify({"error": "Cette route n'est disponible qu'en environnement de développement"}), 403
    
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"error": "Le paramètre user_id est requis"}), 400
    
     # Si user_id est fourni, vérifier qu'il correspond à l'utilisateur connecté ou qu'il est admin
    if user_id and user_id != str(g.user.id) and not g.user.is_admin:
        return jsonify({"error": "Accès non autorisé"}), 403
    
    notification = notification_service.create_notification(
        user_id=user_id,
        title="Notification de test",
        message="Ceci est une notification de test pour le développement.",
        type="test",
        reference_id="test-123"
    )
    
    return jsonify(notification.to_dict()), 201

@notification_bp.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications():
    try:
        notifications = get_user_notifications(g.user_id)
        return jsonify(notifications), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching notifications: {str(e)}")
        return jsonify({"error": "Failed to fetch notifications"}), 500

@notification_bp.route('/api/notifications/<notification_id>/read', methods=['PUT'])
@token_required
def mark_as_read(notification_id):
    try:
        mark_notification_read(notification_id, g.user_id)
        return jsonify({"success": True}), 200
    except Exception as e:
        current_app.logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify({"error": "Failed to mark notification as read"}), 500

@notification_bp.route('/api/notifications/mark-multiple', methods=['PUT'])
@token_required
def mark_multiple_as_read():
    try:
        notification_ids = request.json.get('ids', [])
        if not notification_ids:
            return jsonify({"error": "No notification IDs provided"}), 400
            
        for notification_id in notification_ids:
            mark_notification_read(notification_id, g.user_id)
            
        return jsonify({"success": True}), 200
    except Exception as e:
        current_app.logger.error(f"Error marking multiple notifications as read: {str(e)}")
        return jsonify({"error": "Failed to mark notifications as read"}), 500

@notification_bp.route('/api/notifications/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    try:
        notification = Notification.query.filter_by(id=notification_id, user_id=g.user_id).first()
        
        if not notification:
            return jsonify({"error": "Notification not found"}), 404
            
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({"success": True}), 200
    except Exception as e:
        current_app.logger.error(f"Error deleting notification: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete notification"}), 500

@notification_bp.route('/api/notifications/settings', methods=['GET'])
@token_required
def get_notification_settings():
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
            db.session.add(preferences)
            db.session.commit()
        
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
    try:
        settings_data = request.json
        
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
        db.session.rollback()
        return jsonify({"error": "Failed to update notification settings"}), 500
