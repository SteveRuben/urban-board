import uuid
from app import db
from app.models.challenge import Challenge, UserChallenge
from flask import abort
from sqlalchemy.exc import NoResultFound
from datetime import datetime, timedelta

from app.types.challenge import ChallengeStatus, UserChallengeStatus
from app.utils.format_challenge_participation_url import format_challenge_participation_url

def create_challenge_service(data):
    newChallenge = Challenge(**data)
    db.session.add(newChallenge)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de l'adhesion au challenge' :", e)
        raise e
    return newChallenge

def get_all_challenges_service(user_id):
    return Challenge.query.filter_by(owner_id=user_id).all()

def get_challenge_service(challenge_id, user_id):
    try:
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).one()
        return challenge
    except NoResultFound:
        abort(404, description="Challenge non trouvé ou non autorisé")

def update_challenge_service(challenge_id, user_id, data):
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

def update_challenge_service(challenge_id, user_id, data):
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

def delete_challenge_service(challenge_id, user_id):
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


# User challenge


def generate_participation_token_service(challenge_id, user_id):
    # Vérifie que le challenge appartient à l'utilisateur et est publié
    challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()

    if not challenge:
        abort(403, description="Challenge introuvable ou non autorisé")

    if challenge.status != ChallengeStatus.published:
        abort(403, description="Ce challenge n'est pas encore disponible.")

    # Génération sécurisée et unique du token
    token_id = uuid.uuid4()
    while UserChallenge.query.filter_by(token_id=token_id).first():
        token_id = uuid.uuid4()  # Regénère si déjà existant

    # Définir la date d’expiration (ex: 48h à partir de maintenant)
    expiration_date = datetime.utcnow() + timedelta(days=7)

    # Création de l’entrée UserChallenge
    participation = UserChallenge(
        challenge_id=challenge_id,
        token_id=token_id,
        expires_at=expiration_date
    )

    db.session.add(participation)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur génération token :", e)
        raise e

    # Génère l’URL complète à envoyer
    participation_url = format_challenge_participation_url(participation.token_id)

    return {
        "challenge_id": challenge_id,
        "participation_url": participation_url
    }

def get_challenge_participate_service(challenge_id):
    challenge = Challenge.query.filter_by(id=challenge_id).first()

    if not challenge:
        abort(404, description="Challenge introuvable.")

    if challenge.status != ChallengeStatus.published:
        abort(403, description="Ce challenge n'est pas encore disponible pour la participation.")

    return {
        "title": challenge.title,
        "description": challenge.description
    }

def get_users_challenge_service(challenge_id, user_id):
    # Vérifier que le challenge appartient à l'utilisateur
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        abort(404, description="Challenge introuvable.")
    if challenge.owner_id != user_id:
        abort(403, description="Action interdite : vous n'êtes pas le propriétaire de ce challenge.")

    # Récupérer les participations
    users_challenge = UserChallenge.query.filter_by(challenge_id=challenge_id).all()

    # Formater la reponse
    users = []
    for uc in users_challenge:
        users.append({
            "user_challenge": uc.id,
            "user_challenge_token": format_challenge_participation_url(uc.token_id),
            "owner": user_id,
            "challenge_id": uc.challenge_id,
            "status": uc.status.name,
            "current_step": uc.current_step,
            "attempts": uc.attempts,
            "created_at": uc.created_at.isoformat() if uc.created_at else None,
            "updated_at": uc.updated_at.isoformat() if uc.updated_at else None
        })

    return users

def delete_user_challenge_service(challenge_id, user_challenge_id, user_id):
    # Vérifier que le participant existe et appartient bien à ce challenge
    participation = UserChallenge.query.filter_by(id=user_challenge_id, challenge_id=challenge_id).first()
    if not participation:
        abort(404, description="Ce participant ne participe pas à ce challenge.")

    # Vérifier que l'utilisateur connecté est bien le propriétaire du challenge
    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        abort(404, description="Challenge introuvable.")
    if challenge.owner_id != user_id:
        abort(403, description="Action interdite : vous n'êtes pas le propriétaire de ce challenge.")

    # Supprimer la participation
    db.session.delete(participation)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la suppression :", e)
        raise e

    return True

def abandoned_challenge_service(participation):
    try:
        user_challenge = UserChallenge.query.filter_by(
            id=participation.id,
            challenge_id=participation.challenge_id
        ).one()
    except NoResultFound:
        abort(403, description="Ce participant ne participe pas à ce challenge.")

    # Marquer le challenge comme abandonné
    user_challenge.status = UserChallengeStatus.abandoned
    user_challenge.expires_at = datetime.utcnow()  # Expire immédiatement le lien

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de l'abandon du challenge :", e)
        raise e

    return user_challenge

