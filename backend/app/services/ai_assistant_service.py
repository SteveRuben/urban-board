# backend/app/services/ai_assistant_service.py
import os
import uuid
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from sqlalchemy.orm.exc import NoResultFound

from app import db
from app.models.ai_assistant import AIAssistant, AIAssistantDocument
from app.models.user import User
from app.services.llm_service import LLMService

class AIAssistantService:
    def __init__(self):
        self.llm_service = LLMService()
        self.upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'uploads', 'assistant_docs')
        
        # Créer le dossier d'upload s'il n'existe pas
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
    
    def get_all_assistants(self, user_id, include_templates=False):
        """
        Récupère tous les assistants IA de l'utilisateur
        
        Args:
            user_id (str): ID de l'utilisateur
            include_templates (bool): Inclure les modèles publics
            
        Returns:
            list: Liste des assistants
        """
        query = AIAssistant.query.filter_by(user_id=user_id, is_template=False).order_by(AIAssistant.created_at.desc())
        assistants = query.all()
        
        # Si demandé, ajouter les modèles publics
        if include_templates:
            templates = AIAssistant.query.filter_by(is_template=True).all()
            return [assistant.to_dict() for assistant in assistants] + [template.to_dict() for template in templates]
        
        return [assistant.to_dict() for assistant in assistants]
    
    def get_assistant_by_id(self, assistant_id, user_id=None):
        """
        Récupère un assistant par son ID
        
        Args:
            assistant_id (str): ID de l'assistant
            user_id (str, optional): ID de l'utilisateur pour vérification
            
        Returns:
            dict: Données de l'assistant
            
        Raises:
            NoResultFound: Si l'assistant n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
        """
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions (sauf pour les modèles publics)
            if not assistant.is_template and user_id and str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            return assistant.to_dict()
        except NoResultFound:
            raise NoResultFound("Assistant non trouvé.")
    
    def create_assistant(self, user_id, assistant_data):
        """
        Crée un nouvel assistant IA
        
        Args:
            user_id (str): ID de l'utilisateur
            assistant_data (dict): Données de l'assistant
            
        Returns:
            dict: Assistant créé
        """
        # Convertir les noms de champs camelCase en snake_case pour la BD
        data_mapping = {
            'jobRole': 'job_role',
            'interviewMode': 'interview_mode',
            'baseKnowledge': 'base_knowledge',
            'customPrompt': 'custom_prompt',
            'questionBank': 'question_bank'
        }
        
        db_data = {}
        for key, value in assistant_data.items():
            db_key = data_mapping.get(key, key.lower())
            db_data[db_key] = value
        
        # Créer l'assistant
        assistant = AIAssistant(
            user_id=user_id,
            **db_data
        )
        
        db.session.add(assistant)
        db.session.commit()
        
        return assistant.to_dict()
    
    def update_assistant(self, assistant_id, user_id, assistant_data):
        """
        Met à jour un assistant existant
        
        Args:
            assistant_id (str): ID de l'assistant
            user_id (str): ID de l'utilisateur
            assistant_data (dict): Nouvelles données de l'assistant
            
        Returns:
            dict: Assistant mis à jour
            
        Raises:
            NoResultFound: Si l'assistant n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
        """
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions
            if str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            # Convertir les noms de champs camelCase en snake_case pour la BD
            data_mapping = {
                'jobRole': 'job_role',
                'interviewMode': 'interview_mode',
                'baseKnowledge': 'base_knowledge',
                'customPrompt': 'custom_prompt',
                'questionBank': 'question_bank'
            }
            
            # Mettre à jour les champs
            for key, value in assistant_data.items():
                if key in ['id', 'user_id', 'created_at', 'updated_at']:
                    continue  # Ignorer ces champs
                
                db_key = data_mapping.get(key, key.lower())
                setattr(assistant, db_key, value)
            
            assistant.updated_at = datetime.utcnow()
            db.session.commit()
            
            return assistant.to_dict()
        except NoResultFound:
            raise NoResultFound("Assistant non trouvé.")
    
    def delete_assistant(self, assistant_id, user_id):
        """
        Supprime un assistant
        
        Args:
            assistant_id (str): ID de l'assistant
            user_id (str): ID de l'utilisateur
            
        Raises:
            NoResultFound: Si l'assistant n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
        """
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions
            if str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            # Supprimer les documents associés
            for document in assistant.documents:
                file_path = document.file_path
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    # Log l'erreur mais continuer
                    print(f"Erreur lors de la suppression du fichier {file_path}: {str(e)}")
            
            # Supprimer l'assistant
            db.session.delete(assistant)
            db.session.commit()
        except NoResultFound:
            raise NoResultFound("Assistant non trouvé.")
    
    def get_assistant_templates(self):
        """
        Récupère tous les modèles d'assistants prédéfinis
        
        Returns:
            list: Liste des modèles
        """
        templates = AIAssistant.query.filter_by(is_template=True).all()
        
        # Ajouter des informations supplémentaires pour l'affichage dans la galerie
        template_dicts = []
        for template in templates:
            template_dict = template.to_dict()
            
            # Ajouter les points forts du modèle (pourrait être stocké dans un champ supplémentaire)
            template_dict['highlights'] = self._get_template_highlights(template)
            
            template_dicts.append(template_dict)
        
        return template_dicts
    
    def _get_template_highlights(self, template):
        """
        Génère des points forts pour un modèle d'assistant
        
        Args:
            template (AIAssistant): Modèle d'assistant
            
        Returns:
            list: Points forts du modèle
        """
        highlights = []
        
        # Basé sur le secteur d'activité
        industry_highlights = {
            'technology': 'Spécialisé dans les entretiens techniques',
            'finance': 'Expert en compétences financières et analytiques',
            'healthcare': 'Connaissances approfondies du secteur de la santé',
            'education': 'Axé sur les compétences pédagogiques',
            'retail': 'Orienté vers le service client et les ventes',
            'manufacturing': 'Axé sur les processus de production et l\'amélioration continue'
        }
        
        if template.industry in industry_highlights:
            highlights.append(industry_highlights[template.industry])
        
        # Basé sur le poste
        role_highlights = {
            'software-engineer': 'Questions techniques de programmation adaptatives',
            'data-scientist': 'Évaluation des compétences analytiques et statistiques',
            'product-manager': 'Focus sur la vision produit et la priorisation',
            'designer': 'Évaluation des compétences de conception UX/UI',
            'marketing': 'Questions centrées sur les stratégies marketing et l\'analyse de marché',
            'sales': 'Évaluation des compétences de négociation et de closing',
            'customer-support': 'Focus sur la résolution de problèmes et l\'empathie'
        }
        
        if template.job_role in role_highlights:
            highlights.append(role_highlights[template.job_role])
        
        # Basé sur le mode d'entretien
        mode_highlights = {
            'autonomous': 'Conduit des entretiens complets de manière autonome',
            'collaborative': 'Suggère des questions et analyses pertinentes en temps réel',
            'hybrid': 'Flexible entre autonomie et assistance au recruteur'
        }
        
        if template.interview_mode in mode_highlights:
            highlights.append(mode_highlights[template.interview_mode])
        
        # Basé sur les capacités
        if template.capabilities.get('evaluateResponses', False):
            highlights.append('Évaluation objective des réponses des candidats')
        
        if template.capabilities.get('suggestFollowUps', False):
            highlights.append('Génération de questions de suivi pertinentes')
        
        if template.capabilities.get('biometricIntegration', False):
            highlights.append('Intégration avec l\'analyse biométrique')
        
        # Si nous n'avons pas au moins 3 points forts, ajouter des génériques
        if len(highlights) < 3:
            generic_highlights = [
                'Adaptable à différents niveaux d\'expérience',
                'Questions personnalisables selon vos besoins',
                'Analyses détaillées des réponses des candidats'
            ]
            
            for highlight in generic_highlights:
                if highlight not in highlights and len(highlights) < 3:
                    highlights.append(highlight)
        
        return highlights[:4]  # Limiter à 4 points forts maximum
    
    def clone_assistant(self, template_id, user_id, options=None):
        """
        Clone un assistant existant ou un modèle
        
        Args:
            template_id (str): ID de l'assistant ou du modèle à cloner
            user_id (str): ID de l'utilisateur
            options (dict, optional): Options de clonage (nouveau nom, etc.)
            
        Returns:
            dict: Nouvel assistant cloné
            
        Raises:
            NoResultFound: Si l'assistant à cloner n'existe pas
        """
        try:
            template = AIAssistant.query.filter_by(id=template_id).one()
            
            # Configurer les options
            options = options or {}
            new_name = options.get('name', f"Copie de {template.name}")
            
            # Créer une copie de l'assistant
            new_assistant = AIAssistant(
                user_id=user_id,
                name=new_name,
                description=template.description,
                avatar=template.avatar,
                model=template.model,
                industry=template.industry,
                job_role=template.job_role,
                seniority=template.seniority,
                interview_mode=template.interview_mode,
                personality=template.personality,
                base_knowledge=template.base_knowledge,
                capabilities=template.capabilities,
                custom_prompt=template.custom_prompt,
                question_bank=template.question_bank,
                is_template=False,
                template_id=template.id if template.is_template else template.template_id
            )
            
            db.session.add(new_assistant)
            db.session.commit()
            
            return new_assistant.to_dict()
        except NoResultFound:
            raise NoResultFound("Assistant à cloner non trouvé.")
    
    def upload_document(self, assistant_id, user_id, file, document_type, description=None):
        """
        Télécharge un document à associer à un assistant
        
        Args:
            assistant_id (str): ID de l'assistant
            user_id (str): ID de l'utilisateur
            file: Fichier à télécharger
            document_type (str): Type de document
            description (str, optional): Description du document
            
        Returns:
            dict: Métadonnées du document
            
        Raises:
            NoResultFound: Si l'assistant n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
            ValueError: Si le type de fichier n'est pas pris en charge
        """
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions
            if str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            # Vérifier le type de fichier
            original_filename = secure_filename(file.filename)
            file_extension = os.path.splitext(original_filename)[1].lower()
            
            allowed_extensions = ['.pdf', '.docx', '.txt', '.md']
            if file_extension not in allowed_extensions:
                raise ValueError(f"Type de fichier non pris en charge. Extensions autorisées: {', '.join(allowed_extensions)}")
            
            # Générer un nom de fichier unique
            filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(self.upload_folder, filename)
            
            # Sauvegarder le fichier
            file.save(file_path)
            
            # Créer l'enregistrement dans la base de données
            document = AIAssistantDocument(
                assistant_id=assistant_id,
                filename=filename,
                original_filename=original_filename,
                file_path=file_path,
                file_size=os.path.getsize(file_path),
                file_type=file.content_type,
                document_type=document_type,
                description=description,
                vector_index_status='pending'
            )
            
            db.session.add(document)
            db.session.commit()
            
            # Lancer l'indexation du document en arrière-plan (dans un vrai système, ce serait une tâche asynchrone)
            self._index_document(document.id)
            
            return document.to_dict()
        except NoResultFound:
            raise NoResultFound("Assistant non trouvé.")
    
    def _index_document(self, document_id):
        """
        Indexe un document pour la recherche vectorielle
        
        Args:
            document_id (str): ID du document
            
        Note:
            Dans un système réel, cette méthode serait exécutée de manière asynchrone
        """
        try:
            document = AIAssistantDocument.query.filter_by(id=document_id).one()
            document.vector_index_status = 'processing'
            db.session.commit()
            
            # Logique d'indexation ici...
            # Dans un système réel, on utiliserait un service d'embeddings
            # pour créer des vecteurs à partir du contenu du document
            
            # Simuler un traitement réussi
            document.vector_index_status = 'completed'
            db.session.commit()
        except Exception as e:
            try:
                document = AIAssistantDocument.query.filter_by(id=document_id).one()
                document.vector_index_status = 'failed'
                db.session.commit()
            except:
                pass
            
            # Log l'erreur
            print(f"Erreur lors de l'indexation du document {document_id}: {str(e)}")
    
    def get_assistant_documents(self, assistant_id, user_id):
        """
        Récupère la liste des documents associés à un assistant
        
        Args:
            assistant_id (str): ID de l'assistant
            user_id (str): ID de l'utilisateur
            
        Returns:
            list: Liste des documents
            
        Raises:
            NoResultFound: Si l'assistant n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
        """
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions
            if not assistant.is_template and str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            return [document.to_dict() for document in assistant.documents]
        except NoResultFound:
            raise NoResultFound("Assistant non trouvé.")
    
    def delete_document(self, assistant_id, document_id, user_id):
        """
        Supprime un document associé à un assistant
        
        Args:
            assistant_id (str): ID de l'assistant
            document_id (str): ID du document
            user_id (str): ID de l'utilisateur
            
        Raises:
            NoResultFound: Si l'assistant ou le document n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
        """
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions
            if str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            document = AIAssistantDocument.query.filter_by(id=document_id, assistant_id=assistant_id).one()
            
            # Supprimer le fichier
            try:
                if os.path.exists(document.file_path):
                    os.remove(document.file_path)
            except Exception as e:
                # Log l'erreur mais continuer
                print(f"Erreur lors de la suppression du fichier {document.file_path}: {str(e)}")
            
            # Supprimer l'enregistrement
            db.session.delete(document)
            db.session.commit()
        except NoResultFound:
            raise NoResultFound("Assistant ou document non trouvé.")
    
    def test_assistant(self, assistant_id, params, user_id=None):
        """
        Test la réponse de l'assistant à une question
        
        Args:
            assistant_id (str): ID de l'assistant à tester
            params (dict): Paramètres du test (question, etc.)
            user_id (str, optional): ID de l'utilisateur
            
        Returns:
            dict: Réponse de l'assistant
            
        Raises:
            NoResultFound: Si l'assistant n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
        """
        # Si preview mode, utiliser les données de l'assistant passées dans les paramètres
        if assistant_id == 'preview':
            if 'assistant' not in params:
                raise ValueError("Données d'assistant manquantes pour le mode aperçu.")
            
            assistant_data = params['assistant']
            prompt = self._generate_prompt(assistant_data, params.get('question', ''))
            
            # Appeler le service LLM
            response = self.llm_service.generate_response(
                prompt=prompt,
                model=assistant_data.get('model', 'claude-3-7-sonnet')
            )
            
            return {
                'content': response,
                'model': assistant_data.get('model', 'claude-3-7-sonnet')
            }
        
        # Sinon, charger l'assistant depuis la base de données
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions (sauf pour les modèles publics)
            if not assistant.is_template and user_id and str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            prompt = self._generate_prompt(assistant.to_dict(), params.get('question', ''))
            
            # Appeler le service LLM
            response = self.llm_service.generate_response(
                prompt=prompt,
                model=assistant.model
            )
            
            return {
                'content': response,
                'model': assistant.model
            }
        except NoResultFound:
            raise NoResultFound("Assistant non trouvé.")
    
    def _generate_prompt(self, assistant_data, question):
        """
        Génère le prompt pour l'assistant IA
        
        Args:
            assistant_data (dict): Données de l'assistant
            question (str): Question posée
            
        Returns:
            str: Prompt complet
        """
        # Récupérer les paramètres de personnalité
        personality = assistant_data.get('personality', {})
        friendliness = personality.get('friendliness', 3)
        formality = personality.get('formality', 3)
        technical_depth = personality.get('technicalDepth', 3)
        follow_up_intensity = personality.get('followUpIntensity', 3)
        
        # Récupérer les paramètres de connaissances
        base_knowledge = assistant_data.get('baseKnowledge', {})
        
        # Construire le prompt de base
        industry_mapping = {
            'technology': 'technologie',
            'finance': 'finance',
            'healthcare': 'santé',
            'education': 'éducation',
            'retail': 'commerce de détail',
            'manufacturing': 'industrie'
        }
        
        role_mapping = {
            'software-engineer': 'ingénieur logiciel',
            'data-scientist': 'data scientist',
            'product-manager': 'chef de produit',
            'designer': 'designer',
            'marketing': 'spécialiste marketing',
            'sales': 'commercial',
            'customer-support': 'agent de support client'
        }
        
        seniority_mapping = {
            'entry-level': 'débutant',
            'mid-level': 'intermédiaire',
            'senior': 'senior',
            'management': 'manager',
            'executive': 'cadre dirigeant'
        }
        
        industry = industry_mapping.get(assistant_data.get('industry', ''), assistant_data.get('industry', ''))
        job_role = role_mapping.get(assistant_data.get('jobRole', ''), assistant_data.get('jobRole', ''))
        seniority = seniority_mapping.get(assistant_data.get('seniority', ''), assistant_data.get('seniority', ''))
        
        prompt = f"""Vous êtes un assistant d'entretien professionnel spécialisé dans le secteur de {industry} pour le poste de {job_role} de niveau {seniority}.

PARAMÈTRES DE PERSONNALITÉ:
- Convivialité: {friendliness}/5 ({"très formel et direct" if friendliness == 1 else "plutôt formel" if friendliness == 2 else "équilibré" if friendliness == 3 else "chaleureux" if friendliness == 4 else "très chaleureux et détendu"})
- Formalité: {formality}/5 ({"très conversationnel" if formality == 1 else "plutôt informel" if formality == 2 else "équilibré" if formality == 3 else "formel" if formality == 4 else "très formel"})
- Profondeur technique: {technical_depth}/5 ({"conceptuel et général" if technical_depth == 1 else "notions de base" if technical_depth == 2 else "équilibré" if technical_depth == 3 else "détaillé" if technical_depth == 4 else "très technique et détaillé"})
- Questions de suivi: {follow_up_intensity}/5 ({"basiques" if follow_up_intensity == 1 else "occasionnelles" if follow_up_intensity == 2 else "équilibrées" if follow_up_intensity == 3 else "approfondies" if follow_up_intensity == 4 else "très approfondies et challenging"})

DOMAINES DE CONNAISSANCES:"""
        
        if base_knowledge.get('technicalSkills', True):
            prompt += "\n- Compétences techniques pertinentes pour le poste"
        
        if base_knowledge.get('softSkills', True):
            prompt += "\n- Compétences comportementales et interpersonnelles"
        
        if base_knowledge.get('companyValues', False):
            prompt += "\n- Valeurs et culture d'entreprise"
        
        if base_knowledge.get('industryTrends', False):
            prompt += "\n- Tendances actuelles du secteur"
        
        # Ajouter le prompt personnalisé s'il existe
        custom_prompt = assistant_data.get('customPrompt', '')
        if custom_prompt:
            prompt += f"\n\nINSTRUCTIONS PERSONNALISÉES:\n{custom_prompt}"
        
        # Ajouter la question
        prompt += f"\n\nQUESTION DU CANDIDAT: {question}\n\nVotre réponse:"
        
        return prompt
    
    def get_assistant_history(self, assistant_id, user_id, filters=None):
        """
        Récupère l'historique des conversations avec un assistant
        
        Args:
            assistant_id (str): ID de l'assistant
            user_id (str): ID de l'utilisateur
            filters (dict, optional): Filtres optionnels (dates, etc.)
            
        Returns:
            list: Historique des conversations
            
        Raises:
            NoResultFound: Si l'assistant n'existe pas
            PermissionError: Si l'utilisateur n'a pas accès à cet assistant
        """
        # Cette méthode serait implémentée avec un modèle supplémentaire pour les conversations
        # Pour l'instant, nous retournons un tableau vide
        try:
            assistant = AIAssistant.query.filter_by(id=assistant_id).one()
            
            # Vérifier les permissions
            if str(assistant.user_id) != str(user_id):
                raise PermissionError("Vous n'avez pas accès à cet assistant.")
            
            # Dans un système réel, nous interrogerions la table des conversations
            return []
        except NoResultFound:
            raise NoResultFound("Assistant non trouvé.")

# Créer une instance du service
ai_assistant_service = AIAssistantService()