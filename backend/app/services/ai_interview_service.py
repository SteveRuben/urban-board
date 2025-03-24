# backend/services/ai_interview_service.py
import os
import json
import requests
from flask import current_app
import anthropic
import base64
from io import BytesIO
import whisper
import logging

class AIInterviewService:
    """Service pour gérer les interactions avec les modèles d'IA pour les entretiens"""
    
    def __init__(self, app=None):
        self.app = app
        self.claude_client = None
        self.claude_api_key = os.environ.get('CLAUDE_API_KEY')
        self.openai_api_key = os.environ.get('OPENAI_API_KEY')
        self.whisper_model = None
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialise le service avec l'application Flask"""
        self.app = app
        
        # Initialiser le client Claude si disponible
        if self.claude_api_key:
            self.claude_client = anthropic.Anthropic(api_key=self.claude_api_key)
            app.logger.info("Client Claude initialisé avec succès")
        else:
            app.logger.warning("CLAUDE_API_KEY non définie. Le service Claude ne sera pas disponible.")
        
        # Initialiser le modèle Whisper pour la transcription
        try:
            self.whisper_model = whisper.load_model("base")
            app.logger.info("Modèle Whisper chargé avec succès")
        except Exception as e:
            app.logger.error(f"Erreur lors du chargement du modèle Whisper: {str(e)}")
            self.whisper_model = None
    
    def generate_questions(self, job_role, experience_level, number=5, specialization=None):
        """Génère des questions d'entretien basées sur le rôle et le niveau d'expérience"""
        if self.claude_client:
            return self._generate_questions_claude(job_role, experience_level, number, specialization)
        elif self.openai_api_key:
            return self._generate_questions_openai(job_role, experience_level, number, specialization)
        else:
            # Utiliser des questions par défaut si aucun service d'IA n'est disponible
            return self._default_questions(job_role, experience_level)
    
    def _generate_questions_claude(self, job_role, experience_level, number, specialization):
        """Génère des questions d'entretien avec Claude"""
        prompt = f"""Tu es un recruteur technique expérimenté qui prépare des questions d'entretien pour un poste de {job_role} avec un niveau d'expérience {experience_level}.
        
        Génère {number} questions techniques pertinentes pour évaluer les compétences d'un candidat.
        
        {f"Le candidat a mentionné une spécialisation en {specialization}. Inclus au moins 2 questions ciblant cette expertise." if specialization else ""}
        
        Pour chaque question, spécifie:
        1. Le texte de la question
        2. La difficulté (facile, moyenne, difficile)
        3. La catégorie/domaine de compétence
        
        Présente le résultat sous forme d'un tableau JSON que je pourrai utiliser directement dans mon application.
        """
        
        try:
            response = self.claude_client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Extraire le JSON de la réponse
            json_content = self._extract_json_from_text(response.content[0].text)
            return json_content.get('questions', [])
        except Exception as e:
            current_app.logger.error(f"Erreur avec Claude: {str(e)}")
            return self._default_questions(job_role, experience_level)
    
    def _generate_questions_openai(self, job_role, experience_level, number, specialization):
        """Génère des questions d'entretien avec OpenAI GPT-4o"""
        prompt = f"""Tu es un recruteur technique expérimenté qui prépare des questions d'entretien pour un poste de {job_role} avec un niveau d'expérience {experience_level}.
        
        Génère {number} questions techniques pertinentes pour évaluer les compétences d'un candidat.
        
        {f"Le candidat a mentionné une spécialisation en {specialization}. Inclus au moins 2 questions ciblant cette expertise." if specialization else ""}
        
        Pour chaque question, spécifie:
        1. Le texte de la question
        2. La difficulté (facile, moyenne, difficile)
        3. La catégorie/domaine de compétence
        
        Renvoie uniquement un tableau JSON sans autre texte.
        """
        
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                }
            )
            
            response_data = response.json()
            content = response_data['choices'][0]['message']['content']
            json_data = json.loads(content)
            return json_data.get('questions', [])
        except Exception as e:
            current_app.logger.error(f"Erreur avec OpenAI: {str(e)}")
            return self._default_questions(job_role, experience_level)
    
    def evaluate_response(self, question, response, job_role, experience_level):
        """Évalue la réponse d'un candidat à une question d'entretien"""
        if self.claude_client:
            return self._evaluate_response_claude(question, response, job_role, experience_level)
        elif self.openai_api_key:
            return self._evaluate_response_openai(question, response, job_role, experience_level)
        else:
            # Retourner une évaluation par défaut
            return self._default_evaluation(question, response)
    
    def _evaluate_response_claude(self, question, response, job_role, experience_level):
        """Évalue la réponse avec Claude"""
        prompt = f"""Tu es un expert en recrutement technique évaluant des candidats pour un poste de {job_role} avec un niveau d'expérience {experience_level}.

        Question posée au candidat:
        "{question}"

        Réponse du candidat:
        "{response}"

        Évalue la réponse selon les critères suivants (note de 1 à 5):
        1. Exactitude technique
        2. Clarté et communication
        3. Profondeur et exhaustivité
        
        Fournis également:
        - Un score global (moyenne pondérée)
        - Un feedback sur la réponse (2-3 phrases)
        - 3 points forts spécifiques 
        - 2 axes d'amélioration spécifiques

        Présente ton évaluation au format JSON pour intégration directe dans notre application.
        """
        
        try:
            response = self.claude_client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Extraire le JSON de la réponse
            json_content = self._extract_json_from_text(response.content[0].text)
            return json_content
        except Exception as e:
            current_app.logger.error(f"Erreur avec Claude: {str(e)}")
            return self._default_evaluation(question, response)
    
    def _evaluate_response_openai(self, question, response, job_role, experience_level):
        """Évalue la réponse avec OpenAI GPT-4o"""
        prompt = f"""Tu es un expert en recrutement technique évaluant des candidats pour un poste de {job_role} avec un niveau d'expérience {experience_level}.

        Question posée au candidat:
        "{question}"

        Réponse du candidat:
        "{response}"

        Évalue la réponse selon les critères suivants (note de 1 à 5):
        1. Exactitude technique
        2. Clarté et communication
        3. Profondeur et exhaustivité
        
        Fournis également:
        - Un score global (moyenne pondérée)
        - Un feedback sur la réponse (2-3 phrases)
        - 3 points forts spécifiques 
        - 2 axes d'amélioration spécifiques

        Renvoie uniquement un objet JSON sans autre texte.
        """
        
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"}
                }
            )
            
            response_data = response.json()
            content = response_data['choices'][0]['message']['content']
            return json.loads(content)
        except Exception as e:
            current_app.logger.error(f"Erreur avec OpenAI: {str(e)}")
            return self._default_evaluation(question, response)
    
    def analyze_biometrics(self, image_data):
        """Analyse les caractéristiques biométriques d'une image"""
        # Simulation d'analyse biométrique pour le MVP
        # Dans une application réelle, ce serait connecté à un service d'analyse faciale comme Azure Face API
        import random
        
        emotions = {
            "neutral": random.uniform(0.2, 0.6),
            "happy": random.uniform(0, 0.4),
            "surprised": random.uniform(0, 0.2),
            "sad": random.uniform(0, 0.2),
            "fearful": random.uniform(0, 0.1),
            "angry": random.uniform(0, 0.1),
            "disgusted": random.uniform(0, 0.1)
        }
        
        # Normaliser pour que la somme = 1
        total = sum(emotions.values())
        emotions = {k: v/total for k, v in emotions.items()}
        
        engagement_levels = ["Faible", "Moyen", "Bon", "Excellent"]
        
        return {
            "emotions": emotions,
            "engagement": {
                "eyeContact": random.choice(engagement_levels),
                "posture": random.choice(engagement_levels),
                "gestures": random.choice(engagement_levels),
                "attention": random.choice(engagement_levels)
            }
        }
    
    def transcribe_audio(self, audio_file):
        """Transcrit un fichier audio en texte"""
        if self.whisper_model:
            try:
                # Sauvegarder temporairement l'audio
                temp_path = "/tmp/temp_audio.wav"
                with open(temp_path, 'wb') as f:
                    f.write(audio_file.read())
                
                # Transcription avec Whisper
                result = self.whisper_model.transcribe(temp_path)
                os.remove(temp_path)
                
                return result["text"]
            except Exception as e:
                current_app.logger.error(f"Erreur de transcription Whisper: {str(e)}")
                return self._fallback_transcription(audio_file)
        else:
            return self._fallback_transcription(audio_file)
    
    def _fallback_transcription(self, audio_file):
        """Utilise l'API OpenAI Whisper comme solution de secours"""
        if not self.openai_api_key:
            return "Transcription non disponible. Veuillez configurer une clé API."
        
        try:
            temp_path = "/tmp/temp_audio.wav"
            with open(temp_path, 'wb') as f:
                f.write(audio_file.read())
            
            with open(temp_path, 'rb') as f:
                response = requests.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {self.openai_api_key}"},
                    files={"file": f},
                    data={"model": "whisper-1"}
                )
            
            os.remove(temp_path)
            result = response.json()
            return result.get("text", "Transcription échouée")
        except Exception as e:
            current_app.logger.error(f"Erreur de transcription OpenAI: {str(e)}")
            return "Erreur de transcription. Veuillez réessayer."
    
    def generate_interview_summary(self, interview_data):
        """Génère un résumé complet de l'entretien"""
        if self.claude_client:
            return self._generate_summary_claude(interview_data)
        elif self.openai_api_key:
            return self._generate_summary_openai(interview_data)
        else:
            return self._default_summary(interview_data)
    
    def _generate_summary_claude(self, interview_data):
        """Génère un résumé d'entretien avec Claude"""
        job_role = interview_data.get('jobRole', 'Non spécifié')
        experience_level = interview_data.get('experienceLevel', 'Non spécifié')
        
        # Formater les questions et réponses pour le prompt
        qa_pairs = []
        for i, q in enumerate(interview_data.get('questions', [])):
            response = interview_data.get('responses', {}).get(str(i), "Aucune réponse")
            qa_pairs.append(f"Q{i+1}: {q['question']}\nR: {response}")
        
        qa_text = "\n\n".join(qa_pairs)
        
        prompt = f"""Tu es un expert en recrutement aidant à évaluer un candidat pour un poste de {job_role} (niveau {experience_level}).

        Voici les questions posées lors de l'entretien et les réponses du candidat:
        
        {qa_text}
        
        Génère un résumé complet de l'entretien qui inclut:
        
        1. Synthèse globale (3-4 phrases)
        2. Évaluation des compétences techniques (par domaine)
        3. Points forts du candidat (minimum 3)
        4. Axes d'amélioration (minimum 2)
        5. Adéquation au poste (sur une échelle de 1 à 5 avec justification)
        6. Recommandation finale (embaucher, considérer, rejeter)
        
        Présente ton analyse au format JSON pour intégration dans notre application RecruteIA.
        """
        
        try:
            response = self.claude_client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Extraire le JSON de la réponse
            json_content = self._extract_json_from_text(response.content[0].text)
            return json_content
        except Exception as e:
            current_app.logger.error(f"Erreur avec Claude: {str(e)}")
            return self._default_summary(interview_data)
    
    def _generate_summary_openai(self, interview_data):
        """Génère un résumé d'entretien avec OpenAI GPT-4o"""
        # Implémentation similaire à Claude mais avec l'API OpenAI
        # Code omis pour brièveté
        pass
    
    def _extract_json_from_text(self, text):
        """Extrait le contenu JSON d'une réponse textuelle"""
        try:
            # Trouver le premier et le dernier accolade (délimiteurs JSON)
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                return json.loads(json_str)
            else:
                raise ValueError("Aucun objet JSON valide trouvé dans le texte")
        except Exception as e:
            current_app.logger.error(f"Erreur d'extraction JSON: {str(e)}")
            return {}
    
    def _default_questions(self, job_role, experience_level):
        """Fournit des questions par défaut en cas d'échec de l'IA"""
        # Liste de questions génériques par domaine
        return [
            {
                "question": f"Décrivez votre expérience professionnelle en tant que {job_role}.",
                "difficulty": "facile",
                "category": "expérience professionnelle"
            },
            {
                "question": "Quel est le projet le plus complexe sur lequel vous avez travaillé?",
                "difficulty": "moyenne",
                "category": "gestion de projet"
            },
            {
                "question": "Comment restez-vous à jour avec les nouvelles technologies dans votre domaine?",
                "difficulty": "facile",
                "category": "développement professionnel"
            },
            {
                "question": "Décrivez un défi technique que vous avez rencontré et comment vous l'avez surmonté.",
                "difficulty": "moyenne",
                "category": "résolution de problèmes"
            },
            {
                "question": "Où vous voyez-vous professionnellement dans 5 ans?",
                "difficulty": "facile",
                "category": "objectifs de carrière"
            }
        ]
    
    def _default_evaluation(self, question, response):
        """Fournit une évaluation par défaut en cas d'échec de l'IA"""
        return {
            "exactitude": 3,
            "clarté": 3,
            "profondeur": 3,
            "score_global": 3.0,
            "feedback": "La réponse couvre les points essentiels et démontre une compréhension correcte du sujet.",
            "points_forts": [
                "Bonne structure de réponse",
                "Explications claires",
                "Exemples pertinents"
            ],
            "axes_amélioration": [
                "Pourrait approfondir certains aspects techniques",
                "Ajouter des exemples concrets d'expérience personnelle"
            ]
        }
    
    def _default_summary(self, interview_data):
        """Fournit un résumé par défaut en cas d'échec de l'IA"""
        return {
            "synthèse": "Le candidat a démontré une compréhension correcte des concepts techniques et a fourni des réponses pertinentes aux questions posées.",
            "compétences_techniques": {
                "développement": 3,
                "résolution_problèmes": 3,
                "communication": 3
            },
            "points_forts": [
                "Communication claire",
                "Bonnes connaissances techniques",
                "Approche méthodique"
            ],
            "axes_amélioration": [
                "Approfondir certains domaines techniques",
                "Développer plus d'exemples concrets"
            ],
            "adéquation_poste": {
                "score": 3,
                "justification": "Le candidat possède les compétences de base requises pour le poste."
            },
            "recommandation": "considérer"
        }
    
    # Ajoutez cette nouvelle méthode à votre classe AIInterviewService existante

