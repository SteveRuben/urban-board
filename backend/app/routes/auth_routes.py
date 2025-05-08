# backend/app/routes/auth_routes.py
import datetime
import os
from flask import Blueprint, request, jsonify, g

from ..services.user_service import UserService
from ..services.auth_service import AuthService
from ..middleware.auth_middleware import token_required
from ..middleware.rate_limit import auth_limit, standard_limit
from .. import db  # Importation de l'instance db
from ..models.user import User  # Import du modèle User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
@auth_limit
def register():
    """
    Inscription d'un nouvel utilisateur
    ---
    tags:
      - Authentification
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                format: password
              first_name:
                type: string
              last_name:
                type: string
            required:
              - email
              - password
              - first_name
              - last_name
    responses:
      201:
        description: Utilisateur créé avec succès
      400:
        description: Données invalides
      409:
        description: Utilisateur déjà existant
    """
    data = request.get_json()

    # Vérifier si toutes les données requises sont présentes,123Abc@@@
    required_fields = ['email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Le champ {field} est requis'}), 400
    
    # Créer l'utilisateur
    user, error = AuthService.create_user(
        email=data['email'],
        password=data['password'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        role=data.get('role', 'user')
    )
    
    if error:
        return jsonify({'message': error}), 400
    
    # Authentifier immédiatement l'utilisateur
    success, tokens, user_data, message = AuthService.login(data['email'], data['password'])
    
    if not success:
        return jsonify({'message': 'Compte créé mais erreur lors de la connexion automatique'}), 201
    
    return jsonify({
        'message': 'Compte créé avec succès',
        'tokens': tokens,
        'user': user_data,
        'onboarding_required': True
    }), 201

@auth_bp.route('/login', methods=['POST'])
@auth_limit
def login():
    """
    Authentification d'un utilisateur
    ---
    tags:
      - Authentification
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                format: password
            required:
              - email
              - password
    responses:
      200:
        description: Authentification réussie
      401:
        description: Authentification échouée
    """
    data = request.get_json()
    
    # Vérifier les données requises
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'message': 'Email et mot de passe requis'}), 400
    
    success, tokens, user, message = AuthService.login(data['email'], data['password'])
    
    if not success:
        # Utiliser un délai pour prévenir le timing attack
        import time
        time.sleep(0.5)
        return jsonify({'message': message}), 401
      
    print(user['id'])
    onboarding_required = UserService.check_onboarding_required(user_id=user['id'])
    
    return jsonify({
        'message': 'Authentification réussie',
        'tokens': tokens,
        'onboarding_required': onboarding_required,
        'user': user
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@token_required
@standard_limit
def logout():
    """
    Déconnexion d'un utilisateur
    ---
    tags:
      - Authentification
    security:
      - bearerAuth: []
    responses:
      200:
        description: Déconnexion réussie
      401:
        description: Non authentifié
    """
    # Récupérer le token depuis l'en-tête Authorization
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1] if auth_header and auth_header.startswith('Bearer ') else None
    
    if not token:
        return jsonify({'message': 'Token non fourni'}), 400
    
    success = AuthService.logout(token)
    
    if not success:
        return jsonify({'message': 'Erreur lors de la déconnexion'}), 500
    
    return jsonify({'message': 'Déconnexion réussie'}), 200

@auth_bp.route('/refresh', methods=['POST'])
@auth_limit
def refresh():
    """
    Rafraîchissement du token d'accès
    ---
    tags:
      - Authentification
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              refresh_token:
                type: string
            required:
              - refresh_token
    responses:
      200:
        description: Token rafraîchi avec succès
      400:
        description: Token de rafraîchissement non fourni
      401:
        description: Token de rafraîchissement invalide ou expiré
    """
    data = request.get_json()
    
    if not data or 'refresh_token' not in data:
        return jsonify({'message': 'Token de rafraîchissement requis'}), 400
    
    success, tokens, message = AuthService.refresh_token(data['refresh_token'])
    
    if not success:
        return jsonify({'message': message}), 401
    
    return jsonify({
        'message': message,
        'tokens': tokens
    }), 200

@auth_bp.route('/password-reset-request', methods=['POST'])
@auth_limit
def password_reset_request():
    """
    Demande de réinitialisation de mot de passe
    ---
    tags:
      - Authentification
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
            required:
              - email
    responses:
      200:
        description: Si l'email existe, un lien de réinitialisation a été envoyé
    """
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({'message': 'Email requis'}), 400
    
    success, message, reset_token = AuthService.initiate_password_reset(data['email'])
    
    # Toujours retourner 200 pour ne pas divulguer si l'email existe
    response = {'message': message}
    
    # En développement, on peut inclure le token pour faciliter les tests
    if reset_token and 'FLASK_ENV' in os.environ and os.environ['FLASK_ENV'] == 'development':
        response['reset_token'] = reset_token
    
    return jsonify(response), 200

@auth_bp.route('/reset-password', methods=['POST'])
@auth_limit
def reset_password():
    """
    Réinitialisation du mot de passe
    ---
    tags:
      - Authentification
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              token:
                type: string
              new_password:
                type: string
                format: password
            required:
              - token
              - new_password
    responses:
      200:
        description: Mot de passe réinitialisé avec succès
      400:
        description: Données invalides
      401:
        description: Token invalide ou expiré
    """
    data = request.get_json()
    
    if not data or 'token' not in data or 'new_password' not in data:
        return jsonify({'message': 'Token et nouveau mot de passe requis'}), 400
    
    success, message = AuthService.reset_password(data['token'], data['new_password'])
    
    if not success:
        return jsonify({'message': message}), 401
    
    return jsonify({'message': message}), 200

@auth_bp.route('/change-password', methods=['POST'])
@token_required
@standard_limit
def change_password():
    """
    Changement de mot de passe
    ---
    tags:
      - Authentification
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
        description: Mot de passe changé avec succès
      400:
        description: Données invalides
      401:
        description: Mot de passe actuel incorrect
    """
    data = request.get_json()
    
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({'message': 'Mot de passe actuel et nouveau mot de passe requis'}), 400
    
    # Récupérer l'ID de l'utilisateur à partir du token
    user_id = g.current_user.user_id
    
    success, message = AuthService.change_password(
        user_id, 
        data['current_password'], 
        data['new_password']
    )
    
    if not success:
        return jsonify({'message': message}), 401
    
    return jsonify({'message': message}), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
@standard_limit
def get_current_user():
    """
    Récupère les informations de l'utilisateur courant
    ---
    tags:
      - Authentification
    security:
      - bearerAuth: []
    responses:
      200:
        description: Informations de l'utilisateur
      401:
        description: Non authentifié
      404:
        description: Utilisateur non trouvé
    """
    # L'utilisateur est déjà chargé grâce au décorateur token_required
    user = g.current_user
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Convertir l'objet utilisateur en dictionnaire
    user_data = user.to_dict()
    # Récupérer le statut des organisations
    org_status = UserService.get_user_organization_status(user.id)
    
    # S'assurer que le mot de passe n'est pas inclus dans la réponse
    if 'password' in user_data:
        del user_data['password']
    
    return jsonify({'user': user_data, 'organization_status': org_status}), 200

# Nouvelle route pour mettre à jour le profil utilisateur
@auth_bp.route('/profile', methods=['PUT'])
@token_required
@standard_limit
def update_profile():
    """
    Met à jour le profil de l'utilisateur
    ---
    tags:
      - Authentification
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
              job_title:
                type: string
              department:
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
    
    # Récupérer l'utilisateur depuis la base de données
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    # Mettre à jour les champs autorisés
    updateable_fields = ['first_name', 'last_name', 'job_title', 'department']
    updated = False
    
    for field in updateable_fields:
        if field in data and getattr(user, field) != data[field]:
            setattr(user, field, data[field])
            updated = True
    
    if updated:
        try:
            user.updated_at = datetime.datetime.now()
            db.session.commit()
            
            # Convertir l'objet utilisateur en dictionnaire
            user_data = user.to_dict()
            
            # S'assurer que le mot de passe n'est pas inclus dans la réponse
            if 'password' in user_data:
                del user_data['password']
            
            return jsonify({
                'message': 'Profil mis à jour avec succès',
                'user': user_data
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Erreur lors de la mise à jour du profil: {str(e)}'}), 500
    else:
        return jsonify({'message': 'Aucune modification détectée'}), 200