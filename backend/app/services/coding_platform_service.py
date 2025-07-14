# backend/services/coding_platform_service.py
from datetime import datetime, timezone
from flask import abort, current_app
from app import db
from app.models.coding_platform import (
    Exercise, Challenge, ChallengeStep, ChallengeStepTestcase, 
    UserChallenge, UserChallengeProgress, 
    ChallengeStatus, ChallengeDifficulty, ProgrammingLanguage, 
    UserChallengeStatus
)
import uuid
import base64
import requests

class CodingPlatformService:
    """Service pour gérer la plateforme de coding challenges"""
    
    def __init__(self):
        self.code_execution_service = CodeExecutionService()
    
    # =============================================================================
    # EXERCISE MANAGEMENT
    # =============================================================================
    
    def create_exercise(self, user_id, data):
        """
        Crée un nouvel exercice
        
        Args:
            user_id: ID de l'utilisateur créateur
            data: Données de l'exercice
            
        Returns:
            L'exercice créé
        """
        try:
            exercise = Exercise(
                created_by=user_id,
                title=data['title'],
                description=data.get('description', ''),
                language=ProgrammingLanguage(data['language']),
                difficulty=ChallengeDifficulty(data['difficulty']),
                order_index=data.get('order_index', 0)
            )
            
            db.session.add(exercise)
            db.session.commit()
            
            return exercise
            
        except ValueError as e:
            db.session.rollback()
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error creating exercise: {str(e)}')
    
    def get_exercises(self, page=1, per_page=20, language=None, difficulty=None, user_id=None):
        """
        Récupère les exercices avec pagination et filtres
        
        Args:
            page: Numéro de page
            per_page: Nombre d'éléments par page
            language: Filtre par langage
            difficulty: Filtre par difficulté
            user_id: Si fourni, filtre par créateur (admin)
            
        Returns:
            Tuple (exercices, total)
        """
        query = Exercise.query
        
        # Filtres pour admin
        if user_id:
            query = query.filter_by(created_by=user_id)
        
        if language:
            query = query.filter_by(language=ProgrammingLanguage(language))
        
        if difficulty:
            query = query.filter_by(difficulty=ChallengeDifficulty(difficulty))
        
        # Pour les utilisateurs publics, ne montrer que les exercices avec challenges publiés
        if not user_id:
            query = query.join(Challenge).filter(Challenge.status == ChallengeStatus.PUBLISHED).distinct()
        
        exercises = query.order_by(Exercise.order_index, Exercise.created_at).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return exercises.items, exercises.total
    
    def get_exercise_by_id(self, exercise_id, user_id=None):
        """
        Récupère un exercice par son ID
        
        Args:
            exercise_id: ID de l'exercice
            user_id: Si fourni, vérifie les permissions admin
            
        Returns:
            L'exercice trouvé
        """
        exercise = Exercise.query.get(exercise_id)
        if not exercise:
            abort(404, description="Exercise not found")
        
        # Vérification des permissions pour admin
        if user_id and exercise.created_by != user_id:
            abort(403, description="Access denied to this exercise")
        
        return exercise
    
    def update_exercise(self, exercise_id, user_id, data):
        """
        Met à jour un exercice
        
        Args:
            exercise_id: ID de l'exercice
            user_id: ID de l'utilisateur
            data: Nouvelles données
            
        Returns:
            L'exercice mis à jour
        """
        exercise = self.get_exercise_by_id(exercise_id, user_id)
        
        try:
            if 'title' in data:
                exercise.title = data['title']
            if 'description' in data:
                exercise.description = data['description']
            if 'language' in data:
                exercise.language = ProgrammingLanguage(data['language'])
            if 'difficulty' in data:
                exercise.difficulty = ChallengeDifficulty(data['difficulty'])
            if 'order_index' in data:
                exercise.order_index = data['order_index']
                
            exercise.updated_at = datetime.now(timezone.utc)
            db.session.commit()
            
            return exercise
            
        except ValueError as e:
            db.session.rollback()
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error updating exercise: {str(e)}')
    
    def delete_exercise(self, exercise_id, user_id):
        """
        Supprime un exercice
        
        Args:
            exercise_id: ID de l'exercice
            user_id: ID de l'utilisateur
        """
        exercise = self.get_exercise_by_id(exercise_id, user_id)
        
        try:
            db.session.delete(exercise)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error deleting exercise: {str(e)}')
    
    # =============================================================================
    # CHALLENGE MANAGEMENT
    # =============================================================================
    
    def create_challenge(self, data):
        """
        Crée un nouveau challenge
        
        Args:
            data: Données du challenge
            
        Returns:
            Le challenge créé
        """
        # Vérifier que l'exercice existe
        exercise = Exercise.query.get(data['exercise_id'])
        if not exercise:
            abort(404, description="Exercise not found")
        
        try:
            challenge = Challenge(
                exercise_id=data['exercise_id'],
                title=data['title'],
                description=data['description'],
                constraints=data.get('constraints', ''),
                tags=data.get('tags', []),
                status=ChallengeStatus(data.get('status', 'draft')),
                order_index=data.get('order_index', 0),
                estimated_time_minutes=data.get('estimated_time_minutes', 30)
            )
            
            db.session.add(challenge)
            db.session.commit()
            
            return challenge
            
        except ValueError as e:
            db.session.rollback()
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error creating challenge: {str(e)}')
    
    def get_challenges(self, exercise_id=None, status=None, page=1, per_page=20, user_id=None):
        """
        Récupère les challenges avec filtres
        
        Args:
            exercise_id: Filtre par exercice
            status: Filtre par statut
            page: Numéro de page
            per_page: Nombre d'éléments par page
            user_id: Si fourni, filtre par créateur de l'exercice parent
            
        Returns:
            Tuple (challenges, total)
        """
        query = Challenge.query
        
        if exercise_id:
            query = query.filter_by(exercise_id=exercise_id)
        
        if status:
            query = query.filter_by(status=ChallengeStatus(status))
        
        # Pour admin, filtrer par créateur de l'exercice
        if user_id:
            query = query.join(Exercise).filter(Exercise.created_by == user_id)
        # Pour public, ne montrer que les publiés
        else:
            query = query.filter_by(status=ChallengeStatus.PUBLISHED)
        
        challenges = query.order_by(Challenge.order_index, Challenge.created_at).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return challenges.items, challenges.total
    
    def get_challenge_by_id(self, challenge_id, user_id=None, check_published=True):
        """
        Récupère un challenge par son ID
        
        Args:
            challenge_id: ID du challenge
            user_id: Si fourni, vérifie les permissions admin
            check_published: Si True, vérifie que le challenge est publié (pour users)
            
        Returns:
            Le challenge trouvé
        """
        query = Challenge.query
        
        if check_published and not user_id:
            query = query.filter_by(status=ChallengeStatus.PUBLISHED)
        
        challenge = query.filter_by(id=challenge_id).first()
        if not challenge:
            abort(404, description="Challenge not found")
        
        # Vérification des permissions pour admin
        if user_id and challenge.exercise.created_by != user_id:
            abort(403, description="Access denied to this challenge")
        
        return challenge
    
    def update_challenge(self, challenge_id, user_id, data):
        """
        Met à jour un challenge
        
        Args:
            challenge_id: ID du challenge
            user_id: ID de l'utilisateur
            data: Nouvelles données
            
        Returns:
            Le challenge mis à jour
        """
        challenge = self.get_challenge_by_id(challenge_id, user_id, check_published=False)
        
        try:
            if 'title' in data:
                challenge.title = data['title']
            if 'description' in data:
                challenge.description = data['description']
            if 'constraints' in data:
                challenge.constraints = data['constraints']
            if 'tags' in data:
                challenge.tags = data['tags']
            if 'status' in data:
                challenge.status = ChallengeStatus(data['status'])
            if 'order_index' in data:
                challenge.order_index = data['order_index']
            if 'estimated_time_minutes' in data:
                challenge.estimated_time_minutes = data['estimated_time_minutes']
                
            challenge.updated_at = datetime.now(timezone.utc)
            db.session.commit()
            
            return challenge
            
        except ValueError as e:
            db.session.rollback()
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error updating challenge: {str(e)}')
    
    def delete_challenge(self, challenge_id, user_id):
        """
        Supprime un challenge
        
        Args:
            challenge_id: ID du challenge
            user_id: ID de l'utilisateur
        """
        challenge = self.get_challenge_by_id(challenge_id, user_id, check_published=False)
        
        try:
            db.session.delete(challenge)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error deleting challenge: {str(e)}')
    
    # =============================================================================
    # CHALLENGE STEP MANAGEMENT
    # =============================================================================
    
    def create_challenge_step(self, challenge_id, user_id, data):
        """
        Crée une étape de challenge
        
        Args:
            challenge_id: ID du challenge
            user_id: ID de l'utilisateur
            data: Données de l'étape
            
        Returns:
            L'étape créée
        """
        challenge = self.get_challenge_by_id(challenge_id, user_id, check_published=False)
        
        try:
            step = ChallengeStep(
                challenge_id=challenge_id,
                title=data['title'],
                instructions=data['instructions'],
                hint=data.get('hint', ''),
                starter_code=data.get('starter_code', ''),
                solution_code=data.get('solution_code', ''),
                order_index=data.get('order_index', 0),
                is_final_step=data.get('is_final_step', False)
            )
            
            db.session.add(step)
            db.session.commit()
            
            return step
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error creating challenge step: {str(e)}')
    
    def get_challenge_steps(self, challenge_id, user_id=None):
        """
        Récupère les étapes d'un challenge
        
        Args:
            challenge_id: ID du challenge
            user_id: Si fourni, vérifie les permissions admin
            
        Returns:
            Liste des étapes
        """
        challenge = self.get_challenge_by_id(challenge_id, user_id, check_published=not bool(user_id))
        
        steps = ChallengeStep.query.filter_by(challenge_id=challenge_id).order_by(ChallengeStep.order_index).all()
        return steps
    
    def get_challenge_step(self, challenge_id, step_id, user_id=None, session_info=None):
        """
        Récupère une étape spécifique
        
        Args:
            challenge_id: ID du challenge
            step_id: ID de l'étape
            user_id: Si fourni, vérifie les permissions admin
            session_info: Info de session pour les utilisateurs
            
        Returns:
            L'étape trouvée
        """
        # Vérifier les permissions
        if user_id:
            challenge = self.get_challenge_by_id(challenge_id, user_id, check_published=False)
        elif session_info:
            user_challenge = self._find_user_challenge(challenge_id, session_info)
            if not user_challenge:
                abort(404, description="No active session found for this challenge")
        else:
            abort(400, description="Session identifier required")
        
        step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
        if not step:
            abort(404, description="Challenge step not found")
        
        return step
    
    # =============================================================================
    # TEST CASE MANAGEMENT
    # =============================================================================
    
    def create_testcase(self, step_id, user_id, data):
        """
        Crée un cas de test
        
        Args:
            step_id: ID de l'étape
            user_id: ID de l'utilisateur
            data: Données du cas de test
            
        Returns:
            Le cas de test créé
        """
        step = ChallengeStep.query.get(step_id)
        if not step:
            abort(404, description="Challenge step not found")
        
        # Vérifier les permissions
        if step.challenge.exercise.created_by != user_id:
            abort(403, description="Access denied")
        
        try:
            testcase = ChallengeStepTestcase(
                step_id=step_id,
                input_data=data['input_data'],
                expected_output=data['expected_output'],
                is_hidden=data.get('is_hidden', False),
                is_example=data.get('is_example', False),
                timeout_seconds=data.get('timeout_seconds', 5),
                memory_limit_mb=data.get('memory_limit_mb', 128),
                order_index=data.get('order_index', 0)
            )
            
            db.session.add(testcase)
            db.session.commit()
            
            return testcase
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error creating test case: {str(e)}')
    
    def bulk_create_testcases(self, step_id, user_id, testcases_data):
        """
        Création en lot de cas de test
        
        Args:
            step_id: ID de l'étape
            user_id: ID de l'utilisateur
            testcases_data: Liste des données des cas de test
            
        Returns:
            Liste des cas de test créés
        """
        step = ChallengeStep.query.get(step_id)
        if not step:
            abort(404, description="Challenge step not found")
        
        # Vérifier les permissions
        if step.challenge.exercise.created_by != user_id:
            abort(403, description="Access denied")
        
        try:
            created_testcases = []
            for i, tc_data in enumerate(testcases_data):
                if 'input_data' not in tc_data or 'expected_output' not in tc_data:
                    continue
                    
                testcase = ChallengeStepTestcase(
                    step_id=step_id,
                    input_data=tc_data['input_data'],
                    expected_output=tc_data['expected_output'],
                    is_hidden=tc_data.get('is_hidden', False),
                    is_example=tc_data.get('is_example', False),
                    timeout_seconds=tc_data.get('timeout_seconds', 5),
                    memory_limit_mb=tc_data.get('memory_limit_mb', 128),
                    order_index=tc_data.get('order_index', i)
                )
                
                db.session.add(testcase)
                created_testcases.append(testcase)
            
            db.session.commit()
            return created_testcases
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error creating test cases: {str(e)}')
    
    # =============================================================================
    # USER SESSION MANAGEMENT
    # =============================================================================
    
    def start_challenge(self, challenge_id, session_info, anonymous_identifier=None):
        """
        Démarre ou reprend une session de challenge
        """
        print(f"🚀 DEBUG: start_challenge appelé avec:")
        print(f"   challenge_id={challenge_id}")
        print(f"   session_info={session_info}")
        print(f"   anonymous_identifier='{anonymous_identifier}'")

        challenge = self.get_challenge_by_id(challenge_id, check_published=True)

        try:
            # Chercher une session existante
            user_challenge = self._find_user_challenge(challenge_id, session_info)

            if not user_challenge:
                print(f"🆕 DEBUG: Création d'une nouvelle session UserChallenge")
                # Créer nouvelle session
                first_step = ChallengeStep.query.filter_by(challenge_id=challenge_id).order_by(ChallengeStep.order_index).first()

                user_challenge = UserChallenge(
                    user_id=session_info['value'] if session_info and session_info['type'] == 'user_id' else None,
                    challenge_id=challenge_id,
                    current_step_id=first_step.id if first_step else None,
                    status=UserChallengeStatus.IN_PROGRESS,
                    session_token=str(uuid.uuid4()),
                    anonymous_identifier=anonymous_identifier
                )

                print(f"🆕 DEBUG: UserChallenge créé avec anonymous_identifier='{anonymous_identifier}'")
                db.session.add(user_challenge)
            else:
                print(f"♻️ DEBUG: Reprise de session existante UserChallenge ID={user_challenge.id}")
                # Reprendre session existante
                user_challenge.session_token = str(uuid.uuid4())
                if user_challenge.status == UserChallengeStatus.NOT_STARTED:
                    user_challenge.status = UserChallengeStatus.IN_PROGRESS

            db.session.commit()
            print(f"✅ DEBUG: UserChallenge sauvegardé avec ID={user_challenge.id}")
            return user_challenge

        except Exception as e:
            db.session.rollback()
            print(f"❌ DEBUG: Erreur dans start_challenge: {str(e)}")
            raise Exception(f'Error starting challenge: {str(e)}')
    
    def save_step_progress(self, challenge_id, step_id, session_info, code, language):
        """
        Sauvegarde le progrès d'une étape
        
        Args:
            challenge_id: ID du challenge
            step_id: ID de l'étape
            session_info: Information de session
            code: Code sauvegardé
            language: Langage de programmation
            
        Returns:
            Le progrès sauvegardé
        """
        # Vérifier l'accès
        user_challenge = self._find_user_challenge(challenge_id, session_info)
        if not user_challenge:
            abort(404, description="No active session found for this challenge")
        
        # Vérifier que l'étape existe
        step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
        if not step:
            abort(404, description="Challenge step not found")
        
        try:
            # Récupérer ou créer le progrès
            progress = UserChallengeProgress.query.filter_by(
                user_challenge_id=user_challenge.id,
                step_id=step_id
            ).first()
            
            if not progress:
                progress = UserChallengeProgress(
                    user_challenge_id=user_challenge.id,
                    step_id=step_id,
                    language=ProgrammingLanguage(language)
                )
                db.session.add(progress)
            
            # Mettre à jour le progrès
            progress.code = code
            progress.language = ProgrammingLanguage(language)
            progress.last_edited = datetime.now(timezone.utc)
            
            db.session.commit()
            return progress
            
        except ValueError as e:
            db.session.rollback()
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error saving progress: {str(e)}')
    
    def load_step_progress(self, challenge_id, step_id, session_info):
        """
        Charge le progrès d'une étape
        
        Args:
            challenge_id: ID du challenge
            step_id: ID de l'étape
            session_info: Information de session
            
        Returns:
            Le progrès ou le code de départ
        """
        # Vérifier l'accès
        user_challenge = self._find_user_challenge(challenge_id, session_info)
        if not user_challenge:
            abort(404, description="No active session found for this challenge")
        
        # Récupérer le progrès
        progress = UserChallengeProgress.query.filter_by(
            user_challenge_id=user_challenge.id,
            step_id=step_id
        ).first()
        print('pssssspas emer..........1')
        if progress:
            print('pssssspas emer..........2')
            return progress.to_dict()
        else:
            # Retourner le code de départ
            step = ChallengeStep.query.get(step_id)
            if not step:
                abort(404, description="Challenge step not found")
            print('pssssspas emer..........3')
            return {
                'step_id': step_id,
                'code': step.starter_code or '',
                'language': 'python',  
                'is_completed': False,
                'tests_passed': 0,
                'tests_total': 0
            }
    
    # =============================================================================
    # CODE EXECUTION
    # =============================================================================
    
    def submit_code(self, challenge_id, step_id, session_info, code, language):
        """
        Soumet le code pour évaluation
        """
        # Vérifier l'accès
        user_challenge = self._find_user_challenge(challenge_id, session_info)
        print(f'🔍 DEBUG: user_challenge trouvé: {user_challenge.id if user_challenge else None}')

        # Vérifier que l'étape existe
        step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
        if not step:
            abort(404, description="Challenge step not found")
        print(f'🔍 DEBUG: step trouvé: {step.id}, order_index: {step.order_index}')

        # Récupérer les cas de test
        testcases = ChallengeStepTestcase.query.filter_by(step_id=step_id).order_by(ChallengeStepTestcase.order_index).all()
        if not testcases:
            abort(404, description="No test cases found for this step")

        try:
            # Exécuter le code contre chaque cas de test
            language_enum = ProgrammingLanguage(language)
            execution_results = []
            passed_count = 0

            for testcase in testcases:
                result = self.code_execution_service.execute_code(
                    code=code,
                    language=language_enum,
                    test_input=testcase.input_data,
                    expected_output=testcase.expected_output,
                    timeout=testcase.timeout_seconds
                )
                print(f'🔍 DEBUG: Testcase {testcase.id} - passed: {result["passed"]}')

                # Préparer le résultat (masquer les sorties attendues pour les cas cachés)
                testcase_result = {
                    'testcase_id': testcase.id,
                    'input': testcase.input_data,
                    'expected_output': testcase.expected_output if not testcase.is_hidden else '[Hidden]',
                    'actual_output': result.get('stdout', ''),
                    'passed': result['passed'],
                    'error': result.get('stderr', ''),
                    'execution_time': result.get('time'),
                    'memory_used': result.get('memory'),
                    'status': result.get('status'),
                    'is_hidden': testcase.is_hidden
                }

                execution_results.append(testcase_result)

                if result['passed']:
                    passed_count += 1

            print(f'🔍 DEBUG: Tests passés: {passed_count}/{len(testcases)}')

            # CORRECTION 1: Mettre à jour le progrès de l'étape spécifique
            step_progress = self._update_step_progress(
                user_challenge, step_id, code, language_enum, passed_count, len(testcases)
            )
            print(f'🔍 DEBUG: Step progress is_completed: {step_progress.is_completed}')

            # CORRECTION 2: Mettre à jour le challenge utilisateur SEULEMENT si l'étape est complétée
            step_completed = passed_count == len(testcases)
            if step_completed:
                self._update_user_challenge_progression(user_challenge, step)
                print(f'🔍 DEBUG: Étape complétée, progression du challenge mise à jour')
            else:
                print(f'🔍 DEBUG: Étape non complétée ({passed_count}/{len(testcases)}), pas de progression du challenge')

            # Incrémenter le compteur de tentatives
            user_challenge.attempt_count += 1
            db.session.commit()

            # CORRECTION 3: Récupérer les informations de progression actualisées
            updated_user_challenge = UserChallenge.query.get(user_challenge.id)

            # Préparer la réponse
            response = {
                'execution_results': execution_results,
                'summary': {
                    'passed': passed_count,
                    'total': len(testcases),
                    'success_rate': round((passed_count / len(testcases)) * 100, 2),
                    'all_passed': step_completed
                },
                'step_progress': {
                    'step_id': step_id,
                    'is_completed': step_completed,
                    'tests_passed': passed_count,
                    'tests_total': len(testcases),
                    'code': code,
                    'language': language_enum.value
                },
                'user_challenge': {
                    'id': updated_user_challenge.id,
                    'current_step_id': updated_user_challenge.current_step_id,
                    'status': updated_user_challenge.status.value,
                    'attempt_count': updated_user_challenge.attempt_count,
                    'started_at': updated_user_challenge.started_at.isoformat() if updated_user_challenge.started_at else None,
                    'completed_at': updated_user_challenge.completed_at.isoformat() if updated_user_challenge.completed_at else None
                }
            }

            # Ajouter info sur l'étape suivante si disponible
            if updated_user_challenge.current_step_id:
                next_step = ChallengeStep.query.get(updated_user_challenge.current_step_id)
                if next_step:
                    response['next_step'] = {
                        'id': next_step.id,
                        'title': next_step.title,
                        'order_index': next_step.order_index
                    }

            print(f'🔍 DEBUG: Response prepared - current_step_id: {updated_user_challenge.current_step_id}')
            return response

        except ValueError as e:
            db.session.rollback()
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error submitting code: {str(e)}')

    def _update_step_progress(self, user_challenge, step_id, code, language, passed_count, total_count):
        """
        Met à jour le progrès d'une étape spécifique
        """
        print(f'🔍 DEBUG: Mise à jour progrès pour step_id: {step_id}, user_challenge_id: {user_challenge.id}')

        progress = UserChallengeProgress.query.filter_by(
            user_challenge_id=user_challenge.id,
            step_id=step_id
        ).first()

        if not progress:
            progress = UserChallengeProgress(
                user_challenge_id=user_challenge.id,
                step_id=step_id,
                language=language
            )
            db.session.add(progress)
            print(f'🔍 DEBUG: Nouveau progress créé pour step_id: {step_id}')
        else:
            print(f'🔍 DEBUG: Progress existant trouvé pour step_id: {step_id}')

        # Mettre à jour avec les résultats d'exécution
        progress.code = code
        progress.language = language
        progress.tests_passed = passed_count
        progress.tests_total = total_count
        progress.is_completed = passed_count == total_count
        progress.last_execution_result = {
            'passed_count': passed_count,
            'total_count': total_count,
            'submission_time': datetime.now(timezone.utc).isoformat()
        }
        progress.last_edited = datetime.now(timezone.utc)

        print(f'🔍 DEBUG: Progress mis à jour - is_completed: {progress.is_completed}, tests: {passed_count}/{total_count}')

        db.session.flush()  # S'assurer que les changements sont visibles dans la session
        return progress
    
    def _update_user_challenge_progression(self, user_challenge, completed_step):
        """
        Met à jour la progression du challenge utilisateur après complétion d'une étape
        """
        print(f'🔍 DEBUG: Mise à jour progression challenge pour step: {completed_step.id}, order: {completed_step.order_index}')
        print(f'🔍 DEBUG: Current step_id avant: {user_challenge.current_step_id}')

        # CORRECTION: Vérifier si c'est bien l'étape courante qui a été complétée
        if user_challenge.current_step_id == completed_step.id:
            print(f'🔍 DEBUG: Étape courante complétée, recherche de la suivante...')

            # Chercher l'étape suivante
            next_step = ChallengeStep.query.filter_by(
                challenge_id=user_challenge.challenge_id
            ).filter(
                ChallengeStep.order_index > completed_step.order_index
            ).order_by(ChallengeStep.order_index).first()

            if next_step:
                user_challenge.current_step_id = next_step.id
                print(f'🔍 DEBUG: Passage à l\'étape suivante: {next_step.id}, order: {next_step.order_index}')
            else:
                # C'était la dernière étape
                user_challenge.status = UserChallengeStatus.COMPLETED
                user_challenge.completed_at = datetime.now(timezone.utc)
                user_challenge.current_step_id = None
                print(f'🔍 DEBUG: Challenge terminé - toutes les étapes complétées')
        else:
            print(f'🔍 DEBUG: Étape complétée ({completed_step.id}) n\'est pas l\'étape courante ({user_challenge.current_step_id})')
            # Si ce n'est pas l'étape courante, on ne change pas la progression
            # Cela permet de compléter des étapes précédentes sans affecter la progression

        print(f'🔍 DEBUG: Current step_id après: {user_challenge.current_step_id}')
        db.session.flush()  # S'assurer que les changements sont visibles
    
    def test_code(self, challenge_id, step_id, session_info, code, language):
        """
        Teste le code contre les cas de test visibles seulement
        
        Args:
            challenge_id: ID du challenge
            step_id: ID de l'étape
            session_info: Information de session
            code: Code à tester
            language: Langage de programmation
            
        Returns:
            Résultats du test
        """
        # Vérifier l'accès
        user_challenge = self._find_user_challenge(challenge_id, session_info)
        if not user_challenge:
            abort(404, description="No active session found for this challenge")
        
        # Récupérer seulement les cas de test visibles
        testcases = ChallengeStepTestcase.query.filter_by(
            step_id=step_id,
            is_hidden=False
        ).order_by(ChallengeStepTestcase.order_index).all()
        
        if not testcases:
            abort(404, description="No visible test cases found for this step")
        
        try:
            # Exécuter le code contre les cas de test visibles
            language_enum = ProgrammingLanguage(language)
            execution_results = []
            passed_count = 0
            
            for testcase in testcases:
                result = self.code_execution_service.execute_code(
                    code=code,
                    language=language_enum,
                    test_input=testcase.input_data,
                    expected_output=testcase.expected_output,
                    timeout=testcase.timeout_seconds
                )
                
                testcase_result = {
                    'testcase_id': testcase.id,
                    'input': testcase.input_data,
                    'expected_output': testcase.expected_output,
                    'actual_output': result.get('stdout', ''),
                    'passed': result['passed'],
                    'error': result.get('stderr', ''),
                    'execution_time': result.get('time'),
                    'memory_used': result.get('memory'),
                    'status': result.get('status')
                }
                
                execution_results.append(testcase_result)
                
                if result['passed']:
                    passed_count += 1
            
            return {
                'execution_results': execution_results,
                'summary': {
                    'passed': passed_count,
                    'total': len(testcases),
                    'success_rate': round((passed_count / len(testcases)) * 100, 2),
                    'all_passed': passed_count == len(testcases)
                },
                'note': 'This test only runs against visible test cases. Submit your solution to test against all cases.'
            }
            
        except ValueError as e:
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            raise Exception(f'Error testing code: {str(e)}')
    
    def get_step_by_id(self, step_id, user_id):
        """
        Récupère une étape par son ID avec vérification des permissions
        
        Args:
            step_id: ID de l'étape
            user_id: ID de l'utilisateur admin
            
        Returns:
            L'étape trouvée
        """
        step = ChallengeStep.query.get(step_id)
        if not step:
            abort(404, description="Challenge step not found")
        
        # Vérifier les permissions admin
        if step.challenge.exercise.created_by != user_id:
            abort(403, description="Access denied to this step")
        
        return step
    
    def update_step(self, step_id, user_id, data):
        """
        Met à jour une étape
        
        Args:
            step_id: ID de l'étape
            user_id: ID de l'utilisateur admin
            data: Nouvelles données
            
        Returns:
            L'étape mise à jour
        """
        step = self.get_step_by_id(step_id, user_id)
        
        try:
            if 'title' in data:
                step.title = data['title']
            if 'instructions' in data:
                step.instructions = data['instructions']
            if 'hint' in data:
                step.hint = data['hint']
            if 'starter_code' in data:
                step.starter_code = data['starter_code']
            if 'solution_code' in data:
                step.solution_code = data['solution_code']
            if 'order_index' in data:
                step.order_index = data['order_index']
            if 'is_final_step' in data:
                step.is_final_step = data['is_final_step']
                
            db.session.commit()
            return step
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error updating step: {str(e)}')
    
    def delete_step(self, step_id, user_id):
        """
        Supprime une étape et tous ses cas de test
        
        Args:
            step_id: ID de l'étape
            user_id: ID de l'utilisateur admin
        """
        step = self.get_step_by_id(step_id, user_id)
        
        try:
            db.session.delete(step)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise Exception(f'Error deleting step: {str(e)}')
    
    # =============================================================================
    # ADMIN CODE TESTING
    # =============================================================================
    
    def admin_test_code(self, step_id, user_id, code, language):
        """
        Teste le code dans un contexte admin (accès à tous les cas de test)
        
        Args:
            step_id: ID de l'étape
            user_id: ID de l'utilisateur admin
            code: Code à tester
            language: Langage de programmation
            
        Returns:
            Résultats de l'exécution
        """
        # Vérifier les permissions
        step = self.get_step_by_id(step_id, user_id)
        
        # Récupérer tous les cas de test (visibles et cachés)
        testcases = ChallengeStepTestcase.query.filter_by(
            step_id=step_id
        ).order_by(ChallengeStepTestcase.order_index).all()
        
        if not testcases:
            return {
                'execution_results': [],
                'summary': {
                    'passed': 0,
                    'total': 0,
                    'success_rate': 0,
                    'all_passed': True
                },
                'note': 'Aucun cas de test défini pour cette étape.'
            }
        
        try:
            # Exécuter le code contre tous les cas de test
            language_enum = ProgrammingLanguage(language)
            execution_results = []
            passed_count = 0
            
            for testcase in testcases:
                result = self.code_execution_service.execute_code(
                    code=code,
                    language=language_enum,
                    test_input=testcase.input_data,
                    expected_output=testcase.expected_output,
                    timeout=testcase.timeout_seconds
                )
                
                testcase_result = {
                    'testcase_id': testcase.id,
                    'input': testcase.input_data,
                    'expected_output': testcase.expected_output,
                    'actual_output': result.get('stdout', ''),
                    'passed': result['passed'],
                    'error': result.get('stderr', ''),
                    'execution_time': result.get('time'),
                    'memory_used': result.get('memory'),
                    'status': result.get('status'),
                    'is_hidden': testcase.is_hidden,
                    'is_example': testcase.is_example
                }
                
                execution_results.append(testcase_result)
                
                if result['passed']:
                    passed_count += 1
            
            return {
                'execution_results': execution_results,
                'summary': {
                    'passed': passed_count,
                    'total': len(testcases),
                    'success_rate': round((passed_count / len(testcases)) * 100, 2),
                    'all_passed': passed_count == len(testcases)
                },
                'note': 'Test admin - tous les cas de test sont visibles.'
            }
            
        except ValueError as e:
            raise ValueError(f'Invalid enum value: {str(e)}')
        except Exception as e:
            raise Exception(f'Error testing code: {str(e)}')
    
    def admin_validate_code(self, step_id, user_id, code, language):
        """
        Valide le code solution dans un contexte admin
        Identique à admin_test_code mais avec un nom différent pour clarté
        """
        return self.admin_test_code(step_id, user_id, code, language)
    
    # =============================================================================
    # HELPER METHODS
    # =============================================================================
    
    def _find_user_challenge(self, challenge_id, session_info):
        """
        Trouve un challenge utilisateur basé sur les informations de session
        
        Args:
            challenge_id: ID du challenge
            session_info: Information de session
            
        Returns:
            UserChallenge ou None
        """
        if not session_info:
            print(f"❌ DEBUG: session_info is None")
            return None
        
        print(f"🔍 DEBUG: Recherche user_challenge pour challenge_id={challenge_id}")
        print(f"🔍 DEBUG: session_info={session_info}")
        
        query = UserChallenge.query.filter_by(challenge_id=challenge_id)
        
        if session_info['type'] == 'user_id':
            print(f"🔍 DEBUG: Recherche par user_id={session_info['value']}")
            result = query.filter_by(user_id=session_info['value']).first()
            
        elif session_info['type'] == 'session_token':
            print(f"🔍 DEBUG: Recherche par session_token={session_info['value']}")
            result = query.filter_by(session_token=session_info['value']).first()
            
        elif session_info['type'] == 'anonymous_id':
            print(f"🔍 DEBUG: Recherche par anonymous_identifier={session_info['value']}")
            result = query.filter_by(anonymous_identifier=session_info['value']).first()
            
            # Debug supplémentaire pour anonymous_id
            all_challenges = query.all()
            print(f"🔍 DEBUG: Nombre total de UserChallenge pour challenge_id {challenge_id}: {len(all_challenges)}")
            for uc in all_challenges:
                print(f"   - UserChallenge ID={uc.id}, anonymous_identifier='{uc.anonymous_identifier}', user_id={uc.user_id}")
        else:
            print(f"❌ DEBUG: Type de session non reconnu: {session_info['type']}")
            return None
        
        print(f"🔍 DEBUG: Résultat trouvé: {result}")
        return result
    
    def _update_progress_after_submission(self, user_challenge, step_id, code, language, passed_count, total_count):
        """
        Met à jour le progrès après soumission
        """
        print('.............>>>>>>>.',user_challenge.id)
        progress = UserChallengeProgress.query.filter_by(
            user_challenge_id=user_challenge.id,
            step_id=step_id
        ).first()
        if not progress:
            progress = UserChallengeProgress(
                user_challenge_id=user_challenge.id,
                step_id=step_id,
                language=language
            )
            db.session.add(progress)
        
        # Mettre à jour avec les résultats d'exécution
        progress.code = code
        progress.language = language
        progress.tests_passed = passed_count
        progress.tests_total = total_count
        progress.is_completed = passed_count == total_count
        progress.last_execution_result = {
            'passed_count': passed_count,
            'total_count': total_count,
            'submission_time': datetime.now(timezone.utc).isoformat()
        }
        progress.last_edited = datetime.now(timezone.utc)
        
        return progress
    
    def _update_user_challenge_progress(self, user_challenge, current_step):
        """
        Met à jour le progrès du challenge utilisateur
        """
        print('sllslslsls',current_step.id)
        if user_challenge.current_step_id == current_step.id:
            # Passer à l'étape suivante ou marquer comme terminé
            next_step = ChallengeStep.query.filter_by(challenge_id=user_challenge.challenge_id).filter(
                ChallengeStep.order_index > current_step.order_index
            ).order_by(ChallengeStep.order_index).first()
            
            if next_step:
                user_challenge.current_step_id = next_step.id
            else:
                # C'était la dernière étape
                user_challenge.status = UserChallengeStatus.COMPLETED
                user_challenge.completed_at = datetime.now(timezone.utc)
                user_challenge.current_step_id = None


