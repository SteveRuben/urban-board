# backend/routes/candidate_response_routes.py
import os

from sqlalchemy import null
from flask import Blueprint, request, jsonify, current_app, render_template_string, redirect, url_for
from ..services.interview_scheduling_service import InterviewSchedulingService
from ..services.notification_service import NotificationService
from ..services.audit_service import AuditService
from ..models.interview_scheduling import InterviewSchedule
from datetime import datetime, timedelta
import hashlib
from app import db

candidate_response_bp = Blueprint('candidate_response', __name__, url_prefix='/api/candidate')

scheduling_service = InterviewSchedulingService()
notification_service = NotificationService()
audit_service = AuditService()

def generate_action_hash(access_token, action):
    """
    Génère un hash sécurisé pour une action candidat
    
    Args:
        access_token: Token d'accès de l'entretien
        action: Action à effectuer ('confirm' ou 'cancel')
    
    Returns:
        Hash sécurisé pour l'action
    """
    secret_key = current_app.config.get('CANDIDATE_RESPONSE_SECRET', 'default_secret_key')

    data = f"{access_token}:{action}:{secret_key}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]  # 16 premiers caractères

def validate_action_hash(access_token, action, provided_hash):
    """
    Valide un hash d'action candidat
    
    Args:
        access_token: Token d'accès de l'entretien
        action: Action à effectuer
        provided_hash: Hash fourni à valider
    
    Returns:
        Boolean indiquant si le hash est valide
    """
    expected_hash = generate_action_hash(access_token, action)
    return provided_hash == expected_hash

@candidate_response_bp.route('/interview/<access_token>/<action>/<action_hash>', methods=['GET'])
def handle_candidate_action(access_token, action, action_hash):
    """
    Gère les actions candidat (confirmation ou annulation)
    
    Args:
        access_token: Token d'accès de l'entretien
        action: Action à effectuer ('confirm' ou 'cancel')
        action_hash: Hash de sécurité
    """
    # Valider l'action
    if action not in ['confirm', 'cancel']:
        return render_error_page("Action non autorisée"), 400
    
    # Valider le hash de sécurité
    if not validate_action_hash(access_token, action, action_hash):
        return render_error_page("Lien invalide ou modifié"), 400
    
    # Récupérer l'entretien
    schedule = scheduling_service.get_schedule_by_token(access_token)
    if not schedule:
        return render_error_page("Entretien introuvable"), 404
    
    # Vérifier que l'entretien peut encore être modifié
    if schedule.status not in ['scheduled', 'confirmed']:
        return render_already_processed_page(schedule), 400
    
    # Vérifier que l'entretien n'est pas déjà passé
    if schedule.scheduled_at <= datetime.utcnow():
        return render_interview_passed_page(schedule), 400
    
    # Vérifier qu'il reste assez de temps (au moins 2 heures avant)
    time_until_interview = schedule.scheduled_at - datetime.utcnow()
    if time_until_interview.total_seconds() < 7200:  # 2 heures
        return render_too_late_page(schedule), 400
    
    if action == 'confirm':
        return render_confirm_page(schedule, access_token, action_hash)
    else:  # cancel
        return render_cancel_page(schedule, access_token, action_hash)

@candidate_response_bp.route('/interview/<access_token>/confirm/<action_hash>', methods=['POST'])
def confirm_interview(access_token, action_hash):
    """Confirme l'entretien"""
    if not validate_action_hash(access_token, 'confirm', action_hash):
        return render_error_page("Lien invalide"), 400
    
    schedule = scheduling_service.get_schedule_by_token(access_token)
    if not schedule:
        return render_error_page("Entretien introuvable"), 404
    
    try:
        # Mettre à jour le statut
        schedule.status = 'confirmed'
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log de l'action
        audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=None,  # Action candidat
            action='candidate_confirm',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Entretien confirmé par le candidat {schedule.candidate_name}",
            metadata={
                'candidate_email': schedule.candidate_email,
                'access_token_used': True
            }
        )
        
        # Notifier le recruteur
        try:
            notification_service.create_notification(
                user_id=schedule.recruiter_id,
                title=f"Entretien confirmé - {schedule.candidate_name}",
                message=f"Le candidat {schedule.candidate_name} a confirmé sa présence pour l'entretien du {schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M')}",
                type='candidate_response',
                reference_id=schedule.id,
                link=f"/interviews/scheduled/{schedule.id}"
            )
        except Exception as e:
            print(f"Erreur notification recruteur: {str(e)}")
        
        return render_success_page(schedule, 'confirmed'), 200
        
    except Exception as e:
        print(f"Erreur confirmation: {str(e)}")
        return render_error_page("Erreur lors de la confirmation"), 500

