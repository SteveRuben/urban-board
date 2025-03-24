# backend/routes/subscription_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..models.plan import Plan, PlanFeature
from ..models.subscription import Subscription
from ..services.payment_service import PaymentService
from app import db
import stripe

subscription_bp = Blueprint('subscription', __name__)
payment_service = PaymentService()

@subscription_bp.route('/plans', methods=['GET'])
def get_plans():
    """Récupère tous les plans actifs"""
    plans = Plan.query.filter_by(is_active=True).all()
    return jsonify({
        'status': 'success',
        'data': [plan.to_dict() for plan in plans]
    }), 200

@subscription_bp.route('/plans/<int:plan_id>', methods=['GET'])
def get_plan(plan_id):
    """Récupère un plan spécifique"""
    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({
            'status': 'error',
            'message': 'Plan non trouvé'
        }), 404
        
    return jsonify({
        'status': 'success',
        'data': plan.to_dict()
    }), 200

@subscription_bp.route('/subscriptions', methods=['POST'])
@jwt_required()
def create_subscription():
    """Crée un nouvel abonnement pour l'utilisateur"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({
            'status': 'error',
            'message': 'Utilisateur non trouvé'
        }), 404
    
    data = request.get_json()
    plan_id = data.get('plan_id')
    billing_cycle = data.get('billing_cycle', 'monthly')
    
    # Vérifier si l'utilisateur a déjà un abonnement actif
    existing_sub = Subscription.query.filter_by(
        user_id=user_id, 
        status='active'
    ).first()
    
    if existing_sub:
        return jsonify({
            'status': 'error',
            'message': 'Vous avez déjà un abonnement actif'
        }), 400
    
    try:
        subscription, stripe_subscription = payment_service.create_subscription(
            user, plan_id, billing_cycle
        )
        
        # Créer un payment intent pour le checkout
        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': stripe_subscription['items']['data'][0]['price']['id'],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=request.host_url + 'payment/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url + 'payment/cancel',
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'subscription': subscription.to_dict(),
                'checkout_url': checkout_session.url
            }
        }), 201
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except stripe.error.StripeError as e:
        return jsonify({
            'status': 'error',
            'message': f"Erreur Stripe: {str(e)}"
        }), 400

@subscription_bp.route('/subscriptions/current', methods=['GET'])
@jwt_required()
def get_current_subscription():
    """Récupère l'abonnement actif de l'utilisateur"""
    user_id = get_jwt_identity()
    
    subscription = Subscription.query.filter_by(
        user_id=user_id, 
        status='active'
    ).first()
    
    if not subscription:
        return jsonify({
            'status': 'error',
            'message': 'Aucun abonnement actif trouvé'
        }), 404
    
    return jsonify({
        'status': 'success',
        'data': subscription.to_dict()
    }), 200

@subscription_bp.route('/subscriptions/<int:subscription_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription(subscription_id):
    """Annule un abonnement"""
    user_id = get_jwt_identity()
    
    subscription = Subscription.query.filter_by(
        id=subscription_id,
        user_id=user_id
    ).first()
    
    if not subscription:
        return jsonify({
            'status': 'error',
            'message': 'Abonnement non trouvé'
        }), 404
    
    try:
        updated_subscription = payment_service.cancel_subscription(subscription.id)
        
        return jsonify({
            'status': 'success',
            'message': 'Abonnement annulé avec succès',
            'data': updated_subscription.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400

@subscription_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Webhook pour recevoir les événements Stripe"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        result = payment_service.process_webhook_event(payload, sig_header)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400