class CodeExecutionService:
    """Service pour exécuter du code via Judge0 API"""
    
    @staticmethod
    def execute_code(code, language, test_input, expected_output, timeout=5):
        """
        Exécute le code avec l'entrée donnée et compare avec la sortie attendue
        
        Args:
            code: Code à exécuter
            language: Langage de programmation
            test_input: Entrée de test
            expected_output: Sortie attendue
            timeout: Limite de temps
            
        Returns:
            Résultat de l'exécution avec statut pass/fail
        """
        try:
            # Mapping des langages vers IDs Judge0
            LANGUAGE_IDS = {
                ProgrammingLanguage.PYTHON: 71,  # Python 3.8.1
                ProgrammingLanguage.JAVASCRIPT: 63,  # JavaScript (Node.js 12.14.0)
                ProgrammingLanguage.JAVA: 62,  # Java (OpenJDK 13.0.1)
                ProgrammingLanguage.CPP: 54,  # C++ (GCC 9.2.0)
                ProgrammingLanguage.C: 50,  # C (GCC 9.2.0)
            }
            
            language_id = LANGUAGE_IDS.get(language)
            if not language_id:
                return {
                    'success': False,
                    'error': f'Unsupported language: {language.value}',
                    'passed': False
                }
            
            # Préparer les données de soumission
            submission_data = {
                'source_code': base64.b64encode(code.encode()).decode(),
                'language_id': language_id,
                'stdin': base64.b64encode(test_input.encode()).decode() if test_input else '',
                'expected_output': base64.b64encode(expected_output.encode()).decode(),
                'cpu_time_limit': timeout,
                'memory_limit': 128000,  # 128MB en KB
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': current_app.config.get('JUDGE0_API_KEY', ''),
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
            
            # Soumettre le code pour exécution
            submit_url = f"{current_app.config.get('JUDGE0_API_URL', '')}/submissions?wait=true&base64_encoded=true"
            response = requests.post(submit_url, json=submission_data, headers=headers, timeout=30)
            
            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f'Judge0 API error: {response.status_code}',
                    'passed': False
                }
            
            result = response.json()
            
            # Décoder les sorties base64
            stdout = base64.b64decode(result.get('stdout', '')).decode() if result.get('stdout') else ''
            stderr = base64.b64decode(result.get('stderr', '')).decode() if result.get('stderr') else ''
            compile_output = base64.b64decode(result.get('compile_output', '')).decode() if result.get('compile_output') else ''
            
            # Vérifier si l'exécution a réussi
            status_id = result.get('status', {}).get('id')
            passed = status_id == 3 and stdout.strip() == expected_output.strip()  # Status 3 = Accepted
            
            return {
                'success': True,
                'passed': passed,
                'stdout': stdout,
                'stderr': stderr,
                'compile_output': compile_output,
                'time': result.get('time'),
                'memory': result.get('memory'),
                'status': result.get('status', {}).get('description', 'Unknown'),
                'status_id': status_id
            }
            
        except requests.RequestException as e:
            return {
                'success': False,
                'error': f'Network error: {str(e)}',
                'passed': False
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Execution error: {str(e)}',
                'passed': False
            }