@candidate_response_bp.route('/interview/<access_token>/cancel/<action_hash>', methods=['POST'])
def cancel_interview(access_token, action_hash):
    """Annule l'entretien avec raison optionnelle"""
    if not validate_action_hash(access_token, 'cancel', action_hash):
        return render_error_page("Lien invalidee"), 400
    
    schedule = scheduling_service.get_schedule_by_token(access_token)
    if not schedule:
        return render_error_page("Entretien introuvable"), 404
    
    # Récupérer la raison fournie par le candidat
    reason = request.form.get('reason', '').strip()
    if not reason:
        reason = "Annulé par le candidat"
    
    try:
        # Mettre à jour le statut
        schedule.status = 'canceled'
        schedule.cancellation_reason = reason
        schedule.meet_link=null
        schedule.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log de l'action
        audit_service.log_action(
            organization_id=schedule.organization_id,
            user_id=None,  # Action candidat
            action='candidate_cancel',
            entity_type='interview_schedule',
            entity_id=schedule.id,
            description=f"Entretien annulé par le candidat {schedule.candidate_name}",
            metadata={
                'candidate_email': schedule.candidate_email,
                'reason': reason,
                'access_token_used': True
            }
        )
        
        # Notifier le recruteur
        try:
            notification_service.create_notification(
                user_id=schedule.recruiter_id,
                title=f"Entretien annulé - {schedule.candidate_name}",
                message=f"Le candidat {schedule.candidate_name} a annulé l'entretien du {schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M')}. Raison: {reason}",
                type='candidate_response',
                reference_id=schedule.id,
                link=f"/interviews/scheduled/{schedule.id}"
            )
        except Exception as e:
            print(f"Erreur notification recruteur: {str(e)}")
        
        return render_success_page(schedule, 'canceled', reason), 200
        
    except Exception as e:
        print(f"Erreur annulation: {str(e)}")
        return render_error_page("Erreur lors de l'annulation"), 500

