# backend/app/services/user_service.py
from .. import db
from ..models.user import User
from ..models.login_history import LoginHistory
from ..models.notification_setting import NotificationPreference
from ..models.two_factor_auth import TwoFactorAuth
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import datetime
import os
import uuid
import pyotp
import qrcode
import io
import base64
from sqlalchemy.exc import SQLAlchemyError
from flask import current_app

class UserService:
    @staticmethod
    def get_full_profile(user_id):
        """
        Récupère le profil complet de l'utilisateur avec toutes les données associées
        """
        try:
            # Récupérer l'utilisateur
            user = User.query.get(user_id)
            if not user:
                return None
            
            # Convertir l'utilisateur en dictionnaire
            profile = user.to_dict()
            
            # Supprimer le mot de passe
            if 'password' in profile:
                del profile['password']
            
            # Récupérer les préférences de notification
            notification_prefs = NotificationPreference.query.filter_by(user_id=user_id).first()
            if notification_prefs:
                profile['notification_preferences'] = notification_prefs.to_dict()
            
            # Récupérer les informations de 2FA
            two_factor = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if two_factor:
                profile['two_factor_enabled'] = two_factor.is_enabled
                profile['two_factor_method'] = two_factor.method
            else:
                profile['two_factor_enabled'] = False
                profile['two_factor_method'] = None
            
            # Récupérer l'historique des connexions (5 dernières)
            login_history = LoginHistory.query.filter_by(user_id=user_id).order_by(
                LoginHistory.timestamp.desc()).limit(5).all()
            if login_history:
                profile['login_history'] = [h.to_dict() for h in login_history]
            else:
                profile['login_history'] = []
            
            # Récupérer les intégrations
            # Dans une implémentation complète, vous devriez ajouter ces informations
            profile['integrations'] = []
            
            return profile
        except Exception as e:
            print(f"Erreur lors de la récupération du profil: {str(e)}")
            return None
    
    @staticmethod
    def update_profile(user_id, data):
        """
        Met à jour les informations du profil utilisateur
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return None, "Utilisateur non trouvé"
            
            # Vérifier si l'email existe déjà (s'il est mis à jour)
            if 'email' in data and data['email'] != user.email:
                existing_user = User.query.filter_by(email=data['email']).first()
                if existing_user:
                    return None, "Cette adresse email est déjà utilisée"
            
            # Mettre à jour les champs autorisés
            updateable_fields = ['first_name', 'last_name', 'email', 'job_title', 'company', 'phone']
            updated = False
            
            for field in updateable_fields:
                if field in data and data[field] is not None:
                    setattr(user, field, data[field])
                    updated = True
            
            if updated:
                user.updated_at = datetime.datetime.now()
                db.session.commit()
                
                # Récupérer le profil complet mis à jour
                return UserService.get_full_profile(user_id), None
            else:
                return UserService.get_full_profile(user_id), None
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, f"Erreur de base de données: {str(e)}"
        except Exception as e:
            return None, f"Erreur lors de la mise à jour du profil: {str(e)}"
    
    @staticmethod
    def update_avatar(user_id, file):
        """
        Met à jour l'avatar de l'utilisateur
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return None, "Utilisateur non trouvé"
            
            # Générer un nom de fichier sécurisé avec UUID
            filename = secure_filename(file.filename)
            extension = filename.rsplit('.', 1)[1].lower()
            new_filename = f"{uuid.uuid4()}.{extension}"
            
            # Définir le chemin du dossier de stockage des avatars
            upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'avatars')
            
            # Créer le dossier s'il n'existe pas
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
            
            # Chemin complet du fichier
            file_path = os.path.join(upload_folder, new_filename)
            
            # Sauvegarder le fichier
            file.save(file_path)
            
            # Mettre à jour le chemin de l'avatar dans la base de données
            avatar_url = f"/uploads/avatars/{new_filename}"
            
            # Supprimer l'ancien avatar si existant
            if user.avatar_url and user.avatar_url != "/images/default-avatar.png":
                old_avatar_path = os.path.join(
                    current_app.root_path, 
                    'static', 
                    user.avatar_url.lstrip('/')
                )
                if os.path.exists(old_avatar_path):
                    os.remove(old_avatar_path)
            
            # Mettre à jour l'URL de l'avatar
            user.avatar_url = avatar_url
            user.updated_at = datetime.datetime.now()
            db.session.commit()
            
            return avatar_url, None
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, f"Erreur de base de données: {str(e)}"
        except Exception as e:
            return None, f"Erreur lors de la mise à jour de l'avatar: {str(e)}"
    
    @staticmethod
    def update_password(user_id, current_password, new_password):
        """
        Met à jour le mot de passe de l'utilisateur
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return False, "Utilisateur non trouvé", None
            
            # Vérifier le mot de passe actuel
            if not check_password_hash(user.password, current_password):
                return False, "Mot de passe actuel incorrect", None
            
            # Valider le nouveau mot de passe
            if len(new_password) < 8:
                return False, "Le nouveau mot de passe doit contenir au moins 8 caractères", None
            
            # Mettre à jour le mot de passe
            user.password = generate_password_hash(new_password)
            user.last_password_change = datetime.datetime.now()
            user.updated_at = datetime.datetime.now()
            db.session.commit()
            
            return True, "Mot de passe mis à jour avec succès", user.last_password_change.isoformat()
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, f"Erreur de base de données: {str(e)}", None
        except Exception as e:
            return False, f"Erreur lors de la mise à jour du mot de passe: {str(e)}", None
    
    @staticmethod
    def init_two_factor(user_id, method='app'):
        """
        Initialise la configuration de l'authentification à deux facteurs
        """
        try:
            user = User.query.get(user_id)
            if not user:
                return None, "Utilisateur non trouvé"
            
            # Vérifier si la méthode est valide
            valid_methods = ['app', 'sms', 'email']
            if method not in valid_methods:
                return None, "Méthode d'authentification non valide"
            
            # Vérifier si la 2FA est déjà configurée
            existing_2fa = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            
            # Générer une clé secrète pour TOTP
            secret_key = pyotp.random_base32()
            
            # Créer ou mettre à jour la configuration 2FA
            if existing_2fa:
                existing_2fa.secret_key = secret_key
                existing_2fa.method = method
                existing_2fa.updated_at = datetime.datetime.now()
            else:
                new_2fa = TwoFactorAuth(
                    user_id=user_id,
                    secret_key=secret_key,
                    method=method,
                    is_enabled=False,
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                )
                db.session.add(new_2fa)
            
            db.session.commit()
            
            # Préparer la réponse
            response = {
                'method': method,
                'secretKey': secret_key
            }
            
            # Générer des codes de secours (pour la méthode 'app')
            if method == 'app':
                # Générer un QR code pour les applications d'authentification
                totp = pyotp.TOTP(secret_key)
                uri = totp.provisioning_uri(user.email, issuer_name="RecruteIA")
                
                # Créer le QR code
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(uri)
                qr.make(fit=True)
                
                img = qr.make_image(fill_color="black", back_color="white")
                
                # Convertir l'image en base64
                buffer = io.BytesIO()
                img.save(buffer)
                buffer.seek(0)
                img_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                # Générer des codes de secours
                backup_codes = [f"{uuid.uuid4().hex[:8]}" for _ in range(8)]
                
                # Ajouter à la réponse
                response['qrCode'] = img_str
                response['backupCodes'] = backup_codes
                
                # Sauvegarder les codes de secours (dans une implémentation complète, ils devraient être hachés)
                # Cette partie pourrait être ajoutée dans un modèle séparé
            
            return response, None
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, f"Erreur de base de données: {str(e)}"
        except Exception as e:
            return None, f"Erreur lors de l'initialisation de l'authentification à deux facteurs: {str(e)}"
    
    @staticmethod
    def verify_two_factor(user_id, method, code):
        """
        Vérifie le code d'authentification à deux facteurs et active la 2FA
        """
        try:
            # Récupérer la configuration 2FA
            two_factor = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if not two_factor:
                return False, "Configuration d'authentification à deux facteurs non trouvée"
            
            # Vérifier que la méthode correspond
            if two_factor.method != method:
                return False, "Méthode d'authentification incorrecte"
            
            # Vérifier le code selon la méthode
            if method == 'app':
                # Vérifier le code TOTP
                totp = pyotp.TOTP(two_factor.secret_key)
                if not totp.verify(code):
                    return False, "Code incorrect"
            elif method in ['sms', 'email']:
                # Dans une implémentation réelle, vous devriez vérifier le code envoyé par SMS ou email
                # Pour cet exemple, acceptons simplement un code de test
                if code != '123456':  # Code de test, à remplacer par une vraie vérification
                    return False, "Code incorrect"
            
            # Activer la 2FA
            two_factor.is_enabled = True
            two_factor.updated_at = datetime.datetime.now()
            db.session.commit()
            
            return True, "Authentification à deux facteurs activée avec succès"
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, f"Erreur de base de données: {str(e)}"
        except Exception as e:
            return False, f"Erreur lors de la vérification du code: {str(e)}"
    
    @staticmethod
    def disable_two_factor(user_id):
        """
        Désactive l'authentification à deux facteurs
        """
        try:
            # Récupérer la configuration 2FA
            two_factor = TwoFactorAuth.query.filter_by(user_id=user_id).first()
            if not two_factor:
                return False, "Configuration d'authentification à deux facteurs non trouvée"
            
            # Désactiver la 2FA
            two_factor.is_enabled = False
            two_factor.updated_at = datetime.datetime.now()
            db.session.commit()
            
            return True, "Authentification à deux facteurs désactivée avec succès"
        except SQLAlchemyError as e:
            db.session.rollback()
            return False, f"Erreur de base de données: {str(e)}"
        except Exception as e:
            return False, f"Erreur lors de la désactivation de l'authentification à deux facteurs: {str(e)}"
    
    @staticmethod
    def get_login_history(user_id):
        """
        Récupère l'historique des connexions de l'utilisateur
        """
        try:
            # Vérifier si l'utilisateur existe
            user = User.query.get(user_id)
            if not user:
                return None, "Utilisateur non trouvé"
            
            # Récupérer l'historique des connexions
            history = LoginHistory.query.filter_by(user_id=user_id).order_by(
                LoginHistory.timestamp.desc()).limit(20).all()
            
            # Convertir en liste de dictionnaires
            history_list = [h.to_dict() for h in history]
            
            return history_list, None
        except Exception as e:
            return None, f"Erreur lors de la récupération de l'historique des connexions: {str(e)}"
    
    @staticmethod
    def get_notification_preferences(user_id):
        """
        Récupère les préférences de notification de l'utilisateur
        """
        try:
            # Vérifier si l'utilisateur existe
            user = User.query.get(user_id)
            if not user:
                return None, "Utilisateur non trouvé"
            
            # Récupérer les préférences de notification
            preferences = NotificationPreference.query.filter_by(user_id=user_id).first()
            
            # Si aucune préférence n'existe, créer des préférences par défaut
            if not preferences:
                default_prefs = {
                    'email': {
                        'newMessages': True,
                        'interviewReminders': True,
                        'weeklyReports': True,
                        'marketingEmails': False
                    },
                    'push': {
                        'newMessages': True,
                        'interviewReminders': True,
                        'candidateUpdates': True,
                        'teamNotifications': True
                    },
                    'desktop': {
                        'newMessages': True,
                        'interviewReminders': True,
                        'candidateUpdates': False,
                        'teamNotifications': True
                    }
                }
                
                # Dans une implémentation réelle, vous devriez créer un enregistrement dans la base de données
                # Pour cet exemple, retournons simplement les préférences par défaut
                return default_prefs, None
            
            # Convertir en dictionnaire
            prefs_dict = preferences.to_dict()
            
            return prefs_dict, None
        except Exception as e:
            return None, f"Erreur lors de la récupération des préférences de notification: {str(e)}"
    
    @staticmethod
    def update_notification_preferences(user_id, data):
        """
        Met à jour les préférences de notification de l'utilisateur
        """
        try:
            # Vérifier si l'utilisateur existe
            user = User.query.get(user_id)
            if not user:
                return None, "Utilisateur non trouvé"
            
            # Récupérer les préférences de notification existantes
            preferences = NotificationPreference.query.filter_by(user_id=user_id).first()
            
            # Si aucune préférence n'existe, en créer une nouvelle
            if not preferences:
                preferences = NotificationPreference(
                    user_id=user_id,
                    email_preferences={},
                    push_preferences={},
                    desktop_preferences={},
                    created_at=datetime.datetime.now(),
                    updated_at=datetime.datetime.now()
                )
                db.session.add(preferences)
            
            # Mettre à jour les préférences
            if 'email' in data:
                preferences.email_preferences = data['email']
            
            if 'push' in data:
                preferences.push_preferences = data['push']
            
            if 'desktop' in data:
                preferences.desktop_preferences = data['desktop']
            
            preferences.updated_at = datetime.datetime.now()
            db.session.commit()
            
            # Convertir en dictionnaire
            prefs_dict = preferences.to_dict()
            
            return prefs_dict, None
        except SQLAlchemyError as e:
            db.session.rollback()
            return None, f"Erreur de base de données: {str(e)}"
        except Exception as e:
            return None, f"Erreur lors de la mise à jour des préférences de notification: {str(e)}"
    
    @staticmethod
    def get_integration_auth_url(integration_id):
        """
        Génère une URL d'authentification pour une intégration
        """
        # Cette méthode serait implémentée selon les besoins spécifiques de chaque intégration
        try:
            # Valider l'ID d'intégration
            valid_integrations = ['calendar', 'microsoft', 'ats', 'slack']
            if integration_id not in valid_integrations:
                return None, "Intégration non valide"
            
            # Créer une URL d'authentification fictive
            # Dans une implémentation réelle, vous devriez utiliser l'API OAuth du service concerné
            auth_url = f"https://example.com/oauth/{integration_id}/auth?client_id=123456&redirect_uri=https://recrute-ia.com/api/integrations/{integration_id}/callback"
            
            return auth_url, None
        except Exception as e:
            return None, f"Erreur lors de la génération de l'URL d'authentification: {str(e)}"
    
    @staticmethod
    def disconnect_integration(user_id, integration_id):
        """
        Déconnecte une intégration
        """
        # Cette méthode serait implémentée selon les besoins spécifiques de chaque intégration
        try:
            # Valider l'ID d'intégration
            valid_integrations = ['calendar', 'microsoft', 'ats', 'slack']
            if integration_id not in valid_integrations:
                return False, "Intégration non valide"
            
            # Vérifier si l'utilisateur existe
            user = User.query.get(user_id)
            if not user:
                return False, "Utilisateur non trouvé"
            
            # Simuler la déconnexion
            # Dans une implémentation réelle, vous devriez supprimer les tokens d'accès et les références
            
            return True, f"Intégration {integration_id} déconnectée avec succès"
        except Exception as e:
            return False, f"Erreur lors de la déconnexion de l'intégration: {str(e)}"