# backend/routes/ai_routes.py
from flask import Blueprint, request, jsonify, current_app
from ..services.ai_interview_service import ai_service
from ..models.interview import Interview
from ..models.question import Question
from ..models.response import Response
from ..models.evaluation import Evaluation
from ..models.biometric_data import BiometricData
from ..middleware.auth_middleware import token_required as auth_required
from ..middleware.auth_middleware import get_current_user
from datetime import datetime

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/generate-questions', methods=['POST'])
@auth_required
def generate_questions():
    """Génère des questions d'entretien basées sur le rôle et le niveau d'expérience"""
    data = request.json
    
    if not data:
        return jsonify({"error": "Données manquantes"}), 400
    
    job_role = data.get('job_role', '')
    experience_level = data.get('experience_level', '')
    number_of_questions = data.get('number_of_questions', 5)
    specialization = data.get('specialization')
    
    if not job_role or not experience_level:
        return jsonify({"error": "Le rôle et le niveau d'expérience sont requis"}), 400
    
    try:
        # Limiter le nombre de questions à un maximum raisonnable
        if number_of_questions > 10:
            number_of_questions = 10
            
        questions = ai_service.generate_questions(
            job_role, 
            experience_level, 
            number_of_questions, 
            specialization
        )
        
        return jsonify({"questions": questions})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la génération des questions: {str(e)}")
        return jsonify({"error": "Erreur lors de la génération des questions"}), 500

@ai_bp.route('/evaluate-response', methods=['POST'])
@auth_required
def evaluate_response():
    """Évalue la réponse d'un candidat à une question d'entretien"""
    data = request.json
    
    if not data:
        return jsonify({"error": "Données manquantes"}), 400
    
    question = data.get('question', '')
    response_text = data.get('response', '')
    job_role = data.get('job_role', '')
    experience_level = data.get('experience_level', '')
    
    if not question or not response_text:
        return jsonify({"error": "La question et la réponse sont requises"}), 400
    
    try:
        evaluation = ai_service.evaluate_response(
            question, 
            response_text, 
            job_role, 
            experience_level
        )
        
        return jsonify({"evaluation": evaluation})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'évaluation de la réponse: {str(e)}")
        return jsonify({"error": "Erreur lors de l'évaluation de la réponse"}), 500

@ai_bp.route('/analyze-biometrics', methods=['POST'])
@auth_required
def analyze_biometrics():
    """Analyse les caractéristiques biométriques d'une image"""
    data = request.json
    
    if not data or 'image_data' not in data:
        return jsonify({"error": "Données d'image manquantes"}), 400
    
    image_data = data.get('image_data')
    
    try:
        analysis = ai_service.analyze_biometrics(image_data)
        return jsonify({"analysis": analysis})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'analyse biométrique: {str(e)}")
        return jsonify({"error": "Erreur lors de l'analyse biométrique"}), 500

@ai_bp.route('/transcribe', methods=['POST'])
@auth_required
def transcribe_audio():
    """Transcrit un fichier audio en texte"""
    if 'audio' not in request.files:
        return jsonify({"error": "Fichier audio manquant"}), 400
    
    audio_file = request.files['audio']
    
    if audio_file.filename == '':
        return jsonify({"error": "Aucun fichier sélectionné"}), 400
    
    try:
        transcript = ai_service.transcribe_audio(audio_file)
        return jsonify({"transcript": transcript})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la transcription: {str(e)}")
        return jsonify({"error": "Erreur lors de la transcription audio"}), 500

@ai_bp.route('/generate-summary', methods=['POST'])
@auth_required
def generate_interview_summary():
    """Génère un résumé complet de l'entretien"""
    data = request.json
    
    if not data or 'interview_data' not in data:
        return jsonify({"error": "Données d'entretien manquantes"}), 400
    
    interview_data = data.get('interview_data')
    
    try:
        summary = ai_service.generate_interview_summary(interview_data)
        
        # Si un ID d'entretien est fourni, enregistrer le résumé dans la base de données
        interview_id = interview_data.get('interviewId')
        if interview_id:
            from ..models.db import db
            from ..models.interview import InterviewSummary
            
            # Vérifier si un résumé existe déjà
            existing_summary = InterviewSummary.query.filter_by(interview_id=interview_id).first()
            
            if existing_summary:
                # Mettre à jour le résumé existant
                existing_summary.content = summary
                existing_summary.updated_at = datetime.utcnow()
            else:
                # Créer un nouveau résumé
                new_summary = InterviewSummary(
                    interview_id=interview_id,
                    content=summary,
                    created_by=get_current_user().id
                )
                db.session.add(new_summary)
            
            db.session.commit()
        
        return jsonify({"summary": summary})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la génération du résumé: {str(e)}")
        return jsonify({"error": "Erreur lors de la génération du résumé d'entretien"}), 500

