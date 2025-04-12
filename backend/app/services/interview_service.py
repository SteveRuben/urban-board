# backend/app/services/interview_service.py
from .llm_service import get_llm_response
from .notification_service import NotificationService
from .email_notification_service import EmailNotificationService
import json
import uuid
from datetime import datetime
from ..models.interview import Interview
from app import db
from sqlalchemy import desc

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
    try:
        # Créer une nouvelle instance du modèle Interview
        new_interview = Interview(
            title=interview_data.get('title', 'Entretien sans titre'),
            job_title=interview_data.get('job_title', ''),
            job_description=interview_data.get('job_description'),
            experience_level=interview_data.get('experience_level'),
            interview_mode=interview_data.get('interview_mode', 'autonomous'),
            status=interview_data.get('status', 'draft'),
            candidate_name=interview_data.get('candidate_name'),
            candidate_email=interview_data.get('candidate_email'),
            cv_file_path=interview_data.get('cv_file_path'),
            created_by=interview_data.get('created_by'),
            scheduled_for=interview_data.get('scheduled_for')
        )
        
        # Ajouter et committer à la base de données
        db.session.add(new_interview)
        db.session.commit()
        
        # Retourner l'entretien sous forme de dictionnaire
        return new_interview.to_dict()
        
    except Exception as e:
        db.session.rollback()
        raise e

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
    try:
        # Récupérer l'entretien
        interview = Interview.query.get(interview_id)
        if not interview:
            return None
        
        # Mettre à jour les champs
        interview.status = 'completed'
        interview.completed_at = datetime.utcnow()
        
        # Mettre à jour d'autres champs si fournis
        for key, value in interview_data.items():
            if hasattr(interview, key) and key not in ['id', 'created_at', 'created_by']:
                setattr(interview, key, value)
        
        # Sauvegarder les modifications
        db.session.commit()
        
        # Envoyer des notifications
        if recruiter_id:
            notification_service.create_interview_completed_notification(
                user_id=recruiter_id,
                interview_data=interview.to_dict()
            )
        
        if recruiter_email:
            email_service.send_interview_completed_notification(
                recipient_email=recruiter_email,
                interview_data=interview.to_dict()
            )
        
        return interview.to_dict()
        
    except Exception as e:
        db.session.rollback()
        raise e

def get_interview(interview_id):
    """
    Récupère un entretien par son ID.
    
    Args:
        interview_id (str): ID de l'entretien
        
    Returns:
        dict: Données de l'entretien ou None si non trouvé
    """
    interview = Interview.query.get(interview_id)
    if not interview:
        return None
    
    return interview.to_dict_with_relations()

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
    try:
        # Récupérer l'entretien
        interview = Interview.query.get(interview_id)
        if not interview:
            return None
        
        # Mettre à jour le statut
        interview.status = status
        
        # Ajouter des timestamps selon le statut
        if status == 'in_progress':
            interview.started_at = datetime.utcnow()
        elif status == 'completed':
            interview.completed_at = datetime.utcnow()
        
        # Ajouter des données supplémentaires si fournies
        if additional_data:
            for key, value in additional_data.items():
                if hasattr(interview, key) and key not in ['id', 'created_at', 'created_by']:
                    setattr(interview, key, value)
        
        # Sauvegarder les modifications
        db.session.commit()
        
        # Si l'entretien est terminé, envoyer des notifications
        if status == 'completed':
            creator = interview.creator
            if creator:
                complete_interview(
                    interview_id=interview_id,
                    interview_data={},  # Pas besoin de données supplémentaires ici
                    recruiter_id=creator.id,
                    recruiter_email=creator.email if hasattr(creator, 'email') else None
                )
        
        return interview.to_dict()
        
    except Exception as e:
        db.session.rollback()
        raise e

