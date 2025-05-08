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

       
        
        

def extract_candidate_skills_no_llm(resume_text):
    """
    Extrait les compétences d'un CV sans utiliser de LLM.
    Version de secours basée sur des mots-clés.
    
    Args:
        resume_text: Texte du CV
            
    Returns:
        Dictionnaire contenant les compétences du candidat
    """
    skills = []
    education = []
    
    # Listes de technologies et compétences courantes à rechercher
    common_techs = ["Python", "JavaScript", "TypeScript", "Java", "C#", "PHP", 
                    "Ruby", "Go", "React", "Angular", "Vue", "Node.js", "Django", 
                    "Flask", "Spring", "Express", "Laravel", "Ruby on Rails", 
                    "PostgreSQL", "MySQL", "MongoDB", "SQL Server", "Oracle", 
                    "Flutter", "Dart", "Swift", "Kotlin"]
    
    common_skills = ["API REST", "GraphQL", "Git", "Docker", "Kubernetes", "CI/CD", 
                     "AWS", "Azure", "GCP", "DevOps", "Agile", "Scrum", "TDD", 
                     "Machine Learning", "Deep Learning", "Data Science", "Big Data", 
                     "Cloud Computing", "Microservices", "Mobile Development",
                     "UML", "RUP", "Tests unitaires", "UI/UX"]
    
    # Recherche basique de mots-clés et détermination du niveau
    technical_skills = []
    
    for tech in common_techs:
        if tech.lower() in resume_text.lower():
            level = "intermédiaire"  # niveau par défaut
            if "expert" in resume_text.lower() and tech.lower() in resume_text.lower().split("expert")[0][-20:]:
                level = "expert"
            elif "avancé" in resume_text.lower() and tech.lower() in resume_text.lower().split("avancé")[0][-20:]:
                level = "avancé"
            elif "débutant" in resume_text.lower() and tech.lower() in resume_text.lower().split("débutant")[0][-20:]:
                level = "débutant"
            skills.append({"name": tech, "level": level})
            technical_skills.append(tech)
            
    for skill in common_skills:
        if skill.lower() in resume_text.lower():
            level = "intermédiaire"  # niveau par défaut
            if "expert" in resume_text.lower() and skill.lower() in resume_text.lower().split("expert")[0][-20:]:
                level = "expert"
            elif "avancé" in resume_text.lower() and skill.lower() in resume_text.lower().split("avancé")[0][-20:]:
                level = "avancé"
            elif "débutant" in resume_text.lower() and skill.lower() in resume_text.lower().split("débutant")[0][-20:]:
                level = "débutant"
            skills.append({"name": skill, "level": level})
            technical_skills.append(skill)
    
    # Détection basique de l'éducation
    education_data = []
    education_keywords = ["Licence", "Master", "Doctorat", "DUT", "BTS", "Ingénieur", "Université", "École"]
    for keyword in education_keywords:
        if keyword.lower() in resume_text.lower():
            # Trouver la ligne contenant le mot-clé
            lines = resume_text.split('\n')
            for line in lines:
                if keyword.lower() in line.lower():
                    # Simplification pour la démo
                    education_data.append({
                        "degree": line.strip(),
                        "institution": "Institution extraite du CV",
                        "year": "2020",  # Valeur par défaut
                        "relevance": "moyenne"  # Relevance par défaut
                    })
                    break
    
    # Détection simple de l'expérience
    experience_years = 0
    roles = []
    relevant_experience = []
    
    # Recherche de mots clés liés à l'expérience
    experience_keywords = ["expérience", "ans d'expérience", "années d'expérience"]
    for keyword in experience_keywords:
        if keyword in resume_text.lower():
            # Trouver le nombre d'années (simplification)
            for i in range(1, 21):  # de 1 à 20 ans
                if str(i) + " " + keyword in resume_text.lower():
                    experience_years = i
                    break
    
    # Recherche de rôles professionnels
    role_keywords = ["Développeur", "Ingénieur", "Architecte", "Chef de projet", 
                    "Data Scientist", "DevOps", "Full Stack", "Frontend", "Backend"]
    for role in role_keywords:
        if role.lower() in resume_text.lower():
            roles.append(role)
            # Créer une entrée d'expérience basique
            relevant_experience.append({
                "position": role,
                "company": "Entreprise extraite du CV",
                "duration": f"{max(1, experience_years // len(roles))} ans",  # Répartition basique de l'expérience
                "highlights": ["Compétence détectée automatiquement"]
            })
    
    # Détection des soft skills
    soft_skills = []
    common_soft_skills = ["Communication", "Travail d'équipe", "Autonomie", 
                          "Résolution de problèmes", "Adaptabilité", "Créativité",
                          "Leadership", "Gestion du temps", "Organisation"]
    for skill in common_soft_skills:
        if skill.lower() in resume_text.lower():
            soft_skills.append(skill)
    
    # Valeurs par défaut si rien n'est détecté
    if not technical_skills:
        technical_skills = ["Python", "JavaScript"]
    
    if not soft_skills:
        soft_skills = ["Communication", "Travail d'équipe"]
    
    if not education_data:
        education_data = [{
            "degree": "Formation non spécifiée",
            "institution": "Institution non spécifiée",
            "year": "N/A",
            "relevance": "non déterminée"
        }]
    
    if not relevant_experience:
        relevant_experience = [{
            "position": "Poste non spécifié",
            "company": "Entreprise non spécifiée",
            "duration": "Durée non spécifiée",
            "highlights": ["Expérience détectée automatiquement"]
        }]
    
    # Créer un résumé simple basé sur les compétences et l'expérience détectées
    resume_summary = f"Professionnel avec {experience_years if experience_years > 0 else 'une'} expérience "
    if roles:
        resume_summary += f"en tant que {', '.join(roles[:2])}. "
    else:
        resume_summary += "dans le domaine. "
    
    if technical_skills:
        resume_summary += f"Compétences en {', '.join(technical_skills[:3])}."
    
    # Estimer un score d'adéquation basique (à affiner selon les besoins)
    fit_score = min(7.0, 4.0 + (len(technical_skills) * 0.2) + (len(soft_skills) * 0.1) + (experience_years * 0.1))
    
    # Créer des forces basiques basées sur les compétences détectées
    strengths = []
    if technical_skills:
        strengths.append(f"Maîtrise de {', '.join(technical_skills[:3])}")
    if soft_skills:
        strengths.append(f"Bonnes compétences en {', '.join(soft_skills[:2])}")
    if experience_years > 3:
        strengths.append(f"Expérience significative de {experience_years} ans dans le domaine")
    
    # Créer des lacunes basiques
    gaps = ["Analyse automatique limitée - vérification manuelle recommandée"]
    if experience_years < 2:
        gaps.append("Expérience professionnelle potentiellement limitée")
    
    # Générer des questions d'entretien basiques
    recommended_questions = [
        {
            "question": f"Pouvez-vous me parler de votre expérience avec {technical_skills[0] if technical_skills else 'les technologies mentionnées dans votre CV'}?",
            "rationale": "Pour évaluer la profondeur des connaissances techniques"
        },
        {
            "question": "Décrivez un projet difficile sur lequel vous avez travaillé récemment.",
            "rationale": "Pour évaluer la résolution de problèmes et l'expérience pratique"
        }
    ]
    
    # Assembler les résultats
    return {
        "resume_summary": resume_summary,
        "technical_skills": technical_skills,
        "soft_skills": soft_skills,
        "relevant_experience": relevant_experience,
        "education": education_data,
        "fit_score": fit_score,
        "fit_justification": "Score basé sur l'analyse automatique des compétences et de l'expérience détectées",
        "strengths": strengths,
        "gaps": gaps,
        "recommended_questions": recommended_questions,
        "keywords": technical_skills + soft_skills,
        "_generated_by": "fallback_method"  # Marqueur pour indiquer que c'est la méthode de secours
    }