def generate_questions_from_cv_and_job(self, job_description, cv_text, number=5, experience_level=None):
    """
    Génère des questions d'entretien personnalisées en analysant le CV du candidat 
    et la description du poste.
    
    Args:
        job_description (str): Description complète du poste
        cv_text (str): Texte du CV du candidat
        number (int): Nombre de questions à générer
        experience_level (str, optional): Niveau d'expérience attendu
        
    Returns:
        list: Liste de questions d'entretien personnalisées
    """
    if self.claude_client:
        return self._generate_questions_from_cv_claude(job_description, cv_text, number, experience_level)
    elif self.openai_api_key:
        return self._generate_questions_from_cv_openai(job_description, cv_text, number, experience_level)
    else:
        # Utiliser des questions génériques si aucun service d'IA n'est disponible
        return self._default_questions_from_job(job_description)
    
def _generate_questions_from_cv_claude(self, job_description, cv_text, number, experience_level):
    """Génère des questions personnalisées avec Claude en analysant le CV et le poste"""
    prompt = f"""Tu es un recruteur technique expérimenté qui prépare un entretien personnalisé.
    
    ## Description du poste:
    {job_description}
    
    ## CV du candidat:
    {cv_text}
    
    ## Niveau d'expérience requis:
    {experience_level if experience_level else "Non spécifié"}
    
    Sur la base du CV du candidat et de la description du poste, génère {number} questions d'entretien pertinentes et personnalisées.
    Concentre-toi sur:
    1. Les compétences mentionnées dans le CV qui correspondent aux exigences du poste
    2. Les projets pertinents sur lesquels le candidat a travaillé
    3. Les écarts ou lacunes potentiels entre le CV et les exigences du poste
    4. Les compétences techniques spécifiques nécessaires pour le poste
    5. L'expérience dans le secteur ou avec des technologies similaires
    
    Pour chaque question, spécifie:
    1. Le texte de la question
    2. La difficulté (facile, moyenne, difficile)
    3. La catégorie/domaine de compétence
    4. Le raisonnement (pourquoi cette question est pertinente pour ce candidat et ce poste)
    
    Format cela en tableau JSON que je pourrai utiliser directement.
    """
    
    try:
        response = self.claude_client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Extraire le JSON de la réponse
        json_content = self._extract_json_from_text(response.content[0].text)
        return json_content.get('questions', [])
    except Exception as e:
        current_app.logger.error(f"Erreur avec Claude: {str(e)}")
        return self._default_questions_from_job(job_description)
    
