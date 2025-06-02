# backend/services/subscription_service.py
from ..models.user import User
from ..models.organization import Organization, OrganizationMember
from ..models.subscription import Subscription
from ..models.plan import Plan, PlanFeature
from datetime import datetime, timedelta
from app import db

class SubscriptionService:
    """Service pour gérer les abonnements et les fonctionnalités disponibles selon le plan"""
    
    # Définition des fonctionnalités disponibles par plan
    PLAN_FEATURES = {
        'freemium': ['basic_interviews', 'basic_analytics'],
        'starter': ['basic_interviews', 'basic_analytics', 'storage_30d', 'full_candidate_analysis'],
        'pro': ['basic_interviews', 'basic_analytics', 'storage_1y', 'full_candidate_analysis', 
                'ats_integration', 'collaboration', 'ai_assistants'],
        'enterprise': ['basic_interviews', 'basic_analytics', 'storage_unlimited', 'full_candidate_analysis', 
                      'ats_integration', 'collaboration', 'biometric_analysis', 'api_access', 'ai_assistants']
    }
    
    def get_organization_for_user(self, user_id):
        """Récupère l'organisation d'un utilisateur"""
        member = OrganizationMember.query.filter_by(user_id=user_id).first()
        if not member:
            return None
        
        return member.organization
    
    def get_user_subscription(self, user_id):
        """Récupère l'abonnement actif d'un utilisateur"""
        return Subscription.query.filter_by(
            user_id=user_id,
            status='active'
        ).order_by(Subscription.end_date.desc()).first()
    
    def get_organization_subscription(self, organization_id):
        """Récupère l'abonnement actif d'une organisation"""
        return Subscription.query.filter_by(
            organization_id=organization_id,
            status='active'
        ).order_by(Subscription.end_date.desc()).first()
    
    def get_user_plan(self, user_id):
        """Récupère le plan d'abonnement d'un utilisateur via son organisation"""
        # Priorité à l'abonnement personnel
        subscription = self.get_user_subscription(user_id)
        if subscription and subscription.plan:
            return subscription.plan.name
        
        # Sinon, vérifier l'abonnement de l'organisation
        organization = self.get_organization_for_user(user_id)
        if not organization:
            return 'freemium'
        
        org_subscription = self.get_organization_subscription(organization.id)
        if org_subscription and org_subscription.plan:
            return org_subscription.plan.name
        
        return 'freemium'
    
    def has_feature(self, user_id, feature_name):
        """Vérifie si un utilisateur a accès à une fonctionnalité spécifique"""
        plan_name = self.get_user_plan(user_id)
        
        # Vérifier si la fonctionnalité est incluse dans le plan
        return feature_name in self.PLAN_FEATURES.get(plan_name, [])
    
    def get_user_features(self, user_id):
        """Récupère toutes les fonctionnalités disponibles pour un utilisateur"""
        plan_name = self.get_user_plan(user_id)
        return self.PLAN_FEATURES.get(plan_name, [])
    
    def upgrade_plan(self, organization_id, new_plan_name, billing_cycle='monthly'):
        """Met à jour le plan d'abonnement d'une organisation"""
        # Vérifier si le plan existe
        plan = Plan.query.filter_by(name=new_plan_name, is_active=True).first()
        if not plan:
            raise ValueError(f"Plan d'abonnement invalide ou inactif: {new_plan_name}")
        
        # Vérifier si l'organisation existe
        organization = Organization.query.get(organization_id)
        if not organization:
            raise ValueError(f"Organisation introuvable: {organization_id}")
        
        # Mettre fin à l'abonnement actif
        current_subscription = self.get_organization_subscription(organization_id)
        if current_subscription:
            current_subscription.status = 'canceled'
            current_subscription.updated_at = datetime.utcnow()
        
        # Déterminer la durée de l'abonnement
        start_date = datetime.utcnow()
        if billing_cycle == 'yearly':
            end_date = start_date + timedelta(days=365)
            price = plan.price_yearly
        else:  # monthly
            end_date = start_date + timedelta(days=30)
            price = plan.price_monthly
        
        # Créer le nouvel abonnement
        new_subscription = Subscription(
            organization_id=organization_id,
            plan_id=plan.id,
            status='active',
            billing_cycle=billing_cycle,
            start_date=start_date,
            end_date=end_date
        )
        
        db.session.add(new_subscription)
        db.session.commit()
        
        return new_subscription
    
    def get_plan_limits(self, plan_name):
        """Récupère les limites associées à un plan d'abonnement"""
        limits = {
            'freemium': {
                'monthly_interviews': 5,
                'max_members': 1,
                'storage_duration_days': 30,
            },
            'starter': {
                'monthly_interviews': 20,
                'max_members': 3,
                'storage_duration_days': 30,
            },
            'pro': {
                'monthly_interviews': 100,
                'max_members': 10,
                'storage_duration_days': 365,
            },
            'enterprise': {
                'monthly_interviews': -1,  # illimité
                'max_members': -1,  # illimité
                'storage_duration_days': -1,  # illimité
            }
        }
        
        return limits.get(plan_name, limits['freemium'])
    
    def check_interview_limit(self, user_id):
        """Vérifie si l'utilisateur a atteint sa limite d'entretiens mensuelle"""
        from ..models.interview_scheduling import InterviewSchedule
        
        # Récupérer le plan et les limites
        plan_name = self.get_user_plan(user_id)
        limits = self.get_plan_limits(plan_name)
        
        monthly_limit = limits['monthly_interviews']
        if monthly_limit < 0:  # -1 signifie illimité
            return True
        
        # Calculer la date de début du mois courant
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        # Compter les entretiens du mois
        interview_count = InterviewSchedule.query.filter(
            InterviewSchedule.recruiter_id == user_id,
            InterviewSchedule.created_at >= start_of_month
        ).count()
        
        return interview_count < monthly_limit
    
    def check_member_limit(self, organization_id):
        """Vérifie si l'organisation a atteint sa limite de membres"""
        organization = Organization.query.get(organization_id)
        if not organization:
            return False
        
        # Récupérer l'abonnement de l'organisation
        org_subscription = self.get_organization_subscription(organization_id)
        if not org_subscription or not org_subscription.plan:
            plan_name = 'freemium'
        else:
            plan_name = org_subscription.plan.name
        
        limits = self.get_plan_limits(plan_name)
        max_members = limits['max_members']
        
        if max_members < 0:  # -1 signifie illimité
            return True
        
        current_members = OrganizationMember.query.filter_by(
            organization_id=organization_id
        ).count()
        
        # Inclure également les invitations en cours
        from ..models.invitation import Invitation
        invitations_count = Invitation.query.filter_by(
            organization_id=organization_id,
            status='pending'
        ).count()
        
        total_count = current_members + invitations_count
        
        return total_count < max_members