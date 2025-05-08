# backend/app/middleware/rate_limit.py
from functools import wraps
from flask import request, jsonify, current_app, g
import time
import hashlib

# Réutiliser le client Redis et get_current_user du module auth_middleware
from .auth_middleware import redis_client, get_current_user

def get_remote_address():
    """
    Récupère l'adresse IP du client en tenant compte des proxies
    """
    if request.headers.get('X-Forwarded-For'):
        # Si l'application est derrière un proxy, utiliser l'en-tête X-Forwarded-For
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr

def generate_key(key_prefix, user_identifier=None):
    """
    Génère une clé unique pour Redis basée sur le préfixe et l'identifiant de l'utilisateur ou l'IP
    """
    if user_identifier is None:
        # Récupérer l'utilisateur courant avec la fonction get_current_user
        user = get_current_user()
        if user:
            # Utiliser l'ID de l'utilisateur connecté
            identifier = user.id
        else:
            # Utiliser l'adresse IP pour les utilisateurs non authentifiés
            identifier = get_remote_address()
    else:
        identifier = user_identifier
    
    # Hacher l'identifiant pour la confidentialité
    hashed_identifier = hashlib.sha256(str(identifier).encode()).hexdigest()
    return f"{key_prefix}:{hashed_identifier}"

class RateLimitExceeded(Exception):
    """Exception levée lorsque le taux limite est dépassé"""
    pass

def rate_limit(limit, period, key_prefix='rate_limit'):
    """
    Décorateur pour limiter le taux d'appels à une route
    
    Args:
        limit (int): Nombre maximal de requêtes autorisées
        period (int): Période en secondes
        key_prefix (str): Préfixe de la clé Redis
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                key = generate_key(key_prefix)
                
                # Récupérer le nombre actuel de requêtes
                count = redis_client.get(key)
                current = int(count) if count else 0
                
                # Vérifier si la limite est dépassée
                if current >= limit:
                    # Récupérer le TTL restant
                    ttl = redis_client.ttl(key)
                    resp = {
                        'message': 'Trop de requêtes, veuillez réessayer plus tard',
                        'limit': limit,
                        'period': period,
                        'retry_after': ttl if ttl > 0 else period
                    }
                    # Ajouter les en-têtes de rate limit
                    headers = {
                        'X-RateLimit-Limit': str(limit),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': str(int(time.time()) + ttl if ttl > 0 else period),
                        'Retry-After': str(ttl if ttl > 0 else period)
                    }
                    return jsonify(resp), 429, headers
                
                # Incrémenter le compteur
                pipe = redis_client.pipeline()
                pipe.incr(key)
                
                # Définir l'expiration si elle n'est pas déjà définie
                if current == 0:
                    pipe.expire(key, period)
                
                pipe.execute()
                
                # Ajouter les en-têtes de rate limit
                headers = {
                    'X-RateLimit-Limit': str(limit),
                    'X-RateLimit-Remaining': str(limit - current - 1),
                    'X-RateLimit-Reset': str(int(time.time()) + redis_client.ttl(key))
                }
                
                # Exécuter la fonction protégée
                response = f(*args, **kwargs)
                # Si la réponse est un tuple (réponse, code, en-têtes)
                if isinstance(response, tuple) and len(response) >= 3:
                    resp, code, resp_headers = response
                    resp_headers.update(headers)
                    return resp, code, resp_headers
                # Si la réponse est un tuple (réponse, code)
                elif isinstance(response, tuple) and len(response) == 2:
                    resp, code = response
                    return resp, code, headers
                # Si la réponse est juste un objet ou une chaîne
                else:
                    return response
            except Exception as e:
                current_app.logger.error(f"Erreur lors de l'application du rate limit: {str(e)}")
                # En cas d'erreur avec Redis, laisser passer la requête
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# Rate limit spécifiques pour différents types de routes
def standard_limit(f):
    """Limite standard pour la plupart des routes API (100 requêtes/minute)"""
    return rate_limit(10000000, 60, 'standard_limit')(f)

def auth_limit(f):
    """Limite stricte pour les routes d'authentification (10 requêtes/minute)"""
    return rate_limit(10000000, 60, 'auth_limit')(f)

def sensitive_limit(f):
    """Limite pour les routes sensibles (30 requêtes/minute)"""
    return rate_limit(10000000, 60, 'sensitive_limit')(f)

def custom_limit(limit, period):
    """Limite personnalisée pour des cas spécifiques"""
    return rate_limit(limit, period, f'custom_limit_{limit}_{period}')

# Middleware pour appliquer des limites différentes en fonction de l'authentification
def adaptive_rate_limit(anon_limit, auth_limit, period=60, key_prefix='adaptive'):
    """
    Applique des limites différentes selon que l'utilisateur est authentifié ou non
    
    Args:
        anon_limit (int): Limite pour les utilisateurs non authentifiés
        auth_limit (int): Limite pour les utilisateurs authentifiés
        period (int): Période en secondes
        key_prefix (str): Préfixe de la clé Redis
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Récupérer l'utilisateur courant
                user = get_current_user()
                
                # Détermine la limite à appliquer
                if user:
                    limit = auth_limit
                    key = generate_key(f"{key_prefix}_auth", user.id)
                else:
                    limit = anon_limit
                    key = generate_key(f"{key_prefix}_anon")
                
                # La même logique que dans rate_limit
                count = redis_client.get(key)
                current = int(count) if count else 0
                
                if current >= limit:
                    ttl = redis_client.ttl(key)
                    resp = {
                        'message': 'Trop de requêtes, veuillez réessayer plus tard',
                        'limit': limit,
                        'period': period,
                        'retry_after': ttl if ttl > 0 else period
                    }
                    headers = {
                        'X-RateLimit-Limit': str(limit),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': str(int(time.time()) + ttl if ttl > 0 else period),
                        'Retry-After': str(ttl if ttl > 0 else period)
                    }
                    return jsonify(resp), 429, headers
                
                pipe = redis_client.pipeline()
                pipe.incr(key)
                if current == 0:
                    pipe.expire(key, period)
                pipe.execute()
                
                headers = {
                    'X-RateLimit-Limit': str(limit),
                    'X-RateLimit-Remaining': str(limit - current - 1),
                    'X-RateLimit-Reset': str(int(time.time()) + redis_client.ttl(key))
                }
                
                response = f(*args, **kwargs)
                
                if isinstance(response, tuple) and len(response) >= 3:
                    resp, code, resp_headers = response
                    resp_headers.update(headers)
                    return resp, code, resp_headers
                elif isinstance(response, tuple) and len(response) == 2:
                    resp, code = response
                    return resp, code, headers
                else:
                    return response
            except Exception as e:
                print(f"Erreur dans adaptive_rate_limit: {str(e)}")
                current_app.logger.error(f"Erreur lors de l'application du rate limit adaptatif: {str(e)}")
                # En cas d'erreur avec Redis, laisser passer la requête
                return f(*args, **kwargs)
        
        return decorated_function
    return decorator