def get_user_interviews(user_id, page=1, per_page=10, status=None, search=None, sort_by='created_at', sort_dir='desc'):
    """
    Récupère la liste des entretiens créés par un utilisateur avec pagination.
    
    Args:
        user_id (int): ID de l'utilisateur créateur
        page (int, optional): Numéro de page. Defaults to 1.
        per_page (int, optional): Nombre d'entretiens par page. Defaults to 10.
        status (str, optional): Filtrer par statut ('draft', 'scheduled', etc). Defaults to None.
        search (str, optional): Terme de recherche pour le titre ou le nom du candidat. Defaults to None.
        sort_by (str, optional): Champ de tri. Defaults to 'created_at'.
        sort_dir (str, optional): Direction du tri ('asc' ou 'desc'). Defaults to 'desc'.
    
    Returns:
        dict: Contient les éléments suivants:
            - items: Liste des entretiens pour la page demandée
            - total: Nombre total d'entretiens correspondant aux critères
            - pages: Nombre total de pages
            - page: Numéro de la page actuelle
            - per_page: Nombre d'éléments par page
    """
    try:
        # Construire la requête de base
        query = Interview.query.filter_by(created_by=user_id)
        
        # Appliquer les filtres
        if status:
            query = query.filter_by(status=status)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Interview.title.ilike(search_term)) | 
                (Interview.candidate_name.ilike(search_term)) |
                (Interview.job_title.ilike(search_term))
            )
        
        # Appliquer le tri
        if hasattr(Interview, sort_by):
            sort_attr = getattr(Interview, sort_by)
            if sort_dir.lower() == 'desc':
                query = query.order_by(desc(sort_attr))
            else:
                query = query.order_by(sort_attr)
        else:
            # Par défaut, trier par date de création décroissante
            query = query.order_by(desc(Interview.created_at))
        
        # Paginer les résultats
        paginated_interviews = query.paginate(page=page, per_page=per_page)
        
        # Préparer le résultat
        result = {
            'items': [interview.to_dict() for interview in paginated_interviews.items],
            'total': paginated_interviews.total,
            'pages': paginated_interviews.pages,
            'page': page,
            'per_page': per_page
        }
        
        return result
        
    except Exception as e:
        # Log l'erreur et la propager
        print(f"Erreur lors de la récupération des entretiens: {str(e)}")
        raise e

def delete_interview(interview_id, user_id=None):
    """
    Supprime un entretien. Si user_id est fourni, vérifie que l'utilisateur est bien le créateur.
    
    Args:
        interview_id (int): ID de l'entretien à supprimer
        user_id (int, optional): ID de l'utilisateur qui demande la suppression. Defaults to None.
    
    Returns:
        bool: True si la suppression a réussi, False sinon
    """
    try:
        interview = Interview.query.get(interview_id)
        if not interview:
            return False
        
        # Vérifier que l'utilisateur est autorisé à supprimer cet entretien
        if user_id is not None and interview.created_by != user_id:
            return False
        
        # Supprimer l'entretien
        db.session.delete(interview)
        db.session.commit()
        
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la suppression de l'entretien {interview_id}: {str(e)}")
        return False

def update_interview(interview_id, update_data, user_id=None):
    """
    Met à jour un entretien. Si user_id est fourni, vérifie que l'utilisateur est bien le créateur.
    
    Args:
        interview_id (int): ID de l'entretien à mettre à jour
        update_data (dict): Données à mettre à jour
        user_id (int, optional): ID de l'utilisateur qui demande la mise à jour. Defaults to None.
    
    Returns:
        dict: Entretien mis à jour ou None si non trouvé ou non autorisé
    """
    try:
        interview = Interview.query.get(interview_id)
        if not interview:
            return None
        
        # Vérifier que l'utilisateur est autorisé à mettre à jour cet entretien
        if user_id is not None and interview.created_by != user_id:
            return None
        
        # Mettre à jour les champs
        for key, value in update_data.items():
            if hasattr(interview, key) and key not in ['id', 'created_at', 'created_by']:
                setattr(interview, key, value)
        
        # Sauvegarder les modifications
        db.session.commit()
        
        return interview.to_dict()
        
    except Exception as e:
        db.session.rollback()
        print(f"Erreur lors de la mise à jour de l'entretien {interview_id}: {str(e)}")
        return None