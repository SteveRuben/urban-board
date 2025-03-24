# backend/app/services/resume_analyzer.py
import os
import re
import io
import json
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import docx
from datetime import datetime
from .llm_service import get_llm_response

# Constantes pour les types de fichiers supportés
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'txt'}

# Template de prompt pour l'analyse du CV
RESUME_ANALYSIS_PROMPT = """
Tu es un expert en recrutement chargé d'analyser un CV pour le poste de {job_role}.

Voici le contenu textuel du CV à analyser:
```
{resume_text}
```

Effectue une analyse approfondie de ce CV et fournis un rapport détaillé sur les éléments suivants:

1. Résumé des qualifications clés
2. Compétences techniques (technologies, langages, outils)
3. Compétences non techniques (soft skills)
4. Expérience professionnelle pertinente pour le poste
5. Formation et certifications
6. Adéquation globale avec le poste (score sur 10 et justification)
7. Forces principales du candidat
8. Éventuelles lacunes ou domaines à approfondir
9. Questions recommandées pour l'entretien, basées sur ce CV

Fournis ta réponse au format JSON avec la structure suivante:
{{
  "resume_summary": "Résumé concis du profil",
  "technical_skills": ["compétence1", "compétence2", ...],
  "soft_skills": ["compétence1", "compétence2", ...],
  "relevant_experience": [
    {{
      "position": "Titre du poste",
      "company": "Entreprise",
      "duration": "Durée",
      "highlights": ["point clé 1", "point clé 2", ...]
    }},
    ...
  ],
  "education": [
    {{
      "degree": "Diplôme/Formation",
      "institution": "Institution",
      "year": "Année",
      "relevance": "Pertinence pour le poste (haute/moyenne/faible)"
    }},
    ...
  ],
  "fit_score": 7.5,
  "fit_justification": "Explication du score d'adéquation",
  "strengths": ["force 1", "force 2", ...],
  "gaps": ["lacune 1", "lacune 2", ...],
  "recommended_questions": [
    {{
      "question": "Question d'entretien",
      "rationale": "Pourquoi poser cette question"
    }},
    ...
  ],
  "keywords": ["mot-clé1", "mot-clé2", ...] // mots-clés pertinents extraits du CV
}}
"""

