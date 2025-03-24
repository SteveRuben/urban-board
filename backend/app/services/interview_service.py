# backend/app/services/interview_service.py
from .llm_service import get_llm_response
from .notification_service import NotificationService
from .email_notification_service import EmailNotificationService
import json
import uuid
from datetime import datetime

# Initialisation des services
notification_service = NotificationService()
email_service = EmailNotificationService()

# Exemple de template de prompt pour générer des questions d'entretien
INTERVIEW_QUESTIONS_PROMPT_TEMPLATE = """
Tu es un recruteur expert pour le poste de {job_role} avec un niveau d'expérience {experience_level}.
Génère une liste de 5 questions techniques pertinentes pour évaluer les compétences d'un candidat.
Chaque question doit être adaptée au niveau d'expérience demandé.
Fournis la réponse au format JSON avec la structure suivante:
[
  {{"question": "Question 1", "difficulty": "facile/moyenne/difficile", "category": "catégorie de la question"}},
  ...
]
"""

# Template pour évaluer les réponses
EVALUATION_PROMPT_TEMPLATE = """
Tu es un recruteur expert évaluant une réponse de candidat. 
Question: {question}
Réponse du candidat: {response}

Évalue cette réponse sur les critères suivants:
1. Exactitude technique (de 1 à 5)
2. Clarté de communication (de 1 à 5)
3. Profondeur de compréhension (de 1 à 5)

Explique brièvement ton évaluation pour chaque critère.
Fournis ta réponse au format JSON avec la structure suivante:
{{
  "exactitude": score,
  "clarté": score,
  "profondeur": score,
  "score_global": moyenne_des_scores,
  "feedback": "Feedback détaillé",
  "points_forts": ["point fort 1", "point fort 2"],
  "axes_amélioration": ["axe 1", "axe 2"]
}}
"""

def generate_interview_questions(job_role, experience_level):
    """
    Génère des questions d'entretien personnalisées en fonction du poste et du niveau d'expérience.
    
    Args:
        job_role (str): Le poste pour lequel le candidat postule
        experience_level (str): Le niveau d'expérience du candidat (débutant, intermédiaire, expert)
        
    Returns:
        list: Liste de questions formatées avec difficulté et catégorie
    """
    # Construire le prompt
    prompt = INTERVIEW_QUESTIONS_PROMPT_TEMPLATE.format(
        job_role=job_role,
        experience_level=experience_level
    )
    
    # Appeler le service LLM pour obtenir une réponse
    response = get_llm_response(prompt)
    
    try:
        # Essayer de parser la réponse comme du JSON
        questions = json.loads(response)
    except json.JSONDecodeError:
        # Si le format n'est pas correct, retourner un ensemble de questions par défaut
        questions = [
            {
                "question": f"Quelles sont vos expériences en tant que {job_role}?",
                "difficulty": "facile",
                "category": "expérience"
            },
            {
                "question": "Décrivez un projet difficile sur lequel vous avez travaillé.",
                "difficulty": "moyenne",
                "category": "résolution de problèmes"
            },
            {
                "question": "Comment restez-vous à jour avec les nouvelles technologies?",
                "difficulty": "facile",
                "category": "développement personnel"
            }
        ]
    
    return questions

def evaluate_response(question, response):
    """
    Évalue la réponse d'un candidat à une question d'entretien.
    
    Args:
        question (str): La question posée
        response (str): La réponse du candidat
        
    Returns:
        dict: Évaluation détaillée de la réponse
    """
    # Construire le prompt
    prompt = EVALUATION_PROMPT_TEMPLATE.format(
        question=question,
        response=response
    )
    
    # Appeler le service LLM pour obtenir une évaluation
    llm_response = get_llm_response(prompt)
    
    try:
        # Essayer de parser la réponse comme du JSON
        evaluation = json.loads(llm_response)
    except json.JSONDecodeError:
        # Si le format n'est pas correct, retourner une évaluation par défaut
        evaluation = {
            "exactitude": 3,
            "clarté": 3,
            "profondeur": 3,
            "score_global": 3.0,
            "feedback": "Réponse acceptable mais manque de détails.",
            "points_forts": ["Communication claire"],
            "axes_amélioration": ["Ajouter plus d'exemples concrets"]
        }
    
    return evaluation

