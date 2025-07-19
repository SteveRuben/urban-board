"""
Mock du service de plateforme de codage
"""

class CodingPlatformService:
    """Mock du service de plateforme de codage"""
    
    def __init__(self, app=None):
        self.app = app
    
    def init_app(self, app):
        """Initialise le service avec l'application Flask"""
        self.app = app
    
    def get_platforms(self):
        """Retourne une liste de plateformes de codage simulées"""
        return [
            {'id': 'mock-1', 'name': 'Mock Platform 1', 'url': 'https://example.com/1'},
            {'id': 'mock-2', 'name': 'Mock Platform 2', 'url': 'https://example.com/2'}
        ]
    
    def get_platform(self, platform_id):
        """Retourne une plateforme de codage simulée"""
        return {
            'id': platform_id, 
            'name': f'Mock Platform {platform_id}', 
            'url': f'https://example.com/{platform_id}'
        }
    
    def create_exercise(self, platform_id, exercise_data):
        """Crée un exercice simulé"""
        return {
            'id': 'mock-exercise-1', 
            'platform_id': platform_id, 
            'title': exercise_data.get('title', 'Mock Exercise')
        }