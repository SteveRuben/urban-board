"""
Mock du service Meet pour eviter l'authentification OAuth au demarrage
"""

class MeetService:
    """Mock du service Meet"""
    
    def __init__(self):
        self.service = None
        print("Mock MeetService initialise")
    
    def is_available(self):
        """Mock - service toujours disponible"""
        return True
    
    def create_meeting(self, schedule_data):
        """Mock de creation de meeting"""
        return {
            'event_id': 'mock-event-123',
            'meet_link': 'https://meet.google.com/mock-meeting',
            'html_link': 'https://calendar.google.com/mock-event',
            'status': 'confirmed'
        }
    
    def update_meeting(self, event_id, schedule_data):
        """Mock de mise a jour de meeting"""
        return {
            'event_id': event_id,
            'meet_link': 'https://meet.google.com/mock-meeting-updated',
            'html_link': 'https://calendar.google.com/mock-event-updated',
            'status': 'confirmed'
        }
    
    def cancel_meeting(self, event_id, reason=None):
        """Mock d'annulation de meeting"""
        return True
    
    def get_meeting_info(self, event_id):
        """Mock d'info de meeting"""
        return {
            'event_id': event_id,
            'title': 'Mock Meeting',
            'description': 'Meeting de test',
            'start': '2025-07-20T10:00:00Z',
            'end': '2025-07-20T11:00:00Z',
            'meet_link': 'https://meet.google.com/mock-meeting',
            'html_link': 'https://calendar.google.com/mock-event',
            'status': 'confirmed',
            'attendees': []
        }
    
    def test_connection(self):
        """Mock de test de connexion"""
        return {
            'success': True,
            'calendar_name': 'Mock Calendar',
            'calendar_id': 'mock-calendar-id'
        }