import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
# import msal

class TeamsService:
    """Service pour créer et gérer des réunions Microsoft Teams"""
    
    def __init__(self):
        self.client_id = os.getenv('MICROSOFT_CLIENT_ID')
        self.client_secret = os.getenv('MICROSOFT_CLIENT_SECRET')
        self.tenant_id = os.getenv('MICROSOFT_TENANT_ID')
        self.redirect_uri = os.getenv('MICROSOFT_REDIRECT_URI', 'http://localhost:5000/auth/microsoft/callback')
        
        # Scopes nécessaires pour créer des meetings Teams
        self.scopes = [
            'https://graph.microsoft.com/OnlineMeetings.ReadWrite',
            'https://graph.microsoft.com/Calendars.ReadWrite',
            'https://graph.microsoft.com/User.Read'
        ]
        
        self.graph_url = 'https://graph.microsoft.com/v1.0'
        self.token_file = 'data/microsoft_tokens/microsoft_token.json'
        
        # Créer le dossier pour les tokens si nécessaire
        os.makedirs(os.path.dirname(self.token_file), exist_ok=True)
    
    def _get_msal_app(self):
        """Créer l'application MSAL"""
        return msal.ConfidentialClientApplication(
            client_id=self.client_id,
            client_credential=self.client_secret,
            authority=f"https://login.microsoftonline.com/{self.tenant_id}"
        )
    
    def get_auth_url(self) -> str:
        """Générer l'URL d'authentification Microsoft"""
        app = self._get_msal_app()
        auth_url = app.get_authorization_request_url(
            scopes=self.scopes,
            redirect_uri=self.redirect_uri
        )
        return auth_url
    
    def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Échanger le code d'autorisation contre un token"""
        try:
            app = self._get_msal_app()
            result = app.acquire_token_by_authorization_code(
                code=code,
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            
            if 'access_token' in result:
                # Sauvegarder le token
                with open(self.token_file, 'w') as f:
                    json.dump(result, f, indent=2)
                
                return {'success': True, 'data': result}
            else:
                return {
                    'success': False, 
                    'error': result.get('error_description', 'Erreur d\'authentification')
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_access_token(self) -> Optional[str]:
        """Récupérer le token d'accès valide"""
        try:
            if not os.path.exists(self.token_file):
                return None
            
            with open(self.token_file, 'r') as f:
                token_data = json.load(f)
            
            # Vérifier si le token est encore valide
            if 'expires_in' in token_data:
                # Simple vérification - dans un vrai système, il faudrait gérer le refresh
                return token_data.get('access_token')
            
            return None
            
        except Exception as e:
            print(f"Erreur lors de la récupération du token: {e}")
            return None
    
    def _make_graph_request(self, endpoint: str, method: str = 'GET', data: dict = None) -> Dict[str, Any]:
        """Faire une requête à l'API Microsoft Graph"""
        token = self._get_access_token()
        if not token:
            return {'success': False, 'error': 'Token non disponible'}
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        url = f"{self.graph_url}/{endpoint}"
        
        try:
            if method == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                response = requests.get(url, headers=headers)
            
            if response.status_code in [200, 201]:
                return {'success': True, 'data': response.json()}
            else:
                return {
                    'success': False, 
                    'error': f'Erreur API: {response.status_code} - {response.text}'
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_online_meeting(self, interview_data: Dict[str, Any]) -> Dict[str, Any]:
        """Créer une réunion Teams"""
        try:
            # Préparer les données de la réunion
            start_time = datetime.fromisoformat(interview_data['scheduled_at'].replace('Z', '+00:00'))
            end_time = start_time + timedelta(minutes=interview_data.get('duration_minutes', 60))
            
            meeting_data = {
                "subject": f"Entretien - {interview_data['candidate_name']} - {interview_data['position']}",
                "startDateTime": start_time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                "endDateTime": end_time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                "participants": {
                    "attendees": [
                        {
                            "emailAddress": {
                                "address": interview_data['candidate_email'],
                                "name": interview_data['candidate_name']
                            }
                        }
                    ]
                }
            }
            
            # Créer la réunion en ligne
            result = self._make_graph_request('me/onlineMeetings', 'POST', meeting_data)
            
            if result['success']:
                meeting_info = result['data']
                return {
                    'success': True,
                    'meeting_id': meeting_info['id'],
                    'join_url': meeting_info['joinWebUrl'],
                    'organizer_url': meeting_info.get('joinWebUrl'),  # Teams n'a pas d'URL séparée pour l'organisateur
                    'meeting_data': meeting_info
                }
            else:
                return result
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_calendar_event(self, interview_data: Dict[str, Any], teams_info: Dict[str, Any]) -> Dict[str, Any]:
        """Créer un événement de calendrier avec la réunion Teams"""
        try:
            start_time = datetime.fromisoformat(interview_data['scheduled_at'].replace('Z', '+00:00'))
            end_time = start_time + timedelta(minutes=interview_data.get('duration_minutes', 60))
            
            event_data = {
                "subject": f"Entretien - {interview_data['candidate_name']} - {interview_data['position']}",
                "body": {
                    "contentType": "HTML",
                    "content": f"""
                    <p><strong>Entretien d'embauche</strong></p>
                    <p><strong>Candidat:</strong> {interview_data['candidate_name']}</p>
                    <p><strong>Poste:</strong> {interview_data['position']}</p>
                    <p><strong>Description:</strong> {interview_data.get('description', '')}</p>
                    <br>
                    <p><a href="{teams_info['join_url']}">Rejoindre la réunion Teams</a></p>
                    """
                },
                "start": {
                    "dateTime": start_time.strftime('%Y-%m-%dT%H:%M:%S.000'),
                    "timeZone": interview_data.get('timezone', 'UTC')
                },
                "end": {
                    "dateTime": end_time.strftime('%Y-%m-%dT%H:%M:%S.000'),
                    "timeZone": interview_data.get('timezone', 'UTC')
                },
                "attendees": [
                    {
                        "emailAddress": {
                            "address": interview_data['candidate_email'],
                            "name": interview_data['candidate_name']
                        },
                        "type": "required"
                    }
                ],
                "isOnlineMeeting": True,
                "onlineMeetingProvider": "teamsForBusiness",
                "onlineMeeting": {
                    "joinUrl": teams_info['join_url']
                }
            }
            
            result = self._make_graph_request('me/events', 'POST', event_data)
            
            if result['success']:
                return {
                    'success': True,
                    'event_id': result['data']['id'],
                    'calendar_link': result['data'].get('webLink'),
                    'event_data': result['data']
                }
            else:
                return result
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def update_meeting(self, meeting_id: str, interview_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mettre à jour une réunion Teams"""
        try:
            start_time = datetime.fromisoformat(interview_data['scheduled_at'].replace('Z', '+00:00'))
            end_time = start_time + timedelta(minutes=interview_data.get('duration_minutes', 60))
            
            update_data = {
                "subject": f"Entretien - {interview_data['candidate_name']} - {interview_data['position']}",
                "startDateTime": start_time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                "endDateTime": end_time.strftime('%Y-%m-%dT%H:%M:%S.000Z')
            }
            
            result = self._make_graph_request(f'me/onlineMeetings/{meeting_id}', 'PATCH', update_data)
            return result
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def delete_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Supprimer une réunion Teams"""
        try:
            result = self._make_graph_request(f'me/onlineMeetings/{meeting_id}', 'DELETE')
            return result
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def test_teams_integration(self) -> Dict[str, Any]:
        """Tester la connexion à Teams"""
        try:
            if not all([self.client_id, self.client_secret, self.tenant_id]):
                return {
                    'success': False,
                    'error': 'Configuration Microsoft manquante (client_id, client_secret, tenant_id)'
                }
            
            token = self._get_access_token()
            if not token:
                return {
                    'success': False,
                    'error': 'Token Microsoft non disponible. Authentification requise.'
                }
            
            # Test avec un appel à l'API User
            result = self._make_graph_request('me')
            
            if result['success']:
                user_info = result['data']
                return {
                    'success': True,
                    'user_name': user_info.get('displayName'),
                    'user_email': user_info.get('mail') or user_info.get('userPrincipalName'),
                    'tenant_id': self.tenant_id
                }
            else:
                return result
                
        except Exception as e:
            return {'success': False, 'error': str(e)}