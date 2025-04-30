from sqlalchemy.exc import NoResultFound
from flask import abort
from app import db
from app.models.challenge import Challenge, UserChallenge
from app.types.challenge import ChallengeStatus

def join_challenge_service(user_id, challenge_id):
    # Vérifier si l'utilisateur participe déjà
    existing_participation = UserChallenge.query.filter_by(user_id=user_id, challenge_id=challenge_id).first()
    if existing_participation:
        abort(400, description="Vous participez déjà à ce challenge.")

    # Vérifier que le challenge existe et est publié
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        abort(404, description="Challenge introuvable.")

    if challenge.status != ChallengeStatus.published:
        abort(403, description="Ce challenge n'est pas disponible pour participation.")

    # Sinon on crée la participation
    newParticipation = UserChallenge(
        user_id=user_id,
        challenge_id=challenge_id
    )

    db.session.add(newParticipation)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de l'adhesion au challenge' :", e)
        raise e

    return newParticipation


def update_user_challenge_service(user_challenge_id, updates: dict):
    participation = UserChallenge.query.get(user_challenge_id)
    if not participation:
        abort(404, description="Participation non trouvée.")

    # Seuls ces champs peuvent être mis à jour
    updatable_fields = {'status', 'current_step', 'attempts'}

    for key, value in updates.items():
        if key in updatable_fields:
            setattr(participation, key, value)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la mise à jour de la participation :", e)
        raise e

    return participation