def _generate_questions_from_cv_openai(self, job_description, cv_text, number, experience_level):
    """Génère des questions personnalisées avec OpenAI GPT-4o en analysant le CV et le poste"""
    prompt = f"""Tu es un recruteur technique expérimenté qui prépare un entretien personnalisé.
    
    ## Description du poste:
    {job_description}
    
    ## CV du candidat:
    {cv_text}
    
    ## Niveau d'expérience requis:
    {experience_level if experience_level else "Non spécifié"}
    
    Sur la base du CV du candidat et de la description du poste, génère {number} questions d'entretien pertinentes et personnalisées.
    Concentre-toi sur:
    1. Les compétences mentionnées dans le CV qui correspondent aux exigences du poste
    2. Les projets pertinents sur lesquels le candidat a travaillé
    3. Les écarts ou lacunes potentiels entre le CV et les exigences du poste
    4. Les compétences techniques spécifiques nécessaires pour le poste
    5. L'expérience dans le secteur ou avec des technologies similaires
    
    Pour chaque question, spécifie:
    1. Le texte de la question
    2. La difficulté (facile, moyenne, difficile)
    3. La catégorie/domaine de compétence
    4. Le raisonnement (pourquoi cette question est pertinente pour ce candidat et ce poste)
    
    Renvoie uniquement un tableau JSON sans autre texte.
    """
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            }
        )
        
        response_data = response.json()
        content = response_data['choices'][0]['message']['content']
        json_data = json.loads(content)
        return json_data.get('questions', [])
    except Exception as e:
        current_app.logger.error(f"Erreur avec OpenAI: {str(e)}")
        return self._default_questions_from_job(job_description)
    