# Templates HTML inline pour éviter les fichiers séparés
def render_confirm_page(schedule, access_token, action_hash):
    """Affiche la page de confirmation"""
    template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmer votre entretien - RecruteIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; overflow: hidden; }
            .header { background: #22c55e; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .interview-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .btn { display: inline-block; padding: 15px 30px; margin: 10px; border: none; border-radius: 5px; text-decoration: none; font-weight: bold; cursor: pointer; font-size: 16px; }
            .btn-confirm { background: #22c55e; color: white; }
            .btn-back { background: #6c757d; color: white; }
            .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
            .actions { text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Confirmer votre entretien</h1>
                <p>Vous êtes sur le point de confirmer votre présence</p>
            </div>
            
            <div class="content">
                <div class="interview-details">
                    <h3>📋 Détails de l'entretien</h3>
                    <p><strong>Candidat :</strong> {{ schedule.candidate_name }}</p>
                    <p><strong>Poste :</strong> {{ schedule.position }}</p>
                    <p><strong>Titre :</strong> {{ schedule.title }}</p>
                    <p><strong>Date :</strong> {{ schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M') }} ({{ schedule.timezone }})</p>
                    <p><strong>Durée :</strong> {{ schedule.duration_minutes }} minutes</p>
                    {% if schedule.description %}
                    <p><strong>Description :</strong> {{ schedule.description }}</p>
                    {% endif %}
                </div>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4>ℹ️ En confirmant</h4>
                    <p>Vous vous engagez à être présent(e) à cet entretien. Le recruteur sera notifié de votre confirmation.</p>
                </div>
                
                <div class="actions">
                    <form method="POST" action="/api/candidate/interview/{{ access_token }}/confirm/{{ action_hash }}" style="display: inline;">
                        <button type="submit" class="btn btn-confirm">✅ Oui, je confirme ma présence</button>
                    </form>
                    <a href="javascript:history.back()" class="btn btn-back">🔙 Retour</a>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, schedule=schedule, access_token=access_token, action_hash=action_hash)

def render_cancel_page(schedule, access_token, action_hash):
    """Affiche la page d'annulation avec formulaire de raison"""
    template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Annuler votre entretien - RecruteIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; overflow: hidden; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .interview-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .form-group { margin: 20px 0; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
            .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; min-height: 100px; font-family: inherit; }
            .btn { display: inline-block; padding: 15px 30px; margin: 10px; border: none; border-radius: 5px; text-decoration: none; font-weight: bold; cursor: pointer; font-size: 16px; }
            .btn-cancel { background: #ef4444; color: white; }
            .btn-back { background: #6c757d; color: white; }
            .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
            .actions { text-align: center; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Annuler votre entretien</h1>
                <p>Nous sommes désolés que vous ne puissiez pas participer</p>
            </div>
            
            <div class="content">
                <div class="interview-details">
                    <h3>📋 Détails de l'entretien</h3>
                    <p><strong>Candidat :</strong> {{ schedule.candidate_name }}</p>
                    <p><strong>Poste :</strong> {{ schedule.position }}</p>
                    <p><strong>Titre :</strong> {{ schedule.title }}</p>
                    <p><strong>Date :</strong> {{ schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M') }} ({{ schedule.timezone }})</p>
                    <p><strong>Durée :</strong> {{ schedule.duration_minutes }} minutes</p>
                </div>
                
                <div class="warning">
                    <h4>⚠️ Annulation de l'entretien</h4>
                    <p>En annulant, cet entretien sera définitivement supprimé de votre planning. Le recruteur sera notifié de votre annulation.</p>
                    <p><strong>Cette action est irréversible.</strong></p>
                </div>
                
                <form method="POST" action="/api/candidate/interview/{{ access_token }}/cancel/{{ action_hash }}">
                    <div class="form-group">
                        <label for="reason">Pouvez-vous nous indiquer la raison de votre annulation ? (optionnel)</label>
                        <textarea id="reason" name="reason" placeholder="Ex: Conflit d'horaire, problème personnel, autre opportunité acceptée..."></textarea>
                        <small style="color: #666;">Cette information aidera le recruteur à mieux comprendre votre situation et pourra faciliter une éventuelle reprogrammation.</small>
                    </div>
                    
                    <div class="actions">
                        <button type="submit" class="btn btn-cancel">❌ Confirmer l'annulation</button>
                        <a href="javascript:history.back()" class="btn btn-back">🔙 Retour</a>
                    </div>
                </form>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, schedule=schedule, access_token=access_token, action_hash=action_hash)

def render_success_page(schedule, action, reason=None):
    """Affiche la page de succès"""
    if action == 'confirmed':
        title = "Entretien confirmé !"
        icon = "✅"
        color = "#22c55e"
        message = "Votre présence à l'entretien a été confirmée avec succès."
        next_steps = [
            "Vous recevrez un email de confirmation",
            "Un rappel vous sera envoyé 24h avant l'entretien",
            "Préparez vos documents (CV, portfolio, etc.)",
            "Testez votre connexion internet et votre caméra"
        ]
    else:  # canceled
        title = "Entretien annulé"
        icon = "❌"
        color = "#ef4444"
        message = "Votre annulation a été transmise au recruteur."
        if reason:
            message += f" Raison indiquée: {reason}"
        next_steps = [
            "Le recruteur a été notifié de votre annulation",
            "Vous recevrez un email de confirmation",
            "Si vous souhaitez reprogrammer, contactez directement le recruteur"
        ]
    
    template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{ title }} - RecruteIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; width: 90%; text-align: center; overflow: hidden; }
            .header { background: {{ color }}; color: white; padding: 30px; }
            .header h1 { margin: 0; font-size: 2em; }
            .content { padding: 30px; }
            .icon { font-size: 4em; margin: 20px 0; }
            .next-steps { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left; }
            .footer { margin-top: 30px; color: #666; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">{{ icon }}</div>
                <h1>{{ title }}</h1>
            </div>
            
            <div class="content">
                <p><strong>{{ message }}</strong></p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <h4>📋 Détails de l'entretien</h4>
                    <p><strong>Candidat :</strong> {{ schedule.candidate_name }}</p>
                    <p><strong>Poste :</strong> {{ schedule.position }}</p>
                    <p><strong>Date :</strong> {{ schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M') }}</p>
                </div>
                
                {% if next_steps %}
                <div class="next-steps">
                    <h4>🎯 Prochaines étapes</h4>
                    <ul>
                        {% for step in next_steps %}
                        <li>{{ step }}</li>
                        {% endfor %}
                    </ul>
                </div>
                {% endif %}
                
                <div class="footer">
                    <p>Cette action a été effectuée le {{ datetime.now().strftime('%d/%m/%Y à %H:%M') }}</p>
                    <p>Pour toute question, contactez notre équipe de recrutement.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, 
                                  title=title, icon=icon, color=color, message=message, 
                                  schedule=schedule, next_steps=next_steps, datetime=datetime)

def render_error_page(message):
    """Affiche une page d'erreur"""
    template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Erreur - RecruteIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; width: 90%; text-align: center; overflow: hidden; }
            .header { background: #ef4444; color: white; padding: 30px; }
            .content { padding: 30px; }
            .icon { font-size: 4em; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">⚠️</div>
                <h1>Une erreur est survenue</h1>
            </div>
            <div class="content">
                <p>{{ message }}</p>
                <p>Si le problème persiste, contactez notre équipe de support.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, message=message)

def render_already_processed_page(schedule):
    """Affiche une page indiquant que l'entretien a déjà été traité"""
    template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Entretien déjà traité - RecruteIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; width: 90%; text-align: center; overflow: hidden; }
            .header { background: #f59e0b; color: white; padding: 30px; }
            .content { padding: 30px; }
            .icon { font-size: 4em; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">ℹ️</div>
                <h1>Entretien déjà traité</h1>
            </div>
            <div class="content">
                <p>Cet entretien a déjà été traité et ne peut plus être modifié.</p>
                <p><strong>Statut actuel :</strong> {{ schedule.status }}</p>
                <p>Si vous avez des questions, contactez directement le recruteur.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, schedule=schedule)

def render_interview_passed_page(schedule):
    """Affiche une page indiquant que l'entretien est passé"""
    template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Entretien passé - RecruteIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; width: 90%; text-align: center; overflow: hidden; }
            .header { background: #6b7280; color: white; padding: 30px; }
            .content { padding: 30px; }
            .icon { font-size: 4em; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">⏰</div>
                <h1>Entretien passé</h1>
            </div>
            <div class="content">
                <p>La date de cet entretien est déjà passée.</p>
                <p><strong>Date prévue :</strong> {{ schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M') }}</p>
                <p>Si vous souhaitez reprogrammer, contactez directement le recruteur.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, schedule=schedule)

def render_too_late_page(schedule):
    """Affiche une page indiquant qu'il est trop tard pour modifier"""
    template = """
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trop tard pour modifier - RecruteIA</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .container { background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; width: 90%; text-align: center; overflow: hidden; }
            .header { background: #f59e0b; color: white; padding: 30px; }
            .content { padding: 30px; }
            .icon { font-size: 4em; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">⏱️</div>
                <h1>Délai dépassé</h1>
            </div>
            <div class="content">
                <p>Il est trop tard pour modifier cet entretien (moins de 2 heures avant le début).</p>
                <p><strong>Heure prévue :</strong> {{ schedule.scheduled_at.strftime('%d/%m/%Y à %H:%M') }}</p>
                <p>Pour toute modification de dernière minute, contactez directement le recruteur par téléphone.</p>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, schedule=schedule)
