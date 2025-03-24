# backend/services/ai_collaboration_service.py

from flask import current_app
from ..models.collaboration import AIAssistant, TeamAIAssistant, AIGeneratedContent, Team, TeamMember, CollaborationActivity
from ..models.user import User
from ..models.interview import Interview
from app import db
from datetime import datetime
import uuid

class AICollaborationService:
    """Service pour gérer la collaboration avec des assistants IA"""
    
    def __init__(self, collaboration_service=None):
        """
        Initialisation du service
        
        Args:
            collaboration_service: Service de collaboration standard (optionnel)
        """
        from ..services.collaboration_service import CollaborationService
        from ..services.notification_service import NotificationService
        from ..services.websocket_service import WebSocketService
        
        self.collab_service = collaboration_service or CollaborationService()
        self.notification_service = NotificationService()
        self.websocket_service = WebSocketService()
    
    def create_ai_assistant(self, name, assistant_type, created_by, capabilities=None, model_version=None):
        """
        Crée un nouvel assistant IA
        
        Args:
            name (str): Nom de l'assistant
            assistant_type (str): Type d'assistant (general, recruiter, evaluator, etc.)
            created_by (int): ID de l'utilisateur créateur
            capabilities (dict, optional): Fonctionnalités disponibles
            model_version (str, optional): Version du modèle d'IA
            
        Returns:
            AIAssistant: L'assistant IA créé
        """
        ai_assistant = AIAssistant(
            id=str(uuid.uuid4()),
            name=name,
            assistant_type=assistant_type,
            capabilities=capabilities or {},
            model_version=model_version,
            created_by=created_by
        )
        
        db.session.add(ai_assistant)
        db.session.commit()
        
        return ai_assistant
    
    def get_user_ai_assistants(self, user_id):
        """
        Récupère les assistants IA créés par un utilisateur
        
        Args:
            user_id (int): ID de l'utilisateur
            
        Returns:
            list: Liste des assistants IA
        """
        assistants = AIAssistant.query.filter_by(created_by=user_id).all()
        
        result = []
        for assistant in assistants:
            # Compter le nombre d'équipes où cet assistant est utilisé
            teams_count = TeamAIAssistant.query.filter_by(ai_assistant_id=assistant.id).count()
            
            result.append({
                'id': assistant.id,
                'name': assistant.name,
                'assistant_type': assistant.assistant_type,
                'capabilities': assistant.capabilities,
                'model_version': assistant.model_version,
                'created_at': assistant.created_at,
                'teams_count': teams_count
            })
        
        return result
    
    def add_ai_to_team(self, team_id, ai_assistant_id, role, added_by):
        """
        Ajoute un assistant IA à une équipe
        
        Args:
            team_id (str): ID de l'équipe
            ai_assistant_id (str): ID de l'assistant IA
            role (str): Rôle de l'assistant (assistant, evaluator, analyzer)
            added_by (int): ID de l'utilisateur qui ajoute
            
        Returns:
            TeamAIAssistant: L'association créée
        """
        # Vérifier que l'équipe existe
        team = Team.query.get(team_id)
        if not team:
            raise ValueError("Équipe non trouvée")
        
        # Vérifier que l'assistant IA existe
        ai_assistant = AIAssistant.query.get(ai_assistant_id)
        if not ai_assistant:
            raise ValueError("Assistant IA non trouvé")
        
        # Vérifier que l'utilisateur est admin de l'équipe
        admin_check = TeamMember.query.filter_by(
            team_id=team_id, 
            user_id=added_by,
            role='admin'
        ).first()
        
        if not admin_check:
            raise ValueError("Seuls les administrateurs peuvent ajouter des assistants IA")
        
        # Vérifier si l'assistant est déjà dans l'équipe
        existing = TeamAIAssistant.query.filter_by(
            team_id=team_id,
            ai_assistant_id=ai_assistant_id
        ).first()
        
        if existing:
            # Réactiver si désactivé
            if not existing.is_active:
                existing.is_active = True
                existing.role = role
                existing.added_by = added_by
                existing.added_at = datetime.utcnow()
                db.session.commit()
                return existing
            else:
                raise ValueError("Cet assistant IA est déjà membre de cette équipe")
        
        # Valider le rôle
        if role not in ['assistant', 'evaluator', 'analyzer']:
            role = 'assistant'  # Rôle par défaut
        
        # Ajouter l'assistant IA à l'équipe
        team_ai = TeamAIAssistant(
            team_id=team_id,
            ai_assistant_id=ai_assistant_id,
            role=role,
            added_by=added_by
        )
        
        db.session.add(team_ai)
        
        # Ajouter une activité
        activity = CollaborationActivity(
            interview_id=None,  # Pas lié à un entretien spécifique
            user_id=added_by,
            activity_type='add_ai_assistant',
            details={
                'team_id': team_id,
                'ai_assistant_id': ai_assistant_id,
                'ai_assistant_name': ai_assistant.name,
                'role': role
            }
        )
        db.session.add(activity)
        db.session.commit()
        
        # Notifier les membres de l'équipe
        self._notify_team_about_ai_assistant(team_id, ai_assistant_id, added_by)
        
        return team_ai
    
    def remove_ai_from_team(self, team_id, ai_assistant_id, removed_by):
        """
        Retire un assistant IA d'une équipe
        
        Args:
            team_id (str): ID de l'équipe
            ai_assistant_id (str): ID de l'assistant IA
            removed_by (int): ID de l'utilisateur qui effectue le retrait
            
        Returns:
            bool: True si succès
        """
        # Vérifier que l'utilisateur est admin de l'équipe
        admin_check = TeamMember.query.filter_by(
            team_id=team_id, 
            user_id=removed_by,
            role='admin'
        ).first()
        
        if not admin_check:
            raise ValueError("Seuls les administrateurs peuvent retirer des assistants IA")
        
        # Trouver l'association
        team_ai = TeamAIAssistant.query.filter_by(
            team_id=team_id,
            ai_assistant_id=ai_assistant_id,
            is_active=True
        ).first()
        
        if not team_ai:
            raise ValueError("Cet assistant IA n'est pas membre actif de cette équipe")
        
        # Désactiver plutôt que supprimer pour conserver l'historique
        team_ai.is_active = False
        
        # Ajouter une activité
        activity = CollaborationActivity(
            interview_id=None,
            user_id=removed_by,
            activity_type='remove_ai_assistant',
            details={
                'team_id': team_id,
                'ai_assistant_id': ai_assistant_id,
                'ai_assistant_name': AIAssistant.query.get(ai_assistant_id).name
            }
        )
        db.session.add(activity)
        db.session.commit()
        
        return True
    
    def generate_ai_content(self, team_id, interview_id, ai_assistant_id, content_type, content, metadata=None, requested_by=None):
        """
        Génère et enregistre du contenu produit par une IA
        
        Args:
            team_id (str): ID de l'équipe
            interview_id (int): ID de l'entretien
            ai_assistant_id (str): ID de l'assistant IA
            content_type (str): Type de contenu (comment, analysis, summary, etc.)
            content (str): Contenu généré
            metadata (dict, optional): Métadonnées supplémentaires
            requested_by (int, optional): ID de l'utilisateur ayant demandé la génération
            
        Returns:
            AIGeneratedContent: Le contenu généré
        """
        # Vérifier que l'IA est membre actif de l'équipe
        team_ai = TeamAIAssistant.query.filter_by(
            team_id=team_id,
            ai_assistant_id=ai_assistant_id,
            is_active=True
        ).first()
        
        if not team_ai:
            raise ValueError("Cet assistant IA n'est pas membre actif de cette équipe")
        
        # Vérifier que l'entretien existe
        interview = Interview.query.get(interview_id)
        if not interview:
            raise ValueError("Entretien non trouvé")
        
        # Valider le type de contenu
        valid_types = ['comment', 'analysis', 'summary', 'question', 'evaluation']
        if content_type not in valid_types:
            raise ValueError(f"Type de contenu invalide. Types valides: {', '.join(valid_types)}")
        
        # Créer le contenu généré
        ai_content = AIGeneratedContent(
            team_id=team_id,
            interview_id=interview_id,
            ai_assistant_id=ai_assistant_id,
            content_type=content_type,
            content=content,
            metadata=metadata or {}
        )
        
        db.session.add(ai_content)
        
        # Ajouter une activité
        activity = CollaborationActivity(
            interview_id=interview_id,
            user_id=requested_by or team_ai.added_by,  # Utiliser l'ajouteur de l'IA si aucun demandeur spécifié
            activity_type='ai_content_generated',
            details={
                'team_id': team_id,
                'ai_assistant_id': ai_assistant_id,
                'ai_assistant_name': AIAssistant.query.get(ai_assistant_id).name,
                'content_type': content_type,
                'content_id': ai_content.id
            }
        )
        db.session.add(activity)
        db.session.commit()
        
        # Notifier les membres de l'équipe du nouveau contenu
        self._notify_team_about_ai_content(team_id, interview_id, ai_content.id)
        
        return ai_content
    
    def get_ai_contents(self, interview_id, team_id=None, content_type=None):
        """
        Récupère le contenu généré par IA pour un entretien
        
        Args:
            interview_id (int): ID de l'entretien
            team_id (str, optional): Filtrer par équipe
            content_type (str, optional): Filtrer par type de contenu
            
        Returns:
            list: Liste des contenus générés
        """
        query = AIGeneratedContent.query.filter_by(interview_id=interview_id)
        
        if team_id:
            query = query.filter_by(team_id=team_id)
        
        if content_type:
            query = query.filter_by(content_type=content_type)
        
        contents = query.order_by(AIGeneratedContent.created_at).all()
        
        return [content.to_dict() for content in contents]
    
    def get_active_team_ai_assistants(self, team_id):
        """
        Récupère tous les assistants IA actifs d'une équipe
        
        Args:
            team_id (str): ID de l'équipe
            
        Returns:
            list: Liste des assistants IA avec leurs rôles
        """
        team_assistants = TeamAIAssistant.query.filter_by(
            team_id=team_id,
            is_active=True
        ).all()
        
        result = []
        for team_ai in team_assistants:
            assistant = AIAssistant.query.get(team_ai.ai_assistant_id)
            if assistant:
                result.append({
                    'id': assistant.id,
                    'name': assistant.name,
                    'assistant_type': assistant.assistant_type,
                    'team_role': team_ai.role,
                    'capabilities': assistant.capabilities,
                    'model_version': assistant.model_version,
                    'added_by': team_ai.added_by,
                    'added_at': team_ai.added_at
                })
        
        return result
    
    def request_ai_analysis(self, team_id, interview_id, ai_assistant_id, analysis_type, parameters=None, requested_by=None):
        """
        Demande une analyse à un assistant IA
        
        Args:
            team_id (str): ID de l'équipe
            interview_id (int): ID de l'entretien
            ai_assistant_id (str): ID de l'assistant IA
            analysis_type (str): Type d'analyse demandée
            parameters (dict, optional): Paramètres pour l'analyse
            requested_by (int, optional): ID de l'utilisateur demandeur
            
        Returns:
            dict: Résultat de l'analyse ou tâche en attente
        """
        # Vérifier que l'IA est membre actif de l'équipe
        team_ai = TeamAIAssistant.query.filter_by(
            team_id=team_id,
            ai_assistant_id=ai_assistant_id,
            is_active=True
        ).first()
        
        if not team_ai:
            raise ValueError("Cet assistant IA n'est pas membre actif de cette équipe")
        
        # Vérifier que l'entretien existe
        interview = Interview.query.get(interview_id)
        if not interview:
            raise ValueError("Entretien non trouvé")
        
        # Vérifier le type d'analyse demandée
        ai_assistant = AIAssistant.query.get(ai_assistant_id)
        capabilities = ai_assistant.capabilities or {}
        
        if 'analysis_types' in capabilities and analysis_type not in capabilities['analysis_types']:
            raise ValueError(f"Cet assistant IA ne peut pas effectuer d'analyse de type '{analysis_type}'")
        
        # Enregistrer la demande d'analyse
        # Note: Dans une implémentation réelle, cette méthode ferait appel à un service d'IA
        # externe ou à une file d'attente pour traitement asynchrone
        
        # Pour cet exemple, nous générons immédiatement un contenu factice
        # qui serait normalement le résultat de l'analyse de l'IA
        sample_content = f"Analyse de type {analysis_type} pour l'entretien {interview_id}.\n"
        sample_content += "Ceci est un exemple de contenu qui serait généré par l'IA.\n"
        
        if parameters:
            sample_content += f"Paramètres utilisés: {parameters}\n"
        
        # Créer le contenu d'analyse
        ai_content = self.generate_ai_content(
            team_id=team_id,
            interview_id=interview_id,
            ai_assistant_id=ai_assistant_id,
            content_type='analysis',
            content=sample_content,
            metadata={
                'analysis_type': analysis_type,
                'parameters': parameters,
                'requested_by': requested_by
            },
            requested_by=requested_by or team_ai.added_by
        )
        
        return {
            'status': 'completed',  # ou 'pending' dans un cas réel
            'content_id': ai_content.id,
            'analysis_type': analysis_type,
            'result': ai_content.to_dict()
        }
    
    # ====== MÉTHODES UTILITAIRES ======
    
    def _notify_team_about_ai_assistant(self, team_id, ai_assistant_id, except_user_id=None):
        """
        Notifie les membres d'une équipe de l'ajout d'un assistant IA
        
        Args:
            team_id (str): ID de l'équipe
            ai_assistant_id (str): ID de l'assistant IA
            except_user_id (int, optional): ID de l'utilisateur à ne pas notifier
        """
        team = Team.query.get(team_id)
        ai_assistant = AIAssistant.query.get(ai_assistant_id)
        
        if not team or not ai_assistant:
            return
        
        members = TeamMember.query.filter_by(team_id=team_id).all()
        
        for member in members:
            if except_user_id and member.user_id == except_user_id:
                continue
                
            notification_data = {
                'type': "ai_assistant_added",
                'title': "Nouvel assistant IA",
                'message': f"L'assistant IA {ai_assistant.name} a été ajouté à l'équipe {team.name}",
                'link': f"/teams/{team_id}/assistants",
                'data': {
                    "team_id": team_id,
                    "ai_assistant_id": ai_assistant_id,
                    "ai_assistant_name": ai_assistant.name
                }
            }
            self.notification_service.create_notification(member.user_id, notification_data)
            
            # Notification WebSocket
            self.websocket_service.emit_notification(member.user_id, {
                'type': 'ai_assistant_added',
                'teamId': team_id,
                'teamName': team.name,
                'aiAssistantId': ai_assistant_id,
                'aiAssistantName': ai_assistant.name
            })
    
    def _notify_team_about_ai_content(self, team_id, interview_id, content_id):
        """
        Notifie les membres d'une équipe d'un nouveau contenu généré par IA
        
        Args:
            team_id (str): ID de l'équipe
            interview_id (int): ID de l'entretien
            content_id (int): ID du contenu généré
        """
        team = Team.query.get(team_id)
        interview = Interview.query.get(interview_id)
        content = AIGeneratedContent.query.get(content_id)
        
        if not team or not interview or not content:
            return
        
        ai_assistant = AIAssistant.query.get(content.ai_assistant_id)
        if not ai_assistant:
            return
        
        members = TeamMember.query.filter_by(team_id=team_id).all()
        content_type_names = {
            'comment': 'commentaire',
            'analysis': 'analyse',
            'summary': 'résumé',
            'question': 'question',
            'evaluation': 'évaluation'
        }
        content_type_name = content_type_names.get(content.content_type, content.content_type)
        
        for member in members:
            notification_data = {
                'type': "ai_content_generated",
                'title': f"Nouveau {content_type_name} IA",
                'message': f"{ai_assistant.name} a généré un {content_type_name} pour l'entretien '{interview.title or interview.candidate_name}'",
                'link': f"/interviews/{interview_id}/ai-contents",
                'data': {
                    "team_id": team_id,
                    "interview_id": interview_id,
                    "content_id": content_id,
                    "content_type": content.content_type,
                    "ai_assistant_id": ai_assistant.id,
                    "ai_assistant_name": ai_assistant.name
                }
            }
            self.notification_service.create_notification(member.user_id, notification_data)
            
            # Notification WebSocket
            self.websocket_service.emit_notification(member.user_id, {
                'type': 'ai_content_generated',
                'teamId': team_id,
                'teamName': team.name,
                'interviewId': interview_id,
                'interviewTitle': interview.title or interview.candidate_name,
                'contentId': content_id,
                'contentType': content.content_type,
                'aiAssistantName': ai_assistant.name
            })