# backend/services/payment_service.py
import stripe
from datetime import datetime, timedelta
from flask import current_app
from ..models.subscription import Subscription
from ..models.payment import Payment
from ..models.plan import Plan
from app import db

class PaymentService:
    def __init__(self, api_key=None):
        self.api_key = api_key or current_app.config['STRIPE_SECRET_KEY']
        stripe.api_key = self.api_key
    
    def create_customer(self, user):
        """Crée un customer Stripe pour un utilisateur"""
        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name} {user.last_name}",
            metadata={"user_id": user.id}
        )
        
        # Sauvegarder l'ID customer dans le modèle utilisateur
        user.stripe_customer_id = customer.id
        db.session.commit()
        
        return customer
    
    def get_or_create_customer(self, user):
        """Récupère le customer Stripe ou en crée un nouveau"""
        if not user.stripe_customer_id:
            return self.create_customer(user)
        
        try:
            return stripe.Customer.retrieve(user.stripe_customer_id)
        except stripe.error.InvalidRequestError:
            return self.create_customer(user)
    
    def create_subscription(self, user, plan_id, billing_cycle='monthly'):
        """Crée un abonnement Stripe pour un utilisateur"""
        # Récupérer le plan
        plan = Plan.query.get(plan_id)
        if not plan:
            raise ValueError("Plan non trouvé")
        
        # Déterminer le prix
        price_amount = plan.price_monthly if billing_cycle == 'monthly' else plan.price_yearly
        
        # Récupérer ou créer le customer
        customer = self.get_or_create_customer(user)
        
        # Créer un produit si nécessaire (peut être fait en amont dans Stripe Dashboard)
        product_id = f"plan_{plan.id}"
        try:
            product = stripe.Product.retrieve(product_id)
        except stripe.error.InvalidRequestError:
            product = stripe.Product.create(
                id=product_id,
                name=plan.name,
                description=plan.description
            )
        
        # Créer un price
        price_id = f"{product_id}_{billing_cycle}"
        try:
            price = stripe.Price.retrieve(price_id)
        except stripe.error.InvalidRequestError:
            price = stripe.Price.create(
                id=price_id,
                product=product.id,
                unit_amount=int(price_amount * 100),  # En centimes
                currency='eur',
                recurring={
                    "interval": "month" if billing_cycle == 'monthly' else "year"
                }
            )
        
        # Créer l'abonnement Stripe
        stripe_subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[
                {"price": price.id},
            ],
            metadata={
                "user_id": user.id,
                "plan_id": plan.id,
                "billing_cycle": billing_cycle
            }
        )
        
        # Calculer la date de fin
        if billing_cycle == 'monthly':
            end_date = datetime.utcnow() + timedelta(days=30)
        else:
            end_date = datetime.utcnow() + timedelta(days=365)
        
        # Créer l'abonnement dans notre base de données
        subscription = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            status='active',
            billing_cycle=billing_cycle,
            external_subscription_id=stripe_subscription.id,
            end_date=end_date
        )
        
        db.session.add(subscription)
        db.session.commit()
        
        return subscription, stripe_subscription
    
    def cancel_subscription(self, subscription_id):
        """Annule un abonnement"""
        subscription = Subscription.query.get(subscription_id)
        if not subscription:
            raise ValueError("Abonnement non trouvé")
        
        try:
            stripe_subscription = stripe.Subscription.retrieve(subscription.external_subscription_id)
            stripe.Subscription.modify(
                stripe_subscription.id,
                cancel_at_period_end=True
            )
            
            subscription.status = 'canceled'
            db.session.commit()
            
            return subscription
        except stripe.error.StripeError as e:
            current_app.logger.error(f"Erreur Stripe: {str(e)}")
            raise e
    
    def process_webhook_event(self, payload, sig_header):
        """Traite les événements webhook de Stripe"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, current_app.config['STRIPE_WEBHOOK_SECRET']
            )
        except ValueError as e:
            return {"error": "Invalid payload"}
        except stripe.error.SignatureVerificationError as e:
            return {"error": "Invalid signature"}
        
        # Traiter différents types d'événements
        if event['type'] == 'invoice.payment_succeeded':
            return self._handle_payment_succeeded(event)
        elif event['type'] == 'customer.subscription.deleted':
            return self._handle_subscription_canceled(event)
        
        return {"status": "Received unknown event type"}
    
    def _handle_payment_succeeded(self, event):
        """Gère un paiement réussi"""
        invoice = event['data']['object']
        subscription_id = invoice.get('subscription')
        
        if not subscription_id:
            return {"status": "Not a subscription invoice"}
        
        # Trouver l'abonnement dans notre base
        subscription = Subscription.query.filter_by(
            external_subscription_id=subscription_id
        ).first()
        
        if not subscription:
            return {"error": "Subscription not found"}
        
        # Créer un paiement
        payment = Payment(
            user_id=subscription.user_id,
            subscription_id=subscription.id,
            amount=invoice.get('amount_paid') / 100,  # Convertir de centimes
            currency=invoice.get('currency', 'eur').upper(),
            payment_method='stripe',
            payment_status='completed',
            external_payment_id=invoice.get('id'),
            invoice_url=invoice.get('hosted_invoice_url')
        )
        
        db.session.add(payment)
        
        # Mettre à jour la date de fin de l'abonnement
        if subscription.billing_cycle == 'monthly':
            subscription.end_date = datetime.utcnow() + timedelta(days=30)
        else:
            subscription.end_date = datetime.utcnow() + timedelta(days=365)
        
        db.session.commit()
        
        return {"status": "Payment recorded successfully"}
    
    def _handle_subscription_canceled(self, event):
        """Gère un abonnement annulé"""
        stripe_subscription = event['data']['object']
        subscription_id = stripe_subscription.get('id')
        
        subscription = Subscription.query.filter_by(
            external_subscription_id=subscription_id
        ).first()
        
        if not subscription:
            return {"error": "Subscription not found"}
        
        subscription.status = 'expired'
        db.session.commit()
        
        return {"status": "Subscription marked as expired"}