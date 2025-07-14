# backend/services/ai_interview_orchestrator.py
import asyncio
import json
import time
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
from flask_socketio import SocketIO, emit, join_room, leave_room
from .ai_interview_service import AIInterviewService

class InterviewMode(Enum):
    AUTONOMOUS = "autonomous"  # IA mène l'entretien
    COLLABORATIVE = "collaborative"  # IA assiste le recruteur

class InterviewState(Enum):
    WAITING = "waiting"
    INTRODUCTION = "introduction"
    QUESTIONING = "questioning" 
    FOLLOW_UP = "follow_up"
    EVALUATION = "evaluation"
    CONCLUSION = "conclusion"
    COMPLETED = "completed"

@dataclass
class InterviewContext:
    interview_id: str
    mode: InterviewMode
    state: InterviewState
    current_question_index: int = 0
    questions: List[Dict] = None
    responses: Dict[str, str] = None
    evaluations: Dict[str, Dict] = None
    start_time: float = None
    last_activity: float = None
    candidate_info: Dict = None
    job_info: Dict = None
    ai_suggestions: List[Dict] = None
    
    def __post_init__(self):
        if self.questions is None:
            self.questions = []
        if self.responses is None:
            self.responses = {}
        if self.evaluations is None:
            self.evaluations = {}
        if self.ai_suggestions is None:
            self.ai_suggestions = []

