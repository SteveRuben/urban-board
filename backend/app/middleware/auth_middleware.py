# backend/app/middleware/auth_middleware.py
from functools import wraps
from flask import request, jsonify, g, current_app
import jwt
from datetime import datetime, timedelta
import uuid
import redis
from werkzeug.local import LocalProxy
from ..models.user import User
from ..models.login_history import LoginHistory
from .. import db

# Définir une fonction pour obtenir le client Redis
def get_redis_client():
    """
    Retourne une instance de client Redis basée sur la configuration de l'application
    """
    return redis.Redis(
        host=current_app.config.get('REDIS_HOST', 'localhost'),
        port=current_app.config.get('REDIS_PORT', 6379),
        db=current_app.config.get('REDIS_DB', 0),
        decode_responses=True
    )

# Utiliser une propriété pour accéder au client Redis à la demande
redis_client = LocalProxy(get_redis_client)

def get_token_from_request():
    """
    Extrait le token JWT de la requête HTTP
    
    Returns:
        str: Token JWT ou None si non trouvé
    """
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    
    return None

def verify_token(token):
    """
    Vérifie la validité d'un token JWT
    
    Args:
        token (str): Token JWT à vérifier
        
    Returns:
        dict: Payload décodé si valide, None sinon
    """
    try:
        payload = jwt.decode(
            token, 
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        
        # Vérifier si le token est dans la liste noire
        jti = payload.get('jti')
        if redis_client.exists(f"blacklist:{jti}"):
            return None
        
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la vérification du token: {str(e)}")
        return None

def get_current_user():
    """
    Récupère l'utilisateur courant depuis le contexte g de Flask
    Si l'utilisateur n'est pas dans g mais que le token est valide,
    récupère l'utilisateur depuis la DB et le stocke dans g.
    
    Returns:
        User: L'objet utilisateur ou None si non authentifié
    """
    # Si l'utilisateur est déjà chargé dans g, le retourner
    if hasattr(g, 'current_user') and g.current_user is not None:
        # Si c'est un dictionnaire (comportement précédent), convertir en objet User
        if isinstance(g.current_user, dict):
            user_id = g.current_user.user_id
            if user_id:
                try:
                    user = User.query.get(user_id)
                    if user:
                        g.current_user = user
                        return user
                except Exception as e:
                    current_app.logger.error(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
                    return None
            return None
        return g.current_user
    
    # Sinon, essayer de récupérer l'utilisateur à partir du token
    token = get_token_from_request()
    if not token:
        return None
    
    payload = verify_token(token)
    if not payload:
        return None
    
    user_id = payload.get('user_id')
    if not user_id:
        return None
    
    try:
        # Récupérer l'utilisateur depuis la base de données
        user = User.query.get(user_id)
        
        # Vérifier si l'utilisateur existe et est actif
        if not user or not user.is_active:
            return None
        
        # Stocker l'utilisateur dans le contexte de requête
        g.current_user = user
        return user
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
        return None

# Crée un proxy pour accéder à l'utilisateur courant
current_user = LocalProxy(get_current_user)

def record_login_attempt(user_id, status, error_message=None):
    """
    Enregistre une tentative de connexion dans l'historique
    
    Args:
        user_id (str): ID de l'utilisateur
        status (str): 'success' ou 'failed'
        error_message (str, optional): Message d'erreur en cas d'échec
    """
    try:
        # Récupérer l'adresse IP
        ip_address = request.remote_addr
        
        # Déterminer l'appareil (user agent)
        user_agent = request.headers.get('User-Agent', '')
        device = parse_user_agent(user_agent)
        
        # Déterminer la localisation (si possible)
        location = get_location_from_ip(ip_address)
        
        # Créer l'entrée d'historique
        login_entry = LoginHistory(
            user_id=user_id,
            ip_address=ip_address,
            device=device,
            location=location,
            status=status,
            timestamp=datetime.utcnow()
        )
        
        db.session.add(login_entry)
        db.session.commit()
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'enregistrement de la tentative de connexion: {str(e)}")
        db.session.rollback()

def parse_user_agent(user_agent_string):
    """
    Analyse l'user agent pour déterminer l'appareil
    
    Args:
        user_agent_string (str): Chaîne User-Agent
    
    Returns:
        str: Description de l'appareil
    """
    # Version simple pour la démonstration
    # Dans une implémentation réelle, utilisez une bibliothèque comme user-agents
    if 'Mobile' in user_agent_string:
        if 'iPhone' in user_agent_string:
            return 'iPhone'
        elif 'Android' in user_agent_string:
            return 'Android'
        else:
            return 'Mobile'
    elif 'Tablet' in user_agent_string:
        return 'Tablet'
    else:
        if 'Chrome' in user_agent_string:
            return 'Chrome/Desktop'
        elif 'Firefox' in user_agent_string:
            return 'Firefox/Desktop'
        elif 'Safari' in user_agent_string:
            return 'Safari/Desktop'
        elif 'Edge' in user_agent_string:
            return 'Edge/Desktop'
        else:
            return 'Desktop'

def get_location_from_ip(ip_address):
    """
    Détermine la localisation à partir de l'adresse IP
    
    Args:
        ip_address (str): Adresse IP
    
    Returns:
        str: Localisation (ville, pays)
    """
    try:
        # Pour les réseaux locaux, retourner une valeur connue
        if ip_address == '127.0.0.1' or ip_address.startswith('192.168.') or ip_address.startswith('10.'):
            return 'Réseau local'
        
        # Intégration avec un service de géolocalisation (optionnel)
        # Cette partie peut être étendue avec un service réel comme MaxMind GeoIP
        
        # Exemple de code pour MaxMind GeoIP (nécessite geoip2 et une base de données)
        geoip_db_path = current_app.config.get('GEOIP_DB_PATH')
        if geoip_db_path:
            try:
                import geoip2.database
                with geoip2.database.Reader(geoip_db_path) as reader:
                    response = reader.city(ip_address)
                    if response.city.name and response.country.name:
                        return f"{response.city.name}, {response.country.name}"
            except Exception:
                pass
        
        # Si on ne peut pas déterminer la localisation, retourner une valeur par défaut
        return 'Localisation inconnue'
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la détermination de la localisation: {str(e)}")
        return 'Localisation inconnue'

def create_token(user_id, role="user", expires_in=24):
    """
    Crée un token JWT pour l'authentification
    
    Args:
        user_id (str): ID de l'utilisateur
        role (str): Rôle de l'utilisateur (par défaut: "user")
        expires_in (int): Durée de validité en heures
        
    Returns:
        tuple: (token, refresh_token)
    """
    # Token d'authentification
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=expires_in),
        'iat': datetime.utcnow(),
        'jti': str(uuid.uuid4())
    }
    token = jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # Token de rafraîchissement
    refresh_payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30),
        'iat': datetime.utcnow(),
        'jti': str(uuid.uuid4()),
        'type': 'refresh'
    }
    refresh_token = jwt.encode(
        refresh_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # Stocker le jti dans Redis pour permettre la révocation
    redis_client.setex(
        f"token:{payload['jti']}",
        int(expires_in * 3600),
        user_id
    )
    
    redis_client.setex(
        f"refresh_token:{refresh_payload['jti']}",
        2592000,  # 30 jours en secondes
        user_id
    )
    
    # Enregistrer la connexion réussie
    try:
        record_login_attempt(user_id, 'success')
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'enregistrement de la connexion: {str(e)}")
    
    return token, refresh_token

def revoke_token(token):
    """
    Révoque un token en l'ajoutant à la liste noire dans Redis
    
    Args:
        token (str): Token JWT à révoquer
    
    Returns:
        bool: True si succès, False sinon
    """
    try:
        payload = jwt.decode(
            token, 
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        jti = payload.get('jti')
        
        # Ajouter à la liste noire avec une expiration égale au temps restant
        exp_timestamp = payload.get('exp')
        current_timestamp = datetime.utcnow().timestamp()
        ttl = max(int(exp_timestamp - current_timestamp), 0)
        
        if ttl > 0:
            redis_client.setex(f"blacklist:{jti}", ttl, "1")
            return True
        return False
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la révocation du token: {str(e)}")
        return False

def token_required(f):
    """
    Décorateur pour protéger les routes avec authentification JWT
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        
        if not token:
            return jsonify({'message': 'Token d\'authentification manquant'}), 401
        
        # Vérifier le token
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token invalide ou expiré'}), 401
        
        # Récupérer l'utilisateur complet depuis la base de données
        user_id = payload.get('user_id')
        try:
            user = User.query.get(user_id)
            if not user:
                return jsonify({'message': 'Utilisateur introuvable'}), 401
            
            if not user.is_active:
                return jsonify({'message': 'Compte utilisateur désactivé'}), 403
                
            # Stocker l'utilisateur dans le contexte Flask
            g.current_user = user
            
            # Ajouter l'ID utilisateur pour faciliter l'accès
            g.current_user.user_id = user.id
            
        except Exception as e:
            current_app.logger.error(f"Erreur lors de la récupération de l'utilisateur: {str(e)}")
            return jsonify({'message': 'Erreur lors de l\'authentification'}), 500
        
        return f(*args, **kwargs)
    return decorated

def role_required(roles):
    """
    Décorateur pour vérifier le rôle de l'utilisateur
    
    Args:
        roles (list): Liste des rôles autorisés
    """
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            
            if not user or user.role not in roles:
                return jsonify({
                    'message': 'Vous n\'avez pas les droits suffisants pour accéder à cette ressource'
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    
    # Si un seul rôle est passé en string, le convertir en liste
    if isinstance(roles, str):
        roles = [roles]
    
    return decorator

def check_onboarding_status():
    """Middleware pour vérifier si l'utilisateur a complété l'onboarding"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Vérifier le JWT
                token = get_token_from_request()
                
                payload = verify_token(token)
                if not payload:
                    return jsonify({'message': 'Token invalide ou expiré'}), 401
                    
                # Récupérer l'ID utilisateur du token
                current_user_id = payload.get('user_id');
                
                # Récupérer l'utilisateur avec ses relations
                user = User.query.filter_by(id=current_user_id).first()
                
                if not user:
                    return jsonify({"message": "Utilisateur non trouvé"}), 404
                
                # Vérifier si l'utilisateur a une organisation ou a déjà complété l'onboarding
                has_completed_onboarding = user.onboarding_completed
                has_organization = len(user.organizations) > 0
                
                # Si l'utilisateur a une organisation mais n'a pas encore complété l'onboarding,
                # mettre à jour son statut
                if has_organization and not has_completed_onboarding:
                    user.onboarding_completed = True
                    from app import db
                    db.session.commit()
                    has_completed_onboarding = True
                
                # Stocker le statut d'onboarding dans le contexte g
                g.onboarding_completed = has_completed_onboarding
                g.has_organization = has_organization
                g.current_user = user
                
                # Si l'utilisateur n'a pas d'organisation et n'a pas complété l'onboarding
                # et n'est pas sur le chemin d'onboarding
                if not has_completed_onboarding and not has_organization and not request.path.startswith('/api/onboarding') and not request.path.startswith('/api/organizations'):
                    return jsonify({"message": "Onboarding requis", "onboarding_required": True}), 403
                
            except Exception as e:
                print(e)
                current_app.logger.error(f"Erreur dans auth_middleware: {str(e)}")
                return jsonify({"message": "Erreur d'authentification"}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    """
    Décorateur pour les routes réservées aux administrateurs
    """
    return role_required(['admin'])(f)

def record_api_access(endpoint_name=None):
    """
    Décorateur pour enregistrer l'accès à des endpoints sensibles
    
    Args:
        endpoint_name (str): Nom de l'endpoint à enregistrer
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if user:
                try:
                    # Enregistrer l'accès à l'API
                    endpoint = endpoint_name or request.endpoint
                    login_entry = LoginHistory(
                        user_id=user.id,
                        ip_address=request.remote_addr,
                        device=parse_user_agent(request.headers.get('User-Agent', '')),
                        location=get_location_from_ip(request.remote_addr),
                        status='api_access',
                        timestamp=datetime.utcnow()
                    )
                    db.session.add(login_entry)
                    db.session.commit()
                except Exception as e:
                    current_app.logger.error(f"Erreur lors de l'enregistrement de l'accès API: {str(e)}")
                    db.session.rollback()
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Alias pour compatibilité avec les autres parties du code
# auth_required = token_required