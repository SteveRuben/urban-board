# backend/app/routes/interview.py
from flask import request, jsonify, current_app, g
from . import interview_bp
from ..middleware.auth_middleware import token_required
from ..middleware.rate_limit import standard_limit
from ..services.interview_service import (
    generate_interview_questions,
    evaluate_response,
    create_interview,
    complete_interview,
    update_interview_status,
    get_user_interviews
)

@interview_bp.route('/', methods=['GET'])
@token_required
@standard_limit
def list_interviews_route():
    """liste les entretiens de l'utilisateur connecté"""
    user_id = g.current_user.user_id
    interviews = get_user_interviews(user_id)
    return jsonify(interviews), 201

@interview_bp.route('/', methods=['POST'])
def create_interview_route():
    """Crée un nouvel entretien"""
    data = request.json
    
    # Vérifier les champs obligatoires
    required_fields = ['job_role', 'candidate_name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
    
    # Créer l'entretien
    interview = create_interview(data)
    
    return jsonify(interview), 201

@interview_bp.route('/<interview_id>', methods=['GET'])
def get_interview_route(interview_id):
    """Récupère les détails d'un entretien spécifique"""
    # Dans une implémentation réelle, cette fonction récupérerait
    # les données de l'entretien depuis une base de données
    
    # Pour la démo, nous retournons des données factices
    interview = {
        "id": interview_id,
        "job_role": "Développeur Full Stack",
        "experience_level": "intermediaire",
        "candidate_name": "Thomas Dubois",
        "candidate_email": "thomas.dubois@example.com",
        "status": "completed",
        "created_at": "2023-05-15T10:30:00",
        "completed_at": "2023-05-15T11:45:00",
        "score": 7.8,
        "recruiter_id": "rec-001",
        "recruiter_email": "recruiter@example.com"
    }
    
    return jsonify(interview)

@interview_bp.route('/<interview_id>', methods=['PUT'])
def update_interview_route(interview_id):
    """Met à jour un entretien existant"""
    data = request.json
    
    # Vérifier si un nouveau statut est fourni
    status = data.get('status')
    if status:
        # Si le statut passe à "completed", nous devons envoyer des notifications
        if status == 'completed':
            updated_interview = complete_interview(
                interview_id=interview_id,
                interview_data=data,
                recruiter_id=data.get('recruiter_id'),
                recruiter_email=data.get('recruiter_email')
            )
        else:
            # Mettre à jour le statut sans envoyer de notifications
            updated_interview = update_interview_status(
                interview_id=interview_id,
                status=status,
                additional_data=data
            )
    else:
        # Si le statut n'est pas modifié, simplement mettre à jour les données
        # Dans une implémentation réelle, cette fonction mettrait à jour
        # les données de l'entretien dans une base de données
        updated_interview = {
            **data,
            "id": interview_id,
            "updated_at": "2023-05-15T12:00:00"
        }
    
    return jsonify(updated_interview)

@interview_bp.route('/<interview_id>/questions', methods=['GET'])
def get_questions(interview_id):
    """Récupère les questions pour un entretien spécifique"""
    # Si des données de profil sont fournies, on peut personnaliser les questions
    job_role = request.args.get('job_role', 'développeur')
    experience_level = request.args.get('experience_level', 'intermédiaire')
    
    # Utiliser le service pour générer des questions
    questions = generate_interview_questions(job_role, experience_level)
    
    return jsonify({"interview_id": interview_id, "questions": questions})

@interview_bp.route('/<interview_id>/evaluate', methods=['POST'])
def evaluate_interview(interview_id):
    """Évalue une réponse d'entretien"""
    data = request.json
    question = data.get('question')
    response = data.get('response')
    
    # Utiliser le service pour évaluer la réponse
    evaluation = evaluate_response(question, response)
    
    return jsonify({"evaluation": evaluation})

@interview_bp.route('/<interview_id>/complete', methods=['POST'])
def complete_interview_route(interview_id):
    """
    Marque un entretien comme terminé et déclenche les notifications.
    Cette route est utilisée spécifiquement pour terminer un entretien
    et envoyer des notifications aux recruteurs.
    """
    data = request.json
    
    # Vérifier que les données essentielles sont présentes
    if not data.get('score'):
        return jsonify({"error": "Le score est obligatoire pour terminer un entretien"}), 400
    
    # Récupérer les informations du recruteur
    recruiter_id = data.get('recruiter_id')
    recruiter_email = data.get('recruiter_email')
    
    # Au moins une méthode de notification doit être fournie
    if not recruiter_id and not recruiter_email:
        return jsonify({"error": "Veuillez fournir recruiter_id ou recruiter_email pour les notifications"}), 400
    
    # Mettre à jour le statut et envoyer des notifications
    updated_interview = complete_interview(
        interview_id=interview_id,
        interview_data=data,
        recruiter_id=recruiter_id,
        recruiter_email=recruiter_email
    )
    
    return jsonify({
        "message": "Entretien terminé avec succès et notifications envoyées",
        "interview": updated_interview
    })

@interview_bp.route('/test-notification', methods=['POST'])
def test_notification():
    """
    Route de test pour envoyer une notification de fin d'entretien (utile pour le développement)
    """
    if current_app.config['ENV'] != 'development':
        return jsonify({"error": "Cette route n'est disponible qu'en environnement de développement"}), 403
    
    data = request.json
    recruiter_id = data.get('recruiter_id')
    recruiter_email = data.get('recruiter_email')
    
    if not recruiter_id and not recruiter_email:
        return jsonify({"error": "Veuillez fournir recruiter_id ou recruiter_email"}), 400
    
    # Données de test
    test_interview = {
        "id": "test-" + str(int(datetime.now().timestamp())),
        "job_role": "Développeur Full Stack Test",
        "candidate_name": "Candidat Test",
        "status": "completed",
        "completed_at": datetime.now().isoformat(),
        "score": 8.5
    }
    
    # Envoyer les notifications
    complete_interview(
        interview_id=test_interview["id"],
        interview_data=test_interview,
        recruiter_id=recruiter_id,
        recruiter_email=recruiter_email
    )
    
    return jsonify({
        "message": "Notification de test envoyée avec succès",
        "interview": test_interview
    })