def _default_questions_from_job(self, job_description):
    """Fournit des questions génériques basées sur la description de poste en cas d'échec de l'IA"""
    job_keywords = self._extract_keywords_from_job(job_description)
    
    # Créer des questions à partir des mots-clés extraits
    questions = []
    
    if job_keywords.get('technologies'):
        techs = ', '.join(job_keywords['technologies'][:3])
        questions.append({
            "question": f"Pouvez-vous décrire votre expérience avec {techs} ?",
            "difficulty": "moyenne",
            "category": "compétences techniques",
            "reasoning": "Technologies clés mentionnées dans la description du poste"
        })
    
    if job_keywords.get('soft_skills'):
        soft_skill = job_keywords['soft_skills'][0] if job_keywords['soft_skills'] else "le travail en équipe"
        questions.append({
            "question": f"Donnez-moi un exemple de situation où vous avez fait preuve de {soft_skill}.",
            "difficulty": "facile",
            "category": "compétences comportementales",
            "reasoning": "Compétence comportementale essentielle pour le poste"
        })
    
    # Ajout de questions génériques pour atteindre le minimum de 5
    generic_questions = [
        {
            "question": "Décrivez un défi technique que vous avez rencontré récemment et comment vous l'avez surmonté.",
            "difficulty": "moyenne",
            "category": "résolution de problèmes",
            "reasoning": "Évaluation de la capacité à résoudre des problèmes techniques"
        },
        {
            "question": "Comment restez-vous à jour avec les nouvelles technologies dans votre domaine?",
            "difficulty": "facile",
            "category": "développement professionnel",
            "reasoning": "Évaluation de la veille technologique et de l'apprentissage continu"
        },
        {
            "question": "Parlez-moi d'un projet dont vous êtes particulièrement fier. Quel était votre rôle et quelle a été votre contribution?",
            "difficulty": "moyenne",
            "category": "expérience professionnelle",
            "reasoning": "Évaluation des réalisations passées et de l'impact"
        },
        {
            "question": "Où vous voyez-vous professionnellement dans 5 ans?",
            "difficulty": "facile",
            "category": "objectifs de carrière",
            "reasoning": "Évaluation de l'adéquation à long terme avec l'entreprise"
        },
        {
            "question": "Comment gérez-vous les délais serrés et la pression?",
            "difficulty": "moyenne",
            "category": "gestion du stress",
            "reasoning": "Évaluation de la capacité à travailler sous pression"
        }
    ]
    
    # Compléter avec des questions génériques
    while len(questions) < 5:
        questions.append(generic_questions[len(questions)])
    
    return questions

