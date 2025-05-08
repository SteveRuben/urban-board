from typing import Dict, Any, List, Optional
from exercise_generator import ExerciseGenerator

class ExerciseRecommender:
    """Classe pour recommander des exercices basés sur l'analyse des écarts."""
    
    def __init__(self, exercise_generator=None):
        # Ne pas initialiser ExerciseRepository pour éviter toute dépendance à la BD
        self.exercise_generator = exercise_generator or ExerciseGenerator()
    
    def recommend_exercises(self, gap_analysis: Dict[str, Any], language: str = "python") -> Dict[str, Any]:
        """
        Recommande des exercices simples générés par l'IA basés sur l'analyse des écarts.
        
        Args:
            gap_analysis: Résultat de l'analyse des écarts
            language: Langage de programmation préféré (par défaut: python)
            
        Returns:
            Dictionnaire contenant les exercices recommandés
        """
        missing_skills = gap_analysis.get("missing_skills", [])
        matching_skills = gap_analysis.get("matching_skills", [])
        
        # Si aucune compétence manquante, utiliser les compétences correspondantes
        skills_to_target = missing_skills if missing_skills else matching_skills
        
        if not skills_to_target:
            # Si aucune compétence n'est détectée, utiliser le langage spécifié
            skills_to_target = [language]
        
        # S'assurer que le langage est inclus dans les compétences
        if language.lower() not in [skill.lower() for skill in skills_to_target]:
            skills_to_target.append(language)
        
        # Générer directement des exercices sans chercher dans la BD
        evaluation_exercises = []
        training_exercises = []
        
        try:
            # 1. Générer un exercice d'évaluation simple
            if skills_to_target:
                print(f"Génération d'un exercice d'évaluation pour les compétences: {', '.join(skills_to_target[:2])}")
                evaluation_exercise = self.exercise_generator.generate_exercise_for_skills(
                    skills=skills_to_target[:2],
                    difficulty="easy",  # Facile pour les tests
                    purpose="evaluation"
                )
                evaluation_exercises.append(evaluation_exercise)
            
            # 2. Générer des exercices d'entraînement simples (limiter à 2 maximum)
            skills_count = min(2, len(skills_to_target))
            for i in range(skills_count):
                skill = skills_to_target[i]
                # Alterner les niveaux de difficulté
                difficulty = "easy" if i % 2 == 0 else "medium"
                
                print(f"Génération d'un exercice d'entraînement pour la compétence: {skill}")
                training_exercise = self.exercise_generator.generate_exercise_for_skills(
                    skills=[skill, language],  # Inclure le langage
                    difficulty=difficulty,
                    purpose="training"
                )
                training_exercises.append(training_exercise)
                
        except Exception as e:
            print(f"Erreur lors de la génération d'exercices: {str(e)}")
            # En cas d'erreur, créer au moins un exercice par défaut
            default_exercise = self.exercise_generator._generate_simple_exercise_no_llm(
                skills=[language],
                difficulty="easy",
                purpose="training",
                technology=language
            )
            if not training_exercises:
                training_exercises.append(default_exercise)
        
        return {
            "evaluation": evaluation_exercises,
            "training": training_exercises,
            "message": "Exercices générés uniquement par IA (pas d'accès à la base de données)"
        }
    
    def get_exercises_by_skills(self, skills: List[str], purpose: str, language: str = "python", limit: int = 2) -> List[Dict[str, Any]]:
        """
        Génère des exercices pour des compétences spécifiques.
        Ne recherche pas dans la BD, génère directement avec l'IA.
        
        Args:
            skills: Liste des compétences cibles
            purpose: Objectif des exercices ('evaluation' ou 'training')
            language: Langage de programmation préféré
            limit: Nombre maximum d'exercices à retourner
            
        Returns:
            Liste d'exercices générés
        """
        if not skills:
            return []
        
        # S'assurer que le langage est inclus dans les compétences
        skills_with_language = skills.copy()
        if language.lower() not in [skill.lower() for skill in skills_with_language]:
            skills_with_language.append(language)
        
        # Générer directement des exercices sans chercher dans la BD
        exercises = []
        
        try:
            # Générer des exercices (limiter au nombre demandé)
            for i in range(min(limit, len(skills))):
                skill = skills[i]
                # Alterner les niveaux de difficulté
                difficulty = "easy" if i % 2 == 0 else "medium"
                
                print(f"Génération d'un exercice {purpose} pour la compétence: {skill}")
                exercise = self.exercise_generator.generate_exercise_for_skills(
                    skills=[skill, language],  # Inclure le langage
                    difficulty=difficulty,
                    purpose=purpose
                )
                exercises.append(exercise)
                
        except Exception as e:
            print(f"Erreur lors de la génération d'exercices: {str(e)}")
            # En cas d'erreur, créer au moins un exercice par défaut
            if not exercises:
                default_exercise = self.exercise_generator._generate_simple_exercise_no_llm(
                    skills=[language],
                    difficulty="easy",
                    purpose=purpose,
                    technology=language
                )
                exercises.append(default_exercise)
        
        return exercises