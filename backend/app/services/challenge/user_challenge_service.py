from datetime import datetime, timedelta
import uuid
from sqlalchemy.exc import NoResultFound
from flask import abort
from app import db
from app.models.challenge import Challenge, ChallengeStepTestcase, UserChallenge, ChallengeStep, UserChallengeStatus
from app.types.challenge import ChallengeStatus
from app.utils.format_challenge_participation_url import format_challenge_participation_url


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

def get_challenge_participate_service(challenge_id, token_id):
    challenge = Challenge.query.filter_by(id=challenge_id).first()

    if not challenge:
        abort(404, description="Challenge introuvable.")

    if challenge.status != ChallengeStatus.published:
        abort(403, description="Ce challenge n'est pas encore disponible pour la participation.")

    user_challenge = UserChallenge.query.filter_by(token_id=token_id).first()
    if not user_challenge:
        abort(404, description="Lien de participation invalide.")

    # Initialiser l'utilisateur s'il accède pour la première fois
    if user_challenge.current_step == 0:
        user_challenge.current_step = 1
        user_challenge.status = UserChallengeStatus.in_progress
        db.session.commit()

    # Récupérer les steps triés par numéro d'étape
    steps = ChallengeStep.query.filter_by(challenge_id=challenge.id).order_by(ChallengeStep.step_number).all()
    titles_steps = [{"step_number": step.step_number, "title": step.title} for step in steps]

    return {
        "title": challenge.title,
        "description": challenge.description,
        "steps": titles_steps
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

def get_challenge_participate_step_service(challenge_id, step_id, token_id):
    # Récupère la participation via le token
    user_challenge = UserChallenge.query.filter_by(token_id=token_id).first()
    if not user_challenge:
        abort(404, description="Invalid participation token.")

    challenge = Challenge.query.filter_by(id=challenge_id).first()
    if not challenge:
        abort(404, description="Challenge not found.")

    requested_step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
    if not requested_step:
        abort(404, description="Challenge step not found.")

    # Trouver le step actuel de l'utilisateur
    current_step = ChallengeStep.query.filter_by(
        challenge_id=challenge_id,
        step_number=user_challenge.current_step
    ).first()

    def serialize_testcases(step):
        testcases = ChallengeStepTestcase.query.filter_by(step_id=step.id).all()
        return [
            tc.input
            for tc in testcases
        ]

    if requested_step.step_number <= user_challenge.current_step:
        return {
            "challenge_title": challenge.title,
            "status": user_challenge.status,
            "step": {
                "id": requested_step.id,
                "title": requested_step.title,
                "description": requested_step.description,
                "step_number": requested_step.step_number,
                "testcases": serialize_testcases(requested_step)
            }
        }
    else:
        return {
            "challenge_title": challenge.title,
            "status": user_challenge.status,
            "warning": f"You can't access step {requested_step.step_number} yet. Please complete the previous steps first.",
            "step": {
                "id": current_step.id,
                "title": current_step.title,
                "description": current_step.description,
                "step_number": current_step.step_number,
                "testcases": serialize_testcases(current_step)
            }
        }

def submit_challenge_participate_step_service(challenge_id, token_id, data):
    # Récupérer la participation
    user_challenge = UserChallenge.query.filter_by(token_id=token_id).first()
    if not user_challenge:
        abort(404, description="Invalid participation token.")
    if user_challenge.status == UserChallengeStatus.completed:
        abort(500, description="All steps is already completed")

    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        abort(404, description="Challenge not found.")
    
    print(f"current: {user_challenge.current_step}, Input: {user_challenge.status}")

    # Récupérer le step courant
    try:
        current_step = ChallengeStep.query.filter_by(
            challenge_id=challenge_id,
            step_number=user_challenge.current_step
        ).first()
        if not current_step:
            print("Étape de challenge introuvable pour challenge_id:", challenge_id)
            abort(404, description="Étape de challenge introuvable.")
    except Exception as e:
        db.session.rollback()
        print("Erreur inattendue lors de la récupération du ChallengeStep:", e)
        abort(500, description="Une erreur interne est survenue. Veuillez réessayer plus tard.")

    # Récupérer les testcases attendus
    expected_testcases = ChallengeStepTestcase.query.filter_by(step_id=current_step.id).all()
    
    print("✅ Testcases attendus :")
    for tc in expected_testcases:
        print(f"ID: {tc.id}, Input: {tc.input}, Output attendu: {tc.expected_output}, Current: {current_step.id}")
    
    if len(expected_testcases) != len(data):
        abort(400, description="Number of testcases doesn't match.")

    results = []
    all_passed = True

    for expected, user_submission in zip(expected_testcases, data):
        expected_output = expected.expected_output.strip()
        user_output = user_submission.get("output", "").strip()
        test_input = user_submission.get("input", "").strip()

        passed = (expected_output == user_output)
        results.append({
            "input": test_input,
            "expected_output": expected_output,
            "user_output": user_output,
            "passed": passed
        })

        if not passed:
            all_passed = False

        # Si tous les tests sont passés
        if all_passed:
            # Vérifier si c'était le dernier step
            total_steps = ChallengeStep.query.filter_by(challenge_id=challenge_id).count()

            if user_challenge.current_step + 1 >= total_steps:
                user_challenge.status = UserChallengeStatus.completed

            user_challenge.current_step += 1
            db.session.commit()

    return {
        "step_id": current_step.id,
        "step_number": current_step.step_number,
        "results": results,
        "passed": all_passed
    }

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

