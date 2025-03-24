# backend/routes/admin_routes.py
from flask import Blueprint, request, jsonify
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..models.plan import Plan, PlanFeature
from app import db

admin_bp = Blueprint('admin', __name__)

# Middleware pour vérifier les droits admin
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({
                'status': 'error',
                'message': 'Action non autorisée'
            }), 403
        
        return fn(*args, **kwargs)
    
    return wrapper

@admin_bp.route('/plans', methods=['POST'])
@admin_required
def create_plan():
    """Crée un nouveau plan tarifaire"""
    data = request.get_json()
    
    # Valider les données requises
    required_fields = ['name', 'price_monthly', 'price_yearly']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'status': 'error',
                'message': f'Le champ {field} est requis'
            }), 400
    
    # Vérifier si un plan avec ce nom existe déjà
    existing_plan = Plan.query.filter_by(name=data['name']).first()
    if existing_plan:
        return jsonify({
            'status': 'error',
            'message': 'Un plan avec ce nom existe déjà'
        }), 400
    
    # Créer le plan
    plan = Plan(
        name=data['name'],
        description=data.get('description', ''),
        price_monthly=data['price_monthly'],
        price_yearly=data['price_yearly'],
        is_active=data.get('is_active', True)
    )
    
    db.session.add(plan)
    db.session.flush()  # Pour obtenir l'ID du plan
    
    # Ajouter les fonctionnalités du plan
    if 'features' in data and isinstance(data['features'], list):
        for feature_data in data['features']:
            feature = PlanFeature(
                plan_id=plan.id,
                feature=feature_data.get('feature', ''),
                included=feature_data.get('included', True)
            )
            db.session.add(feature)
    
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'Plan créé avec succès',
        'data': plan.to_dict()
    }), 201

@admin_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@admin_required
def update_plan(plan_id):
    """Met à jour un plan tarifaire"""
    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({
            'status': 'error',
            'message': 'Plan non trouvé'
        }), 404
    
    data = request.get_json()
    
    # Mettre à jour les champs du plan
    if 'name' in data:
        # Vérifier si le nouveau nom est déjà utilisé par un autre plan
        existing_plan = Plan.query.filter(Plan.name == data['name'], Plan.id != plan_id).first()
        if existing_plan:
            return jsonify({
                'status': 'error',
                'message': 'Un autre plan avec ce nom existe déjà'
            }), 400
        plan.name = data['name']
    
    if 'description' in data:
        plan.description = data['description']
    
    if 'price_monthly' in data:
        plan.price_monthly = data['price_monthly']
    
    if 'price_yearly' in data:
        plan.price_yearly = data['price_yearly']
    
    if 'is_active' in data:
        plan.is_active = data['is_active']
    
    # Mettre à jour les fonctionnalités
    if 'features' in data and isinstance(data['features'], list):
        # Supprimer les anciennes fonctionnalités
        PlanFeature.query.filter_by(plan_id=plan.id).delete()
        
        # Ajouter les nouvelles fonctionnalités
        for feature_data in data['features']:
            feature = PlanFeature(
                plan_id=plan.id,
                feature=feature_data.get('feature', ''),
                included=feature_data.get('included', True)
            )
            db.session.add(feature)
    
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'Plan mis à jour avec succès',
        'data': plan.to_dict()
    }), 200

@admin_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@admin_required
def delete_plan(plan_id):
    """Supprime un plan tarifaire"""
    plan = Plan.query.get(plan_id)
    if not plan:
        return jsonify({
            'status': 'error',
            'message': 'Plan non trouvé'
        }), 404
    
    # Vérifier si des abonnements utilisent ce plan
    subscriptions_count = plan.subscriptions.count()
    if subscriptions_count > 0:
        # Au lieu de supprimer, désactiver le plan
        plan.is_active = False
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'Plan désactivé car {subscriptions_count} abonnements y sont liés',
            'data': plan.to_dict()
        }), 200
    else:
        # Supprimer le plan et ses fonctionnalités
        db.session.delete(plan)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Plan supprimé avec succès'
        }), 200