# backend/app/services/notification_service.py
import uuid
import json
import os
from datetime import datetime
from flask import current_app
from ..models.notification import Notification
from ..models.notification_setting import NotificationSetting, NotificationPreference

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
    
    def create_interview_scheduled_notification(self, user_id, interview_data):
        """
        Crée une notification pour un entretien planifié.
        
        Args:
            user_id (str): Identifiant du recruteur à notifier
            interview_data (dict): Données de l'entretien planifié
            
        Returns:
            Notification: La notification créée
        """
        candidate_name = interview_data.get('candidate_name', 'Un candidat')
        job_role = interview_data.get('job_role', 'Poste non spécifié')
        interview_id = interview_data.get('id')
        date = interview_data.get('date')
        
        title = f"Entretien planifié: {candidate_name}"
        message = f"Un entretien avec {candidate_name} pour le poste de {job_role} est planifié"
        
        if date:
            # Formatage de la date pour affichage
            formatted_date = self._format_datetime(date)
            message += f" pour le {formatted_date}."
        else:
            message += "."
        
        link = f"/interviews/{interview_id}"
        
        return self.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            type='interview_scheduled',
            reference_id=interview_id,
            link=link
        )
    
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
                
            # TODO: Implémenter d'autres canaux si nécessaire:
            # - Webhooks
            # - Intégrations avec des services tiers comme Slack
            
        except Exception as e:
            if self.logger:
                self.logger.error(f"Erreur lors de l'envoi d'une notification: {str(e)}")
    
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
        # Implémentation à connecter avec le service d'email
        if self.logger:
            self.logger.info(f"Email pour notification {notification.id} mis en file d'attente")
        
        # TODO: Intégrer avec le service d'email_notification_service
        pass
    
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