def extract_job_requirements_no_llm(job_text):
    """
    Extrait les exigences d'une offre d'emploi sans utiliser de LLM.
    Version de secours basée sur des mots-clés.
    
    Args:
        job_text: Texte de l'offre d'emploi
            
    Returns:
        Dictionnaire contenant les exigences du poste
    """
    # Analyse simple basée sur des mots-clés pour la démo
    tech_stacks = []
    technical_skills = []
    
    # Listes de technologies et compétences courantes à rechercher
    common_tech_stacks = ["Python", "JavaScript", "TypeScript", "Java", "C#", "PHP", 
                         "Ruby", "Go", "React", "Angular", "Vue", "Node.js", "Django", 
                         "Flask", "Spring", "Express", "Laravel", "Ruby on Rails", 
                         "PostgreSQL", "MySQL", "MongoDB", "SQL Server", "Oracle", 
                         "Flutter", "Dart", "Swift", "Kotlin"]
    
    common_skills = ["API REST", "GraphQL", "Git", "Docker", "Kubernetes", "CI/CD", 
                    "AWS", "Azure", "GCP", "DevOps", "Agile", "Scrum", "TDD", 
                    "Machine Learning", "Deep Learning", "Data Science", "Big Data", 
                    "Cloud Computing", "Microservices", "Mobile Development",
                    "UML", "RUP", "Tests unitaires", "UI/UX"]
    
    # Recherche basique de mots-clés
    for tech in common_tech_stacks:
        if tech.lower() in job_text.lower():
            tech_stacks.append(tech)
            
    for skill in common_skills:
        if skill.lower() in job_text.lower():
            technical_skills.append(skill)
    
    # Déterminer le niveau d'expérience (analyse basique)
    experience_level = "Junior"
    if "3-5 ans" in job_text or "3 à 5 ans" in job_text or "expérimenté" in job_text.lower():
        experience_level = "3-5 ans"
    elif "5 ans" in job_text or "senior" in job_text.lower():
        experience_level = "5+ ans"
    elif "débutant" in job_text.lower() or "junior" in job_text.lower():
        experience_level = "0-2 ans"
    
    # Détecter les soft skills
    soft_skills = []
    common_soft_skills = ["Communication", "Travail d'équipe", "Autonomie", 
                          "Résolution de problèmes", "Adaptabilité", "Créativité",
                          "Leadership", "Gestion du temps", "Organisation"]
    for skill in common_soft_skills:
        if skill.lower() in job_text.lower():
            soft_skills.append(skill)
    
    # Certifications
    certifications = []
    common_certifications = ["AWS Certified", "Microsoft Certified", "Google Cloud", 
                            "Scrum Master", "PMP", "CISSP", "CISA", "ITIL", "TOGAF"]
    for cert in common_certifications:
        if cert.lower() in job_text.lower():
            certifications.append(cert)
    
    # Si aucune technologie n'est détectée, ajouter des valeurs par défaut pour la démo
    if not tech_stacks:
        tech_stacks = ["Python", "React", "PostgreSQL"]
    if not technical_skills:
        technical_skills = ["API REST", "Git"]
    if not soft_skills:
        soft_skills = ["Communication", "Travail d'équipe"]
            
    return {
        "tech_stacks": tech_stacks,
        "technical_skills": technical_skills,
        "soft_skills": soft_skills,
        "experience_level": experience_level,
        "certifications": certifications,
        "_generated_by": "fallback_method"  # Marqueur pour indiquer que c'est la méthode de secours
    }

