from uuid import UUID
from flask import g, request, jsonify, abort
from app.models.job_posting import JobPosting, JobApplication
from app.routes.user import token_required
from app.services.job_posting_service import JobPostingService
from . import job_postings_bp


job_posting_service = JobPostingService()

@job_postings_bp.route('', methods=['POST'])
@token_required
def create_job_posting():
    """Crée une nouvelle offre d'emploi"""
    user_id = g.current_user.user_id
    data = request.get_json()
    
    # Validation basique des champs obligatoires
    required_fields = ['title', 'description']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"Le champ '{field}' est obligatoire"}), 400
    
    organization_id = g.current_user.organization_id
    
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id
    
    job_posting = job_posting_service.create_job_posting(organization_id, user_id, data)
    return jsonify(job_posting.to_dict()), 201

@job_postings_bp.route('', methods=['GET'])
@token_required
def get_job_postings():
    """Récupère la liste des offres d'emploi avec filtrage et pagination"""
    user_id = g.current_user.user_id
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id
    
    # Paramètres de filtrage et pagination
    organization_id = request.args.get('organization_id')
    status = request.args.get('status')
    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    
    job_postings, total = job_posting_service.get_job_postings(
        organization_id=organization_id,
        status=status,
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    
    result = {
        'data': [job.to_dict() for job in job_postings],
        'pagination': {
            'total': total,
            'limit': limit,
            'offset': offset
        }
    }
    
    return jsonify(result), 200

@job_postings_bp.route('/<job_id>', methods=['GET'])
@token_required
def get_job_posting(job_id):
    """Récupère les détails d'une offre d'emploi spécifique"""
    user_id = g.current_user.user_id
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id
    
    job_posting = job_posting_service.get_job_posting(job_id, user_id)
    return jsonify(job_posting.to_dict()), 200

@job_postings_bp.route('/<job_id>', methods=['PUT'])
@token_required
def update_job_posting(job_id):
    """Met à jour une offre d'emploi existante"""
    user_id = g.current_user.user_id
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id
    
    data = request.get_json()
    
    if 'status' in data and len(data) == 1:
        job_posting = job_posting_service.update_job_status(job_id, data['status'], user_id)
    else:
        return jsonify({"error": "Update functionality not yet implemented"}), 501
    
    return jsonify(job_posting.to_dict()), 200

@job_postings_bp.route('/<job_id>', methods=['DELETE'])
@token_required
def delete_job_posting(job_id):
    """Supprime une offre d'emploi"""
    user_id = g.current_user.user_id
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id
    
    result = job_posting_service.delete_job_posting(job_id, user_id)
    return jsonify({"success": result}), 200

@job_postings_bp.route('/<job_id>/publish', methods=['PUT'])
@token_required
def publish_job_posting(job_id):
    """Publie une offre d'emploi (change son statut de 'draft' à 'published')"""
    user_id = g.current_user.user_id
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id
    
    job_posting = job_posting_service.publish_job_posting(job_id, user_id)
    return jsonify(job_posting.to_dict()), 200

@job_postings_bp.route('/<job_id>/close', methods=['PUT'])
@token_required
def close_job_posting(job_id):
    """Ferme une offre d'emploi (change son statut à 'closed')"""
    user_id = g.current_user.user_id
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id
    
    job_posting = job_posting_service.close_job_posting(job_id, user_id)
    return jsonify(job_posting.to_dict()), 200