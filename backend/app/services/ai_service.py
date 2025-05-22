# backend/services/ai_service.py
import json
import requests
from flask import current_app
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from collections import Counter

# Télécharger les ressources NLTK nécessaires (à exécuter une fois)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class AIService:
    """Service pour toutes les fonctionnalités liées à l'IA dans RecruteIA"""
    
    def __init__(self):
        # Configuration de l'API d'IA (par exemple, OpenAI, Claude, etc.)
        self.api_key = current_app.config.get('AI_API_KEY', '')
        self.api_url = current_app.config.get('AI_API_URL', 'https://api.anthropic.com/v1/messages')
        self.model = current_app.config.get('AI_MODEL', 'claude-3-haiku-20240307')
        
        # Charger la liste des compétences courantes
        self.common_skills = self._load_common_skills()
    
    def _load_common_skills(self):
        """Charge une liste de compétences techniques et soft skills courantes"""
        try:
            with open('data/skills.json', 'r') as f:
                return json.load(f)
        except:
            # Liste par défaut si le fichier n'est pas disponible
            return {
                "technical": [
                    "Python", "JavaScript", "Java", "C++", "SQL", "React", "AWS", "Docker",
                    "Machine Learning", "Data Analysis", "UI/UX Design", "Project Management",
                    "Agile", "DevOps", "Microsoft Office", "Photoshop", "SEO"
                ],
                "soft": [
                    "Communication", "Leadership", "Teamwork", "Problem Solving", "Creativity",
                    "Adaptability", "Time Management", "Critical Thinking", "Negotiation",
                    "Emotional Intelligence", "Conflict Resolution"
                ]
            }
    
    def extract_keywords(self, text, max_keywords=10):
        """
        Extrait les mots-clés les plus importants d'un texte
        
        Args:
            text: Texte à analyser
            max_keywords: Nombre maximum de mots-clés à extraire
            
        Returns:
            Liste des mots-clés les plus importants
        """
        # Tokenisation et suppression des stop words
        tokens = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english') + stopwords.words('french'))
        filtered_tokens = [word for word in tokens if word.isalnum() and word not in stop_words]
        
        # Comptage des occurrences
        word_freq = Counter(filtered_tokens)
        
        # Extraction des mots-clés les plus fréquents
        keywords = [word for word, _ in word_freq.most_common(max_keywords)]
        
        return keywords
    
    def extract_skills(self, text):
        """
        Extrait les compétences mentionnées dans une description de poste
        
        Args:
            text: Texte à analyser
            
        Returns:
            Dictionnaire avec les compétences techniques et soft skills trouvés
        """
        text_lower = text.lower()
        found_skills = {
            "technical": [],
            "soft": []
        }
        
        # Recherche des compétences techniques
        for skill in self.common_skills["technical"]:
            if skill.lower() in text_lower:
                found_skills["technical"].append(skill)
        
        # Recherche des soft skills
        for skill in self.common_skills["soft"]:
            if skill.lower() in text_lower:
                found_skills["soft"].append(skill)
        
        # Si peu de compétences sont trouvées, utiliser l'IA pour en extraire davantage
        if len(found_skills["technical"]) < 3 and len(found_skills["soft"]) < 2:
            ai_skills = self._ai_extract_skills(text)
            
            # Fusionner les résultats
            for category in ["technical", "soft"]:
                found_skills[category] = list(set(found_skills[category] + ai_skills.get(category, [])))
        
        return found_skills
    
    def _ai_extract_skills(self, text):
        """
        Utilise l'IA pour extraire des compétences d'un texte
        
        Args:
            text: Texte à analyser
            
        Returns:
            Dictionnaire avec les compétences identifiées
        """
        prompt = f"""
        Extract both technical skills and soft skills from the following job description. 
        Format your response as a JSON object with two arrays: "technical" and "soft".
        
        Job Description:
        {text}
        """
        
        response = self._call_ai_api(prompt)
        
        # Extraire le JSON de la réponse
        try:
            skills_json = self._extract_json_from_response(response)
            return skills_json
        except:
            # En cas d'erreur, retourner des valeurs par défaut
            return {"technical": [], "soft": []}
    
    def generate_interview_config(self, job_title, job_description, requirements=None):
        """
        Génère une configuration pour un entretien IA basé sur le poste
        
        Args:
            job_title: Titre du poste
            job_description: Description du poste
            requirements: Exigences spécifiques (optionnel)
            
        Returns:
            Configuration JSON pour l'entretien IA
        """
        prompt = f"""
        Create an interview configuration for an AI interviewer based on this job posting:
        
        Title: {job_title}
        Description: {job_description}
        {"Requirements: " + requirements if requirements else ""}
        
        Generate:
        1. 5 technical questions specific to this role
        2. 3 behavioral questions to assess cultural fit
        3. A list of key skills to evaluate
        4. Suggested evaluation criteria for this role
        
        Format your response as a JSON object with the following structure:
        {{
            "technical_questions": [array of question objects with "question" and "expected_topics" fields],
            "behavioral_questions": [array of question objects],
            "key_skills": [array of skills to evaluate],
            "evaluation_criteria": [array of criteria objects with "name" and "description" fields]
        }}
        """
        
        response = self._call_ai_api(prompt)
        
        # Extraire le JSON de la réponse
        try:
            config_json = self._extract_json_from_response(response)
            return config_json
        except Exception as e:
            print(f"Erreur lors de la génération de la configuration d'entretien: {str(e)}")
            # Retourner une configuration par défaut
            return {
                "technical_questions": [
                    {"question": f"Quelle est votre expérience avec le rôle de {job_title}?", "expected_topics": []}
                ],
                "behavioral_questions": [
                    {"question": "Parlez-moi d'une situation difficile que vous avez rencontrée au travail et comment vous l'avez gérée."}
                ],
                "key_skills": ["Communication", "Problem Solving"],
                "evaluation_criteria": [
                    {"name": "Expérience", "description": f"Niveau d'expérience dans le domaine de {job_title}"}
                ]
            }
    
    def extract_job_data(self, html_content, url):
        """
        Utilise l'IA pour extraire les données d'une offre d'emploi à partir d'une page HTML
        
        Args:
            html_content: Contenu HTML de la page
            url: URL de l'offre d'emploi
            
        Returns:
            Dictionnaire avec les données du poste
        """
        # Pour éviter de surcharger l'IA, extraire seulement le contenu pertinent
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Supprimer les scripts, styles et autres éléments non pertinents
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.extract()
        
        # Obtenir le texte
        text = soup.get_text(separator='\n')
        
        # Limiter la taille du texte
        text = text[:10000]  # Limiter à 10 000 caractères
        
        prompt = f"""
        Extract job posting information from the following webpage content.
        Format your response as a JSON object with these fields:
        - title: the job title
        - description: the main job description
        - requirements: specific requirements for the role
        - responsibilities: key responsibilities of the role
        - location: where the job is located
        - employment_type: full-time, part-time, contract, etc.
        - remote_policy: remote, hybrid, on-site
        - salary_range_min: minimum salary if provided (numeric only)
        - salary_range_max: maximum salary if provided (numeric only)
        - salary_currency: currency code (e.g. EUR, USD)
        
        Webpage content (from {url}):
        {text}
        """
        
        response = self._call_ai_api(prompt)
        
        # Extraire le JSON de la réponse
        try:
            job_data = self._extract_json_from_response(response)
            return job_data
        except Exception as e:
            print(f"Erreur lors de l'extraction des données du poste: {str(e)}")
            # Retourner des données minimales
            return {
                "title": "Poste à pourvoir",
                "description": text[:500] + "...",  # Utiliser le début du texte comme description
                "location": "Non spécifié"
            }
    
    def generate_interview_questions(self, job_title, candidate_resume, interview_duration_minutes=30):
        """
        Génère des questions d'entretien personnalisées en fonction du poste et du CV du candidat
        
        Args:
            job_title: Titre du poste
            candidate_resume: Texte du CV du candidat
            interview_duration_minutes: Durée prévue de l'entretien en minutes
            
        Returns:
            Liste des questions d'entretien personnalisées
        """
        # Calculer le nombre approximatif de questions en fonction de la durée
        # En supposant ~3 minutes par question technique et ~5 minutes par question comportementale
        num_technical = max(1, int(interview_duration_minutes * 0.7 / 3))
        num_behavioral = max(1, int(interview_duration_minutes * 0.3 / 5))
        
        prompt = f"""
        Generate personalized interview questions for a {job_title} position based on this candidate's resume:
        
        {candidate_resume}
        
        Generate:
        - {num_technical} technical questions that probe the candidate's claimed skills and experience
        - {num_behavioral} behavioral questions to assess soft skills and culture fit
        
        Format your response as a JSON object with two arrays:
        {{
            "technical_questions": [array of question strings],
            "behavioral_questions": [array of question strings]
        }}
        """
        
        response = self._call_ai_api(prompt)
        
        try:
            questions_json = self._extract_json_from_response(response)
            return questions_json
        except:
            # En cas d'erreur, retourner des questions génériques
            return {
                "technical_questions": [f"Quelle est votre expérience technique la plus pertinente pour ce poste de {job_title}?"],
                "behavioral_questions": ["Parlez-moi d'un défi professionnel que vous avez relevé récemment."]
            }
    
    def _call_ai_api(self, prompt):
        """
        Appelle l'API d'IA (par exemple Claude ou OpenAI)
        
        Args:
            prompt: Texte du prompt à envoyer à l'IA
            
        Returns:
            Réponse de l'IA
        """
        # Exemple avec l'API Claude d'Anthropic
        try:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            }
            
            data = {
                "model": self.model,
                "max_tokens": 2000,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json=data
            )
            
            if response.status_code == 200:
                return response.json()["content"][0]["text"]
            else:
                print(f"Erreur API IA: {response.status_code} - {response.text}")
                return ""
                
        except Exception as e:
            print(f"Erreur lors de l'appel à l'API d'IA: {str(e)}")
            return ""
    
    def _extract_json_from_response(self, response):
        """
        Extrait un objet JSON d'une réponse textuelle de l'IA
        
        Args:
            response: Texte de la réponse de l'IA
            
        Returns:
            Objet JSON extrait
        """
        # Chercher une structure JSON dans la réponse
        import re
        import json
        
        # Rechercher un objet JSON entre accolades
        json_match = re.search(r'({[\s\S]*})', response)
        if json_match:
            json_str = json_match.group(1)
            try:
                return json.loads(json_str)
            except:
                pass
        
        # Essayer de parser toute la réponse comme JSON
        try:
            return json.loads(response)
        except:
            # En dernier recours, lever une exception
            raise ValueError("Impossible d'extraire un JSON valide de la réponse de l'IA")
    
    def analyze_resume(self, resume_text, job_description):
        """
        Analyse un CV par rapport à une description de poste
        
        Args:
            resume_text: Texte du CV
            job_description: Description du poste
            
        Returns:
            Analyse du CV avec score de correspondance
        """
        prompt = f"""
        Analyze this resume against the job description. 
        Determine the match level, identify key strengths and gaps.
        
        Job Description:
        {job_description}
        
        Resume:
        {resume_text}
        
        Format your response as a JSON object with:
        - match_score: a number from 0-100 representing the overall match
        - key_strengths: array of strengths relevant to the position
        - gaps: array of missing skills or experience
        - summary: brief analysis paragraph
        """
        
        response = self._call_ai_api(prompt)
        
        try:
            analysis = self._extract_json_from_response(response)
            return analysis
        except:
            # En cas d'erreur, retourner une analyse minimale
            return {
                "match_score": 50,
                "key_strengths": [],
                "gaps": [],
                "summary": "Analyse non disponible"
            }
    
    def interpret_interview_answer(self, question, answer, expected_topics=None):
        """
        Interprète la réponse d'un candidat à une question d'entretien
        
        Args:
            question: Question posée
            answer: Réponse du candidat
            expected_topics: Sujets ou points clés attendus dans la réponse
            
        Returns:
            Évaluation de la réponse
        """
        topics_str = ""
        if expected_topics:
            topics_str = "Expected topics in the answer:\n" + "\n".join([f"- {topic}" for topic in expected_topics])
        
        prompt = f"""
        Evaluate this candidate answer in a job interview:
        
        Question: {question}
        
        {topics_str}
        
        Candidate Answer: {answer}
        
        Rate the answer on:
        1. Relevance to the question (0-10)
        2. Depth of knowledge (0-10)
        3. Clarity of communication (0-10)
        
        Identify strengths and weaknesses. Format your response as a JSON object.
        """
        
        response = self._call_ai_api(prompt)
        
        try:
            evaluation = self._extract_json_from_response(response)
            return evaluation
        except:
            # En cas d'erreur, retourner une évaluation minimale
            return {
                "relevance": 5,
                "knowledge_depth": 5,
                "clarity": 5,
                "strengths": ["Réponse fournie"],
                "weaknesses": ["Impossible d'évaluer en détail"]
            }