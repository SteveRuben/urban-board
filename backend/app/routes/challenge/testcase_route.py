from flask import Blueprint, g, jsonify, request
from uuid import UUID
from app.schemas.challenge.challenge_schema import ChallengeTestCaseSchema
from app.services.challenge.testcase_service import add_testcase_to_step_service, delete_testcase_service, get_testcase_service, get_testcases_for_step_service, update_testcase_service
from app.routes.user import token_required


challenge_testcase_bp = Blueprint('challenge_testcase', __name__, url_prefix='/api/challenges')


@challenge_testcase_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>/testcases', methods=['POST'])
@token_required
def add_testcase_to_step(challenge_id, step_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    data = request.get_json()
    testcase = add_testcase_to_step_service(challenge_id, step_id, user_id, data)

    # Sérialisation avec Marshmallow
    challenge_testcase_schema = ChallengeTestCaseSchema(many=False)
    return jsonify(challenge_testcase_schema.dump(testcase)), 200

@challenge_testcase_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>/testcases', methods=['GET'])
@token_required
def get_testcases(challenge_id, step_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    testcases = get_testcases_for_step_service(challenge_id, step_id, user_id)

    # Sérialisation avec Marshmallow
    challenge_testcase_schema = ChallengeTestCaseSchema(many=True)
    return jsonify(challenge_testcase_schema.dump(testcases)), 200

@challenge_testcase_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>/testcases/<int:testcase_id>', methods=['GET'])
@token_required
def get_testcase(challenge_id, step_id, testcase_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    testcase = get_testcase_service(challenge_id, step_id, user_id, testcase_id)

    # Sérialisation avec Marshmallow
    challenge_testcase_schema = ChallengeTestCaseSchema(many=False)
    return jsonify(challenge_testcase_schema.dump(testcase)), 200

@challenge_testcase_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>/testcases/<int:testcase_id>', methods=['PUT'])
@token_required
def update_testcase(challenge_id, step_id, testcase_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user
    data = request.get_json()

    testcase = update_testcase_service(challenge_id, step_id, user_id, testcase_id, data)

    # Sérialisation avec Marshmallow
    challenge_testcase_schema = ChallengeTestCaseSchema(many=False)
    return jsonify(challenge_testcase_schema.dump(testcase)), 200

@challenge_testcase_bp.route('/<int:challenge_id>/challenge-steps/<int:step_id>/testcases/<int:testcase_id>', methods=['DELETE'])
@token_required
def delete_testcase(challenge_id, step_id, testcase_id):
    user = g.current_user.user_id
    user_id = UUID(user) if isinstance(user, str) else user

    testcase_removed = delete_testcase_service(challenge_id, step_id, user_id, testcase_id)

    # Sérialisation avec Marshmallow
    challenge_testcase_schema = ChallengeTestCaseSchema(many=False)
    return jsonify(challenge_testcase_schema.dump(testcase_removed)), 200
