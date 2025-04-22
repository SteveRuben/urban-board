# routes/challenge_routes.py
from flask import Blueprint, request, jsonify
from app.models.challenge import Challenge
from app.schemas.challenge_schema import ChallengeSchema
from app import db
from app.services.challenge_service import create_challenge as create_challenge_service
from flask import jsonify

challenge_bp = Blueprint('challenge', __name__, url_prefix='/api/challenges')

challenge_schema = ChallengeSchema()
challenges_schema = ChallengeSchema(many=True)

# Create a challenge
@challenge_bp.route('', methods=['POST'])
def create_challenge():
    data = request.get_json()
    errors = challenge_schema.validate(data)
    if errors:
        return jsonify(errors), 400

    challenge = create_challenge_service(data)
    return jsonify(challenge_schema.dump(challenge)), 201

# List all challenges
@challenge_bp.route('', methods=['GET'])
def get_challenges():
    challenges = Challenge.query.all()
    return challenges_schema.jsonify(challenges)

# Get a challenge by ID
@challenge_bp.route('<int:challenge_id>', methods=['GET'])
def get_challenge(challenge_id):
    challenge = Challenge.query.get_or_404(challenge_id)
    return challenge_schema.jsonify(challenge)

# Update a challenge
@challenge_bp.route('<int:challenge_id>', methods=['PUT'])
def update_challenge(challenge_id):
    challenge = Challenge.query.get_or_404(challenge_id)
    data = request.json
    for key, value in data.items():
        setattr(challenge, key, value)
    db.session.commit()
    return challenge_schema.jsonify(challenge)

# Delete a challenge
@challenge_bp.route('<int:challenge_id>', methods=['DELETE'])
def delete_challenge(challenge_id):
    challenge = Challenge.query.get_or_404(challenge_id)
    db.session.delete(challenge)
    db.session.commit()
    return jsonify({"message": "Challenge supprimé avec succès"}), 200