@ai_bp.route('/generate-questions-from-cv', methods=['POST'])
@auth_required
def generate_questions_from_cv():
    """Génère des questions d'entretien basées sur le CV et la description du poste"""
    data = request.json
    
    if not data:
        return jsonify({"error": "Données manquantes"}), 400
    
    job_description = data.get('job_description', '')
    cv_text = data.get('cv_text', '')
    number_of_questions = data.get('number_of_questions', 5)
    experience_level = data.get('experience_level')
    
    if not job_description or not cv_text:
        return jsonify({"error": "La description du poste et le CV sont requis"}), 400
    
    try:
        # Limiter le nombre de questions à un maximum raisonnable
        if number_of_questions > 10:
            number_of_questions = 10
            
        questions = ai_service.generate_questions_from_cv_and_job(
            job_description, 
            cv_text, 
            number_of_questions, 
            experience_level
        )
        
        return jsonify({"questions": questions})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la génération des questions: {str(e)}")
        return jsonify({"error": "Erreur lors de la génération des questions"}), 500

# Nouvelle route pour extraire le texte d'un CV au format PDF
@ai_bp.route('/extract-cv-text', methods=['POST'])
@auth_required
def extract_cv_text():
    """Extrait le texte d'un CV au format PDF"""
    if 'cv_file' not in request.files:
        return jsonify({"error": "Fichier CV manquant"}), 400
    
    cv_file = request.files['cv_file']
    
    if cv_file.filename == '':
        return jsonify({"error": "Aucun fichier sélectionné"}), 400
    
    # Vérifier que le fichier est un PDF
    if not cv_file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Le fichier doit être au format PDF"}), 400
    
    try:
        # Utiliser PyPDF2 pour extraire le texte
        import PyPDF2
        pdf_reader = PyPDF2.PdfReader(cv_file)
        cv_text = ""
        
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            cv_text += page.extract_text()
        
        return jsonify({"cv_text": cv_text})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'extraction du texte du CV: {str(e)}")
        return jsonify({"error": "Erreur lors de l'extraction du texte du CV"}), 500

@ai_bp.route('/generate-follow-up', methods=['POST'])
@auth_required
def generate_follow_up():
    """Génère une question de suivi basée sur la réponse du candidat"""
    data = request.json
    
    if not data:
        return jsonify({"error": "Données manquantes"}), 400
    
    original_question = data.get('original_question', '')
    candidate_response = data.get('candidate_response', '')
    reason = data.get('reason', 'unclear')  # 'unclear', 'incomplete', 'timeout'
    timeout_duration = data.get('timeout_duration')
    
    if not original_question or not candidate_response:
        return jsonify({"error": "La question originale et la réponse sont requises"}), 400
    
    try:
        follow_up = ai_service.generate_follow_up_question(
            original_question,
            candidate_response,
            reason,
            timeout_duration
        )
        
        return jsonify({"follow_up": follow_up})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la génération de la question de suivi: {str(e)}")
        return jsonify({"error": "Erreur lors de la génération de la question de suivi"}), 500

@ai_bp.route('/analyze-clarity', methods=['POST'])
@auth_required
def analyze_response_clarity():
    """Analyse la clarté d'une réponse et recommande une action"""
    data = request.json
    
    if not data:
        return jsonify({"error": "Données manquantes"}), 400
    
    question = data.get('question', '')
    response = data.get('response', '')
    
    if not question or not response:
        return jsonify({"error": "La question et la réponse sont requises"}), 400
    
    try:
        analysis = ai_service.analyze_response_clarity(question, response)
        return jsonify({"analysis": analysis})
    except Exception as e:
        current_app.logger.error(f"Erreur lors de l'analyse de la clarté: {str(e)}")
        return jsonify({"error": "Erreur lors de l'analyse de la clarté de la réponse"}), 500
    