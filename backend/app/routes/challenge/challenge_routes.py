from uuid import UUID
from flask import Blueprint, abort, g, request, jsonify
from app.middleware.challenge_participation_token_required import challenge_participation_token_required
from app.models.challenge import Challenge
from app.routes.user import token_required
from app.schemas.challenge.challenge_schema import ChallengeSchema
from app.services.challenge.challenge_service import (
    abandoned_challenge_service,
    archive_challenge_service,
    create_challenge_service,
    generate_participation_token_service,
    get_all_challenges_service,
    get_challenge_participate_service,
    get_challenge_service,
    publish_challenge_service,
    update_challenge_service,
    delete_challenge_service,
    get_users_challenge_service,
    delete_user_challenge_service
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

    data["owner_id"] = UUID(user_id) if isinstance(user_id, str) else user_id
    
    challenge = create_challenge_service(data)
    return jsonify(challenge_schema.dump(challenge)), 201

@challenge_bp.route('', methods=['GET'])
@token_required
def get_challenges():
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    challenges = get_all_challenges_service(user_id)
    return jsonify(challenges_schema.dump(challenges)), 200

@challenge_bp.route('/<int:challenge_id>', methods=['GET'])
@token_required
def get_challenge(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    challenge = get_challenge_service(challenge_id, user_id)
    return jsonify(challenge_schema.dump(challenge)), 200

@challenge_bp.route('/<int:challenge_id>', methods=['PUT'])
@token_required
def update_challenge(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user
    
    data = request.get_json()
    challenge = update_challenge_service(challenge_id, user_id, data)
    return jsonify(challenge_schema.dump(challenge)), 200

@challenge_bp.route('/<int:challenge_id>', methods=['DELETE'])
@token_required
def delete_challenge(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user
    
    result = delete_challenge_service(challenge_id, user_id)
    return jsonify({"success": result}), 200

@challenge_bp.route('/<int:challenge_id>/publish', methods=['PUT'])
@token_required
def publish_challenge(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user
    
    challenge = publish_challenge_service(challenge_id, user_id)
    return jsonify(challenge_schema.dump(challenge)), 200

@challenge_bp.route('/<int:challenge_id>/archive', methods=['PUT'])
@token_required
def archive_challenge(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    challenge = archive_challenge_service(challenge_id, user_id)
    return jsonify(challenge_schema.dump(challenge)), 200


# User Challenge management

@challenge_bp.route('/<int:challenge_id>/get-participation-link', methods=['POST'])
@token_required
def generate_link(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    result = generate_participation_token_service(challenge_id, user_id)
    return jsonify({
        "message": "Lien généré avec succès",
        "data": result
    }), 201

@challenge_bp.route('/<int:challenge_id>/users', methods=['GET'])
@token_required
def list_challenge_participants(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    participants = get_users_challenge_service(challenge_id, user_id)
    return jsonify(participants), 200

@challenge_bp.route('/<int:challenge_id>/users/<int:user_challenge_id>', methods=['DELETE'])
@token_required
def delete_user_challenge(challenge_id, user_challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    deleted = delete_user_challenge_service(challenge_id, user_challenge_id, user_id)

    return jsonify({"message": "suppression d'utilisateur effectué avec succès."}), 200


# User Challenge participation

@challenge_bp.route('/participate/<uuid:token_id>', methods=['GET'])
@challenge_participation_token_required
def get_challenge_participate(token_id):
    participation = g.participation
    challenge_id = participation.challenge_id

    challenge = get_challenge_participate_service(challenge_id)
    return jsonify(challenge_schema.dump(challenge)), 200

@challenge_bp.route('/participate/<uuid:token_id>/abandoned', methods=['PUT'])
@challenge_participation_token_required
def abandoned_challenge(token_id):
    participation = g.participation

    challenge = abandoned_challenge_service(participation)
    return jsonify(challenge_schema.dump(challenge)), 200





