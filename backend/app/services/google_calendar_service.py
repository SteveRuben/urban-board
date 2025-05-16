# backend/app/services/google_calendar_service.py
import os
import json
import secrets
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from ..models.user_integration import UserIntegration
from .. import db
from flask import current_app, session
import hashlib

class GoogleCalendarService:
    @staticmethod
    def get_credentials(user_id):
        """Récupère les credentials depuis la base de données"""
        integration = UserIntegration.query.filter_by(
            user_id=user_id,
            service='google_calendar'
        ).first()
        
        if not integration or not integration.access_token:
            return None
        
        return Credentials(
            token=integration.access_token,
            refresh_token=integration.refresh_token,
            token_uri=current_app.config['GOOGLE_TOKEN_URI'],
            client_id=current_app.config['GOOGLE_CLIENT_ID'],
            client_secret=current_app.config['GOOGLE_CLIENT_SECRET'],
            scopes=current_app.config['GOOGLE_SCOPES']
        )

    @staticmethod
    def get_auth_url(user_id):
        """Génère l'URL d'authentification OAuth avec un state sécurisé"""
        try:
            # Créer un state sécurisé qui contient l'ID utilisateur et un jeton aléatoire
            random_token = secrets.token_hex(16)
            state_data = {
                'user_id': str(user_id),  # Convertir explicitement en string pour éviter tout problème
                'token': random_token,
                'expiry': (datetime.utcnow() + timedelta(minutes=10)).isoformat()
            }
            
            # Sérialiser le state
            state_str = json.dumps(state_data)
            
            # Créer le flow OAuth
            flow = Flow.from_client_secrets_file(
                current_app.config['GOOGLE_CLIENT_SECRETS_FILE'],
                scopes=current_app.config['GOOGLE_SCOPES'],
                redirect_uri=current_app.config['GOOGLE_REDIRECT_URI']
            )
            
            # Utiliser le state sécurisé
            auth_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent',
                state=state_str
            )
            
            # Journaliser l'action (en mode développement uniquement)
            if current_app.debug:
                current_app.logger.debug(f"Auth URL generated for user {user_id}")
            
            return auth_url, None
        except Exception as e:
            current_app.logger.error(f"Error generating auth URL: {str(e)}")
            return None, str(e)

    @staticmethod
    def handle_callback(code, state):
        """Gère le callback OAuth et échange le code contre un token"""
        try:
            # Décoder le state et extraire l'ID utilisateur
            try:
                state_data = json.loads(state)
                user_id = state_data.get('user_id')
                if not user_id:
                    return False, "State invalide: ID utilisateur manquant"
                
                # Vérifier l'expiration si présente
                expiry = state_data.get('expiry')
                if expiry and datetime.fromisoformat(expiry) < datetime.utcnow():
                    return False, "Le lien d'authentification a expiré. Veuillez réessayer."
                
            except (json.JSONDecodeError, ValueError, TypeError) as e:
                current_app.logger.error(f"Invalid state format: {str(e)}")
                # Fallback: si le state n'est pas au format JSON, supposer qu'il s'agit directement de l'ID utilisateur
                # comme dans votre implémentation originale
                user_id = state
            
            # Créer le flow OAuth et échanger le code contre un token
            flow = Flow.from_client_secrets_file(
                current_app.config['GOOGLE_CLIENT_SECRETS_FILE'],
                scopes=current_app.config['GOOGLE_SCOPES'],
                redirect_uri=current_app.config['GOOGLE_REDIRECT_URI']
            )
            
            # Échanger le code d'autorisation contre des tokens
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Calculer la date d'expiration de manière sécurisée
            expires_at = None
            if credentials.expiry:
                if isinstance(credentials.expiry, (int, float)):
                    expires_at = datetime.utcfromtimestamp(credentials.expiry)
                elif isinstance(credentials.expiry, datetime):
                    expires_at = credentials.expiry
                else:
                    current_app.logger.warning(f"Format d'expiration inattendu: {type(credentials.expiry)}")
                    expires_at = datetime.utcnow() + timedelta(hours=1)
            
            # Rechercher une intégration existante ou en créer une nouvelle
            integration = UserIntegration.query.filter_by(
                user_id=user_id,
                service='google_calendar'
            ).first()
            
            if not integration:
                integration = UserIntegration(
                    user_id=user_id,
                    service='google_calendar',
                    created_at=datetime.utcnow()
                )
                db.session.add(integration)
            
            # Mettre à jour les tokens
            integration.access_token = credentials.token
            # Ne pas écraser le refresh_token existant si le nouveau est None
            if credentials.refresh_token:
                integration.refresh_token = credentials.refresh_token
            integration.expires_at = expires_at
            integration.updated_at = datetime.utcnow()
            
            # Sauvegarder en base de données
            db.session.commit()
            
            current_app.logger.info(f"Successfully saved Google Calendar credentials for user {user_id}")
            return True, None
        except Exception as e:
            current_app.logger.error(f"Error handling callback: {str(e)}")
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def get_events(user_id, max_results=10, start_date=None, end_date=None, calendar_id=None):
        """Récupère les événements du calendrier avec des options de filtrage"""
        try:
            credentials = GoogleCalendarService.get_credentials(user_id)
            if not credentials:
                return None, "Google Calendar non connecté"
            
            # Rafraîchir le token si expiré
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                GoogleCalendarService.update_credentials(user_id, credentials)
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Utiliser le calendrier primaire par défaut ou celui spécifié
            cal_id = calendar_id or current_app.config.get('GOOGLE_CALENDAR_ID', 'primary')
            
            # Définir la période par défaut (à partir de maintenant)
            time_min = datetime.utcnow()
            if start_date:
                if isinstance(start_date, str):
                    time_min = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                else:
                    time_min = start_date
            
            time_max = None
            if end_date:
                if isinstance(end_date, str):
                    time_max = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                else:
                    time_max = end_date
            
            # Préparer les paramètres de requête
            params = {
                'calendarId': cal_id,
                'timeMin': time_min.isoformat() + 'Z',
                'maxResults': max_results,
                'singleEvents': True,
                'orderBy': 'startTime'
            }
            
            # Ajouter timeMax seulement si spécifié
            if time_max:
                params['timeMax'] = time_max.isoformat() + 'Z'
            
            # Exécuter la requête
            events_result = service.events().list(**params).execute()
            
            return events_result.get('items', []), None
        except Exception as e:
            current_app.logger.error(f"Error getting calendar events: {str(e)}")
            return None, str(e)

    @staticmethod
    def update_credentials(user_id, credentials):
        """Met à jour les credentials dans la base de données"""
        try:
            integration = UserIntegration.query.filter_by(
                user_id=user_id,
                service='google_calendar'
            ).first()
            
            if integration:
                integration.access_token = credentials.token
                if credentials.refresh_token:
                    integration.refresh_token = credentials.refresh_token
                
                # Calculer la date d'expiration de manière sécurisée
                if credentials.expiry:
                    if isinstance(credentials.expiry, (int, float)):
                        integration.expires_at = datetime.utcfromtimestamp(credentials.expiry)
                    elif isinstance(credentials.expiry, datetime):
                        integration.expires_at = credentials.expiry
                    else:
                        integration.expires_at = datetime.utcnow() + timedelta(hours=1)
                
                integration.updated_at = datetime.utcnow()
                db.session.commit()
                return True
            return False
        except Exception as e:
            current_app.logger.error(f"Error updating credentials: {str(e)}")
            db.session.rollback()
            return False

    @staticmethod
    def create_event(user_id, event_data):
        """Crée un événement dans le calendrier de l'utilisateur"""
        try:
            credentials = GoogleCalendarService.get_credentials(user_id)
            if not credentials:
                return None, "Google Calendar non connecté"
            
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                GoogleCalendarService.update_credentials(user_id, credentials)
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Utiliser le calendrier primaire par défaut
            calendar_id = current_app.config.get('GOOGLE_CALENDAR_ID', 'primary')
            
            # Créer l'événement
            event = service.events().insert(
                calendarId=calendar_id,
                body=event_data
            ).execute()
            
            return event, None
        except Exception as e:
            current_app.logger.error(f"Error creating calendar event: {str(e)}")
            return None, str(e)

    @staticmethod
    def delete_event(user_id, event_id, calendar_id=None):
        """Supprime un événement du calendrier de l'utilisateur"""
        try:
            credentials = GoogleCalendarService.get_credentials(user_id)
            if not credentials:
                return False, "Google Calendar non connecté"
            
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                GoogleCalendarService.update_credentials(user_id, credentials)
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Utiliser le calendrier primaire par défaut ou celui spécifié
            cal_id = calendar_id or current_app.config.get('GOOGLE_CALENDAR_ID', 'primary')
            
            # Supprimer l'événement
            service.events().delete(
                calendarId=cal_id,
                eventId=event_id
            ).execute()
            
            return True, None
        except Exception as e:
            current_app.logger.error(f"Error deleting calendar event: {str(e)}")
            return False, str(e)

    @staticmethod
    def update_event(user_id, event_id, event_data, calendar_id=None):
        """Met à jour un événement dans le calendrier de l'utilisateur"""
        try:
            credentials = GoogleCalendarService.get_credentials(user_id)
            if not credentials:
                return None, "Google Calendar non connecté"
            
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                GoogleCalendarService.update_credentials(user_id, credentials)
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Utiliser le calendrier primaire par défaut ou celui spécifié
            cal_id = calendar_id or current_app.config.get('GOOGLE_CALENDAR_ID', 'primary')
            
            # Mise à jour de l'événement
            updated_event = service.events().update(
                calendarId=cal_id,
                eventId=event_id,
                body=event_data
            ).execute()
            
            return updated_event, None
        except Exception as e:
            current_app.logger.error(f"Error updating calendar event: {str(e)}")
            return None, str(e)

    @staticmethod
    def get_calendars(user_id):
        """Récupère la liste des calendriers de l'utilisateur"""
        try:
            credentials = GoogleCalendarService.get_credentials(user_id)
            if not credentials:
                return None, "Google Calendar non connecté"
            
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                GoogleCalendarService.update_credentials(user_id, credentials)
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Récupérer les calendriers
            calendars_result = service.calendarList().list().execute()
            
            return calendars_result.get('items', []), None
        except Exception as e:
            current_app.logger.error(f"Error getting calendars list: {str(e)}")
            return None, str(e)