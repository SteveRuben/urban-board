# backend/routes/biometric_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.biometric_service import BiometricService
from ..models.interview import Interview
from ..services.subscription_service import SubscriptionService
from app import db

biometric_bp = Blueprint('biometric', __name__)
biometric_service = BiometricService()
subscription_service = SubscriptionService()

@biometric_bp.route('/interviews/<int:interview_id>/facial-analysis', methods=['POST'])
@jwt_required()
def save_facial_analysis(interview_id):
    """Enregistre une analyse faciale"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier que l'utilisateur a accès à l'entretien
    interview = Interview.query.get(interview_id)
    if not interview or interview.recruiter_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Entretien non trouvé ou accès non autorisé'
        }), 404
    
    # Vérifier que l'utilisateur a un abonnement qui inclut l'analyse biométrique
    if not subscription_service.has_feature(user_id, 'biometric_analysis'):
        return jsonify({
            'status': 'error',
            'message': 'Cette fonctionnalité n\'est pas incluse dans votre abonnement'
        }), 403
    
    if not data or 'timestamp' not in data or 'emotions' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Les données d\'analyse faciale sont incomplètes'
        }), 400
    
    try:
        analysis = biometric_service.save_facial_analysis(
            interview_id, 
            data['timestamp'], 
            data['emotions']
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Analyse faciale enregistrée avec succès',
            'data': analysis.to_dict()
        }), 201
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur s\'est produite: {str(e)}'
        }), 500

@biometric_bp.route('/interviews/<int:interview_id>/facial-analysis/batch', methods=['POST'])
@jwt_required()
def batch_save_facial_analyses(interview_id):
    """Enregistre un lot d'analyses faciales"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Vérifier que l'utilisateur a accès à l'entretien
    interview = Interview.query.get(interview_id)
    if not interview or interview.recruiter_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Entretien non trouvé ou accès non autorisé'
        }), 404
    
    # Vérifier que l'utilisateur a un abonnement qui inclut l'analyse biométrique
    if not subscription_service.has_feature(user_id, 'biometric_analysis'):
        return jsonify({
            'status': 'error',
            'message': 'Cette fonctionnalité n\'est pas incluse dans votre abonnement'
        }), 403
    
    if not data or not isinstance(data, list) or len(data) == 0:
        return jsonify({
            'status': 'error',
            'message': 'Les données d\'analyse faciale sont incomplètes ou mal formatées'
        }), 400
    
    try:
        count = biometric_service.batch_save_facial_analyses(interview_id, data)
        
        return jsonify({
            'status': 'success',
            'message': f'{count} analyses faciales enregistrées avec succès'
        }), 201
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur s\'est produite: {str(e)}'
        }), 500

@biometric_bp.route('/interviews/<int:interview_id>/biometric-summary', methods=['GET'])
@jwt_required()
def get_biometric_summary(interview_id):
    """Récupère le résumé biométrique d'un entretien"""
    user_id = get_jwt_identity()
    
    # Vérifier que l'utilisateur a accès à l'entretien
    interview = Interview.query.get(interview_id)
    if not interview:
        return jsonify({
            'status': 'error',
            'message': 'Entretien non trouvé'
        }), 404
    
    # Vérifier l'accès
    if interview.recruiter_id != user_id:
        # Vérifier si l'entretien a été partagé avec l'utilisateur
        from models.collaboration import InterviewShare
        share = InterviewShare.query.filter_by(
            interview_id=interview_id,
            shared_with_id=user_id
        ).first()
        
        if not share:
            return jsonify({
                'status': 'error',
                'message': 'Accès non autorisé'
            }), 403
    
    # Vérifier que l'utilisateur a un abonnement qui inclut l'analyse biométrique
    if not subscription_service.has_feature(user_id, 'biometric_analysis'):
        return jsonify({
            'status': 'error',
            'message': 'Cette fonctionnalité n\'est pas incluse dans votre abonnement'
        }), 403
    
    try:
        summary = biometric_service.get_summary(interview_id)
        
        return jsonify({
            'status': 'success',
            'data': summary.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur s\'est produite: {str(e)}'
        }), 500

@biometric_bp.route('/interviews/<int:interview_id>/biometric-summary/generate', methods=['POST'])
@jwt_required()
def generate_biometric_summary(interview_id):
    """Génère ou régénère le résumé biométrique d'un entretien"""
    user_id = get_jwt_identity()
    
    # Vérifier que l'utilisateur a accès à l'entretien
    interview = Interview.query.get(interview_id)
    if not interview or interview.recruiter_id != user_id:
        return jsonify({
            'status': 'error',
            'message': 'Entretien non trouvé ou accès non autorisé'
        }), 404
    
    # Vérifier que l'utilisateur a un abonnement qui inclut l'analyse biométrique
    if not subscription_service.has_feature(user_id, 'biometric_analysis'):
        return jsonify({
            'status': 'error',
            'message': 'Cette fonctionnalité n\'est pas incluse dans votre abonnement'
        }), 403
    
    try:
        summary = biometric_service.generate_summary(interview_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Résumé biométrique généré avec succès',
            'data': summary.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Une erreur s\'est produite: {str(e)}'
        }), 500