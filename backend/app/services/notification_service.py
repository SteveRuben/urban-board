# backend/app/services/notification_service.py
import uuid
import json
import os
from datetime import datetime
from flask import current_app
from ..models.notification import Notification
from ..models.notification_setting import NotificationSetting, NotificationPreference
import hashlib

class NotificationService:
    """
    Service pour gérer les notifications dans l'application.
    
    Ce service permet de créer, lire, mettre à jour et supprimer des notifications,
    ainsi que d'envoyer des notifications aux utilisateurs par différents canaux
    (base de données, email, etc.).
    """
    
    def __init__(self, db=None, logger=None, db_path=None):
        """
        Initialise le service de notification.
        
        Args:
            db: Instance de la base de données SQLAlchemy (pour le mode SQL)
            logger: Instance du logger de l'application
            db_path (str, optional): Chemin vers le fichier de base de données JSON (pour le mode fichier)
        """
        self.db = db
        self.logger = logger or current_app.logger if current_app else None
        self.email_service = None
        if current_app:
            from ..services.email_service import EmailService
            self.email_service = EmailService()
        # Mode fichier JSON (pour le développement ou les tests)
        self.db_path = db_path or os.path.join(os.path.dirname(__file__), '../data/notifications.json')
        self.file_mode = db is None
        
        if self.file_mode:
            self._ensure_db_exists()
    
    def _ensure_db_exists(self):
        """Crée le fichier de base de données s'il n'existe pas."""
        if not self.file_mode:
            return
            
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        if not os.path.exists(self.db_path):
            with open(self.db_path, 'w') as f:
                json.dump([], f)
    
    def _load_notifications(self):
        """
        Charge toutes les notifications depuis la base de données fichier.
        
        Returns:
            list: Liste d'objets Notification
        """
        if not self.file_mode:
            raise ValueError("Cette méthode n'est disponible qu'en mode fichier")
            
        with open(self.db_path, 'r') as f:
            notifications_data = json.load(f)
        
        return [Notification.from_dict(data) for data in notifications_data]
    
    def _save_notifications(self, notifications):
        """
        Sauvegarde la liste des notifications dans la base de données fichier.
        
        Args:
            notifications (list): Liste d'objets Notification
        """
        if not self.file_mode:
            raise ValueError("Cette méthode n'est disponible qu'en mode fichier")
            
        notifications_data = [notification.to_dict() for notification in notifications]
        with open(self.db_path, 'w') as f:
            json.dump(notifications_data, f, indent=2)
    
    def create_notification(self, user_id, title, message, type, reference_id=None, link=None):
        """
        Crée une nouvelle notification pour un utilisateur.
        
        Args:
            user_id (str): Identifiant de l'utilisateur destinataire
            title (str): Titre court de la notification
            message (str): Message détaillé de la notification
            type (str): Type de notification (ex: 'interview_completed')
            reference_id (str, optional): Identifiant de l'objet référencé
            link (str, optional): Lien vers la page concernée
            
        Returns:
            Notification: La notification créée
        """
        try:
            # Vérifier si l'utilisateur veut recevoir ce type de notification
            if not self._should_send_notification(user_id, type, 'inApp'):
                if self.logger:
                    self.logger.info(f"Notification de type {type} désactivée pour l'utilisateur {user_id}")
                return None
                
            notification_id = str(uuid.uuid4())
            
            # Génération du lien si non fourni
            if link is None:
                link = self._generate_link_from_type(type, reference_id)
                
            # En mode SQL
            if not self.file_mode:
                notification = Notification(
                    id=notification_id,
                    user_id=user_id,
                    title=title,
                    message=message,
                    type=type,
                    reference_id=reference_id,
                    link=link,
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                self.db.session.add(notification)
                self.db.session.commit()
            
            # En mode fichier
            else:
                notification = Notification(
                    id=notification_id,
                    user_id=user_id,
                    title=title,
                    message=message,
                    type=type,
                    reference_id=reference_id,
                    link=link,
                    is_read=False,
                    created_at=datetime.now()
                )
                
                notifications = self._load_notifications()
                notifications.append(notification)
                self._save_notifications(notifications)
            
            # Envoyer la notification par d'autres canaux si configuré
            self._send_notification(notification)
            
            return notification
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de la création d'une notification: {str(e)}")
            if not self.file_mode:
                self.db.session.rollback()
            return None
    
    def create_interview_completed_notification(self, user_id, interview_data):
        """
        Crée une notification pour un entretien terminé.
        
        Args:
            user_id (str): Identifiant du recruteur à notifier
            interview_data (dict): Données de l'entretien terminé
            
        Returns:
            Notification: La notification créée
        """
        candidate_name = interview_data.get('candidate_name', 'Un candidat')
        job_role = interview_data.get('job_role', 'Poste non spécifié')
        interview_id = interview_data.get('id')
        score = interview_data.get('score', 0)
        
        title = f"Entretien terminé: {candidate_name}"
        message = f"L'entretien avec {candidate_name} pour le poste de {job_role} est terminé. "
        
        if score:
            message += f"Score obtenu: {score}/10."
        
        link = f"/interviews/{interview_id}"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            type='interview_completed',
            reference_id=interview_id,
            link=link
        )
    
    # def create_interview_scheduled_notification(self, user_id, interview_data):
    #     """
    #     Crée une notification pour un entretien planifié.
        
    #     Args:
    #         user_id (str): Identifiant du recruteur à notifier
    #         interview_data (dict): Données de l'entretien planifié
            
    #     Returns:
    #         Notification: La notification créée
    #     """
    #     candidate_name = interview_data.get('candidate_name', 'Un candidat')
    #     job_role = interview_data.get('job_role', 'Poste non spécifié')
    #     interview_id = interview_data.get('id')
    #     date = interview_data.get('date')
        
    #     title = f"Entretien planifié: {candidate_name}"
    #     message = f"Un entretien avec {candidate_name} pour le poste de {job_role} est planifié"
        
    #     if date:
    #         # Formatage de la date pour affichage
    #         formatted_date = self._format_datetime(date)
    #         message += f" pour le {formatted_date}."
    #     else:
    #         message += "."
        
    #     link = f"/interviews/{interview_id}"
        
    #     return self.create_notification(
    #         user_id=user_id,
    #         title=title,
    #         message=message,
    #         type='interview_scheduled',
    #         reference_id=interview_id,
    #         link=link
    #     )
    
    def create_candidate_application_notification(self, user_id, candidate_data):
        """
        Crée une notification pour une nouvelle candidature.
        
        Args:
            user_id (str): Identifiant du recruteur à notifier
            candidate_data (dict): Données du candidat
            
        Returns:
            Notification: La notification créée
        """
        candidate_name = candidate_data.get('name', 'Un candidat')
        job_role = candidate_data.get('job_role', 'Poste non spécifié')
        candidate_id = candidate_data.get('id')
        
        title = f"Nouvelle candidature: {candidate_name}"
        message = f"{candidate_name} a postulé pour le poste de {job_role}."
        
        link = f"/candidates/{candidate_id}"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            type='candidate_application',
            reference_id=candidate_id,
            link=link
        )
    
    def create_biometric_analysis_notification(self, user_id, analysis_data):
        """
        Crée une notification pour une analyse biométrique terminée.
        
        Args:
            user_id (str): Identifiant du recruteur à notifier
            analysis_data (dict): Données de l'analyse biométrique
            
        Returns:
            Notification: La notification créée
        """
        interview_id = analysis_data.get('interview_id')
        candidate_name = analysis_data.get('candidate_name', 'du candidat')
        
        title = "Analyse biométrique disponible"
        message = f"L'analyse biométrique de l'entretien avec {candidate_name} est maintenant disponible."
        
        link = f"/interviews/{interview_id}/biometrics"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            type='biometric_analysis',
            reference_id=interview_id,
            link=link
        )
    
    def create_collaboration_notification(self, user_id, collaboration_data):
        """
        Crée une notification pour une action collaborative (commentaire, partage).
        
        Args:
            user_id (str): Identifiant de l'utilisateur à notifier
            collaboration_data (dict): Données de la collaboration
            
        Returns:
            Notification: La notification créée
        """
        interview_id = collaboration_data.get('interview_id')
        action_type = collaboration_data.get('action_type', 'commentaire')
        author_name = collaboration_data.get('author_name', 'Un utilisateur')
        candidate_name = collaboration_data.get('candidate_name', 'un candidat')
        
        if action_type == 'comment':
            title = f"Nouveau commentaire de {author_name}"
            message = f"{author_name} a commenté l'entretien avec {candidate_name}."
            link = f"/interviews/{interview_id}/collaboration"
        elif action_type == 'share':
            title = f"Entretien partagé par {author_name}"
            message = f"{author_name} a partagé avec vous l'entretien de {candidate_name}."
            link = f"/interviews/{interview_id}"
        else:
            title = f"Nouvelle activité de collaboration"
            message = f"{author_name} a effectué une action sur l'entretien avec {candidate_name}."
            link = f"/interviews/{interview_id}/collaboration"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            type='collaboration',
            reference_id=interview_id,
            link=link
        )
    
    def create_subscription_notification(self, user_id, subscription_data):
        """
        Crée une notification pour les abonnements (renouvellement, expiration).
        
        Args:
            user_id (str): Identifiant de l'utilisateur à notifier
            subscription_data (dict): Données de l'abonnement
            
        Returns:
            Notification: La notification créée
        """
        action_type = subscription_data.get('action_type', 'renewal')
        plan_name = subscription_data.get('plan_name', 'votre abonnement')
        days_left = subscription_data.get('days_left')
        
        if action_type == 'renewal_reminder':
            title = f"Renouvellement de {plan_name}"
            if days_left:
                message = f"Votre abonnement {plan_name} sera renouvelé dans {days_left} jours."
            else:
                message = f"Votre abonnement {plan_name} sera bientôt renouvelé."
        elif action_type == 'expiration_warning':
            title = f"Expiration de {plan_name}"
            if days_left:
                message = f"Votre abonnement {plan_name} expirera dans {days_left} jours."
            else:
                message = f"Votre abonnement {plan_name} expirera bientôt."
        elif action_type == 'payment_success':
            title = "Paiement réussi"
            message = f"Le paiement pour votre abonnement {plan_name} a été traité avec succès."
        elif action_type == 'payment_failed':
            title = "Échec de paiement"
            message = f"Le paiement pour votre abonnement {plan_name} a échoué. Veuillez mettre à jour vos informations de paiement."
        else:
            title = "Information d'abonnement"
            message = f"Une mise à jour concernant votre abonnement {plan_name} est disponible."
        
        link = "/billing"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            type='subscription_renewal',
            reference_id=None,
            link=link
        )
    
    def create_system_notification(self, user_id, system_data):
        """
        Crée une notification système (maintenance, mise à jour).
        
        Args:
            user_id (str): Identifiant de l'utilisateur à notifier
            system_data (dict): Données système
            
        Returns:
            Notification: La notification créée
        """
        action_type = system_data.get('action_type', 'info')
        message_text = system_data.get('message', 'Une mise à jour système a eu lieu.')
        link_path = system_data.get('link', '/notifications')
        
        if action_type == 'maintenance':
            title = "Maintenance prévue"
        elif action_type == 'update':
            title = "Mise à jour disponible"
        elif action_type == 'feature':
            title = "Nouvelle fonctionnalité"
        else:
            title = "Information système"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message_text,
            type='system',
            reference_id=None,
            link=link_path
        )
    
    def get_notifications(self, user_id, limit=None, unread_only=False, type_filter=None):
        """
        Récupère les notifications d'un utilisateur.
        
        Args:
            user_id (str): Identifiant de l'utilisateur
            limit (int, optional): Nombre maximum de notifications à retourner
            unread_only (bool): Si True, retourne uniquement les notifications non lues
            type_filter (str, optional): Filtre par type de notification
            
        Returns:
            list: Liste des notifications pour l'utilisateur
        """
        try:
            # En mode SQL
            if not self.file_mode:
                query = self.db.session.query(Notification).filter(Notification.user_id == user_id)
                
                if unread_only:
                    query = query.filter(Notification.is_read == False)
                    
                if type_filter:
                    query = query.filter(Notification.type == type_filter)
                
                query = query.order_by(Notification.created_at.desc())
                
                if limit:
                    query = query.limit(limit)
                
                return query.all()
            
            # En mode fichier
            else:
                notifications = self._load_notifications()
                
                # Filtrer les notifications de l'utilisateur
                user_notifications = [n for n in notifications if n.user_id == user_id]
                
                # Filtrer les notifications non lues si demandé
                if unread_only:
                    user_notifications = [n for n in user_notifications if not n.is_read]
                
                # Filtrer par type si demandé
                if type_filter:
                    user_notifications = [n for n in user_notifications if n.type == type_filter]
                
                # Trier par date (plus récent en premier)
                user_notifications.sort(key=lambda n: n.created_at, reverse=True)
                
                # Limiter le nombre de résultats si demandé
                if limit is not None:
                    user_notifications = user_notifications[:limit]
                
                return user_notifications
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de la récupération des notifications: {str(e)}")
            return []
    
    def get_user_notifications(self, user_id, limit=50, filter_type=None, filter_read=None):
        """
        Version SQL de get_notifications compatible avec l'interface existante.
        
        Args:
            user_id (str): Identifiant de l'utilisateur
            limit (int): Nombre maximum de notifications à retourner
            filter_type (str, optional): Filtre par type de notification
            filter_read (bool, optional): Filtre par statut de lecture
            
        Returns:
            list: Liste des notifications pour l'utilisateur au format dict
        """
        try:
            if self.file_mode:
                notifications = self.get_notifications(
                    user_id=user_id,
                    limit=limit,
                    unread_only=(filter_read == False),
                    type_filter=filter_type
                )
                return [n.to_dict() for n in notifications]
            
            query = self.db.session.query(Notification).filter(Notification.user_id == user_id)
            
            if filter_type:
                query = query.filter(Notification.type == filter_type)
            
            if filter_read is not None:
                query = query.filter(Notification.is_read == filter_read)
            
            notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
            return [notification.to_dict() for notification in notifications]
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de la récupération des notifications: {str(e)}")
            return []
    
    def mark_as_read(self, notification_id):
        """
        Marque une notification comme lue.
        
        Args:
            notification_id (str): Identifiant de la notification
            
        Returns:
            bool: True si la notification a été trouvée et mise à jour, False sinon
        """
        try:
            # En mode SQL
            if not self.file_mode:
                notification = self.db.session.query(Notification).filter(Notification.id == notification_id).first()
                
                if notification:
                    notification.is_read = True
                    self.db.session.commit()
                    return True
                
                return False
            
            # En mode fichier
            else:
                notifications = self._load_notifications()
                
                for notification in notifications:
                    if notification.id == notification_id:
                        notification.is_read = True
                        self._save_notifications(notifications)
                        return True
                
                return False
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors du marquage de la notification {notification_id}: {str(e)}")
            if not self.file_mode:
                self.db.session.rollback()
            return False
    
    def mark_notification_read(self, notification_id, user_id):
        """
        Version alternative de mark_as_read qui vérifie aussi l'utilisateur.
        
        Args:
            notification_id (str): Identifiant de la notification
            user_id (str): Identifiant de l'utilisateur
            
        Returns:
            bool: True si la notification a été trouvée et mise à jour, False sinon
        """
        try:
            # En mode SQL
            if not self.file_mode:
                notification = self.db.session.query(Notification).filter(
                    Notification.id == notification_id,
                    Notification.user_id == user_id
                ).first()
                
                if notification:
                    notification.is_read = True
                    self.db.session.commit()
                    return True
                
                return False
            
            # En mode fichier
            else:
                notifications = self._load_notifications()
                
                for notification in notifications:
                    if notification.id == notification_id and notification.user_id == user_id:
                        notification.is_read = True
                        self._save_notifications(notifications)
                        return True
                
                return False
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors du marquage de la notification {notification_id}: {str(e)}")
            if not self.file_mode:
                self.db.session.rollback()
            return False
    
    def mark_all_as_read(self, user_id):
        """
        Marque toutes les notifications d'un utilisateur comme lues.
        
        Args:
            user_id (str): Identifiant de l'utilisateur
            
        Returns:
            int: Nombre de notifications mises à jour
        """
        try:
            # En mode SQL
            if not self.file_mode:
                result = self.db.session.query(Notification).filter(
                    Notification.user_id == user_id,
                    Notification.is_read == False
                ).update({Notification.is_read: True})
                
                self.db.session.commit()
                return result
            
            # En mode fichier
            else:
                notifications = self._load_notifications()
                count = 0
                
                for notification in notifications:
                    if notification.user_id == user_id and not notification.is_read:
                        notification.is_read = True
                        count += 1
                
                if count > 0:
                    self._save_notifications(notifications)
                
                return count
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors du marquage global des notifications: {str(e)}")
            if not self.file_mode:
                self.db.session.rollback()
            return 0
    
    def delete_notification(self, notification_id):
        """
        Supprime une notification.
        
        Args:
            notification_id (str): Identifiant de la notification
            
        Returns:
            bool: True si la notification a été trouvée et supprimée, False sinon
        """
        try:
            # En mode SQL
            if not self.file_mode:
                notification = self.db.session.query(Notification).filter(Notification.id == notification_id).first()
                
                if notification:
                    self.db.session.delete(notification)
                    self.db.session.commit()
                    return True
                
                return False
            
            # En mode fichier
            else:
                notifications = self._load_notifications()
                initial_count = len(notifications)
                
                notifications = [n for n in notifications if n.id != notification_id]
                
                if len(notifications) < initial_count:
                    self._save_notifications(notifications)
                    return True
                
                return False
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de la suppression de la notification {notification_id}: {str(e)}")
            if not self.file_mode:
                self.db.session.rollback()
            return False

    def _should_send_notification(self, user_id, notification_type, category):
        """
        Vérifie si une notification doit être envoyée selon les préférences utilisateur.
        
        Args:
            user_id (str): Identifiant de l'utilisateur
            notification_type (str): Type de notification
            category (str): Catégorie de notification (email, inApp, mobile)
            
        Returns:
            bool: True si la notification doit être envoyée
        """
        try:
            # En mode SQL
            if not self.file_mode:
                setting = self.db.session.query(NotificationSetting).filter(
                    NotificationSetting.user_id == user_id,
                    NotificationSetting.category == category,
                    NotificationSetting.notification_type == notification_type
                ).first()
                
                # Si aucun paramètre trouvé, on considère que c'est activé par défaut
                if not setting:
                    return True
                
                return setting.enabled
            
            # En mode fichier, toujours envoyer (pas de gestion de préférences)
            return True
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de la vérification des préférences de notification: {str(e)}")
            # Par défaut, envoyer la notification
            return True
    
    def _should_send_realtime_email(self, user_id):
        """
        Vérifie si les emails doivent être envoyés en temps réel pour cet utilisateur.
        
        Args:
            user_id (str): Identifiant de l'utilisateur
            
        Returns:
            bool: True si les emails doivent être envoyés en temps réel
        """
        try:
            # En mode SQL
            if not self.file_mode:
                preference = self.db.session.query(NotificationPreference).filter(
                    NotificationPreference.user_id == user_id
                ).first()
                
                # Si aucune préférence trouvée, on utilise le comportement par défaut
                if not preference:
                    return False  # Par défaut, pas d'email en temps réel
                
                return preference.email_digest == 'realtime'
            
            # En mode fichier, ne pas envoyer d'email
            return False
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de la vérification des préférences d'email: {str(e)}")
            # Par défaut, ne pas envoyer d'email en temps réel
            return False
    
    def _send_email_notification(self, notification):
        """
        Envoie une notification par email.
        
        Args:
            notification (Notification): La notification à envoyer
        """
        # # Implémentation à connecter avec le service d'email
        # if self.logger:
        #     self.logger.info(f"Email pour notification {notification.id} mis en file d'attente")
        
        # # TODO: Intégrer avec le service d'email_notification_service
        if not self.email_service:
            if self.logger:
                self.logger.warning("EmailService non disponible pour l'envoi de notification")
            return False
    
        try:
            # Déterminer le template et contexte selon le type de notification
            template_name, context = self._get_email_template_and_context(notification)
            
            if not template_name:
                if self.logger:
                    self.logger.warning(f"Pas de template email pour le type: {notification.type}")
                return False
            
            # Récupérer l'email de l'utilisateur
            from ..models.user import User
            user = User.query.get(notification.user_id)
            if not user or not user.email:
                if self.logger:
                    self.logger.warning(f"Utilisateur {notification.user_id} introuvable ou sans email")
                return False
            
            # Envoyer l'email
            success = self.email_service.send_email(
                to_email=user.email,
                subject=notification.title,
                template_name=template_name,
                context=context
            )
            
            if self.logger:
                if success:
                    self.logger.info(f"Email envoyé pour notification {notification.id}")
                else:
                    self.logger.error(f"Échec envoi email pour notification {notification.id}")
            
            return success
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de l'envoi email notification {notification.id}: {str(e)}")
            return False
            # pass
    
    def _send_mobile_notification(self, notification):
        """
        Envoie une notification mobile (push).
        
        Args:
            notification (Notification): La notification à envoyer
        """
        # Implémentation à connecter avec le service de notification push
        if self.logger:
            self.logger.info(f"Notification push pour {notification.id} mise en file d'attente")
        
        # TODO: Intégrer avec un service de notification push (Firebase, OneSignal, etc.)
        pass
    
    def get_unread_count(self, user_id):
        """
        Compte le nombre de notifications non lues pour un utilisateur.
        
        Args:
            user_id (str): Identifiant de l'utilisateur
            
        Returns:
            int: Nombre de notifications non lues
        """
        try:
            # En mode SQL
            if not self.file_mode:
                count = self.db.session.query(Notification).filter(
                    Notification.user_id == user_id,
                    Notification.is_read == False
                ).count()
                
                return count
            
            # En mode fichier
            else:
                notifications = self._load_notifications()
                return sum(1 for n in notifications if n.user_id == user_id and not n.is_read)
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors du comptage des notifications non lues: {str(e)}")
            return 0

    def get_notification_by_id(self, notification_id):
        """
        Récupère une notification par son ID.
        
        Args:
            notification_id (str): Identifiant de la notification
            
        Returns:
            Notification: L'objet notification trouvé ou None
        """
        try:
            # En mode SQL
            if not self.file_mode:
                return self.db.session.query(Notification).filter(Notification.id == notification_id).first()
            
            # En mode fichier
            else:
                notifications = self._load_notifications()
                for notification in notifications:
                    if notification.id == notification_id:
                        return notification
                return None
                
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de la récupération de la notification {notification_id}: {str(e)}")
            return None
    
    def _generate_link_from_type(self, notification_type, reference_id):
        """
        Génère un lien en fonction du type de notification et de la référence.
        
        Args:
            notification_type (str): Type de notification
            reference_id (str): Identifiant de référence
            
        Returns:
            str: Lien vers la page appropriée
        """
        if not reference_id:
            # Liens par défaut sans référence
            default_links = {
                'interview_completed': '/interviews',
                'interview_scheduled': '/interviews/scheduled',
                'candidate_application': '/candidates',
                'job_position': '/positions',
                'biometric_analysis': '/analytics/biometrics',
                'collaboration': '/collaboration',
                'subscription_renewal': '/billing',
                'system': '/notifications'
            }
            return default_links.get(notification_type, '/dashboard')
            
        # Liens avec référence
        type_links = {
            'interview_completed': f'/interviews/{reference_id}',
            'interview_scheduled': f'/interviews/{reference_id}',
            'candidate_application': f'/candidates/{reference_id}',
            'job_position': f'/positions/{reference_id}',
            'biometric_analysis': f'/interviews/{reference_id}/biometrics',
            'collaboration': f'/interviews/{reference_id}/collaboration',
            'subscription_renewal': '/billing',
            'system': '/notifications'
        }
        
        return type_links.get(notification_type, '/dashboard')
    
    def _format_datetime(self, date_string):
        """
        Formate une date/heure pour l'affichage dans les notifications.
        
        Args:
            date_string (str): Chaîne de date au format ISO
            
        Returns:
            str: Date formatée pour l'affichage
        """
        try:
            if isinstance(date_string, str):
                # Convertir la chaîne en objet datetime
                date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            else:
                # Utiliser directement l'objet datetime
                date_obj = date_string
                
            # Formater la date selon la locale française
            formatted_date = date_obj.strftime('%d/%m/%Y à %H:%M')
            return formatted_date
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors du formatage de la date {date_string}: {str(e)}")
            # En cas d'erreur, retourner la chaîne d'origine
            return str(date_string)
    
    def _send_notification(self, notification):
        """
        Envoie la notification par différents canaux selon sa configuration.
        
        Args:
            notification (Notification): Notification à envoyer
        """
        try:
            user_id = notification.user_id
            notification_type = notification.type
            
            # Vérifier si l'email est activé pour ce type de notification
            should_send_email = self._should_send_notification(user_id, notification_type, 'email')
            
            # Vérifier si les notifications mobiles sont activées
            should_send_mobile = self._should_send_notification(user_id, notification_type, 'mobile')
            
            # Envoi d'email en temps réel si configuré
            if should_send_email and self._should_send_realtime_email(user_id):
                self._send_email_notification(notification)
            
            # Envoi de notification mobile si configuré
            if should_send_mobile:
                self._send_mobile_notification(notification)
            
            # Envoyer la notification en temps réel via WebSocket si disponible
            from flask import current_app
            if hasattr(current_app, 'websocket_service'):
                notification_dict = notification.to_dict()
                current_app.websocket_service.emit_notification(user_id, notification_dict)
                if self.logger:
                    self.logger.info(f"Notification WebSocket envoyée à l'utilisateur {user_id}")
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de l'envoi d'une notification: {str(e)}")

    def _get_email_template_and_context(self, notification):
        """
        Détermine le template et contexte email selon le type de notification.

        Args:
            notification (Notification): La notification

        Returns:
            tuple: (template_name, context) ou (None, None) si pas de template
        """
        # Contexte de base pour tous les emails
        base_context = {
            'notification_title': notification.title,
            'notification_message': notification.message,
            'notification_link': notification.link,
            'user_id': notification.user_id
        }

        # Templates spécifiques selon le type
        if notification.type == 'candidate_application':
            return 'new_application_notification', base_context

        elif notification.type == 'application_status_update':
            return 'application_status_update', base_context

        elif notification.type == 'interview_completed':
            interview_context = base_context.copy()
            interview_context.update({
                'completion_date': datetime.now().strftime("%d/%m/%Y à %H:%M"),
                'candidate_name': 'Candidat',  # À récupérer depuis la référence
                'job_title': 'Entretien',     # À récupérer depuis la référence
                'recruiter_name': '',         # À récupérer depuis l'utilisateur
                'score': None                 # À récupérer depuis les données d'entretien
            })

        elif notification.type == 'interview_scheduled':
            return 'interview_rescheduled', base_context

        # Template générique pour les autres types
        return 'generic_notification', base_context

    def create_application_confirmation_notification(self, application, job):
        """Crée une notification de confirmation de candidature"""
        try:
            title = f"Confirmation de candidature - {job.title}"
            message = f"Votre candidature pour le poste de {job.title} a été reçue avec succès."

            # Créer la notification en base pour l'historique
            notification = self.create_notification(
                user_id=application.candidate_email,  # Utiliser l'email comme ID temporaire
                title=title,
                message=message,
                type='application_confirmation',
                reference_id=application.id,
                link=f"/applications/{application.id}"
            )

            # Envoyer directement l'email avec le template spécifique
            if self.email_service:
                context = {
                    'candidate_name': application.candidate_name,
                    'job_title': job.title,
                    'organization_name': job.organization.name if job.organization else 'l\'entreprise',
                    'application_date': application.created_at.strftime("%d/%m/%Y à %H:%M"),
                    'job_location': job.location,
                    'employment_type': job.employment_type
                }

                return self.email_service.send_email(
                    application.candidate_email,
                    title,
                    'application_confirmation',
                    context
                )

            return notification

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification confirmation: {str(e)}")
            return None

    def create_new_application_notification(self, application, job):
        """Crée une notification pour nouvelle candidature au recruteur"""
        try:
            if not job.creator:
                return None

            title = f"Nouvelle candidature pour {job.title}"
            message = f"{application.candidate_name} a postulé pour le poste de {job.title}."

            # Créer la notification pour le recruteur
            notification = self.create_notification(
                user_id=job.creator.id,
                title=title,
                message=message,
                type='new_application',
                reference_id=application.id,
                link=f"/dashboard/applications/{application.id}"
            )

            # Le système enverra automatiquement l'email si configuré
            return notification

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification nouvelle candidature: {str(e)}")
            return None

    def create_status_update_notification(self, application, old_status, new_status):
        """Crée une notification de changement de statut pour le candidat"""
        try:
            # Messages selon le statut
            status_messages = {
                'reviewed': 'Votre candidature a été examinée',
                'interview_scheduled': 'Un entretien a été planifié',
                'rejected': 'Votre candidature n\'a pas été retenue',
                'hired': 'Félicitations ! Votre candidature a été acceptée'
            }

            if new_status not in status_messages:
                return None

            title = f"Mise à jour de votre candidature - {application.job_posting.title}"
            message = status_messages[new_status]

            # Créer la notification avec l'email comme user_id temporaire
            notification = self.create_notification(
                user_id=application.candidate_email,
                title=title,
                message=message,
                type='application_status_update',
                reference_id=application.id,
                link=f"/applications/{application.id}/status"
            )

            # Envoyer directement l'email
            if self.email_service:
                context = {
                    'candidate_name': application.candidate_name,
                    'job_title': application.job_posting.title,
                    'organization_name': application.job_posting.organization.name if application.job_posting.organization else 'l\'entreprise',
                    'status_message': message,
                    'new_status': new_status,
                    'notes': application.notes
                }

                return self.email_service.send_email(
                    application.candidate_email,
                    title,
                    'application_status_update',
                    context
                )

            return notification

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification statut: {str(e)}")
            return None
        
    def create_interview_scheduled_notification(self, recruiter_id, schedule_data):
        """Crée une notification d'entretien planifié pour le recruteur"""
        try:
            title = "Nouvel entretien planifié"
            message = f"Vous avez planifié un entretien avec {schedule_data['candidate_name']} pour le {schedule_data['scheduled_at']}"
            return self.create_notification(
                user_id=recruiter_id,
                title=title,
                message=message,
                type='interview_scheduled',
                reference_id=schedule_data['schedule_id'],
                link=f"/interviews/scheduled/{schedule_data['schedule_id']}"
            )
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification entretien planifié: {str(e)}")
            return None

    def create_interview_rescheduled_notification(self, recruiter_id, schedule_data):
        """Crée une notification d'entretien reprogrammé"""
        try:
            title = "Entretien reprogrammé"
            message = f"L'entretien avec {schedule_data['candidate_name']} a été reprogrammé pour le {schedule_data['scheduled_at']}"

            return self.create_notification(
                user_id=recruiter_id,
                title=title,
                message=message,
                type='interview_rescheduled',
                reference_id=schedule_data['schedule_id'],
                link=f"/interviews/scheduled/{schedule_data['schedule_id']}"
            )
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification reprogrammation: {str(e)}")
            return None

    def create_interview_canceled_notification(self, recruiter_id, schedule_data):
        """Crée une notification d'entretien annulé"""
        try:
            title = "Entretien annulé"
            message = f"L'entretien avec {schedule_data['candidate_name']} a été annulé"

            return self.create_notification(
                user_id=recruiter_id,
                title=title,
                message=message,
                type='interview_canceled',
                reference_id=schedule_data['schedule_id'],
                link=f"/interviews/scheduled/{schedule_data['schedule_id']}"
            )
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification annulation: {str(e)}")
            return None

    def create_interview_reminder_notification(self, recruiter_id, schedule_data):
        """Crée une notification de rappel d'entretien"""
        try:
            title = "Rappel d'entretien"
            message = f"Rappel: Vous avez un entretien avec {schedule_data['candidate_name']} demain à {schedule_data['time']}"

            return self.create_notification(
                user_id=recruiter_id,
                title=title,
                message=message,
                type='interview_reminder',
                reference_id=schedule_data['schedule_id'],
                link=f"/interviews/scheduled/{schedule_data['schedule_id']}"
            )
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification rappel: {str(e)}")
            return None

    def send_interview_invitation_email(self, schedule):
        """Envoie une invitation d'entretien par email au candidat"""
        try:
            return self.send_interview_invitation_with_response_buttons(schedule)

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur envoi invitation entretien: {str(e)}")
            return False

    def send_interview_rescheduled_email(self, schedule):
        """Envoie un email de reprogrammation au candidat"""
        try:
            return self.send_interview_rescheduled_with_response_buttons(schedule)

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur envoi reprogrammation entretien: {str(e)}")
            return False

    def send_interview_canceled_email(self, schedule, reason=None):
        """Envoie un email d'annulation au candidat"""
        try:
            if not self.email_service:
                return False

            return self.email_service.send_interview_canceled(
                email=schedule.candidate_email,
                candidate_name=schedule.candidate_name,
                interview_title=schedule.title,
                recruiter_name=schedule.recruiter.first_name if schedule.recruiter else 'Le recruteur',
                reason=reason
            )
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur envoi annulation entretien: {str(e)}")
            return False

    def send_interview_reminder_email(self, schedule):
        """Envoie un rappel d'entretien par email au candidat"""
        try:
            if not self.email_service:
                return False

            return self.email_service.send_interview_reminder(
                email=schedule.candidate_email,
                candidate_name=schedule.candidate_name,
                interview_title=schedule.title,
                recruiter_name=schedule.recruiter.name if schedule.recruiter else 'Le recruteur',
                scheduled_at=schedule.scheduled_at,
                duration_minutes=schedule.duration_minutes,
                timezone=schedule.timezone,
                access_token=schedule.access_token,
                meet_link=schedule.meet_link
            )
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur envoi rappel entretien: {str(e)}")
            return False
    
    def send_interview_invitation_with_response_buttons(self, schedule):
        """
        Version simplifiée qui utilise directement EmailService
        """
        try:
            if not self.email_service:
                return False

            return self.email_service.send_interview_invitation(
                email=schedule.candidate_email,
                candidate_name=schedule.candidate_name,
                interview_title=schedule.title,
                recruiter_name=schedule.recruiter.first_name if schedule.recruiter else 'Équipe RH',
                scheduled_at=schedule.scheduled_at,
                duration_minutes=schedule.duration_minutes,
                timezone=schedule.timezone,
                access_token=schedule.access_token,
                description=schedule.description,
                meet_link=schedule.meet_link
            )

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur envoi invitation avec boutons: {str(e)}")
            return False    

    def send_interview_rescheduled_with_response_buttons(self, schedule):
        """
        Version simplifiée qui utilise directement EmailService
        """
        try:
            if not self.email_service:
                return False

            return self.email_service.send_interview_rescheduled(
                email=schedule.candidate_email,
                candidate_name=schedule.candidate_name,
                interview_title=schedule.title,
                recruiter_name=schedule.recruiter.first_name if schedule.recruiter else 'Équipe RH',
                scheduled_at=schedule.scheduled_at,
                duration_minutes=schedule.duration_minutes,
                timezone=schedule.timezone,
                access_token=schedule.access_token
            )

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur envoi reprogrammation avec boutons: {str(e)}")
            return False
    
    def create_candidate_response_notification(self, recruiter_id, schedule, action, reason=None):
        """
        Crée une notification pour informer le recruteur de la réponse du candidat

        Args:
            recruiter_id: ID du recruteur
            schedule: Objet InterviewSchedule
            action: 'confirmed' ou 'canceled'
            reason: Raison de l'annulation (si applicable)

        Returns:
            Notification créée
        """
        try:
            if action == 'confirmed':
                title = f"Entretien confirmé - {schedule.candidate_name}"
                message = f"Le candidat {schedule.candidate_name} a confirmé sa présence pour l'entretien du {schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M')}"
            else:  # canceled
                title = f"Entretien annulé - {schedule.candidate_name}"
                message = f"Le candidat {schedule.candidate_name} a annulé l'entretien du {schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M')}"
                if reason:
                    message += f" - Raison: {reason}"

            return self.create_notification(
                user_id=recruiter_id,
                title=title,
                message=message,
                type='candidate_response',
                reference_id=schedule.id,
                link=f"/interviews/scheduled/{schedule.id}"
            )

        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur création notification réponse candidat: {str(e)}")
            return None

    def generate_candidate_response_urls(self, access_token, base_url=None):
        """Génère les URLs candidat (méthode d'instance)"""
        
        if base_url is None:
            base_url = current_app.config.get('APP_BASE_URL', 'https://votre-domaine.com')

        def generate_action_hash(access_token, action):
            secret_key = current_app.config.get('CANDIDATE_RESPONSE_SECRET', 'default_secret_key')
            data = f"{access_token}:{action}:{secret_key}"
            return hashlib.sha256(data.encode()).hexdigest()[:16]

        confirm_hash = generate_action_hash(access_token, 'confirm')
        cancel_hash = generate_action_hash(access_token, 'cancel')

        return {
            'confirm_url': f"{base_url}/api/candidate/interview/{access_token}/confirm/{confirm_hash}",
            'cancel_url': f"{base_url}/api/candidate/interview/{access_token}/cancel/{cancel_hash}",
        }
