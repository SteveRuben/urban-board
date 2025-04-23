from app import db
from app.models.challenge import Challenge

def create_challenge(data):
    challenge = Challenge(**data)
    db.session.add(challenge)
    db.session.commit()
    return challenge

def get_all_challenges():
    return Challenge.query.all()

def get_challenge_by_id(challenge_id):
    return Challenge.query.get_or_404(challenge_id)

def update_challenge(challenge_id, data):
    challenge = Challenge.query.get_or_404(challenge_id)
    for key, value in data.items():
        setattr(challenge, key, value)
    db.session.commit()
    return challenge

def delete_challenge(challenge_id):
    challenge = Challenge.query.get_or_404(challenge_id)
    db.session.delete(challenge)
    db.session.commit()
    return True
