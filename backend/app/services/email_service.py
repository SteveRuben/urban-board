# backend/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from datetime import datetime
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape
from flask import current_app, app

class EmailService:
    """Service pour gérer l'envoi d'emails dans l'application"""
    
    def __init__(self):
        # Configuration des paramètres d'email
        self.smtp_server = current_app.config.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = current_app.config.get('SMTP_PORT', 587)
        self.smtp_username = current_app.config.get('SMTP_USERNAME', '')
        self.smtp_password = current_app.config.get('SMTP_PASSWORD', '')
        self.sender_email = current_app.config.get('SENDER_EMAIL', 'noreply@recruteai.com')
        self.sender_name = current_app.config.get('SENDER_NAME', 'RecruteIA')
        
        # Configuration de Jinja2 pour les templates d'email
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates', 'emails')
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
    
    def send_email(self, to_email, subject, template_name, context={}, attachments=None):
        """
        Envoie un email avec un template HTML
        
        Args:
            to_email: Adresse email du destinataire
            subject: Sujet de l'email
            template_name: Nom du template Jinja2 (sans extension)
            context: Dictionnaire de variables pour le template
            attachments: Liste de tuples (filename, content) pour les pièces jointes
            
        Returns:
            Boolean indiquant si l'envoi a réussi
        """
        try:
            # Charger le template HTML
            html_template = self.jinja_env.get_template(f"{template_name}.html")
            text_template = self.jinja_env.get_template(f"{template_name}.txt")

            # Rendre les templates avec le contexte
            html_content = html_template.render(**context)
            text_content = text_template.render(**context)

            # Créer le message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.sender_name} <{self.sender_email}>"
            message['To'] = to_email
            
            # Ajouter les parties du message
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            message.attach(part1)
            message.attach(part2)
            
            # Ajouter les pièces jointes
            if attachments:
                for filename, content in attachments:
                    part = MIMEApplication(content)
                    part.add_header('Content-Disposition', 'attachment', filename=filename)
                    message.attach(part)
            
            # Envoyer l'email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.sender_email, to_email, message.as_string())
            
            return True
        except Exception as e:
            print(f"Erreur lors de l'envoi de l'email: {str(e)}")
            return False
    
    def send_interview_invitation(self, email, candidate_name, interview_title, recruiter_name, 
                                 scheduled_at, duration_minutes, timezone, access_token, description=None):
        """Envoie une invitation à un entretien"""
        print('..........135..............')
        subject = f"Invitation: {interview_title}"
        print('..........8..............')
        # Générer le lien d'accès
        interview_url = f"{app.config.get('FRONTEND_URL', 'https://recruteai.com')}/interview/join/{access_token}"
        
        # Formater la date pour l'affichage
        formatted_date = scheduled_at.strftime("%A %d %B %Y à %H:%M")
        print('..........9..............')
        # Préparer le contexte pour le template
        context = {
            'candidate_name': candidate_name,
            'interview_title': interview_title,
            'recruiter_name': recruiter_name,
            'scheduled_at': formatted_date,
            'duration_minutes': duration_minutes,
            'timezone': timezone,
            'description': description,
            'interview_url': interview_url,
            'add_to_calendar_url': self._generate_calendar_link(
                interview_title, description, scheduled_at, duration_minutes, timezone
            )
        }
        print('..........10..............')
        return self.send_email(email, subject, 'interview_invitation', context)
    
    def send_interview_reminder(self, email, candidate_name, interview_title, recruiter_name, 
                               scheduled_at, duration_minutes, timezone, access_token):
        """Envoie un rappel d'entretien"""
        subject = f"Rappel: Votre entretien {interview_title} demain"
        
        # Générer le lien d'accès
        interview_url = f"{app.config.get('FRONTEND_URL', 'https://recruteai.com')}/interview/join/{access_token}"
        
        # Formater la date pour l'affichage
        formatted_date = scheduled_at.strftime("%A %d %B %Y à %H:%M")
        
        # Préparer le contexte pour le template
        context = {
            'candidate_name': candidate_name,
            'interview_title': interview_title,
            'recruiter_name': recruiter_name,
            'scheduled_at': formatted_date,
            'duration_minutes': duration_minutes,
            'timezone': timezone,
            'interview_url': interview_url
        }
        
        return self.send_email(email, subject, 'interview_reminder', context)
    
    def send_interview_rescheduled(self, email, candidate_name, interview_title, recruiter_name, 
                                  scheduled_at, duration_minutes, timezone, access_token):
        """Envoie une notification de reprogrammation d'entretien"""
        subject = f"Modification: Votre entretien {interview_title} a été reprogrammé"
        
        # Générer le lien d'accès
        interview_url = f"{app.config.get('FRONTEND_URL', 'https://recruteai.com')}/interview/join/{access_token}"
        
        # Formater la date pour l'affichage
        formatted_date = scheduled_at.strftime("%A %d %B %Y à %H:%M")
        
        # Préparer le contexte pour le template
        context = {
            'candidate_name': candidate_name,
            'interview_title': interview_title,
            'recruiter_name': recruiter_name,
            'scheduled_at': formatted_date,
            'duration_minutes': duration_minutes,
            'timezone': timezone,
            'interview_url': interview_url,
            'add_to_calendar_url': self._generate_calendar_link(
                interview_title, None, scheduled_at, duration_minutes, timezone
            )
        }
        
        return self.send_email(email, subject, 'interview_rescheduled', context)
    
    def send_interview_canceled(self, email, candidate_name, interview_title, recruiter_name, reason=None):
        """Envoie une notification d'annulation d'entretien"""
        subject = f"Annulation: Votre entretien {interview_title} a été annulé"
        
        # Préparer le contexte pour le template
        context = {
            'candidate_name': candidate_name,
            'interview_title': interview_title,
            'recruiter_name': recruiter_name,
            'reason': reason
        }
        
        return self.send_email(email, subject, 'interview_canceled', context)
    
    def send_interview_accepted_notification(self, organization_name, admin_id, new_member_email, 
                                            new_member_name, role):
        """Envoie une notification lorsqu'une invitation est acceptée"""
        from models.user import User
        admin = User.query.get(admin_id)
        if not admin:
            return False
        
        subject = f"Nouvelle membre dans {organization_name}"
        
        # Préparer le contexte pour le template
        context = {
            'admin_name': admin.name,
            'organization_name': organization_name,
            'new_member_email': new_member_email,
            'new_member_name': new_member_name,
            'role': role
        }
        
        return self.send_email(admin.email, subject, 'invitation_accepted', context)
    
    def send_interview_completed(self, email, candidate_name, interview_title, recruiter_name,
                                interview_summary_url=None):
        """Envoie un email de remerciement après un entretien"""
        subject = f"Merci pour votre participation à l'entretien {interview_title}"
        
        # Préparer le contexte pour le template
        context = {
            'candidate_name': candidate_name,
            'interview_title': interview_title,
            'recruiter_name': recruiter_name,
            'interview_summary_url': interview_summary_url
        }
        
        return self.send_email(email, subject, 'interview_completed', context)
    
    def _generate_calendar_link(self, title, description, start_time, duration_minutes, timezone):
        """
        Génère un lien Google Calendar pour ajouter l'événement
        
        Args:
            title: Titre de l'événement
            description: Description de l'événement
            start_time: Date et heure de début (datetime)
            duration_minutes: Durée en minutes
            timezone: Fuseau horaire
            
        Returns:
            URL pour ajouter l'événement à Google Calendar
        """
        from urllib.parse import quote
        
        # Formater les dates pour Google Calendar
        start_str = start_time.strftime("%Y%m%dT%H%M%S")
        end_time = start_time + timedelta(minutes=duration_minutes)
        end_str = end_time.strftime("%Y%m%dT%H%M%S")
        
        # Construire l'URL
        base_url = "https://calendar.google.com/calendar/render?action=TEMPLATE"
        event_params = {
            "text": title,
            "dates": f"{start_str}/{end_str}",
            "ctz": timezone
        }
        
        if description:
            event_params["details"] = description
        
        # Construire l'URL avec les paramètres
        url_parts = [base_url]
        for key, value in event_params.items():
            url_parts.append(f"{key}={quote(value)}")
        
        return "&".join(url_parts)