def allowed_file(filename):
    """
    Vérifie si le fichier a une extension autorisée
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_file):
    """
    Extrait le texte d'un fichier PDF
    """
    pdf_reader = PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(docx_file):
    """
    Extrait le texte d'un fichier DOCX
    """
    doc = docx.Document(docx_file)
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text + "\n"
    return text

def extract_text_from_file(file):
    """
    Extrait le texte d'un fichier selon son type
    """
    filename = secure_filename(file.filename)
    file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ""
    
    # Réinitialiser la position du curseur au début du fichier
    file.seek(0)
    
    if file_extension == 'pdf':
        return extract_text_from_pdf(file)
    elif file_extension == 'docx':
        return extract_text_from_docx(file)
    elif file_extension == 'txt':
        return file.read().decode('utf-8')
    else:
        raise ValueError(f"Format de fichier non pris en charge: {file_extension}")

def preprocess_resume_text(text):
    """
    Prétraite le texte du CV pour améliorer l'analyse
    """
    # Suppression des espaces multiples
    text = re.sub(r'\s+', ' ', text)
    
    # Suppression des caractères spéciaux superflus
    text = re.sub(r'[^\w\s.,:;@()[\]{}\'\"&\-/]', '', text)
    
    # Normalisation des sauts de ligne
    text = re.sub(r'\n+', '\n', text)
    
    return text.strip()

def extract_contact_info(text):
    """
    Extrait les informations de contact du texte du CV
    """
    contact_info = {
        'email': None,
        'phone': None,
        'linkedin': None
    }
    
    # Extraction de l'email
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    email_matches = re.findall(email_pattern, text)
    if email_matches:
        contact_info['email'] = email_matches[0]
    
    # Extraction du numéro de téléphone (formats français et internationaux)
    phone_patterns = [
        r'(?:\+33|0)(?:\s*\d){9}',  # Format français
        r'(?:\+\d{1,3}\s*)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'  # Format international
    ]
    
    for pattern in phone_patterns:
        phone_matches = re.findall(pattern, text)
        if phone_matches:
            contact_info['phone'] = phone_matches[0]
            break
    
    # Extraction du profil LinkedIn
    linkedin_patterns = [
        r'linkedin\.com/in/[\w-]+',
        r'linkedin\.com/profile/[\w-]+'
    ]
    
    for pattern in linkedin_patterns:
        linkedin_matches = re.findall(pattern, text)
        if linkedin_matches:
            contact_info['linkedin'] = linkedin_matches[0]
            break
    
    return contact_info

def analyze_resume(file, job_role=None):
    """
    Analyse un CV téléchargé et retourne des informations structurées
    
    Args:
        file: Le fichier CV téléchargé
        job_role (str, optional): Le poste pour lequel le candidat postule
        
    Returns:
        dict: Résultats d'analyse structurés
    """
    try:
        # Vérifier si le fichier est valide
        if not file or not allowed_file(file.filename):
            return {
                "error": "Format de fichier non pris en charge. Veuillez télécharger un fichier PDF, DOCX ou TXT."
            }
        
        # Extraire le texte du CV
        resume_text = extract_text_from_file(file)
        
        # Prétraiter le texte
        processed_text = preprocess_resume_text(resume_text)
        
        # Extraire les informations de contact
        contact_info = extract_contact_info(processed_text)
        
        # Si aucun poste n'est spécifié, utiliser un poste générique
        job_role = job_role or "un poste dans votre entreprise"
        
        # Analyser le CV avec le LLM
        prompt = RESUME_ANALYSIS_PROMPT.format(
            job_role=job_role,
            resume_text=processed_text[:8000]  # Limiter la taille pour éviter de dépasser le contexte du LLM
        )
        
        llm_response = get_llm_response(prompt)
        
        try:
            # Tenter de parser la réponse JSON
            analysis = json.loads(llm_response)
            
            # Ajouter les informations de contact et métadonnées
            analysis['contact_info'] = contact_info
            analysis['metadata'] = {
                'filename': secure_filename(file.filename),
                'analysis_timestamp': datetime.now().isoformat(),
                'job_role': job_role
            }
            
            return analysis
            
        except json.JSONDecodeError:
            # Si la réponse n'est pas au format JSON valide
            return {
                "error": "Erreur lors de l'analyse du CV. Format de réponse invalide.",
                "raw_response": llm_response[:500],  # Retourner une partie de la réponse brute pour le débogage
                "contact_info": contact_info
            }
            
    except Exception as e:
        # Capturer toute autre erreur
        return {
            "error": f"Erreur lors de l'analyse du CV: {str(e)}"
        }

def match_resume_to_job_description(resume_text, job_description, detailed=True):
    """
    Compare un CV à une description de poste et évalue la correspondance
    
    Args:
        resume_text (str): Le texte du CV
        job_description (str): La description du poste
        detailed (bool): Si True, retourne une analyse détaillée
        
    Returns:
        dict: Résultats de correspondance
    """
    prompt = f"""
    Tu es un expert en recrutement chargé d'évaluer l'adéquation entre un CV et une description de poste.

    CV:
    ```
    {resume_text[:4000]}  # Limiter pour ne pas dépasser le contexte
    ```

    Description du poste:
    ```
    {job_description[:2000]}  # Limiter pour ne pas dépasser le contexte
    ```

    {"Analyse de façon détaillée" if detailed else "Analyse brièvement"} l'adéquation entre ce CV et cette description de poste. 
    
    Fournis ta réponse au format JSON avec la structure suivante:
    {{
      "match_score": 85,  // Score de correspondance sur 100
      "matching_skills": ["compétence1", "compétence2", ...],  // Compétences présentes dans le CV qui correspondent au poste
      "missing_skills": ["compétence1", "compétence2", ...],  // Compétences importantes pour le poste mais absentes du CV
      "key_strengths": ["point1", "point2", ...],  // Points forts du candidat pour ce poste
      "overall_assessment": "Évaluation globale de l'adéquation"
    }}
    """
    
    try:
        llm_response = get_llm_response(prompt)
        match_analysis = json.loads(llm_response)
        return match_analysis
    except Exception as e:
        return {
            "error": f"Erreur lors de l'analyse de correspondance: {str(e)}",
            "match_score": 0
        }

def generate_interview_questions_from_resume(resume_text, job_role, num_questions=5):
    """
    Génère des questions d'entretien personnalisées basées sur le CV
    
    Args:
        resume_text (str): Le texte du CV
        job_role (str): Le poste pour lequel le candidat postule
        num_questions (int): Nombre de questions à générer
        
    Returns:
        list: Liste de questions d'entretien
    """
    prompt = f"""
    Tu es un recruteur expérimenté spécialisé dans les entretiens pour le poste de {job_role}.
    Après avoir analysé le CV suivant, génère {num_questions} questions d'entretien pertinentes 
    qui permettront d'évaluer les compétences et l'expérience du candidat.

    CV:
    ```
    {resume_text[:5000]}  # Limiter pour ne pas dépasser le contexte
    ```

    Les questions doivent:
    1. Être spécifiques au parcours et aux compétences mentionnés dans le CV
    2. Inclure un mélange de questions techniques et comportementales
    3. Permettre d'évaluer l'adéquation au poste de {job_role}
    4. Être formulées de manière ouverte pour encourager des réponses détaillées

    Fournis ta réponse au format JSON avec la structure suivante:
    [
      {{
        "question": "Question d'entretien complète",
        "type": "technique/comportementale/situation/expérience",
        "skill_to_assess": "Compétence évaluée",
        "difficulty": "facile/moyenne/difficile",
        "expected_answer_elements": ["élément1", "élément2", ...] // Points clés à rechercher dans la réponse
      }},
      ...
    ]
    """
    
    try:
        llm_response = get_llm_response(prompt)
        questions = json.loads(llm_response)
        return questions
    except Exception as e:
        # En cas d'erreur, retourner quelques questions génériques
        return [
            {
                "question": f"Parlez-moi de votre expérience en tant que {job_role}.",
                "type": "expérience",
                "skill_to_assess": "Expérience générale",
                "difficulty": "facile",
                "expected_answer_elements": ["Parcours professionnel", "Réalisations"]
            },
            {
                "question": "Décrivez un projet difficile sur lequel vous avez travaillé récemment.",
                "type": "situation",
                "skill_to_assess": "Résolution de problèmes",
                "difficulty": "moyenne",
                "expected_answer_elements": ["Analyse de la situation", "Approche méthodique", "Résultats"]
            }
        ]