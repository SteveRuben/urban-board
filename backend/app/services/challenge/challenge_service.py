from app import db
from app.models.challenge import Challenge, ChallengeStep
from flask import abort
from sqlalchemy.exc import NoResultFound

from app.types.challenge import ChallengeStatus

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




def create_challenge_step_service(challenge_id, user_id, data):
    try:
        # On récupère le challenge avec filtre sur l'owner
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()

        if not challenge:
            abort(403, description="Not found or Unauthorize")

        # Calculer automatiquement du step_number
        current_max_step = db.session.query(
            db.func.max(ChallengeStep.step_number)
        ).filter_by(challenge_id=challenge_id).scalar()

        step_number = (current_max_step or 0) + 1

        # Créer le ChallengeStep
        new_step = ChallengeStep(
            challenge_id=challenge_id,
            step_number=step_number,
            title=data["title"],
            description=data.get("description", ""),
        )

        # Ajouter à la base de données
        db.session.add(new_step)
        db.session.commit()

        return new_step
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de l'abandon du challenge :", e)
        raise e

def get_challenge_step_by_id_service(challenge_id, step_id, user_id):
    try:
        # Vérifie que l'utilisateur est bien le propriétaire du challenge
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
        if not challenge:
            abort(403, description="Challenge non trouvé ou accès non autorisé")

        # Récupère le step spécifique
        step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
        if not step:
            abort(404, description="Step non trouvé")

        return step

    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la récupération du step :", e)
        raise e

def get_challenge_step_service(challenge_id, user_id):
    try:
        # Vérifie si l'utilisateur est bien le propriétaire
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()

        if not challenge:
            abort(403, description="Not found or Unauthorized")

        # Récupère tous les steps liés à ce challenge
        return ChallengeStep.query.filter_by(challenge_id=challenge.id).order_by(ChallengeStep.step_number).all()

    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la récupération des steps du challenge :", e)
        raise e

def update_challenge_step_service(challenge_id, step_id, user_id, data):
    try:
        # Vérifie si le challenge appartient à l'utilisateur
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
        if not challenge:
            abort(403, description="Not found or Unauthorized")

        # Récupère le ChallengeStep à mettre à jour
        step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()

        if not step:
            abort(404, description="ChallengeStep not found")

        # Mettre à jour les données du ChallengeStep
        step.title = data.get('title', step.title)
        step.description = data.get('description', step.description)

        # Sauvegarder les changements
        db.session.commit()

        return step

    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la mise à jour du ChallengeStep:", e)
        raise e

def delete_challenge_step_service(challenge_id, step_id, user_id):
    try:
        # Vérifie si le challenge appartient à l'utilisateur
        challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
        if not challenge:
            abort(403, description="Not found or Unauthorized")

        # Récupère le ChallengeStep à supprimer
        step_to_delete = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()

        if not step_to_delete:
            abort(404, description="ChallengeStep not found")

        # Supprime le step
        db.session.delete(step_to_delete)
        db.session.commit()

        # Récupère tous les autres steps du challenge, triés par step_number
        remaining_steps = ChallengeStep.query \
            .filter_by(challenge_id=challenge_id) \
            .order_by(ChallengeStep.step_number) \
            .all()

        # Réorganise les step_number (1, 2, 3, ...)
        for index, step in enumerate(remaining_steps):
            step.step_number = index + 1

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la suppression du ChallengeStep:", e)
        raise e

