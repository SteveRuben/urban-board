from app.middleware.challenge_participation_token_required import challenge_participation_token_required
from uuid import UUID
from flask import Blueprint, g, request, jsonify
from app.schemas.challenge.challenge_schema import ChallengeSchema, UserChallengeSchema
from app.routes.user import token_required
from app.services.challenge.user_challenge_service import (
    generate_participation_token_service,
    get_challenge_participate_step_service,
    get_users_challenge_service,
    delete_user_challenge_service,
    get_challenge_participate_service,
    submit_challenge_participate_step_service,
    abandoned_challenge_service
)

user_challenge_bp = Blueprint('user_challenge', __name__, url_prefix='/api/challenges')


user_challenge_schema = UserChallengeSchema()
challenges_schema = ChallengeSchema(many=True)

@user_challenge_bp.route('/<int:challenge_id>/get-participation-link', methods=['POST'])
@token_required
def generate_link(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user
    
    result = generate_participation_token_service(challenge_id, user_id)
    return jsonify({
        "message": "Lien généré avec succès",
        "data": result
    }), 201

@user_challenge_bp.route('/<int:challenge_id>/users', methods=['GET'])
@token_required
def list_challenge_participants(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    participants = get_users_challenge_service(challenge_id, user_id)
    return jsonify(participants), 200

@user_challenge_bp.route('/<int:challenge_id>/users/<int:user_challenge_id>', methods=['DELETE'])
@token_required
def delete_user_challenge(challenge_id, user_challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    deleted = delete_user_challenge_service(challenge_id, user_challenge_id, user_id)

    return jsonify({"message": "suppression d'utilisateur effectué avec succès."}), 200


# User Challenge participation

@user_challenge_bp.route('/participate/<uuid:token_id>', methods=['GET'])
@challenge_participation_token_required
def get_challenge_participate(token_id):
    participation = g.participation
    challenge_id = participation.challenge_id

    challenge = get_challenge_participate_service(challenge_id, token_id)
    return jsonify(user_challenge_schema.dump(challenge)), 200

@user_challenge_bp.route('/participate/<uuid:token_id>/<int:step_id>', methods=['GET'])
@challenge_participation_token_required
def get_challenge_participate_step(token_id, step_id):
    participation = g.participation
    challenge_id = participation.challenge_id

    step = get_challenge_participate_step_service(challenge_id, step_id, token_id)
    return jsonify(step), 200

@user_challenge_bp.route('/participate/<uuid:token_id>/submit', methods=['POST'])
@challenge_participation_token_required
def submit_participate_step(token_id):
    participation = g.participation
    challenge_id = participation.challenge_id

    data = request.get_json()

    submission = submit_challenge_participate_step_service(challenge_id, token_id, data)
    return jsonify(submission), 201

@user_challenge_bp.route('/participate/<uuid:token_id>/abandoned', methods=['PUT'])
@challenge_participation_token_required
def abandoned_challenge(token_id):
    participation = g.participation

    challenge = abandoned_challenge_service(participation)
    return jsonify(user_challenge_schema.dump(challenge)), 200

