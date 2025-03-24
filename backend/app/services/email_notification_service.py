# backend/app/services/email_notification_service.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import config_by_name
from jinja2 import Template

class EmailNotificationService:
    """
    Service pour envoyer des notifications par email.
    """
    
    def __init__(self, config_name='dev'):
        """
        Initialise le service d'envoi d'email.
        
        Args:
            config_name (str): Nom de la configuration à utiliser
        """
        self.config = config_by_name[config_name]
        self.smtp_server = self.config.SMTP_SERVER
        self.smtp_port = self.config.SMTP_PORT
        self.smtp_username = self.config.SMTP_USERNAME
        self.smtp_password = self.config.SMTP_PASSWORD
        self.sender_email = self.config.SENDER_EMAIL
        self.sender_name = self.config.SENDER_NAME
        self.templates_dir = os.path.join(os.path.dirname(__file__), '../templates/emails')
    
    def _get_template(self, template_name):
        """
        Récupère le contenu d'un template d'email.
        
        Args:
            template_name (str): Nom du fichier de template
            
        Returns:
            str: Contenu du template
        """
        template_path = os.path.join(self.templates_dir, template_name)
        try:
            with open(template_path, 'r') as file:
                return file.read()
        except FileNotFoundError:
            # Utiliser un template par défaut si le fichier n'existe pas
            return """
            <html>
            <body>
                <h2>{{ title }}</h2>
                <p>{{ message }}</p>
                {% if cta_link %}
                <p><a href="{{ cta_link }}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">{{ cta_text }}</a></p>
                {% endif %}
                <p>Cordialement,<br>L'équipe RecruteIA</p>
            </body>
            </html>
            """
    
    def send_email(self, recipient_email, subject, template_name, context=None):
        """
        Envoie un email à partir d'un template.
        
        Args:
            recipient_email (str): Adresse email du destinataire
            subject (str): Sujet de l'email
            template_name (str): Nom du fichier de template
            context (dict): Variables de contexte pour le template
            
        Returns:
            bool: True si l'email a été envoyé avec succès, False sinon
        """
        if self.config.TESTING:
            # En mode test, ne pas envoyer d'emails réels
            print(f"[TEST] Email to: {recipient_email}, Subject: {subject}")
            return True
        
        context = context or {}
        template_content = self._get_template(template_name)
        template = Template(template_content)
        html_content = template.render(**context)
        
        # Créer le message
        message = MIMEMultipart('alternative')
        message['Subject'] = subject
        message['From'] = f"{self.sender_name} <{self.sender_email}>"
        message['To'] = recipient_email
        
        # Ajouter la version HTML
        message.attach(MIMEText(html_content, 'html'))
        
        try:
            # Connexion au serveur SMTP
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            
            # Envoi de l'email
            server.send_message(message)
            server.quit()
            return True
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email: {str(e)}")
            return False
    
    def send_interview_completed_notification(self, recipient_email, interview_data):
        """
        Envoie une notification par email pour un entretien terminé.
        
        Args:
            recipient_email (str): Adresse email du recruteur
            interview_data (dict): Données de l'entretien terminé
            
        Returns:
            bool: True si l'email a été envoyé avec succès, False sinon
        """
        candidate_name = interview_data.get('candidate_name', 'Un candidat')
        job_role = interview_data.get('job_role', 'Poste non spécifié')
        interview_id = interview_data.get('id')
        score = interview_data.get('score', 0)
        
        subject = f"[RecruteIA] Entretien terminé: {candidate_name} pour {job_role}"
        
        context = {
            'title': f"Entretien terminé avec {candidate_name}",
            'message': f"L'entretien avec {candidate_name} pour le poste de {job_role} est maintenant terminé. Le candidat a obtenu un score de {score}/10.",
            'cta_link': f"{self.config.FRONTEND_URL}/interviews/{interview_id}",
            'cta_text': "Voir les résultats de l'entretien",
            'candidate_name': candidate_name,
            'job_role': job_role,
            'score': score,
            'interview_id': interview_id
        }
        
        return self.send_email(
            recipient_email=recipient_email,
            subject=subject,
            template_name='interview_completed.html',
            context=context
        )