def create_interview(interview_data):
    """
    Crée un nouvel entretien dans le système.
    
    Args:
        interview_data (dict): Données de l'entretien à créer
        
    Returns:
        dict: Entretien créé avec ID généré
    """
    # Dans une implémentation réelle, cette fonction sauvegarderait
    # l'entretien dans une base de données
    
    # Générer un ID unique
    interview_id = str(uuid.uuid4())
    
    # Ajouter des métadonnées
    interview = {
        **interview_data,
        "id": interview_id,
        "status": "scheduled",
        "created_at": datetime.now().isoformat()
    }
    
    # Ici, nous devrions sauvegarder l'entretien dans la base de données
    # ...
    
    return interview

def complete_interview(interview_id, interview_data, recruiter_id=None, recruiter_email=None):
    """
    Marque un entretien comme terminé et envoie des notifications.
    
    Args:
        interview_id (str): ID de l'entretien
        interview_data (dict): Données mises à jour de l'entretien
        recruiter_id (str, optional): ID du recruteur à notifier
        recruiter_email (str, optional): Email du recruteur pour les notifications par email
        
    Returns:
        dict: Entretien mis à jour
    """
    # Dans une implémentation réelle, nous mettrions à jour l'entretien dans la base de données
    # ...
    
    # Mettre à jour le statut et ajouter un timestamp
    updated_interview = {
        **interview_data,
        "status": "completed",
        "completed_at": datetime.now().isoformat()
    }
    
    # Si un ID de recruteur est fourni, envoyer une notification
    if recruiter_id:
        notification_service.create_interview_completed_notification(
            user_id=recruiter_id,
            interview_data=updated_interview
        )
    
    # Si un email de recruteur est fourni, envoyer un email
    if recruiter_email:
        email_service.send_interview_completed_notification(
            recipient_email=recruiter_email,
            interview_data=updated_interview
        )
    
    return updated_interview

def get_interview(interview_id):
    """
    Récupère un entretien par son ID.
    
    Args:
        interview_id (str): ID de l'entretien
        
    Returns:
        dict: Données de l'entretien ou None si non trouvé
    """
    # Dans une implémentation réelle, nous récupérerions l'entretien depuis la base de données
    # ...
    
    # Pour la démo, on retourne None
    return None

def update_interview_status(interview_id, status, additional_data=None):
    """
    Met à jour le statut d'un entretien.
    
    Args:
        interview_id (str): ID de l'entretien
        status (str): Nouveau statut ('scheduled', 'in_progress', 'completed', 'cancelled')
        additional_data (dict, optional): Données supplémentaires à mettre à jour
        
    Returns:
        dict: Entretien mis à jour ou None si non trouvé
    """
    # Récupérer l'entretien existant
    interview = get_interview(interview_id)
    if not interview:
        return None
    
    # Mettre à jour le statut
    interview['status'] = status
    
    # Ajouter des timestamps selon le statut
    if status == 'in_progress':
        interview['started_at'] = datetime.now().isoformat()
    elif status == 'completed':
        interview['completed_at'] = datetime.now().isoformat()
    elif status == 'cancelled':
        interview['cancelled_at'] = datetime.now().isoformat()
    
    # Ajouter des données supplémentaires si fournies
    if additional_data:
        interview.update(additional_data)
    
    # Dans une implémentation réelle, sauvegarder les modifications
    # ...
    
    # Si l'entretien est terminé, envoyer des notifications
    if status == 'completed':
        # Récupérer l'ID du recruteur depuis l'entretien
        recruiter_id = interview.get('recruiter_id')
        recruiter_email = interview.get('recruiter_email')
        
        if recruiter_id or recruiter_email:
            complete_interview(
                interview_id=interview_id,
                interview_data=interview,
                recruiter_id=recruiter_id,
                recruiter_email=recruiter_email
            )
    
    return interview