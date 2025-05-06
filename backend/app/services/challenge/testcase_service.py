from app import db
from flask import abort
from app.models.challenge import Challenge, ChallengeStep, ChallengeStepTestcase




def add_testcase_to_step_service(challenge_id, step_id, user_id, data):
    # Vérifie que le challenge appartient à l'utilisateur
    challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
    if not challenge:
        abort(403, description="Challenge not found or Unauthorized")

    # Vérifie que le step appartient à ce challenge
    step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
    if not step:
        abort(403, description="Step not found")

    # Création du testcase
    testcase = ChallengeStepTestcase(
        step_id=step_id,
        input=data["input"],
        expected_output=data["expected_output"],
    )

    # Ajout à la base de données
    db.session.add(testcase)
    db.session.commit()

    return testcase

def get_testcases_for_step_service(challenge_id, step_id, user_id):
    # Vérifie que le challenge appartient à l'utilisateur
    challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
    if not challenge:
        abort(403, description="Challenge not found or Unauthorized")

    # Vérifie que le step appartient à ce challenge
    step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
    if not step:
        abort(403, description="Step not found")

    # Récupère tous les steps liés à ce challenge
    return ChallengeStepTestcase.query.filter_by(step_id=step_id).all()

def get_testcase_service(challenge_id, step_id, user_id, testcase_id):
    # Vérifie que le challenge appartient à l'utilisateur
    challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
    if not challenge:
        abort(403, description="Challenge not found or Unauthorized")

    # Vérifie que le step appartient à ce challenge
    step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
    if not step:
        abort(403, description="Step not found")

    # Récupère le testcase spécifique
    testcase = ChallengeStepTestcase.query.filter_by(id=testcase_id, step_id=step_id).first()
    if not step:
        abort(404, description="Test case not found")

    return testcase

def update_testcase_service(challenge_id, step_id, user_id, testcase_id, data):
    # Vérifie que le challenge appartient à l'utilisateur
    challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
    if not challenge:
        abort(403, description="Challenge not found or Unauthorized")

    # Vérifie que le step appartient à ce challenge
    step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
    if not step:
        abort(403, description="Step not found")

    # On recupère le test case du step
    testcase = ChallengeStepTestcase.query.filter_by(id=testcase_id, step_id=step_id).one()
    if not testcase:
        abort(403, description="Test case not found")

    # Liste des champs autorisés à être modifiés
    updatable_fields = {'input', 'expected_output'}

    for key, value in data.items():
        if key in updatable_fields:
            setattr(testcase, key, value)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de la mise à jour :", e)
        raise e

    return testcase

def delete_testcase_service(challenge_id, step_id, user_id, index):
    # Vérifie que le challenge appartient à l'utilisateur
    challenge = Challenge.query.filter_by(id=challenge_id, owner_id=user_id).first()
    if not challenge:
        abort(403, description="Challenge not found or Unauthorized")

    # Vérifie que le step appartient à ce challenge
    step = ChallengeStep.query.filter_by(id=step_id, challenge_id=challenge_id).first()
    if not step:
        abort(403, description="Step not found")

    try:
        removed = step.testcases.pop(index)
        db.session.commit()
        return removed
    except IndexError:
        abort(404, description="Testcase introuvable")

    return step