def _extract_keywords_from_job(self, job_description):
    """Extrait des mots-clés pertinents d'une description de poste"""
    # Une implémentation simple pour extraire des mots-clés
    # Dans une version réelle, utilisez des techniques NLP plus avancées
    
    tech_keywords = [
        "Python", "JavaScript", "Java", "C#", "C++", "Ruby", "PHP", "Go", "Kotlin", "Swift",
        "React", "Angular", "Vue", "Node.js", "Django", "Flask", "Spring", "ASP.NET",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git", "SQL", "NoSQL",
        "TensorFlow", "PyTorch", "Machine Learning", "AI", "Big Data", "Hadoop", "Spark"
    ]
    
    soft_skills = [
        "communication", "travail en équipe", "leadership", "résolution de problèmes",
        "gestion du temps", "adaptabilité", "créativité", "pensée critique", 
        "intelligence émotionnelle", "négociation", "gestion de projet"
    ]
    
    found_techs = []
    found_soft_skills = []
    
    # Recherche simplifiée des mots-clés
    for tech in tech_keywords:
        if tech.lower() in job_description.lower():
            found_techs.append(tech)
    
    for skill in soft_skills:
        if skill.lower() in job_description.lower():
            found_soft_skills.append(skill)
    
    return {
        "technologies": found_techs,
        "soft_skills": found_soft_skills
    }

