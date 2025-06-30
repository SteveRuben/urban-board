# backend/services/interview_exercise_service.py
from datetime import datetime, timezone, timedelta
import json
from app import db
from ..models.user_exercise import UserExercise
from ..models.coding_platform import Exercise, Challenge, ChallengeStatus, UserChallengeProgress, UserChallenge
from ..services.coding_platform_service import CodingPlatformService
import re
from typing import List, Dict, Optional, Tuple

class InterviewExerciseService:
    """Service pour gérer l'intégration des exercices de coding dans les entretiens"""
    
    def __init__(self):
        self.coding_service = CodingPlatformService()
    
    def extract_job_keywords(self, position: str, description: str = None) -> List[str]:
        """
        Extrait les mots-clés techniques d'un poste pour la recherche d'exercices
        
        Args:
            position: Titre du poste
            description: Description optionnelle du poste
            
        Returns:
            Liste de mots-clés pertinents
        """
        # Dictionnaire de mapping des termes métiers vers les technologies
        job_tech_mapping = {
            # Développement Web
            'frontend': ['javascript', 'react', 'vue', 'angular', 'html', 'css'],
            'front-end': ['javascript', 'react', 'vue', 'angular', 'html', 'css'],
            'front end': ['javascript', 'react', 'vue', 'angular', 'html', 'css'],
            'backend': ['python', 'java', 'nodejs', 'php', 'go', 'api'],
            'back-end': ['python', 'java', 'nodejs', 'php', 'go', 'api'],
            'back end': ['python', 'java', 'nodejs', 'php', 'go', 'api'],
            'fullstack': ['javascript', 'python', 'java', 'react', 'api'],
            'full-stack': ['javascript', 'python', 'java', 'react', 'api'],
            'full stack': ['javascript', 'python', 'java', 'react', 'api'],
            
            # Technologies spécifiques
            'python': ['Python', 'django', 'flask', 'api'],
            'javascript': ['javascript', 'nodejs', 'react', 'vue'],
            'java': ['java', 'spring', 'api'],
            'react': ['javascript', 'react', 'frontend'],
            'nodejs': ['javascript', 'nodejs', 'api'],
            'angular': ['javascript', 'angular', 'typescript'],
            'vue': ['javascript', 'vue', 'frontend'],
            
            # Domaines spécialisés
            'data': ['python', 'sql', 'algorithm'],
            'machine learning': ['python', 'algorithm'],
            'devops': ['python', 'bash', 'automation'],
            'mobile': ['java', 'kotlin', 'swift'],
            'android': ['java', 'kotlin'],
            'ios': ['swift', 'objective-c'],
            
            # Compétences algorithmiques
            'algorithm': ['algorithm', 'data-structure'],
            'database': ['sql', 'database'],
            'api': ['api', 'rest', 'json']
        }
        
        keywords = set()
        text_to_analyze = f"{position} {description or ''}".lower()
        
        # Rechercher les correspondances directes
        for job_term, tech_keywords in job_tech_mapping.items():
            if job_term in text_to_analyze:
                keywords.update(tech_keywords)
        
        # Ajouter les technologies mentionnées explicitement
        tech_patterns = [
            r'\b(python|java|javascript|typescript|go|rust|php|ruby|swift|kotlin)\b',
            r'\b(react|angular|vue|nodejs|django|flask|spring|laravel)\b',
            r'\b(html|css|sass|less|bootstrap|tailwind)\b',
            r'\b(sql|mongodb|redis|postgresql|mysql)\b',
            r'\b(git|docker|kubernetes|aws|azure|gcp)\b'
        ]
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, text_to_analyze)
            keywords.update(matches)
        
        # Convertir en liste et limiter à 5 mots-clés principaux
        return list(keywords)[:5] if keywords else ['general']
    
    def find_suitable_exercises(self, keywords: List[str], difficulty: str = 'intermediate', limit: int = 10) -> List[Exercise]:
        """
        Trouve les exercices appropriés basés sur les mots-clés du poste
        
        Args:
            keywords: Liste de mots-clés techniques
            difficulty: Niveau de difficulté souhaité
            limit: Nombre maximum d'exercices à retourner
            
        Returns:
            Liste des exercices trouvés
        """
        query = db.session.query(Exercise).join(Challenge).filter(
            Challenge.status == ChallengeStatus.PUBLISHED
        )
        print('5555555555555555555555555555555555555',keywords)
        # Filtrer par difficulté si spécifiée
        if difficulty != 'any':
            from app.types.coding_platform import ChallengeDifficulty
            difficulty_mapping = {
                'beginner': ChallengeDifficulty.BEGINNER,
                'intermediate': ChallengeDifficulty.INTERMEDIATE,
                'advanced': ChallengeDifficulty.ADVANCED,
                'expert': ChallengeDifficulty.EXPERT
            }
            if difficulty in difficulty_mapping:
                query = query.filter(Exercise.difficulty == difficulty_mapping[difficulty])
            else:
                query = query.filter(Exercise.difficulty == difficulty_mapping['expert'])
        
        exercises = query.distinct().all()
        print('psspspododood')
        # Scorer les exercices selon leur pertinence
        scored_exercises = []
        for exercise in exercises:
            score = self._calculate_exercise_relevance(exercise, keywords)
            if score > 0:
                scored_exercises.append((exercise, score))
        
        # Trier par score décroissant et retourner les meilleurs
        scored_exercises.sort(key=lambda x: x[1], reverse=True)
        return [exercise for exercise, _ in scored_exercises[:limit]]
    
    def _calculate_exercise_relevance(self, exercise: Exercise, keywords: List[str]) -> int:
        """
        Calcule un score de pertinence pour un exercice donné
        
        Args:
            exercise: Exercice à évaluer
            keywords: Mots-clés à rechercher
            
        Returns:
            Score de pertinence (plus élevé = plus pertinent)
        """
        score = 0
        exercise_text = f"{exercise.title} {exercise.description or ''}".lower()
        print('88888888888888888',exercise.language)
        # Score basé sur le langage de programmation
        if exercise.language:
            lang_name = exercise.language.value.lower()
            if lang_name in [k.lower() for k in keywords]:
                score += 10  # Correspondance exacte du langage
        
        # Score basé sur les mots-clés dans le titre et la description
        for keyword in keywords:
            keyword_lower = keyword.lower()
            if keyword_lower in exercise_text:
                if keyword_lower in exercise.title.lower():
                    score += 5  # Mot-clé dans le titre
                else:
                    score += 2  # Mot-clé dans la description
        
        # Score basé sur les challenges associés
        for challenge in exercise.challenges:
            if challenge.status == ChallengeStatus.PUBLISHED:
                challenge_text = f"{challenge.title} {challenge.description or ''}".lower()
                for keyword in keywords:
                    if keyword.lower() in challenge_text:
                        score += 1
        
        return score
    
    def select_exercises_for_interview(self, position: str, description: str = None, 
                                     difficulty: str = 'intermediate', count: int = 4) -> Tuple[List[Exercise], List[str]]:
        """
        Sélectionne automatiquement des exercices pour un entretien
        
        Args:
            position: Titre du poste
            description: Description du poste
            difficulty: Niveau de difficulté
            count: Nombre d'exercices à sélectionner
            
        Returns:
            Tuple (exercices sélectionnés, mots-clés utilisés)
        """
        # Extraire les mots-clés du poste
        keywords = self.extract_job_keywords(position, description)
        
        # Rechercher des exercices appropriés
        suitable_exercises = self.find_suitable_exercises(keywords, difficulty, count * 2)
        
        # Sélectionner les meilleurs exercices en diversifiant les compétences
        selected_exercises = self._diversify_exercise_selection(suitable_exercises, count)
        
        return selected_exercises, keywords
    
    def _diversify_exercise_selection(self, exercises: List[Exercise], count: int) -> List[Exercise]:
        """
        Diversifie la sélection d'exercices pour couvrir différentes compétences
        
        Args:
            exercises: Liste d'exercices candidats
            count: Nombre d'exercices à sélectionner
            
        Returns:
            Liste diversifiée d'exercices
        """
        if len(exercises) <= count:
            return exercises
        
        selected = []
        used_languages = set()
        used_difficulties = set()
        
        # Prioriser la diversité des langages et difficultés
        for exercise in exercises:
            if len(selected) >= count:
                break
                
            # Favoriser la diversité des langages
            lang = exercise.language.value if exercise.language else 'unknown'
            diff = exercise.difficulty.value if exercise.difficulty else 'unknown'
            
            # Prendre l'exercice s'il apporte de la diversité ou si on a encore de la place
            if (lang not in used_languages or diff not in used_difficulties or 
                len(selected) < count // 2):
                selected.append(exercise)
                used_languages.add(lang)
                used_difficulties.add(diff)
        
        # Compléter avec les exercices restants si nécessaire
        for exercise in exercises:
            if len(selected) >= count:
                break
            if exercise not in selected:
                selected.append(exercise)
        
        return selected[:count]
    
    def create_user_exercise_session(self, interview_schedule_id: str, candidate_email: str, 
                                   candidate_name: str, position: str, scheduled_at: datetime,
                                   description: str = None, custom_exercise_ids: List[int] = None,
                                   time_limit_minutes: int = 120) -> UserExercise:
        """
        Crée une session d'exercices pour un candidat
        
        Args:
            interview_schedule_id: ID de l'entretien planifié
            candidate_email: Email du candidat
            candidate_name: Nom du candidat
            position: Poste pour lequel le candidat candidate
            scheduled_at: Date et heure de l'entretien
            description: Description du poste
            custom_exercise_ids: IDs d'exercices spécifiques (optionnel)
            time_limit_minutes: Temps limite en minutes
            
        Returns:
            Session UserExercise créée
        """
        # Si des exercices spécifiques sont fournis, les utiliser
        if custom_exercise_ids:
            exercise_ids = custom_exercise_ids
            keywords = self.extract_job_keywords(position, description)
        else:
            # Sinon, sélectionner automatiquement
            selected_exercises, keywords = self.select_exercises_for_interview(
                position, description, 'intermediate', 4
            )
            exercise_ids = [ex.id for ex in selected_exercises]
        
        # Calculer les dates d'accès
        # Le candidat peut commencer 1 heure avant l'entretien
        available_from = scheduled_at - timedelta(hours=1)
        # L'accès expire 2 heures après l'heure de l'entretien
        expires_at = scheduled_at + timedelta(hours=2)
        
        # Créer la session
        user_exercise = UserExercise(
            interview_schedule_id=interview_schedule_id,
            candidate_email=candidate_email,
            candidate_name=candidate_name,
            exercise_ids=exercise_ids,
            position=position,
            job_keywords=keywords,
            available_from=available_from,
            expires_at=expires_at,
            time_limit_minutes=time_limit_minutes,
            total_exercises=len(exercise_ids)
        )
        
        db.session.add(user_exercise)
        db.session.commit()
        
        return user_exercise
    
    def get_user_exercise_by_token(self, access_token: str) -> Optional[UserExercise]:
        """
        Récupère une session d'exercices par son token d'accès
        
        Args:
            access_token: Token d'accès du candidat
            
        Returns:
            Session UserExercise ou None si non trouvée
        """
        return UserExercise.query.filter_by(access_token=access_token).first()
    
    def get_exercises_for_candidate(self, access_token: str) -> Dict:
        """
        Récupère les exercices assignés à un candidat avec leurs détails

        Args:
            access_token: Token d'accès du candidat

        Returns:
            Dictionnaire avec les exercices et informations de session
        """
        user_exercise = self.get_user_exercise_by_token(access_token)
        if not user_exercise:
            print('yes epepr..........')
            raise ValueError("Session d'exercices non trouvée")

        print('yes commencons..........5458', user_exercise.is_accessible())
        if not user_exercise.is_accessible():
            print('yes rahayay..........')
            if user_exercise.is_expired():
                print('yes echec..........')
                raise ValueError("La session d'exercices a expiré")
            else:
                print('yes hum..........')
                raise ValueError("Accès non autorisé aux exercices")

        print('yes commencons..........1')

        # Gérer le cas où exercise_ids pourrait être une chaîne JSON
        exercise_ids = user_exercise.exercise_ids
        if isinstance(exercise_ids, str):
            try:
                exercise_ids = json.loads(exercise_ids)
            except json.JSONDecodeError:
                print(f"Erreur de parsing JSON pour exercise_ids: {exercise_ids}")
                exercise_ids = []
        elif not isinstance(exercise_ids, list):
            print(f"Format inattendu pour exercise_ids: {type(exercise_ids)}")
            exercise_ids = []

        print(f'Exercise IDs à traiter: {exercise_ids}')

        # Récupérer les détails des exercices
        exercises = []
        for exercise_id in exercise_ids:
            try:
                exercise = Exercise.query.get(exercise_id)  # S'assurer que c'est un entier
                print(f'Exercise trouvé pour ID {exercise_id}: {exercise is not None}')

                if exercise:
                    # Récupérer les challenges publiés de cet exercice
                    published_challenges = [
                        c for c in exercise.challenges 
                        if c.status == ChallengeStatus.PUBLISHED
                    ]
                    print(f'Challenges publiés trouvés: {len(published_challenges)}')

                    exercise_data = exercise.to_dict()
                    exercise_data['challenges'] = [c.to_dict() for c in published_challenges]
                    exercises.append(exercise_data)

                    print(f'Exercise ajouté: ID={exercise_id}, Titre={exercise_data.get("title", "N/A")}')
                else:
                    print(f'Exercise non trouvé pour ID: {exercise_id}')

            except (ValueError, TypeError) as e:
                print(f'Erreur lors du traitement de exercise_id {exercise_id}: {e}')
                continue
            
        print(f'Total exercises récupérés: {len(exercises)}')

        # Calculer le temps restant
        now = datetime.now(timezone.utc)
        expires_at = user_exercise.expires_at
        
        # S'assurer que expires_at a un timezone pour éviter l'erreur de soustraction
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        time_remaining_seconds = (expires_at - now).total_seconds()
        time_remaining_minutes = max(0, int(time_remaining_seconds / 60))
        
        print(f'Calcul temps restant: expires_at={expires_at}, now={now}, minutes_restantes={time_remaining_minutes}')
        
        return {
            'session': user_exercise.to_dict(include_detailed_progress=True),
            'exercises': exercises,
            'access_info': {
                'time_remaining_minutes': time_remaining_minutes,
                'can_start': user_exercise.is_accessible(),
                'attempts_remaining': user_exercise.max_attempts - user_exercise.current_attempts
            }
        }
    
    def update_exercise_progress(self, access_token: str, exercise_id: str, 
                               completed: bool = False, score: int = 0) -> UserExercise:
        """
        Met à jour le progrès d'un exercice
        
        Args:
            access_token: Token d'accès du candidat
            exercise_id: ID de l'exercice
            completed: Si l'exercice est terminé
            score: Score obtenu
            
        Returns:
            Session UserExercise mise à jour
        """
        user_exercise = self.get_user_exercise_by_token(access_token)
        if not user_exercise:
            raise ValueError("Session d'exercices non trouvée")
        
        if exercise_id not in user_exercise.exercise_ids:
            raise ValueError("Exercice non assigné à cette session")
        
        # Démarrer la session si c'est la première interaction
        if user_exercise.status == 'not_started':
            user_exercise.start_session()
        
        # Mettre à jour les statistiques si l'exercice est complété
        if completed:
            user_exercise.exercises_completed += 1
            user_exercise.total_score += score
            
            # Marquer comme terminé si tous les exercices sont complétés
            if user_exercise.exercises_completed >= user_exercise.total_exercises:
                user_exercise.complete_session()
        
        db.session.commit()
        return user_exercise
    


    def get_candidate_exercise_results(self, interview_schedule_id: str) -> Dict:
        """
        Récupère les résultats détaillés des exercices d'un candidat avec calculs corrects
        """
        user_exercise = UserExercise.query.filter_by(
            interview_schedule_id=interview_schedule_id
        ).first()

        if not user_exercise:
            raise ValueError("Aucune session d'exercices trouvée pour cet entretien")

        # Récupérer tous les résultats détaillés
        detailed_results = []
        total_global_score = 0
        total_exercises_attempted = 0
        total_exercises_completed = 0

        exercise_ids = user_exercise.exercise_ids
        if isinstance(exercise_ids, str):
            try:
                exercise_ids = json.loads(exercise_ids)
            except json.JSONDecodeError:
                exercise_ids = []

        print(f'🔍 DEBUG: Analyse des résultats pour {len(exercise_ids)} exercices')

        for exercise_id in exercise_ids:
            exercise = Exercise.query.get(exercise_id)
            if not exercise:
                continue

            print(f'🔍 DEBUG: Analyse exercice {exercise_id}: {exercise.title}')

            # Récupérer tous les challenges de cet exercice
            challenges_results = []
            exercise_attempted = False
            exercise_completed = True  # Considéré complété jusqu'à preuve du contraire
            exercise_total_score = 0
            exercise_max_score = 0

            for challenge in exercise.challenges:
                if challenge.status != ChallengeStatus.PUBLISHED:
                    continue

                print(f'🔍 DEBUG: Analyse challenge {challenge.id}: {challenge.title}')

                # Trouver le UserChallenge correspondant
                user_challenge = UserChallenge.query.filter_by(
                    challenge_id=challenge.id
                ).filter(
                    (UserChallenge.user_id == user_exercise.user_id if user_exercise.user_id else False) |
                    (UserChallenge.session_token == user_exercise.access_token) |
                    (UserChallenge.anonymous_identifier == user_exercise.access_token)
                ).first()

                if not user_challenge:
                    print(f'🔍 DEBUG: Pas de UserChallenge trouvé pour challenge {challenge.id}')
                    # Challenge non tenté
                    steps_progress = []
                    for step in challenge.steps:
                        steps_progress.append({
                            'id': f'no_attempt_{step.id}',
                            'step_id': step.id,
                            'is_completed': False,
                            'tests_passed': 0,
                            'tests_total': len(step.testcases) if step.testcases else 0,
                            'code': '',
                            'language': '',
                            'last_edited': None
                        })
                    exercise_completed = False
                else:
                    print(f'🔍 DEBUG: UserChallenge trouvé: {user_challenge.id}, status: {user_challenge.status}')
                    exercise_attempted = True

                    # Récupérer la progression détaillée des étapes
                    steps_progress = []
                    challenge_completed = True
                    challenge_score = 0
                    challenge_max_score = 0

                    for step in challenge.steps:
                        # Récupérer la progression pour cette étape
                        step_progress = UserChallengeProgress.query.filter_by(
                            user_challenge_id=user_challenge.id,
                            step_id=step.id
                        ).first()

                        step_max_score = len(step.testcases) if step.testcases else 0
                        challenge_max_score += step_max_score

                        if step_progress:
                            steps_progress.append({
                                'id': step_progress.id,
                                'step_id': step.id,
                                'is_completed': step_progress.is_completed,
                                'tests_passed': step_progress.tests_passed,
                                'tests_total': step_progress.tests_total,
                                'code': step_progress.code or '',
                                'language': step_progress.language.value if step_progress.language else '',
                                'last_edited': step_progress.last_edited.isoformat() if step_progress.last_edited else None
                            })

                            if step_progress.is_completed:
                                challenge_score += step_progress.tests_passed
                            else:
                                challenge_completed = False

                            print(f'🔍 DEBUG: Step {step.id} - completed: {step_progress.is_completed}, tests: {step_progress.tests_passed}/{step_progress.tests_total}')
                        else:
                            # Étape non tentée
                            steps_progress.append({
                                'id': f'no_progress_{step.id}',
                                'step_id': step.id,
                                'is_completed': False,
                                'tests_passed': 0,
                                'tests_total': step_max_score,
                                'code': '',
                                'language': '',
                                'last_edited': None
                            })
                            challenge_completed = False
                            print(f'🔍 DEBUG: Step {step.id} - pas de progression')

                    if not challenge_completed:
                        exercise_completed = False

                    exercise_total_score += challenge_score
                    exercise_max_score += challenge_max_score

                challenges_results.append({
                    'challenge': {
                        'id': challenge.id,
                        'title': challenge.title,
                        'description': challenge.description,
                        'step_count': len(challenge.steps)
                    },
                    'user_challenge': {
                        'id': user_challenge.id if user_challenge else None,
                        'status': user_challenge.status if user_challenge else 'not_started',
                        'attempt_count': user_challenge.attempt_count if user_challenge else 0,
                        'started_at': user_challenge.started_at.isoformat() if user_challenge and user_challenge.started_at else None,
                        'completed_at': user_challenge.completed_at.isoformat() if user_challenge and user_challenge.completed_at else None,
                        'current_step_id': user_challenge.current_step_id if user_challenge else None
                    },
                    'steps_progress': steps_progress
                })

            if exercise_attempted:
                total_exercises_attempted += 1

            if exercise_completed:
                total_exercises_completed += 1

            total_global_score += exercise_total_score

            print(f'🔍 DEBUG: Exercice {exercise_id} - Score: {exercise_total_score}/{exercise_max_score}, Complété: {exercise_completed}')

            detailed_results.append({
                'exercise': {
                    'id': exercise.id,
                    'title': exercise.title,
                    'description': exercise.description,
                    'language': exercise.language.value if exercise.language else '',
                    'difficulty': exercise.difficulty.value if exercise.difficulty else ''
                },
                'challenges_results': challenges_results,
                'exercise_stats': {
                    'attempted': exercise_attempted,
                    'completed': exercise_completed,
                    'score': exercise_total_score,
                    'max_score': exercise_max_score,
                    'completion_rate': round((exercise_total_score / exercise_max_score * 100), 2) if exercise_max_score > 0 else 0
                }
            })

        # CORRECTION: Recalcul des statistiques globales
        user_exercise.exercises_completed = total_exercises_completed
        user_exercise.total_score = total_global_score

        # Mettre à jour le statut si nécessaire
        if total_exercises_completed == len(exercise_ids) and total_exercises_completed > 0:
            user_exercise.status = 'completed'
            if not user_exercise.completed_at:
                user_exercise.completed_at = datetime.now(timezone.utc)
        elif total_exercises_attempted > 0:
            user_exercise.status = 'in_progress'

        db.session.commit()

        print(f'🔍 DEBUG: Statistiques finales - Complétés: {total_exercises_completed}/{len(exercise_ids)}, Score: {total_global_score}')

        return {
            'user_exercise': {
                'id': user_exercise.id,
                'candidate_name': user_exercise.candidate_name,
                'candidate_email': user_exercise.candidate_email,
                'position': user_exercise.position,
                'status': user_exercise.status,
                'total_score': user_exercise.total_score,
                'exercises_completed': user_exercise.exercises_completed,
                'total_exercises': user_exercise.total_exercises,
                'time_limit_minutes': user_exercise.time_limit_minutes,
                'started_at': user_exercise.started_at.isoformat() if user_exercise.started_at else None,
                'completed_at': user_exercise.completed_at.isoformat() if user_exercise.completed_at else None,
                'interview_info': {
                    'schedule_id': user_exercise.interview_schedule_id,
                    'title': f"Entretien - {user_exercise.position}",
                    'scheduled_at': user_exercise.available_from.isoformat() if user_exercise.available_from else None
                }
            },
            'detailed_results': detailed_results,
            'global_stats': {
                'total_exercises': len(exercise_ids),
                'exercises_attempted': total_exercises_attempted,
                'exercises_completed': total_exercises_completed,
                'global_completion_rate': round((total_exercises_completed / len(exercise_ids) * 100), 2) if exercise_ids else 0,
                'global_score': total_global_score
            }
        }

    def recalculate_candidate_stats(self, access_token: str) -> Dict:
        """
        Recalcule les statistiques d'un candidat en analysant sa progression réelle
        """
        user_exercise = self.get_user_exercise_by_token(access_token)
        if not user_exercise:
            raise ValueError("Session d'exercices non trouvée")

        exercise_ids = user_exercise.exercise_ids
        if isinstance(exercise_ids, str):
            try:
                exercise_ids = json.loads(exercise_ids)
            except json.JSONDecodeError:
                exercise_ids = []

        total_score = 0
        exercises_completed = 0

        for exercise_id in exercise_ids:
            exercise = Exercise.query.get(exercise_id)
            if not exercise:
                continue

            exercise_completed = True

            for challenge in exercise.challenges:
                if challenge.status != ChallengeStatus.PUBLISHED:
                    continue

                # Trouver le UserChallenge
                user_challenge = UserChallenge.query.filter_by(
                    challenge_id=challenge.id
                ).filter(
                    (UserChallenge.session_token == access_token) |
                    (UserChallenge.anonymous_identifier == access_token)
                ).first()

                if not user_challenge:
                    exercise_completed = False
                    continue

                # Vérifier si toutes les étapes sont complétées
                for step in challenge.steps:
                    step_progress = UserChallengeProgress.query.filter_by(
                        user_challenge_id=user_challenge.id,
                        step_id=step.id
                    ).first()

                    if not step_progress or not step_progress.is_completed:
                        exercise_completed = False
                        break
                    else:
                        total_score += step_progress.tests_passed

            if exercise_completed:
                exercises_completed += 1

        # Mettre à jour les statistiques
        user_exercise.total_score = total_score
        user_exercise.exercises_completed = exercises_completed

        if exercises_completed == len(exercise_ids) and exercises_completed > 0:
            user_exercise.status = 'completed'
            if not user_exercise.completed_at:
                user_exercise.completed_at = datetime.now(timezone.utc)
        elif total_score > 0:
            user_exercise.status = 'in_progress'

        db.session.commit()

        return {
            'total_score': total_score,
            'exercises_completed': exercises_completed,
            'total_exercises': len(exercise_ids),
            'status': user_exercise.status
        }