class AIInterviewOrchestrator:
    """Orchestrateur principal pour gérer les entretiens IA en temps réel"""
    
    def __init__(self, socketio: SocketIO, ai_service: AIInterviewService):
        self.socketio = socketio
        self.ai_service = ai_service
        self.active_interviews: Dict[str, InterviewContext] = {}
        self.response_timeout = 30  # 30 secondes max pour commencer à répondre
        self.setup_socket_handlers()
    
    def setup_socket_handlers(self):
        """Configure les gestionnaires d'événements WebSocket"""
        
        @self.socketio.on('start_interview')
        def handle_start_interview(data):
            interview_id = data['interview_id']
            mode = InterviewMode(data['mode'])
            
            context = self.start_interview(
                interview_id=interview_id,
                mode=mode,
                candidate_info=data['candidate_info'],
                job_info=data['job_info'],
                custom_questions=data.get('custom_questions', [])
            )
            
            # Rejoindre la room de l'entretien
            join_room(interview_id)
            
            # Envoyer l'état initial
            emit('interview_started', {
                'interview_id': interview_id,
                'state': context.state.value,
                'mode': context.mode.value
            })
            
            # Démarrer automatiquement si mode autonome
            if mode == InterviewMode.AUTONOMOUS:
                self.socketio.start_background_task(self.run_autonomous_interview, interview_id)
        
        @self.socketio.on('candidate_response')
        def handle_candidate_response(data):
            interview_id = data['interview_id']
            response_text = data['response_text']
            response_duration = data.get('response_duration', 0)
            
            asyncio.create_task(self.process_candidate_response(
                interview_id, response_text, response_duration
            ))
        
        @self.socketio.on('recruiter_action')
        def handle_recruiter_action(data):
            interview_id = data['interview_id']
            action = data['action']  # 'next_question', 'ask_follow_up', 'end_interview'
            
            if action == 'next_question':
                self.move_to_next_question(interview_id)
            elif action == 'ask_follow_up':
                self.generate_follow_up_question(interview_id, data.get('reason'))
            elif action == 'end_interview':
                self.end_interview(interview_id)
        
        @self.socketio.on('audio_transcription')
        def handle_audio_transcription(data):
            interview_id = data['interview_id']
            audio_data = data['audio_data']
            
            # Transcrire l'audio
            transcription = self.ai_service.transcribe_audio(audio_data)
            
            emit('transcription_result', {
                'interview_id': interview_id,
                'transcription': transcription
            }, room=interview_id)
    
    def start_interview(self, interview_id: str, mode: InterviewMode, 
                       candidate_info: Dict, job_info: Dict, 
                       custom_questions: List[Dict] = None) -> InterviewContext:
        """Démarre un nouvel entretien"""
        
        # Générer les questions de l'entretien
        questions = self.ai_service.generate_questions_from_cv_and_job(
            job_description=job_info['description'],
            cv_text=candidate_info.get('cv_text', ''),
            number=5,
            experience_level=job_info.get('experience_level')
        )
        
        # Ajouter les questions personnalisées
        if custom_questions:
            questions.extend(custom_questions)
        
        # Créer le contexte de l'entretien
        context = InterviewContext(
            interview_id=interview_id,
            mode=mode,
            state=InterviewState.INTRODUCTION,
            questions=questions,
            start_time=time.time(),
            last_activity=time.time(),
            candidate_info=candidate_info,
            job_info=job_info
        )
        
        self.active_interviews[interview_id] = context
        return context
    
    async def run_autonomous_interview(self, interview_id: str):
        """Exécute un entretien en mode autonome (IA mène l'entretien)"""
        context = self.active_interviews.get(interview_id)
        if not context:
            return
        
        try:
            # Introduction
            await self.send_ai_introduction(interview_id)
            await asyncio.sleep(2)  # Pause pour que le candidat s'adapte
            
            # Parcourir toutes les questions
            for i, question in enumerate(context.questions):
                context.current_question_index = i
                context.state = InterviewState.QUESTIONING
                
                # Poser la question
                await self.ask_question(interview_id, question)
                
                # Attendre la réponse (avec timeout)
                response_received = await self.wait_for_response(interview_id)
                
                if not response_received:
                    # Timeout - poser une question de suivi
                    await self.handle_response_timeout(interview_id)
                
                # Évaluer la réponse si elle existe
                if str(i) in context.responses:
                    await self.evaluate_current_response(interview_id)
                
                # Décider si on pose une question de suivi
                if await self.should_ask_follow_up(interview_id):
                    await self.ask_follow_up_question(interview_id)
                
                # Pause entre les questions
                await asyncio.sleep(1)
            
            # Conclusion
            await self.conclude_interview(interview_id)
            
        except Exception as e:
            print(f"Erreur dans l'entretien autonome {interview_id}: {str(e)}")
            await self.handle_interview_error(interview_id, str(e))
    
    async def send_ai_introduction(self, interview_id: str):
        """Envoie l'introduction de l'IA"""
        context = self.active_interviews[interview_id]
        
        introduction = f"""
        Bonjour {context.candidate_info['name']}, je suis votre assistant IA pour cet entretien.
        
        Nous allons passer environ {len(context.questions) * 3} minutes ensemble pour évaluer
        votre profil pour le poste de {context.job_info['title']}.
        
        Je vais vous poser {len(context.questions)} questions. Prenez votre temps pour répondre
        et n'hésitez pas à demander des clarifications si nécessaire.
        
        Êtes-vous prêt(e) à commencer ?
        """
        
        self.socketio.emit('ai_message', {
            'interview_id': interview_id,
            'message': introduction,
            'type': 'introduction',
            'timestamp': time.time()
        }, room=interview_id)
        
        context.state = InterviewState.INTRODUCTION
    
    async def ask_question(self, interview_id: str, question: Dict):
        """Pose une question au candidat"""
        context = self.active_interviews[interview_id]
        
        # Personnaliser la question selon le contexte
        question_text = self.personalize_question(question, context)
        
        self.socketio.emit('ai_question', {
            'interview_id': interview_id,
            'question': question_text,
            'question_data': question,
            'question_index': context.current_question_index,
            'total_questions': len(context.questions),
            'timestamp': time.time()
        }, room=interview_id)
        
        # Démarrer le timer pour la réponse
        context.last_activity = time.time()
    
    def personalize_question(self, question: Dict, context: InterviewContext) -> str:
        """Personnalise la question selon le candidat et le poste"""
        question_text = question['question']
        candidate_name = context.candidate_info['name']
        
        # Ajouter le prénom pour plus de personnalisation
        if not question_text.startswith(candidate_name):
            question_text = f"{candidate_name}, {question_text.lower()}"
        
        return question_text
    
    async def wait_for_response(self, interview_id: str, timeout: int = None) -> bool:
        """Attend la réponse du candidat avec timeout"""
        if timeout is None:
            timeout = self.response_timeout
        
        context = self.active_interviews[interview_id]
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            # Vérifier si une réponse a été reçue
            if str(context.current_question_index) in context.responses:
                return True
            
            await asyncio.sleep(0.5)
        
        return False
    
    async def process_candidate_response(self, interview_id: str, response_text: str, response_duration: int):
        """Traite la réponse du candidat"""
        context = self.active_interviews[interview_id]
        current_index = str(context.current_question_index)
        
        # Enregistrer la réponse
        context.responses[current_index] = response_text
        context.last_activity = time.time()
        
        # Analyser la clarté de la réponse
        clarity_analysis = self.ai_service.analyze_response_clarity(
            context.questions[context.current_question_index]['question'],
            response_text
        )
        
        # Informer les participants
        self.socketio.emit('response_received', {
            'interview_id': interview_id,
            'question_index': context.current_question_index,
            'response': response_text,
            'clarity_score': clarity_analysis['score'],
            'duration': response_duration,
            'timestamp': time.time()
        }, room=interview_id)
        
        # En mode collaboratif, suggérer des actions au recruteur
        if context.mode == InterviewMode.COLLABORATIVE:
            await self.provide_recruiter_suggestions(interview_id, clarity_analysis)
    
    async def provide_recruiter_suggestions(self, interview_id: str, clarity_analysis: Dict):
        """Fournit des suggestions au recruteur en mode collaboratif"""
        context = self.active_interviews[interview_id]
        
        suggestions = []
        
        if not clarity_analysis['is_clear']:
            suggestions.append({
                'type': 'follow_up',
                'message': 'La réponse manque de clarté. Suggérer une question de suivi ?',
                'action': 'ask_follow_up',
                'reason': clarity_analysis['reason']
            })
        
        if clarity_analysis['score'] > 0.8:
            suggestions.append({
                'type': 'positive',
                'message': 'Excellente réponse ! Vous pouvez passer à la question suivante.',
                'action': 'next_question'
            })
        
        # Suggérer des questions de suivi basées sur le contenu
        follow_up = self.ai_service.generate_follow_up_question(
            context.questions[context.current_question_index]['question'],
            context.responses[str(context.current_question_index)],
            reason="deepen"
        )
        
        suggestions.append({
            'type': 'follow_up_suggestion',
            'message': f"Question de suivi suggérée: {follow_up['question']}",
            'action': 'custom_follow_up',
            'question': follow_up['question']
        })
        
        context.ai_suggestions = suggestions
        
        self.socketio.emit('ai_suggestions', {
            'interview_id': interview_id,
            'suggestions': suggestions,
            'timestamp': time.time()
        }, room=interview_id)
    
    async def should_ask_follow_up(self, interview_id: str) -> bool:
        """Détermine si une question de suivi est nécessaire"""
        context = self.active_interviews[interview_id]
        current_response = context.responses.get(str(context.current_question_index))
        
        if not current_response:
            return False
        
        # Analyser la qualité de la réponse
        clarity = self.ai_service.analyze_response_clarity(
            context.questions[context.current_question_index]['question'],
            current_response
        )
        
        # Poser une question de suivi si la réponse n'est pas claire ou incomplète
        return not clarity['is_clear'] or clarity['score'] < 0.6
    
    async def ask_follow_up_question(self, interview_id: str, reason: str = "unclear"):
        """Pose une question de suivi"""
        context = self.active_interviews[interview_id]
        current_response = context.responses.get(str(context.current_question_index))
        
        if not current_response:
            return
        
        follow_up = self.ai_service.generate_follow_up_question(
            context.questions[context.current_question_index]['question'],
            current_response,
            reason=reason
        )
        
        context.state = InterviewState.FOLLOW_UP
        
        self.socketio.emit('ai_follow_up', {
            'interview_id': interview_id,
            'question': follow_up['question'],
            'intention': follow_up['intention'],
            'original_question_index': context.current_question_index,
            'timestamp': time.time()
        }, room=interview_id)
    
    async def evaluate_current_response(self, interview_id: str):
        """Évalue la réponse actuelle du candidat"""
        context = self.active_interviews[interview_id]
        current_index = str(context.current_question_index)
        
        if current_index not in context.responses:
            return
        
        question = context.questions[context.current_question_index]['question']
        response = context.responses[current_index]
        
        # Évaluer avec l'IA
        evaluation = self.ai_service.evaluate_response(
            question=question,
            response=response,
            job_role=context.job_info['title'],
            experience_level=context.job_info.get('experience_level', 'intermediate')
        )
        
        context.evaluations[current_index] = evaluation
        
        # Notifier les participants (en mode collaboratif seulement)
        if context.mode == InterviewMode.COLLABORATIVE:
            self.socketio.emit('response_evaluation', {
                'interview_id': interview_id,
                'question_index': context.current_question_index,
                'evaluation': evaluation,
                'timestamp': time.time()
            }, room=interview_id)
    
    def move_to_next_question(self, interview_id: str):
        """Passe à la question suivante"""
        context = self.active_interviews[interview_id]
        
        if context.current_question_index < len(context.questions) - 1:
            context.current_question_index += 1
            context.state = InterviewState.QUESTIONING
            
            # En mode collaboratif, attendre l'action du recruteur
            if context.mode == InterviewMode.COLLABORATIVE:
                self.socketio.emit('ready_for_next_question', {
                    'interview_id': interview_id,
                    'next_question': context.questions[context.current_question_index],
                    'question_index': context.current_question_index
                }, room=interview_id)
        else:
            # Fin de l'entretien
            self.end_interview(interview_id)
    
    def end_interview(self, interview_id: str):
        """Termine l'entretien"""
        context = self.active_interviews[interview_id]
        context.state = InterviewState.COMPLETED
        
        # Générer le résumé final
        summary = self.ai_service.generate_interview_summary({
            'jobRole': context.job_info['title'],
            'experienceLevel': context.job_info.get('experience_level'),
            'questions': context.questions,
            'responses': context.responses,
            'evaluations': context.evaluations
        })
        
        self.socketio.emit('interview_completed', {
            'interview_id': interview_id,
            'summary': summary,
            'total_duration': time.time() - context.start_time,
            'timestamp': time.time()
        }, room=interview_id)
        
        # Nettoyer le contexte
        if interview_id in self.active_interviews:
            del self.active_interviews[interview_id]
    
    async def handle_response_timeout(self, interview_id: str):
        """Gère le timeout de réponse"""
        context = self.active_interviews[interview_id]
        
        timeout_message = f"""
        Je vois que vous prenez le temps de réfléchir, c'est parfaitement normal.
        
        Si vous souhaitez que je reformule la question ou si vous avez besoin
        de clarifications, n'hésitez pas à me le faire savoir.
        
        Sinon, prenez votre temps pour répondre.
        """
        
        self.socketio.emit('ai_message', {
            'interview_id': interview_id,
            'message': timeout_message,
            'type': 'timeout_support',
            'timestamp': time.time()
        }, room=interview_id)
    
    async def handle_interview_error(self, interview_id: str, error_message: str):
        """Gère les erreurs durant l'entretien"""
        self.socketio.emit('interview_error', {
            'interview_id': interview_id,
            'error': error_message,
            'timestamp': time.time()
        }, room=interview_id)
        
        # Nettoyer le contexte en cas d'erreur
        if interview_id in self.active_interviews:
            del self.active_interviews[interview_id]
    
    def get_interview_status(self, interview_id: str) -> Dict:
        """Retourne le statut actuel de l'entretien"""
        context = self.active_interviews.get(interview_id)
        if not context:
            return {'status': 'not_found'}
        
        return {
            'status': 'active',
            'state': context.state.value,
            'mode': context.mode.value,
            'current_question_index': context.current_question_index,
            'total_questions': len(context.questions),
            'progress': (context.current_question_index / len(context.questions)) * 100,
            'duration': time.time() - context.start_time if context.start_time else 0
        }
        
