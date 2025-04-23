# backend/app/services/auth_service.py
import geoip2
from .. import db
from ..models.user import User
from ..models.login_history import LoginHistory
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app, request
from ..middleware.auth_middleware import create_token, revoke_token, record_login_attempt
import datetime
import uuid
import os
import jwt
from datetime import datetime, timedelta

class AuthService:
    @staticmethod
    def create_user(email, password, first_name, last_name, **kwargs):
        """
        Crée un nouvel utilisateur
        
        Args:
            email (str): Email de l'utilisateur
            password (str): Mot de passe
            first_name (str): Prénom
            last_name (str): Nom de famille
            **kwargs: Arguments additionnels (role, job_title, etc.)
            
        Returns:
            tuple: (User, error_message)
        """
        # Vérifier si l'email existe déjà
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return None, "Un utilisateur avec cet email existe déjà"
        
        # Hacher le mot de passe
        hashed_password = generate_password_hash(password)
        
        # Créer un nouvel utilisateur
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=kwargs.get('role', 'user'),
            is_active=True,
            created_at=datetime.utcnow(),
            last_password_change=datetime.utcnow()
        )
        
        try:
            # Sauvegarder dans la base de données
            db.session.add(user)
            db.session.commit()
            
            # Enregistrer la création de compte comme un événement d'historique
            record_login_attempt(user.id, 'account_created')
            
            return user, None
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Erreur lors de la création de l'utilisateur: {str(e)}")
            return None, f"Erreur lors de la création de l'utilisateur: {str(e)}"
    
    @staticmethod
    def login(email, password):
        """
        Authentification d'un utilisateur
        
        Args:
            email (str): Email
            password (str): Mot de passe
            
        Returns:
            tuple: (success, tokens, user, message)
        """
        try:
            # Trouver l'utilisateur par email
            user = User.query.filter_by(email=email).first()
            
            if not user:
                # Simuler un délai pour éviter les attaques temporelles
                import time
                time.sleep(0.5)
                return False, None, None, "Email ou mot de passe incorrect"
            
            # Vérifier si le compte est actif
            if not user.is_active:
                # Enregistrer la tentative de connexion échouée
                record_login_attempt(user.id, 'failed', "Compte désactivé")
                return False, None, None, "Ce compte a été désactivé"
            
            # Vérifier le mot de passe
            if not check_password_hash(user.password, password):
                # Enregistrer la tentative de connexion échouée
                record_login_attempt(user.id, 'failed', "Mot de passe incorrect")
                return False, None, None, "Email ou mot de passe incorrect"
            
            # Mettre à jour la date de dernière connexion
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Générer des tokens
            access_token, refresh_token = create_token(user.id, user.role)
            
            # Enregistrer la tentative de connexion réussie
            # Note: cette étape est maintenant gérée dans la fonction create_token
            
            # Préparer l'objet utilisateur pour la réponse
            user_data = user.to_dict()
            
            return True, {'access_token': access_token, 'refresh_token': refresh_token}, user_data, "Authentification réussie"
        except Exception as e:
            current_app.logger.error(f"Erreur lors de la connexion: {str(e)}")
            return False, None, None, "Une erreur est survenue lors de la connexion"
    
    @staticmethod
    def _record_login_attempt(user_id, status, error_message=None):
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
            device = AuthService._parse_user_agent(user_agent)
            
            # Déterminer la localisation (si possible)
            location = AuthService._get_location_from_ip(ip_address)
            
            # Créer l'entrée d'historique
            login_entry = LoginHistory(
                user_id=user_id,
                ip_address=ip_address,
                device=device,
                location=location,
                status=status,
                timestamp=datetime.datetime.now()
            )
            
            db.session.add(login_entry)
            db.session.commit()
            
        except Exception as e:
            print(f"Erreur lors de l'enregistrement de la tentative de connexion: {str(e)}")
            db.session.rollback()
    
    @staticmethod
    def _parse_user_agent(user_agent_string):
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
    
    @staticmethod
    def _get_location_from_ip(ip_address):
        """
        Détermine la localisation à partir de l'adresse IP
        
        Args:
            ip_address (str): Adresse IP
        
        Returns:
            str: Localisation (ville, pays)
        """
        try:
            # Pour une implémentation réelle, utilisez un service de géolocalisation comme MaxMind GeoIP
            # Ici, une version simplifiée pour la démonstration
            if ip_address == '127.0.0.1' or ip_address.startswith('192.168.') or ip_address.startswith('10.'):
                return 'Local Network'
            
            # Exemple avec MaxMind GeoIP (nécessite un fichier de base de données)
            geoip_db_path = os.path.join(os.path.dirname(__file__), '../data/GeoLite2-City.mmdb')
            
            if os.path.exists(geoip_db_path):
                try:
                    with geoip2.database.Reader(geoip_db_path) as reader:
                        response = reader.city(ip_address)
                        return f"{response.city.name}, {response.country.name}"
                except:
                    pass
            
            # Si la géolocalisation échoue, retourner une valeur par défaut
            return 'Unknown Location'
        except Exception as e:
            print(f"Erreur lors de la géolocalisation: {str(e)}")
            return 'Unknown Location'
        
    @staticmethod
    def logout(token):
        """
        Déconnexion d'un utilisateur
        
        Args:
            token (str): Token JWT à révoquer
            
        Returns:
            bool: True si succès, False sinon
        """
        try:
            # Décoder le token sans vérifier la signature (juste pour obtenir l'identifiant)
            payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
            
            # Récupérer l'identifiant de l'utilisateur
            user_id = payload.get('user_id')
            
            if user_id:
                # Enregistrer la déconnexion dans l'historique
                record_login_attempt(user_id, 'logout')
            
            # Révoquer le token
            return revoke_token(token)
        except Exception as e:
            current_app.logger.error(f"Erreur lors de la déconnexion: {str(e)}")
            return False
    
    @staticmethod
    def refresh_token(refresh_token_str):
        """
        Rafraîchit le token d'accès avec un token de rafraîchissement
        
        Args:
            refresh_token_str (str): Token de rafraîchissement
            
        Returns:
            tuple: (success, tokens, message)
        """
        try:
            # Décoder le token de rafraîchissement
            payload = jwt.decode(
                refresh_token_str, 
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Vérifier que c'est bien un token de rafraîchissement
            if payload.get('type') != 'refresh':
                return False, None, "Token de rafraîchissement invalide"
            
            # Récupérer l'identifiant de l'utilisateur
            user_id = payload.get('user_id')
            if not user_id:
                return False, None, "Token de rafraîchissement invalide"
            
            # Vérifier que l'utilisateur existe toujours
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return False, None, "Utilisateur introuvable ou désactivé"
            
            # Créer un nouveau token d'accès
            access_token, new_refresh_token = create_token(user_id, user.role)
            
            # Enregistrer l'opération de rafraîchissement
            record_login_attempt(user_id, 'token_refresh')
            
            return True, {'access_token': access_token, 'refresh_token': new_refresh_token}, "Token rafraîchi avec succès"
        except jwt.ExpiredSignatureError:
            return False, None, "Token de rafraîchissement expiré"
        except Exception as e:
            current_app.logger.error(f"Erreur lors du rafraîchissement du token: {str(e)}")
            return False, None, "Erreur lors du rafraîchissement du token"
    
    @staticmethod
    def initiate_password_reset(email):
        """
        Initie le processus de réinitialisation de mot de passe
        
        Args:
            email (str): Email de l'utilisateur
            
        Returns:
            tuple: (success, message, reset_token)
        """
        try:
            # Trouver l'utilisateur par email
            user = User.query.filter_by(email=email).first()
            
            # Pour des raisons de sécurité, ne pas révéler si l'email existe
            if not user:
                return True, "Si cette adresse email existe dans notre système, un lien de réinitialisation a été envoyé", None
            
            # Créer un token de réinitialisation
            reset_token = jwt.encode(
                {
                    'user_id': user.id,
                    'exp': datetime.utcnow() + timedelta(hours=1),
                    'iat': datetime.utcnow(),
                    'type': 'password_reset'
                },
                current_app.config['JWT_SECRET_KEY'],
                algorithm='HS256'
            )
            
            # Enregistrer la demande de réinitialisation dans l'historique
            record_login_attempt(user.id, 'password_reset_request')
            
            # En production, envoyer un email avec le token
            # Ici, on se contente de retourner le token pour test
            
            return True, "Un lien de réinitialisation a été envoyé à votre adresse email", reset_token
        except Exception as e:
            current_app.logger.error(f"Erreur lors de l'initialisation de la réinitialisation de mot de passe: {str(e)}")
            return False, "Une erreur est survenue", None
    
    @staticmethod
    def reset_password(reset_token, new_password):
        """
        Réinitialise le mot de passe avec un token de réinitialisation
        
        Args:
            reset_token (str): Token de réinitialisation
            new_password (str): Nouveau mot de passe
            
        Returns:
            tuple: (success, message)
        """
        try:
            # Décoder le token de réinitialisation
            payload = jwt.decode(
                reset_token, 
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Vérifier que c'est bien un token de réinitialisation
            if payload.get('type') != 'password_reset':
                return False, "Token de réinitialisation invalide"
            
            # Récupérer l'identifiant de l'utilisateur
            user_id = payload.get('user_id')
            if not user_id:
                return False, "Token de réinitialisation invalide"
            
            # Trouver l'utilisateur
            user = User.query.get(user_id)
            if not user or not user.is_active:
                return False, "Utilisateur introuvable ou désactivé"
            
            # Vérifier les exigences de complexité du mot de passe
            if len(new_password) < 8:
                return False, "Le mot de passe doit contenir au moins 8 caractères"
            
            # Mettre à jour le mot de passe
            user.password = generate_password_hash(new_password)
            user.last_password_change = datetime.utcnow()
            db.session.commit()
            
            # Enregistrer la réinitialisation dans l'historique
            record_login_attempt(user_id, 'password_reset_success')
            
            return True, "Mot de passe réinitialisé avec succès"
        except jwt.ExpiredSignatureError:
            return False, "Token de réinitialisation expiré"
        except Exception as e:
            current_app.logger.error(f"Erreur lors de la réinitialisation du mot de passe: {str(e)}")
            return False, "Erreur lors de la réinitialisation du mot de passe"
    
    @staticmethod
    def change_password(user_id, current_password, new_password):
        """
        Change le mot de passe d'un utilisateur connecté
        
        Args:
            user_id (str): ID de l'utilisateur
            current_password (str): Mot de passe actuel
            new_password (str): Nouveau mot de passe
            
        Returns:
            tuple: (success, message)
        """
        try:
            # Trouver l'utilisateur
            user = User.query.get(user_id)
            if not user:
                return False, "Utilisateur introuvable"
            
            # Vérifier le mot de passe actuel
            if not check_password_hash(user.password, current_password):
                # Enregistrer la tentative échouée
                record_login_attempt(user_id, 'password_change_failed', "Mot de passe actuel incorrect")
                return False, "Mot de passe actuel incorrect"
            
            # Vérifier les exigences de complexité du mot de passe
            if len(new_password) < 8:
                return False, "Le nouveau mot de passe doit contenir au moins 8 caractères"
            
            # Mettre à jour le mot de passe
            user.password = generate_password_hash(new_password)
            user.last_password_change = datetime.utcnow()
            db.session.commit()
            
            # Enregistrer le changement dans l'historique
            record_login_attempt(user_id, 'password_change_success')
            
            return True, "Mot de passe changé avec succès"
        except Exception as e:
            current_app.logger.error(f"Erreur lors du changement de mot de passe: {str(e)}")
            return False, f"Erreur lors du changement de mot de passe: {str(e)}"
    
    @staticmethod
    def get_current_user():
        """
        Récupère l'utilisateur actuellement authentifié à partir du middleware
        
        Returns:
            User: L'objet utilisateur ou None si non authentifié
        """
        from ..middleware.auth_middleware import get_current_user as middleware_get_current_user
        return middleware_get_current_user()