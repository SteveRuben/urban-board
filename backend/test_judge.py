# test_judge0.py - Script de diagnostic
import requests
import base64
import json
from flask import Flask
from app.__init__ import create_app

def test_judge0_connection():
    """Teste la connexion à Judge0"""
    app = create_app()
    
    with app.app_context():
        api_key = app.config.get('JUDGE0_API_KEY')
        api_url = app.config.get('JUDGE0_API_URL')
        
        print(f"🔧 Configuration:")
        print(f"   JUDGE0_API_URL: {api_url}")
        print(f"   JUDGE0_API_KEY: {'configuré' if api_key else 'MANQUANT'}")
        
        if not api_key or not api_url:
            print("❌ Configuration Judge0 manquante!")
            return False
        
        # Test simple avec Python
        test_code = 'print("Hello World")'
        test_input = ''
        expected_output = 'Hello World'
        
        submission_data = {
            'source_code': base64.b64encode(test_code.encode()).decode(),
            'language_id': 71,  # Python 3
            'stdin': base64.b64encode(test_input.encode()).decode() if test_input else '',
            'expected_output': base64.b64encode(expected_output.encode()).decode(),
        }
        
        headers = {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': api_key,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
        
        submit_url = f"{api_url}/submissions?wait=true&base64_encoded=true"
        
        try:
            print(f"🔧 Test de l'API Judge0...")
            response = requests.post(submit_url, json=submission_data, headers=headers, timeout=30)
            
            print(f"🔧 Status: {response.status_code}")
            print(f"🔧 Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                stdout = base64.b64decode(result.get('stdout', '')).decode() if result.get('stdout') else ''
                stderr = base64.b64decode(result.get('stderr', '')).decode() if result.get('stderr') else ''
                
                print(f"✅ Test réussi!")
                print(f"   Sortie: '{stdout}'")
                print(f"   Erreur: '{stderr}'")
                print(f"   Status: {result.get('status', {})}")
                return True
            else:
                print(f"❌ Erreur API: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            return False

def test_local_service():
    """Teste le service local"""
    from app.services.coding_platform_service import CodeExecutionService
    from app.types.coding_platform import ProgrammingLanguage
    
    app = create_app()
    
    with app.app_context():
        print(f"🔧 Test du CodeExecutionService local...")
        
        result = CodeExecutionService.execute_code(
            code='print("Hello World")',
            language=ProgrammingLanguage.PYTHON,
            test_input='',
            expected_output='Hello World',
            timeout=5
        )
        
        print(f"🔧 Résultat: {json.dumps(result, indent=2)}")
        return result.get('success', False)

if __name__ == "__main__":
    print("=== DIAGNOSTIC JUDGE0 ===")
    
    # Test 1: Configuration
    if not test_judge0_connection():
        print("❌ Test de connexion Judge0 échoué")
    
    # Test 2: Service local
    if not test_local_service():
        print("❌ Test du service local échoué")
    
    print("=== FIN DIAGNOSTIC ===")