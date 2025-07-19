"""
Mock du service d'exécution pour simplifier le démarrage
"""

class ExecutionServiceFactory:
    """Mock du service d'exécution"""
    
    @staticmethod
    def get_execution_service(language):
        """Retourne un mock du service d'exécution"""
        return MockExecutionService()

class MockExecutionService:
    """Service d'exécution simulé"""
    
    def execute_code(self, code, language, test_cases=None):
        """Simule l'exécution de code"""
        return {
            'success': True,
            'output': f'Code {language} exécuté avec succès (mock)',
            'execution_time': 0.5,
            'memory_usage': '10MB',
            'status': 'completed'
        }
    
    def validate_code(self, code, language, test_cases):
        """Simule la validation de code"""
        return {
            'success': True,
            'passed_tests': len(test_cases) if test_cases else 0,
            'total_tests': len(test_cases) if test_cases else 0,
            'results': []
        }