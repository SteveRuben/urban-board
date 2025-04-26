from app import db
from app.models.challenge import Challenge
from flask import abort
from sqlalchemy.exc import NoResultFound

from app.types.challenge import ChallengeStatus

def create_challenge(data):
    challenge = Challenge(**data)
    db.session.add(challenge)
    db.session.commit()
    return challenge

def get_all_challenges(user_id):
    return Challenge.query.filter_by(owner_id=user_id).all()

def get_challenge_by_id(challenge_id, user_id):
    try:
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).one()
        return challenge
    except NoResultFound:
        abort(404, description="Challenge non trouvé ou non autorisé")

def update_challenge(challenge_id, user_id, data):
    try:
        # On s'assure que le challenge appartient à l'utilisateur
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).one()
    except NoResultFound:
        abort(403, description="Action interdite : ce challenge ne vous appartient pas.")

     # Liste des champs autorisés à être modifiés
    updatable_fields = {'title', 'description'}

    for key, value in data.items():
        if key in updatable_fields:
            setattr(challenge, key, value)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la mise à jour :", e)
        raise e

    return challenge

def update_challenge(challenge_id, user_id, data):
    try:
        # On s'assure que le challenge appartient à l'utilisateur
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).one()
    except NoResultFound:
        abort(403, description="Action interdite : ce challenge ne vous appartient pas.")

     # Liste des champs autorisés à être modifiés
    updatable_fields = {'title', 'description'}

    for key, value in data.items():
        if key in updatable_fields:
            setattr(challenge, key, value)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la mise à jour :", e)
        raise e

    return challenge

def delete_challenge(challenge_id, user_id):
    # On récupère le challenge avec filtre sur l'owner
    challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
    
    if not challenge:
        abort(403, description="Vous n'êtes pas autorisé à supprimer ce challenge")

    db.session.delete(challenge)
    db.session.commit()
    return True

def publish_challenge_service(challenge_id, user_id):
    try:
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).one()
    except NoResultFound:
        abort(403, description="Action interdite : ce challenge ne vous appartient pas.")

    if challenge.status == ChallengeStatus.published:
        abort(400, description="Ce challenge est déjà publié.")

    challenge.status = ChallengeStatus.published

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la publication du challenge :", e)
        raise e

    return challenge

def archive_challenge_service(challenge_id, user_id):
    try:
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).one()
    except NoResultFound:
        abort(403, description="Action interdite : ce challenge ne vous appartient pas.")

    if challenge.status != ChallengeStatus.published:
        abort(400, description="Seuls les challenges publiés peuvent être archivés.")

    challenge.status = ChallengeStatus.archived

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de l'archivage :", e)
        raise e

    return challenge