from uuid import UUID
from flask import Blueprint, abort, g, request, jsonify
from app.models.challenge import Challenge, UserChallenge
from app.services.challenge.user_challenge_service import join_challenge_service, update_user_challenge_service
from app.routes.user import token_required

user_challenge_bp = Blueprint('user_challenge', __name__)

@user_challenge_bp.route('/<int:user_challenge_id>/join', methods=['POST'])
@token_required
def join_challenge(challenge_id):
    user = g.current_user.user_id  # on récupère l'utilisateur connecté grâce au token
    user_id = UUID(user) if isinstance(user, str) else user

    # Vérification 1 : Est-ce que l'ID du challenge est fourni et valide ?
    if not challenge_id:
        abort(400, description="L'ID du challenge est requis.")

    # Vérification 2 : Est-ce que le challenge existe ?
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        abort(404, description="Challenge introuvable.")

    # Vérification 3 : Est-ce que l'utilisateur est le propriétaire du challenge ?
    if challenge.owner_id == user_id:
        abort(403, description="Vous ne pouvez pas rejoindre votre propre challenge.")

    # # Tout est bon, l'utilisateur peut rejoindre
    # data = request.get_json()
    # if not data:
    #     abort(400, description="Données JSON requises.")

    # # 👇 Validation automatique basée sur ton modèle
    # validation(UserChallenge)

    participation = join_challenge_service(user_id, challenge_id)

    return jsonify({"message": "Participation réussie.", "participation": participation}), 201



@user_challenge_bp.route('/user_challenges/<int:user_challenge_id>', methods=['PATCH'])
@token_required
def update_user_challenge(user_challenge_id):
    updates = request.json
    participation = update_user_challenge_service(user_challenge_id, updates)
    return jsonify({"message": "Mise à jour réussie.", "participation_id": participation.id})
