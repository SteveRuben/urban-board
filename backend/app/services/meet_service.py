# backend/services/meet_service.py
import os
import json
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from ..models.interview_scheduling import InterviewSchedule
from app import db

class MeetService:
    """Service pour gérer les réunions Google Meet via Google Calendar"""
    
    # Scopes nécessaires pour Google Calendar
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]
    
    def __init__(self):
        self.service = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialise le service Google Calendar"""
        try:
            creds = self._get_credentials()
            if creds:
                self.service = build('calendar', 'v3', credentials=creds)
        except Exception as e:
            print(f"Erreur lors de l'initialisation du service Google Calendar: {str(e)}")
            self.service = None
    
    def _get_credentials(self):
        """Récupère les credentials Google avec gestion des chemins absolus"""
        creds = None
        
        # Obtenir les chemins depuis les variables d'environnement
        token_path = os.getenv('GOOGLE_TOKEN_PATH', 'data/google_tokens/google_token.json')
        credentials_path = os.getenv('GOOGLE_CREDENTIALS_PATH', 'data/google_tokens/google_credentials.json')
        
        # Convertir en chemins absolus si ce sont des chemins relatifs
        if not os.path.isabs(token_path):
            # Trouver la racine du projet (backend)
            current_dir = os.path.dirname(os.path.abspath(__file__))  # /backend/app/services/
            backend_root = os.path.dirname(os.path.dirname(current_dir))  # /backend/
            token_path = os.path.join(backend_root, token_path)
        
        if not os.path.isabs(credentials_path):
            current_dir = os.path.dirname(os.path.abspath(__file__))
            backend_root = os.path.dirname(os.path.dirname(current_dir))
            credentials_path = os.path.join(backend_root, credentials_path)
        
        print(f"Debug - Recherche credentials: {credentials_path}")
        print(f"Debug - Token sera sauvé: {token_path}")
        
        # Le fichier token.json stocke les tokens d'accès et de rafraîchissement de l'utilisateur
        if os.path.exists(token_path):
            try:
                creds = Credentials.from_authorized_user_file(token_path, self.SCOPES)
                print("Debug - Token existant chargé")
            except Exception as e:
                print(f"Debug - Erreur chargement token: {e}")
        
        # Si il n'y a pas de credentials valides disponibles, laisse l'utilisateur se connecter
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    print("Debug - Rafraîchissement du token...")
                    creds.refresh(Request())
                    print("Debug - Token rafraîchi avec succès")
                except Exception as e:
                    print(f"Erreur lors du rafraîchissement du token: {str(e)}")
                    creds = None
            
            if not creds:
                if not os.path.exists(credentials_path):
                    print(f"Fichier credentials non trouvé: {credentials_path}")
                    return None
                
                try:
                    print("Debug - Démarrage du flux OAuth...")
                    flow = InstalledAppFlow.from_client_secrets_file(credentials_path, self.SCOPES)
                    # Utiliser run_local_server pour ouvrir automatiquement le navigateur
                    creds = flow.run_local_server(port=0, open_browser=True)
                    print("Debug - Authentification OAuth réussie")
                except Exception as e:
                    print(f"Erreur lors de l'authentification: {str(e)}")
                    return None
            
            # Sauvegarder les credentials pour la prochaine exécution
            if creds:
                try:
                    # Créer le dossier s'il n'existe pas
                    os.makedirs(os.path.dirname(token_path), exist_ok=True)
                    with open(token_path, 'w') as token:
                        token.write(creds.to_json())
                    print(f"Debug - Token sauvegardé: {token_path}")
                except Exception as e:
                    print(f"Erreur lors de la sauvegarde du token: {str(e)}")
        
        return creds
    
    def is_available(self):
        """Vérifie si le service Meet est disponible"""
        return self.service is not None
    
    def create_meeting(self, schedule_data):
        """
        Crée un événement Google Calendar avec Meet
        
        Args:
            schedule_data: Dictionnaire contenant les données de planification
                - title: Titre de l'entretien
                - description: Description
                - candidate_name: Nom du candidat
                - candidate_email: Email du candidat
                - recruiter_email: Email du recruteur
                - scheduled_at: DateTime de début
                - duration_minutes: Durée en minutes
                - timezone: Fuseau horaire
        
        Returns:
            Dictionnaire contenant event_id et meet_link
        """
        if not self.is_available():
            raise Exception("Service Google Calendar non disponible")
        
        try:
            # Calcul des dates de début et fin
            start_time = schedule_data['scheduled_at']
            end_time = start_time + timedelta(minutes=schedule_data.get('duration_minutes', 30))
            
            # Configuration de l'événement
            event = {
                'summary': f"Entretien: {schedule_data['title']}",
                'description': self._build_description(schedule_data),
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': schedule_data.get('timezone', 'Africa/Douala'),
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': schedule_data.get('timezone', 'Africa/Douala'),
                },
                'attendees': [
                    {'email': schedule_data['candidate_email'], 'displayName': schedule_data['candidate_name']},
                    {'email': schedule_data['recruiter_email']},
                ],
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"meet-{schedule_data.get('schedule_id', 'temp')}",
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 24h avant
                        {'method': 'popup', 'minutes': 30},       # 30min avant
                    ],
                },
                'guestsCanModify': False,
                'guestsCanInviteOthers': False,
                'guestsCanSeeOtherGuests': True,
            }
            
            # Créer l'événement
            event = self.service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'
            ).execute()
            
            # Extraire le lien Meet
            meet_link = None
            if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
                for entry_point in event['conferenceData']['entryPoints']:
                    if entry_point['entryPointType'] == 'video':
                        meet_link = entry_point['uri']
                        break
            
            return {
                'event_id': event['id'],
                'meet_link': meet_link,
                'html_link': event.get('htmlLink'),
                'status': event.get('status')
            }
            
        except HttpError as error:
            print(f"Erreur Google Calendar API: {error}")
            raise Exception(f"Erreur lors de la création de l'événement: {error}")
        except Exception as e:
            print(f"Erreur lors de la création du meeting: {str(e)}")
            raise Exception(f"Erreur lors de la création du meeting: {str(e)}")
    
    def update_meeting(self, event_id, schedule_data):
        """
        Met à jour un événement Google Calendar existant
        
        Args:
            event_id: ID de l'événement Google Calendar
            schedule_data: Nouvelles données de planification
        
        Returns:
            Dictionnaire contenant les informations mises à jour
        """
        if not self.is_available():
            raise Exception("Service Google Calendar non disponible")
        
        try:
            # Récupérer l'événement existant
            event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            
            # Calcul des nouvelles dates
            start_time = schedule_data['scheduled_at']
            end_time = start_time + timedelta(minutes=schedule_data.get('duration_minutes', 30))
            
            # Mettre à jour les champs modifiés
            event['summary'] = f"Entretien: {schedule_data['title']}"
            event['description'] = self._build_description(schedule_data)
            event['start'] = {
                'dateTime': start_time.isoformat(),
                'timeZone': schedule_data.get('timezone', 'Africa/Douala'),
            }
            event['end'] = {
                'dateTime': end_time.isoformat(),
                'timeZone': schedule_data.get('timezone', 'Africa/Douala'),
            }
            
            # Mettre à jour les participants si nécessaire
            attendees = []
            for attendee in event.get('attendees', []):
                if attendee['email'] == schedule_data['candidate_email']:
                    attendee['displayName'] = schedule_data['candidate_name']
                attendees.append(attendee)
            event['attendees'] = attendees
            
            # Mettre à jour l'événement
            updated_event = self.service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event,
                sendUpdates='all'
            ).execute()
            
            # Extraire le lien Meet (il reste le même normalement)
            meet_link = None
            if 'conferenceData' in updated_event and 'entryPoints' in updated_event['conferenceData']:
                for entry_point in updated_event['conferenceData']['entryPoints']:
                    if entry_point['entryPointType'] == 'video':
                        meet_link = entry_point['uri']
                        break
            
            return {
                'event_id': updated_event['id'],
                'meet_link': meet_link,
                'html_link': updated_event.get('htmlLink'),
                'status': updated_event.get('status')
            }
            
        except HttpError as error:
            print(f"Erreur Google Calendar API: {error}")
            raise Exception(f"Erreur lors de la mise à jour de l'événement: {error}")
        except Exception as e:
            print(f"Erreur lors de la mise à jour du meeting: {str(e)}")
            raise Exception(f"Erreur lors de la mise à jour du meeting: {str(e)}")
    
    def cancel_meeting(self, event_id, reason=None):
        """
        Annule un événement Google Calendar
        
        Args:
            event_id: ID de l'événement Google Calendar
            reason: Raison de l'annulation (optionnel)
        
        Returns:
            bool: True si l'annulation a réussi
        """
        if not self.is_available():
            print("Service Google Calendar non disponible pour l'annulation")
            return False
        
        try:
            # Récupérer l'événement pour ajouter la raison d'annulation
            if reason:
                event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
                event['description'] = f"{event.get('description', '')}\n\n[ANNULÉ] Raison: {reason}"
                event['status'] = 'cancelled'
                
                self.service.events().update(
                    calendarId='primary',
                    eventId=event_id,
                    body=event,
                    sendUpdates='all'
                ).execute()
            else:
                # Supprimer directement l'événement
                self.service.events().delete(
                    calendarId='primary',
                    eventId=event_id,
                    sendUpdates='all'
                ).execute()
            
            return True
            
        except HttpError as error:
            print(f"Erreur Google Calendar API lors de l'annulation: {error}")
            return False
        except Exception as e:
            print(f"Erreur lors de l'annulation du meeting: {str(e)}")
            return False
    
    def get_meeting_info(self, event_id):
        """
        Récupère les informations d'un événement Google Calendar
        
        Args:
            event_id: ID de l'événement Google Calendar
        
        Returns:
            Dictionnaire avec les informations de l'événement
        """
        if not self.is_available():
            raise Exception("Service Google Calendar non disponible")
        
        try:
            event = self.service.events().get(calendarId='primary', eventId=event_id).execute()
            
            # Extraire le lien Meet
            meet_link = None
            if 'conferenceData' in event and 'entryPoints' in event['conferenceData']:
                for entry_point in event['conferenceData']['entryPoints']:
                    if entry_point['entryPointType'] == 'video':
                        meet_link = entry_point['uri']
                        break
            
            return {
                'event_id': event['id'],
                'title': event.get('summary'),
                'description': event.get('description'),
                'start': event['start'].get('dateTime'),
                'end': event['end'].get('dateTime'),
                'meet_link': meet_link,
                'html_link': event.get('htmlLink'),
                'status': event.get('status'),
                'attendees': event.get('attendees', [])
            }
            
        except HttpError as error:
            print(f"Erreur Google Calendar API: {error}")
            raise Exception(f"Erreur lors de la récupération de l'événement: {error}")
        except Exception as e:
            print(f"Erreur lors de la récupération du meeting: {str(e)}")
            raise Exception(f"Erreur lors de la récupération du meeting: {str(e)}")
    
    def _build_description(self, schedule_data):
        """Construit la description de l'événement"""
        description = f"""
Entretien pour le poste: {schedule_data.get('position', 'Non spécifié')}

Candidat: {schedule_data['candidate_name']}
Email: {schedule_data['candidate_email']}

Mode d'entretien: {schedule_data.get('mode', 'Non spécifié')}

{schedule_data.get('description', '')}

---
Cet entretien a été planifié automatiquement via votre système de recrutement.
        """.strip()
        
        return description
    
    def test_connection(self):
        """
        Teste la connexion au service Google Calendar
        
        Returns:
            dict: Résultat du test avec succès/erreur
        """
        try:
            if not self.is_available():
                return {
                    'success': False,
                    'error': 'Service Google Calendar non initialisé'
                }
            
            # Tenter de lire le calendrier principal
            calendar = self.service.calendars().get(calendarId='primary').execute()
            
            return {
                'success': True,
                'calendar_name': calendar.get('summary'),
                'calendar_id': calendar.get('id')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