def generate_follow_up_question(self, original_question, candidate_response, reason="unclear", timeout_duration=None):
    """
    Génère une question de suivi basée sur la réponse du candidat
    
    Args:
        original_question (str): Question initiale posée
        candidate_response (str): Réponse fournie par le candidat
        reason (str): Raison de la question de suivi ('unclear', 'incomplete', 'timeout')
        timeout_duration (int, optional): Durée du timeout en secondes si applicable
        
    Returns:
        dict: Question de suivi avec contexte
    """
    if self.claude_client:
        return self._generate_follow_up_claude(original_question, candidate_response, reason, timeout_duration)
    elif self.openai_api_key:
        return self._generate_follow_up_openai(original_question, candidate_response, reason, timeout_duration)
    else:
        return self._default_follow_up_question(original_question, candidate_response, reason)

def _generate_follow_up_claude(self, original_question, candidate_response, reason, timeout_duration):
    """Génère une question de suivi avec Claude"""
    
    context = ""
    if reason == "unclear":
        context = "La réponse du candidat manque de clarté ou de précision."
    elif reason == "incomplete":
        context = "La réponse du candidat semble incomplète ou superficielle."
    elif reason == "timeout":
        context = f"Le candidat a pris {timeout_duration} secondes pour commencer à répondre, ce qui suggère une hésitation."
    
    prompt = f"""Tu es un recruteur expérimenté conduisant un entretien. Tu as posé la question suivante:

Question originale: "{original_question}"

Le candidat a répondu:
"{candidate_response}"

Contexte: {context}

Génère une question de suivi pertinente qui aidera à:
1. Clarifier la réponse si elle est ambiguë
2. Approfondir un point important si la réponse est superficielle
3. Aider le candidat à se sentir à l'aise s'il semble hésiter

Ta question doit être:
- Courte et directe (une seule question)
- Formulée de manière encourageante et non intimidante
- Spécifiquement liée à la réponse du candidat
- Conçue pour obtenir des informations plus pertinentes

Renvoie uniquement un objet JSON avec:
1. La question de suivi
2. L'intention derrière cette question (clarification, approfondissement, soutien)
3. Un lien clair avec la réponse du candidat
"""
    
    try:
        response = self.claude_client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Extraire le JSON de la réponse
        json_content = self._extract_json_from_text(response.content[0].text)
        
        # Ajouter la raison originale
        json_content['reason'] = reason
        if timeout_duration:
            json_content['timeout_duration'] = timeout_duration
            
        return json_content
    except Exception as e:
        current_app.logger.error(f"Erreur avec Claude: {str(e)}")
        return self._default_follow_up_question(original_question, candidate_response, reason)

