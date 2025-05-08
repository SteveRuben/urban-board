from flask import request, jsonify
from . import resume_bp
from ..services.resume_analyzer import analyze_resume, match_resume_to_job_description
from ..services.exercise_generator import ExerciseGenerator
from ..services.exercise_recommender import ExerciseRecommender

@resume_bp.route('/analyze', methods=['POST'])
def analyze():
    """Analyse un CV téléchargé"""
    # Vérifier si un fichier a été téléchargé
    if 'resume' not in request.files:
        return jsonify({"error": "Aucun fichier téléchargé"}), 400
    
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({"error": "Aucun fichier sélectionné"}), 400
    
    # Logique pour analyser le CV
    analysis_results = analyze_resume(file)
    
    return jsonify(analysis_results)

@resume_bp.route('/match-job', methods=['POST'])
def match_job():
    """
    Analyse un CV par rapport à une offre d'emploi et retourne les faiblesses, 
    compétences, éducation et autres informations pour le candidat
    """
    # Vérifier si un fichier a été téléchargé
    if 'resume' not in request.files:
        return jsonify({"error": "Aucun fichier CV téléchargé"}), 400
    
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({"error": "Aucun fichier CV sélectionné"}), 400
    
    # Récupérer le texte de l'offre d'emploi
    job_description = request.form.get('job_description')
    
    if not job_description:
        return jsonify({"error": "Description du poste manquante"}), 400
    
    # Analyser le CV
    resume_analysis = analyze_resume(file)
    
    # Extraire le texte du CV depuis les résultats d'analyse
    resume_text = ""
    if "error" in resume_analysis:
        return jsonify({"error": "Erreur lors de l'analyse du CV: " + resume_analysis["error"]}), 500
    
    # Récupérer le texte du CV (si disponible, sinon utiliser un résumé des informations extraites)
    if hasattr(file, 'seek'):
        file.seek(0)  # Réinitialiser le curseur au début du fichier
        try:
            from ..services.resume_analyzer import extract_text_from_file
            resume_text = extract_text_from_file(file)
        except Exception as e:
            # Si on ne peut pas récupérer le texte brut, on crée un texte à partir des données extraites
            resume_text = f"Résumé: {resume_analysis.get('resume_summary', '')}\n"
            resume_text += f"Compétences techniques: {', '.join(resume_analysis.get('technical_skills', []))}\n"
            resume_text += f"Compétences non techniques: {', '.join(resume_analysis.get('soft_skills', []))}\n"
            
            # Ajouter l'expérience
            resume_text += "Expérience professionnelle:\n"
            for exp in resume_analysis.get('relevant_experience', []):
                resume_text += f"- {exp.get('position', '')} chez {exp.get('company', '')} ({exp.get('duration', '')})\n"
            
            # Ajouter l'éducation
            resume_text += "Formation:\n"
            for edu in resume_analysis.get('education', []):
                resume_text += f"- {edu.get('degree', '')} à {edu.get('institution', '')} ({edu.get('year', '')})\n"
    
    # Comparer le CV à la description du poste
    match_results = match_resume_to_job_description(resume_text, job_description, detailed=True)
    
    # Combiner les résultats
    combined_results = {
        "resume_analysis": resume_analysis,
        "job_match": match_results,
        "candidate_profile": {
            "strengths": resume_analysis.get("strengths", []),
            "gaps": resume_analysis.get("gaps", []) + match_results.get("missing_skills", []),
            "education": resume_analysis.get("education", []),
            "technical_skills": resume_analysis.get("technical_skills", []),
            "soft_skills": resume_analysis.get("soft_skills", []),
            "match_score": match_results.get("match_score", 0),
            "recommended_focus_areas": match_results.get("missing_skills", [])
        }
    }
    
    return jsonify(combined_results)

@resume_bp.route('/generate-evaluation-exercise', methods=['POST'])
def generate_evaluation_exercise():
    """
    Génère un exercice d'évaluation simple basé sur une offre d'emploi
    """
    # Récupérer les paramètres de la requête
    job_description = request.json.get('job_description')
    language = request.json.get('language', 'python')  # Langage par défaut : Python
    
    if not job_description:
        return jsonify({"error": "Description du poste manquante"}), 400
    
    # Extraire les compétences requises de l'offre d'emploi
    try:
        from ..services.resume_analyzer import extract_job_requirements_no_llm
        job_requirements = extract_job_requirements_no_llm(job_description)
        
        # Extraire les compétences techniques
        required_skills = job_requirements.get("technical_skills", []) + job_requirements.get("tech_stacks", [])
        
        # S'assurer qu'il y a au moins une compétence à évaluer
        if not required_skills:
            required_skills = [language]  # Utiliser le langage demandé comme compétence par défaut
        
        # Ajouter explicitement le langage demandé si ce n'est pas déjà dans les compétences
        if language.lower() not in [skill.lower() for skill in required_skills]:
            required_skills.append(language)
        
        # Déterminer le niveau de difficulté en fonction de l'expérience requise
        difficulty = "medium"  # Par défaut
        experience_level = job_requirements.get("experience_level", "")
        
        if "0-2" in experience_level or "junior" in experience_level.lower():
            difficulty = "easy"
        elif "5+" in experience_level or "senior" in experience_level.lower():
            difficulty = "hard"
        
        # Générer un exercice d'évaluation simple
        exercise_generator = ExerciseGenerator()
        evaluation_exercise = exercise_generator.generate_exercise_for_skills(
            skills=required_skills[:3],  # Limiter à 3 compétences pour la précision
            difficulty=difficulty,
            purpose="evaluation"
        )
        
        return jsonify(evaluation_exercise)
        
    except Exception as e:
        return jsonify({"error": f"Erreur lors de la génération de l'exercice: {str(e)}"}), 500


@resume_bp.route('/generate-training-exercises', methods=['POST'])
def generate_training_exercises():
    """
    Génère des exercices d'entraînement simples basés sur un CV et une offre d'emploi
    """
    # Vérifier si un fichier a été téléchargé
    if 'resume' not in request.files:
        return jsonify({"error": "Aucun fichier CV téléchargé"}), 400
    
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({"error": "Aucun fichier CV sélectionné"}), 400
    
    # Récupérer le texte de l'offre d'emploi et le langage préféré
    job_description = request.form.get('job_description')
    language = request.form.get('language', 'python')  # Langage par défaut : Python
    
    if not job_description:
        return jsonify({"error": "Description du poste manquante"}), 400
    
    try:
        # Extraire le texte du CV
        from ..services.resume_analyzer import extract_text_from_file
        resume_text = extract_text_from_file(file)
        
        # Comparer le CV à la description du poste pour identifier les écarts
        match_results = match_resume_to_job_description(resume_text, job_description, detailed=True)
        
        # Utiliser le recommandeur d'exercices pour générer des exercices simples
        recommender = ExerciseRecommender()
        exercises = recommender.recommend_exercises(match_results, language)
        
        return jsonify(exercises)
        
    except Exception as e:
        return jsonify({"error": f"Erreur lors de la génération des exercices: {str(e)}"}), 500


