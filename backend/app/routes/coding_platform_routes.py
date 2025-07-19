"""
Routes pour la plateforme de coding - Version simplifiée
"""
from flask import Blueprint, request, jsonify
from datetime import datetime

coding_platform_bp = Blueprint('coding_platform', __name__)

# Mock data pour les exercices
MOCK_EXERCISES = [
    {
        'id': 1,
        'title': 'Two Sum',
        'description': 'Trouver deux nombres dans un tableau qui s\'additionnent pour donner une cible',
        'difficulty': 'facile',
        'language': 'python',
        'category': 'algorithmes',
        'estimated_time': 15,
        'created_at': '2025-01-15T10:00:00Z',
        'status': 'active'
    },
    {
        'id': 2,
        'title': 'Reverse String',
        'description': 'Inverser une chaîne de caractères',
        'difficulty': 'facile',
        'language': 'javascript',
        'category': 'strings',
        'estimated_time': 10,
        'created_at': '2025-01-16T10:00:00Z',
        'status': 'active'
    },
    {
        'id': 3,
        'title': 'Binary Search',
        'description': 'Implémenter la recherche binaire',
        'difficulty': 'moyen',
        'language': 'python',
        'category': 'algorithmes',
        'estimated_time': 25,
        'created_at': '2025-01-17T10:00:00Z',
        'status': 'active'
    },
    {
        'id': 4,
        'title': 'Merge Sort',
        'description': 'Implémenter le tri fusion',
        'difficulty': 'difficile',
        'language': 'java',
        'category': 'tri',
        'estimated_time': 45,
        'created_at': '2025-01-18T10:00:00Z',
        'status': 'active'
    }
]

@coding_platform_bp.route('/admin/exercises', methods=['GET'])
def get_exercises():
    """Récupérer la liste des exercices avec filtres"""
    try:
        # Récupérer les paramètres de requête
        difficulty = request.args.get('difficulty')
        language = request.args.get('language')
        category = request.args.get('category')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Filtrer les exercices
        filtered_exercises = MOCK_EXERCISES.copy()
        
        if difficulty:
            filtered_exercises = [ex for ex in filtered_exercises if ex['difficulty'] == difficulty]
        
        if language:
            filtered_exercises = [ex for ex in filtered_exercises if ex['language'] == language]
            
        if category:
            filtered_exercises = [ex for ex in filtered_exercises if ex['category'] == category]
        
        # Pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_exercises = filtered_exercises[start_idx:end_idx]
        
        return jsonify({
            'success': True,
            'data': {
                'exercises': paginated_exercises,
                'total': len(filtered_exercises),
                'page': page,
                'limit': limit,
                'total_pages': (len(filtered_exercises) + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@coding_platform_bp.route('/admin/exercises', methods=['POST'])
def create_exercise():
    """Créer un nouvel exercice"""
    try:
        data = request.get_json()
        
        # Validation basique
        required_fields = ['title', 'description', 'difficulty', 'language', 'category']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Le champ {field} est requis'
                }), 400
        
        # Créer le nouvel exercice
        new_exercise = {
            'id': len(MOCK_EXERCISES) + 1,
            'title': data['title'],
            'description': data['description'],
            'difficulty': data['difficulty'],
            'language': data['language'],
            'category': data['category'],
            'estimated_time': data.get('estimated_time', 30),
            'created_at': datetime.now().isoformat() + 'Z',
            'status': 'active'
        }
        
        MOCK_EXERCISES.append(new_exercise)
        
        return jsonify({
            'success': True,
            'data': new_exercise
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@coding_platform_bp.route('/admin/exercises/<int:exercise_id>', methods=['GET'])
def get_exercise(exercise_id):
    """Récupérer un exercice spécifique"""
    try:
        exercise = next((ex for ex in MOCK_EXERCISES if ex['id'] == exercise_id), None)
        
        if not exercise:
            return jsonify({
                'success': False,
                'error': 'Exercice non trouvé'
            }), 404
        
        return jsonify({
            'success': True,
            'data': exercise
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@coding_platform_bp.route('/admin/exercises/<int:exercise_id>', methods=['PUT'])
def update_exercise(exercise_id):
    """Mettre à jour un exercice"""
    try:
        data = request.get_json()
        
        # Trouver l'exercice
        exercise_idx = next((i for i, ex in enumerate(MOCK_EXERCISES) if ex['id'] == exercise_id), None)
        
        if exercise_idx is None:
            return jsonify({
                'success': False,
                'error': 'Exercice non trouvé'
            }), 404
        
        # Mettre à jour les champs
        exercise = MOCK_EXERCISES[exercise_idx]
        for key, value in data.items():
            if key in exercise:
                exercise[key] = value
        
        return jsonify({
            'success': True,
            'data': exercise
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@coding_platform_bp.route('/admin/exercises/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    """Supprimer un exercice"""
    try:
        exercise_idx = next((i for i, ex in enumerate(MOCK_EXERCISES) if ex['id'] == exercise_id), None)
        
        if exercise_idx is None:
            return jsonify({
                'success': False,
                'error': 'Exercice non trouvé'
            }), 404
        
        deleted_exercise = MOCK_EXERCISES.pop(exercise_idx)
        
        return jsonify({
            'success': True,
            'message': 'Exercice supprimé avec succès',
            'data': deleted_exercise
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@coding_platform_bp.route('/exercises/execute', methods=['POST'])
def execute_code():
    """Exécuter du code"""
    try:
        data = request.get_json()
        
        code = data.get('code', '')
        language = data.get('language', 'python')
        test_cases = data.get('test_cases', [])
        
        # Mock d'exécution
        return jsonify({
            'success': True,
            'data': {
                'output': f'Code {language} exécuté avec succès',
                'execution_time': 0.5,
                'memory_usage': '10MB',
                'status': 'completed',
                'test_results': [
                    {
                        'test_case': i + 1,
                        'passed': True,
                        'expected': 'expected_output',
                        'actual': 'expected_output'
                    } for i in range(len(test_cases))
                ]
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@coding_platform_bp.route('/stats', methods=['GET'])
def get_stats():
    """Récupérer les statistiques"""
    try:
        stats = {
            'total_exercises': len(MOCK_EXERCISES),
            'by_difficulty': {
                'facile': len([ex for ex in MOCK_EXERCISES if ex['difficulty'] == 'facile']),
                'moyen': len([ex for ex in MOCK_EXERCISES if ex['difficulty'] == 'moyen']),
                'difficile': len([ex for ex in MOCK_EXERCISES if ex['difficulty'] == 'difficile'])
            },
            'by_language': {
                'python': len([ex for ex in MOCK_EXERCISES if ex['language'] == 'python']),
                'javascript': len([ex for ex in MOCK_EXERCISES if ex['language'] == 'javascript']),
                'java': len([ex for ex in MOCK_EXERCISES if ex['language'] == 'java'])
            }
        }
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500