def match_resume_to_job_description_no_llm(resume_text, job_description):
    """
    Compare un CV à une description de poste sans utiliser de LLM.
    Version de secours basée sur des mots-clés.
    
    Args:
        resume_text: Le texte du CV
        job_description: La description du poste
        
    Returns:
        dict: Résultats de correspondance
    """
    # Extraire les compétences du CV et les exigences du poste
    resume_data = extract_candidate_skills_no_llm(resume_text)
    job_data = extract_job_requirements_no_llm(job_description)
    
    # Compétences techniques du CV
    resume_skills = set(resume_data["technical_skills"])
    
    # Compétences techniques requises pour le poste
    job_skills = set(job_data["technical_skills"] + job_data["tech_stacks"])
    
    # Compétences correspondantes
    matching_skills = list(resume_skills.intersection(job_skills))
    
    # Compétences manquantes
    missing_skills = list(job_skills - resume_skills)
    
    # Calcul du score de correspondance (simple ratio de correspondance)
    if len(job_skills) > 0:
        match_score = min(100, round((len(matching_skills) / len(job_skills)) * 100))
    else:
        match_score = 50  # score par défaut si aucune compétence requise n'est détectée
    
    # Ajustement du score en fonction de l'expérience
    experience_years = resume_data.get("experience", {}).get("years", 0)
    if experience_years == 0:
        # Si on n'a pas pu extraire les années d'expérience, essayons de les déduire de l'expérience
        if resume_data["relevant_experience"]:
            for exp in resume_data["relevant_experience"]:
                duration = exp.get("duration", "")
                if "ans" in duration:
                    try:
                        years = int(re.search(r'(\d+)', duration).group(1))
                        experience_years = max(experience_years, years)
                    except:
                        pass
    
    # Ajustement basé sur l'expérience attendue vs. réelle
    expected_experience = 0
    if job_data["experience_level"] == "0-2 ans":
        expected_experience = 1
    elif job_data["experience_level"] == "3-5 ans":
        expected_experience = 4
    elif job_data["experience_level"] == "5+ ans":
        expected_experience = 6
    
    # Bonus ou malus pour l'expérience (max ±15 points)
    experience_factor = min(15, max(-15, (experience_years - expected_experience) * 3))
    match_score = min(100, max(0, match_score + experience_factor))
    
    # Déterminer les points forts (au moins 3 si possible)
    key_strengths = []
    
    # Ajouter les compétences correspondantes comme points forts
    for skill in matching_skills[:3]:
        key_strengths.append(f"Maîtrise de {skill}")
    
    # Ajouter l'expérience si adéquate
    if experience_years >= expected_experience:
        key_strengths.append(f"Expérience adéquate ({experience_years} ans vs {expected_experience} ans attendus)")
    
    # Ajouter les soft skills correspondants
    resume_soft_skills = set(resume_data["soft_skills"])
    job_soft_skills = set(job_data["soft_skills"])
    matching_soft_skills = resume_soft_skills.intersection(job_soft_skills)
    
    if matching_soft_skills:
        key_strengths.append(f"Compétences interpersonnelles recherchées: {', '.join(list(matching_soft_skills)[:3])}")
    
    # S'assurer d'avoir au moins 2 points forts
    if len(key_strengths) < 2:
        key_strengths.append("Profil détecté automatiquement - analyse limitée")
    
    # Évaluation globale basée sur le score
    assessment = "Correspondance faible - vérification manuelle recommandée"
    if match_score >= 80:
        assessment = "Excellente correspondance - candidat très qualifié pour le poste"
    elif match_score >= 60:
        assessment = "Bonne correspondance - candidat qualifié avec quelques compétences manquantes"
    elif match_score >= 40:
        assessment = "Correspondance moyenne - candidat partiellement qualifié"
    
    # Assembler le résultat
    return {
        "match_score": match_score,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "key_strengths": key_strengths,
        "overall_assessment": assessment,
        "_generated_by": "fallback_method"  # Marqueur pour indiquer que c'est la méthode de secours
    }

