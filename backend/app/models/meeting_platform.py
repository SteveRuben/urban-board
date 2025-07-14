from enum import Enum

class MeetingPlatform(Enum):
    """Énumération des plateformes de réunion supportées"""
    GOOGLE_MEET = 'google_meet'
    TEAMS = 'teams'
    
    @classmethod
    def get_choices(cls):
        """Retourner les choix pour le frontend"""
        return [
            {'value': cls.GOOGLE_MEET.value, 'label': 'Google Meet'},
            {'value': cls.TEAMS.value, 'label': 'Microsoft Teams'}
        ]
    
    @classmethod
    def is_valid(cls, platform: str) -> bool:
        """Vérifier si la plateforme est valide"""
        return platform in [p.value for p in cls]
