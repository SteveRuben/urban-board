from uuid import UUID
from flask import Blueprint, abort, g, request, jsonify
from app.models.challenge import Challenge
from app.routes.user import token_required
from app.schemas.challenge.challenge_schema import ChallengeSchema, ChallengeStepSchema
from app.services.challenge.challenge_service import (
    archive_challenge_service,
    create_challenge_service,
    delete_challenge_step_service,
    get_all_challenges_service,
    get_challenge_service,
    get_challenge_step_by_id_service,
    get_challenge_step_service,
    publish_challenge_service,
    update_challenge_service,
    delete_challenge_service,
    create_challenge_step_service,
    update_challenge_step_service
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







# Challenge step


@challenge_bp.route('/<int:challenge_id>/challenge-steps', methods=['POST'])
@token_required
def create_challenge_step(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    data = request.get_json()

    step = create_challenge_step_service(challenge_id, user_id, data)


    # Sérialisation avec Marshmallow
    challenge_step_schema = ChallengeStepSchema(many=False)
    return jsonify(challenge_step_schema.dump(step)), 200

@challenge_bp.route('/<int:challenge_id>/challenge-steps', methods=['GET'])
@token_required
def get_challenge_steps(challenge_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    steps = get_challenge_step_service(challenge_id, user_id)

    # Sérialisation avec Marshmallow
    challenge_step_schema = ChallengeStepSchema(many=True)
    return jsonify(challenge_step_schema.dump(steps)), 200

@challenge_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>', methods=['GET'])
@token_required
def get_challenge_step_by_id(challenge_id, step_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    step = get_challenge_step_by_id_service(challenge_id, step_id, user_id)

    challenge_step_schema = ChallengeStepSchema()
    return jsonify(challenge_step_schema.dump(step)), 200

@challenge_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>', methods=['PUT'])
@token_required
def update_challenge_step(challenge_id, step_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    data = request.get_json()

    # Appel à un service pour mettre à jour le challenge step
    step = update_challenge_step_service(challenge_id, step_id, user_id, data)

    # Sérialisation avec Marshmallow
    challenge_step_schema = ChallengeStepSchema(many=False)
    return jsonify(challenge_step_schema.dump(step)), 200

@challenge_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>', methods=['DELETE'])
@token_required
def delete_challenge_step(challenge_id, step_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    # Appel à un service pour supprimer le challenge step
    delete_challenge_step_service(challenge_id, step_id, user_id)

    return jsonify({"message": "ChallengeStep deleted successfully"}), 200