def _generate_follow_up_openai(self, original_question, candidate_response, reason, timeout_duration):
    """Génère une question de suivi avec OpenAI GPT-4o"""
    # Implémentation similaire à Claude
    # Code omis pour brièveté
    pass

def _default_follow_up_question(self, original_question, candidate_response, reason):
    """Fournit une question de suivi par défaut en cas d'échec de l'IA"""
    
    # Questions par défaut selon la raison
    if reason == "unclear":
        question = "Pourriez-vous préciser ce que vous entendez par là ?"
        intention = "clarification"
        link = "La réponse n'était pas suffisamment claire"
    elif reason == "incomplete":
        question = "Pouvez-vous développer davantage et donner un exemple concret ?"
        intention = "approfondissement"
        link = "La réponse manquait de détails ou d'exemples"
    elif reason == "timeout":
        question = "Peut-être pourrais-je reformuler ma question. Ce que je cherche à savoir, c'est comment vous aborderiez ce type de situation dans un contexte professionnel."
        intention = "soutien"
        link = "Le candidat semblait hésiter à répondre"
    else:
        question = "Pourriez-vous développer un peu plus votre réponse ?"
        intention = "approfondissement"
        link = "Pour obtenir plus d'informations"
    
    return {
        "question": question,
        "intention": intention,
        "link": link,
        "reason": reason
    }

def analyze_response_clarity(self, question, response):
    """
    Analyse la clarté et la complétude d'une réponse
    
    Args:
        question (str): Question posée
        response (str): Réponse du candidat
        
    Returns:
        dict: Analyse de la clarté avec score et recommandation
    """
    # Version simplifiée pour l'exemple - dans une vraie implémentation,
    # utiliser un modèle d'IA pour analyser la réponse
    
    # Analyse basique basée sur la longueur et les mots-clés
    words = response.split()
    word_count = len(words)
    
    # Indicateurs de réponse vague
    vague_indicators = ["peut-être", "probablement", "je pense", "je crois", 
                      "je suppose", "en quelque sorte", "d'une certaine manière"]
    
    vague_count = sum(1 for indicator in vague_indicators if indicator.lower() in response.lower())
    
    # Trop court = potentiellement incomplet
    if word_count < 20:
        return {
            "is_clear": False,
            "score": 0.3,
            "reason": "incomplete",
            "recommendation": "follow_up",
            "message": "La réponse est trop brève pour évaluer complètement la compétence."
        }
    
    # Beaucoup d'indicateurs vagues = manque de clarté
    if vague_count > 2:
        return {
            "is_clear": False,
            "score": 0.5,
            "reason": "unclear",
            "recommendation": "follow_up",
            "message": "La réponse contient plusieurs termes vagues ou hésitants."
        }
    
    # Réponse qui semble complète et claire
    if word_count > 50 and vague_count <= 1:
        return {
            "is_clear": True,
            "score": 0.9,
            "reason": "clear",
            "recommendation": "continue",
            "message": "La réponse est claire et suffisamment détaillée."
        }
    
    # Cas par défaut
    return {
        "is_clear": True,
        "score": 0.7,
        "reason": "acceptable",
        "recommendation": "continue",
        "message": "La réponse est acceptable mais pourrait être plus détaillée."
    }

# Initialisation pour Flask
ai_service = AIInterviewService()

def init_app(app):
    ai_service.init_app(app)