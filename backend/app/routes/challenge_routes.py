import uuid
from flask import Blueprint, g, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.routes.user import token_required
from app.schemas.challenge_schema import ChallengeSchema
from app.services.challenge_service import (
    create_challenge as create_challenge_service,
    get_all_challenges,
    get_challenge_by_id,
    update_challenge as update_challenge_service,
    delete_challenge as delete_challenge_service
)

challenge_bp = Blueprint('challenge', __name__, url_prefix='/api/challenges')

challenge_schema = ChallengeSchema()
challenges_schema = ChallengeSchema(many=True)

@challenge_bp.route('', methods=['POST'])
@token_required
def create_challenge():
    user_id = g.current_user.user_id
    data = request.get_json()
    errors = challenge_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    data["owner_id"] = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    
    challenge = create_challenge_service(data)
    return jsonify(challenge_schema.dump(challenge)), 201

@challenge_bp.route('', methods=['GET'])
def get_challenges():
    challenges = get_all_challenges()
    return jsonify(challenges_schema.dump(challenges)), 200

@challenge_bp.route('/<int:challenge_id>', methods=['GET'])
def get_challenge(challenge_id):
    challenge = get_challenge_by_id(challenge_id)
    return jsonify(challenge_schema.dump(challenge)), 200

@challenge_bp.route('/<int:challenge_id>', methods=['PUT'])
def update_challenge(challenge_id):
    data = request.get_json()
    challenge = update_challenge_service(challenge_id, data)
    return jsonify(challenge_schema.dump(challenge)), 200

@challenge_bp.route('/<int:challenge_id>', methods=['DELETE'])
def delete_challenge(challenge_id):
    delete_challenge_service(challenge_id)
    return jsonify({"message": "Challenge supprimé avec succès"}), 200