def generate_interview_questions_from_resume_no_llm(resume_text, job_role, num_questions=5):
    """
    Génère des questions d'entretien sans utiliser de LLM.
    Version de secours basée sur un ensemble prédéfini de questions.
    
    Args:
        resume_text: Le texte du CV
        job_role: Le poste pour lequel le candidat postule
        num_questions: Nombre de questions à générer
        
    Returns:
        list: Liste de questions d'entretien
    """
    # Extraire les compétences du CV
    skills_data = extract_candidate_skills_no_llm(resume_text)
    
    # Questions génériques adaptées au profil
    generic_questions = [
        {
            "question": f"Pouvez-vous me parler de votre expérience en tant que {job_role}?",
            "type": "expérience",
            "skill_to_assess": "Expérience générale",
            "difficulty": "facile",
            "expected_answer_elements": ["Parcours professionnel", "Réalisations clés", "Responsabilités"]
        },
        {
            "question": "Décrivez un projet difficile sur lequel vous avez travaillé récemment. Quels défis avez-vous rencontrés et comment les avez-vous surmontés?",
            "type": "situation",
            "skill_to_assess": "Résolution de problèmes",
            "difficulty": "moyenne",
            "expected_answer_elements": ["Identification du problème", "Approche méthodique", "Solutions mises en œuvre", "Résultats obtenus"]
        },
        {
            "question": "Comment gérez-vous les délais serrés et la pression dans votre travail?",
            "type": "comportementale",
            "skill_to_assess": "Gestion du stress",
            "difficulty": "moyenne",
            "expected_answer_elements": ["Priorisation", "Organisation", "Communication", "Adaptabilité"]
        },
        {
            "question": "Pouvez-vous me donner un exemple de situation où vous avez dû apprendre rapidement une nouvelle technologie ou méthodologie?",
            "type": "situation",
            "skill_to_assess": "Capacité d'apprentissage",
            "difficulty": "moyenne",
            "expected_answer_elements": ["Méthode d'apprentissage", "Adaptation", "Application pratique", "Résultats"]
        },
        {
            "question": "Quels sont vos objectifs professionnels à moyen et long terme?",
            "type": "comportementale",
            "skill_to_assess": "Motivation et ambition",
            "difficulty": "facile",
            "expected_answer_elements": ["Vision claire", "Alignement avec le poste", "Plan de développement"]
        }
    ]
    
    # Questions spécifiques aux compétences techniques détectées
    technical_questions = []
    
    if skills_data["technical_skills"]:
        for skill in skills_data["technical_skills"][:3]:  # Prendre les 3 premières compétences
            technical_questions.append({
                "question": f"Pouvez-vous détailler votre niveau d'expertise en {skill} et me donner un exemple concret d'utilisation?",
                "type": "technique",
                "skill_to_assess": skill,
                "difficulty": "moyenne",
                "expected_answer_elements": ["Niveau d'expertise", "Expérience pratique", "Cas d'utilisation", "Connaissance approfondie"]
            })
    
    # Questions spécifiques à l'expérience
    experience_questions = []
    
    if skills_data["relevant_experience"]:
        for exp in skills_data["relevant_experience"][:2]:  # Prendre les 2 premières expériences
            experience_questions.append({
                "question": f"Pendant votre expérience chez {exp.get('company', 'votre précédent employeur')} en tant que {exp.get('position', 'professionnel')}, quelle a été votre plus grande réussite?",
                "type": "expérience",
                "skill_to_assess": "Accomplissements professionnels",
                "difficulty": "moyenne",
                "expected_answer_elements": ["Contexte", "Défis", "Actions entreprises", "Résultats mesurables"]
            })
    
    # Assembler les questions finales
    all_questions = generic_questions + technical_questions + experience_questions
    
    # Limiter au nombre demandé
    return all_questions[:num_questions]

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
       
       # Tenter d'analyser le CV avec le LLM
       try:
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
                   'job_role': job_role,
                   'analysis_method': 'llm'
               }
               
               return analysis
               
           except json.JSONDecodeError:
               # Si la réponse n'est pas au format JSON valide, utiliser la méthode de secours
               print(f"Erreur de décodage JSON dans la réponse LLM, utilisation de la méthode de secours")
               fallback_analysis = extract_candidate_skills_no_llm(processed_text)
               fallback_analysis['contact_info'] = contact_info
               fallback_analysis['metadata'] = {
                   'filename': secure_filename(file.filename),
                   'analysis_timestamp': datetime.now().isoformat(),
                   'job_role': job_role,
                   'analysis_method': 'fallback',
                   'error': 'JSON invalide dans la réponse LLM'
               }
               
               return fallback_analysis
               
       except Exception as llm_error:
           # En cas d'erreur avec le LLM, utiliser la méthode de secours
           print(f"Erreur LLM: {str(llm_error)}, utilisation de la méthode de secours")
           fallback_analysis = extract_candidate_skills_no_llm(processed_text)
           fallback_analysis['contact_info'] = contact_info
           fallback_analysis['metadata'] = {
               'filename': secure_filename(file.filename),
               'analysis_timestamp': datetime.now().isoformat(),
               'job_role': job_role,
               'analysis_method': 'fallback',
               'error': f'Erreur LLM: {str(llm_error)}'
           }
           
           return fallback_analysis
           
   except Exception as e:
       # Capturer toute autre erreur et essayer la méthode de secours
       try:
           print(f"Erreur générale: {str(e)}, tentative d'utilisation de la méthode de secours")
           # Si une erreur se produit mais que nous avons déjà le texte du CV
           if 'processed_text' in locals():
               fallback_analysis = extract_candidate_skills_no_llm(processed_text)
               fallback_analysis['contact_info'] = extract_contact_info(processed_text) if 'contact_info' not in locals() else contact_info
               fallback_analysis['metadata'] = {
                   'filename': secure_filename(file.filename),
                   'analysis_timestamp': datetime.now().isoformat(),
                   'job_role': job_role,
                   'analysis_method': 'fallback',
                   'error': f'Erreur générale: {str(e)}'
               }
               return fallback_analysis
       except:
           pass
           
       # Si même la méthode de secours échoue ou si nous n'avons pas le texte du CV
       return {
           "error": f"Erreur lors de l'analyse du CV: {str(e)}",
           "analysis_method": "failed"
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
   try:
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
           match_analysis['analysis_method'] = 'llm'
           return match_analysis
       except Exception as llm_error:
           # En cas d'erreur avec le LLM, utiliser la méthode de secours
           print(f"Erreur LLM dans match_resume_to_job_description: {str(llm_error)}, utilisation de la méthode de secours")
           fallback_analysis = match_resume_to_job_description_no_llm(resume_text, job_description)
           fallback_analysis['analysis_method'] = 'fallback'
           fallback_analysis['error'] = f'Erreur LLM: {str(llm_error)}'
           return fallback_analysis
   except Exception as e:
       # En cas d'erreur générale, utiliser la méthode de secours
       try:
           print(f"Erreur générale dans match_resume_to_job_description: {str(e)}, utilisation de la méthode de secours")
           fallback_analysis = match_resume_to_job_description_no_llm(resume_text, job_description)
           fallback_analysis['analysis_method'] = 'fallback'
           fallback_analysis['error'] = f'Erreur générale: {str(e)}'
           return fallback_analysis
       except:
           return {
               "error": f"Erreur lors de l'analyse de correspondance: {str(e)}",
               "match_score": 0,
               "analysis_method": "failed"
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
   try:
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
           # Ajouter des métadonnées d'analyse
           for question in questions:
               question['generated_by'] = 'llm'
           return questions
       except Exception as llm_error:
           # En cas d'erreur avec le LLM, utiliser la méthode de secours
           print(f"Erreur LLM dans generate_interview_questions: {str(llm_error)}, utilisation de la méthode de secours")
           fallback_questions = generate_interview_questions_from_resume_no_llm(resume_text, job_role, num_questions)
           # Ajouter des métadonnées d'analyse
           for question in fallback_questions:
               question['generated_by'] = 'fallback'
               question['error'] = f'Erreur LLM: {str(llm_error)}'
           return fallback_questions
   except Exception as e:
       # En cas d'erreur générale, utiliser la méthode de secours
       try:
           print(f"Erreur générale dans generate_interview_questions: {str(e)}, utilisation de la méthode de secours")
           fallback_questions = generate_interview_questions_from_resume_no_llm(resume_text, job_role, num_questions)
           # Ajouter des métadonnées d'analyse
           for question in fallback_questions:
               question['generated_by'] = 'fallback'
               question['error'] = f'Erreur générale: {str(e)}'
           return fallback_questions
       except:
           # Dernière ressource : questions génériques
           return [
               {
                   "question": f"Parlez-moi de votre expérience en tant que {job_role}.",
                   "type": "expérience",
                   "skill_to_assess": "Expérience générale",
                   "difficulty": "facile",
                   "expected_answer_elements": ["Parcours professionnel", "Réalisations"],
                   "generated_by": "default",
                   "error": f"Erreur lors de la génération des questions: {str(e)}"
               },
               {
                   "question": "Décrivez un projet difficile sur lequel vous avez travaillé récemment.",
                   "type": "situation",
                   "skill_to_assess": "Résolution de problèmes",
                   "difficulty": "moyenne",
                   "expected_answer_elements": ["Analyse de la situation", "Approche méthodique", "Résultats"],
                   "generated_by": "default",
                   "error": f"Erreur lors de la génération des questions: {str(e)}"
               }
           ]