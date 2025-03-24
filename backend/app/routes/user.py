# backend/app/routes/user_routes.py
from flask import Blueprint, request, jsonify, g, current_app
from ..services.user_service import UserService
from ..middleware.auth_middleware import token_required
from ..middleware.rate_limit import standard_limit
from ..models.user import User
from .. import db
import datetime
import os
from werkzeug.utils import secure_filename
import uuid
from . import user_bp

@user_bp.route('/register', methods=['POST'])
def register():
    """Enregistre un nouvel utilisateur"""
    data = request.json
    # Logique pour enregistrer l'utilisateur
    return jsonify({"message": "Utilisateur enregistré"}), 201

@user_bp.route('/login', methods=['POST'])
def login():
    """Connecte un utilisateur"""
    data = request.json
    # Logique pour connecter l'utilisateur
    return jsonify({"token": "sample_jwt_token"})

@user_bp.route('/profile', methods=['GET'])
@token_required
@standard_limit
def get_profile():
    """
    Récupère le profil complet de l'utilisateur
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    responses:
      200:
        description: Profil utilisateur
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    # L'utilisateur est déjà chargé grâce au décorateur token_required
    user_id = g.current_user.user_id
    
    # Récupérer le profil complet incluant les préférences, historique, etc.
    profile_data = UserService.get_full_profile(user_id)
    
    if not profile_data:
        return jsonify({'message': 'Profil utilisateur non trouvé'}), 404
    
    return jsonify(profile_data), 200

@user_bp.route('/profile', methods=['PUT'])
@token_required
@standard_limit
def update_profile():
    """
    Met à jour le profil de l'utilisateur
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              first_name:
                type: string
              last_name:
                type: string
              email:
                type: string
                format: email
              job_title:
                type: string
              company:
                type: string
              phone:
                type: string
    responses:
      200:
        description: Profil mis à jour avec succès
      400:
        description: Données invalides
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'Aucune donnée fournie'}), 400
    
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Mise à jour du profil
    updated_profile, error = UserService.update_profile(user_id, data)
    
    if error:
        return jsonify({'message': error}), 400
    
    return jsonify(updated_profile), 200

@user_bp.route('/profile/avatar', methods=['POST'])
@token_required
@standard_limit
def update_avatar():
    """
    Met à jour l'avatar de l'utilisateur
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              avatar:
                type: string
                format: binary
    responses:
      200:
        description: Avatar mis à jour avec succès
      400:
        description: Fichier invalide
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    if 'avatar' not in request.files:
        return jsonify({'message': 'Aucun fichier fourni'}), 400
        
    file = request.files['avatar']
    
    if file.filename == '':
        return jsonify({'message': 'Aucun fichier sélectionné'}), 400
    
    # Vérifier l'extension du fichier
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not '.' in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({'message': 'Format de fichier non autorisé'}), 400
    
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Traiter et sauvegarder l'avatar
    avatar_url, error = UserService.update_avatar(user_id, file)
    
    if error:
        return jsonify({'message': error}), 400
    
    return jsonify({'avatar_url': avatar_url}), 200

@user_bp.route('/profile/password', methods=['PUT'])
@token_required
@standard_limit
def update_password():
    """
    Met à jour le mot de passe de l'utilisateur
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              current_password:
                type: string
                format: password
              new_password:
                type: string
                format: password
            required:
              - current_password
              - new_password
    responses:
      200:
        description: Mot de passe mis à jour avec succès
      400:
        description: Données invalides
      401:
        description: Mot de passe actuel incorrect
      404:
        description: Utilisateur non trouvé
    """
    data = request.get_json()
    
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'message': 'Mot de passe actuel et nouveau mot de passe requis'}), 400
    
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Changer le mot de passe
    success, message, last_password_change = UserService.update_password(
        user_id,
        data['current_password'],
        data['new_password']
    )
    
    if not success:
        return jsonify({'message': message}), 401
    
    return jsonify({
        'message': message,
        'last_password_change': last_password_change
    }), 200

@user_bp.route('/profile/2fa/init', methods=['POST'])
@token_required
@standard_limit
def init_two_factor():
    """
    Initialise la configuration de l'authentification à deux facteurs
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              method:
                type: string
                enum: [app, sms, email]
    responses:
      200:
        description: Configuration 2FA initialisée
      400:
        description: Données invalides
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    data = request.get_json() or {}
    method = data.get('method', 'app')  # Par défaut, on utilise une application
    
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Initialiser la 2FA
    setup_data, error = UserService.init_two_factor(user_id, method)
    
    if error:
        return jsonify({'message': error}), 400
    
    return jsonify(setup_data), 200

@user_bp.route('/profile/2fa/verify', methods=['POST'])
@token_required
@standard_limit
def verify_two_factor():
    """
    Vérifie le code de l'authentification à deux facteurs et active la 2FA
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              method:
                type: string
                enum: [app, sms, email]
              code:
                type: string
            required:
              - method
              - code
    responses:
      200:
        description: Authentification à deux facteurs activée
      400:
        description: Données invalides
      401:
        description: Code incorrect
      404:
        description: Utilisateur non trouvé
    """
    data = request.get_json()
    
    if not data or 'method' not in data or 'code' not in data:
        return jsonify({'message': 'Méthode et code requis'}), 400
    
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Vérifier le code et activer la 2FA
    success, message = UserService.verify_two_factor(
        user_id,
        data['method'],
        data['code']
    )
    
    if not success:
        return jsonify({'message': message}), 401
    
    return jsonify({'success': True, 'message': message}), 200

@user_bp.route('/profile/2fa', methods=['DELETE'])
@token_required
@standard_limit
def disable_two_factor():
    """
    Désactive l'authentification à deux facteurs
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    responses:
      200:
        description: Authentification à deux facteurs désactivée
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Désactiver la 2FA
    success, message = UserService.disable_two_factor(user_id)
    
    if not success:
        return jsonify({'message': message}), 400
    
    return jsonify({'success': True, 'message': message}), 200

@user_bp.route('/profile/login-history', methods=['GET'])
@token_required
@standard_limit
def get_login_history():
    """
    Récupère l'historique des connexions de l'utilisateur
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    responses:
      200:
        description: Historique des connexions
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Récupérer l'historique des connexions
    history, error = UserService.get_login_history(user_id)
    
    if error:
        return jsonify({'message': error}), 404
    
    return jsonify(history), 200

@user_bp.route('/profile/notifications', methods=['GET'])
@token_required
@standard_limit
def get_notification_preferences():
    """
    Récupère les préférences de notification de l'utilisateur
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    responses:
      200:
        description: Préférences de notification
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Récupérer les préférences de notification
    preferences, error = UserService.get_notification_preferences(user_id)
    
    if error:
        return jsonify({'message': error}), 404
    
    return jsonify(preferences), 200

@user_bp.route('/profile/notifications', methods=['PUT'])
@token_required
@standard_limit
def update_notification_preferences():
    """
    Met à jour les préférences de notification de l'utilisateur
    ---
    tags:
      - Profil Utilisateur
    security:
      - bearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: object
              push:
                type: object
              desktop:
                type: object
    responses:
      200:
        description: Préférences de notification mises à jour
      400:
        description: Données invalides
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'Aucune donnée fournie'}), 400
    
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    # Mettre à jour les préférences de notification
    updated_preferences, error = UserService.update_notification_preferences(user_id, data)
    
    if error:
        return jsonify({'message': error}), 400
    
    return jsonify(updated_preferences), 200