from app import db
from app.models.challenge import Challenge

def create_challenge(data):
    challenge = Challenge(**data)
    db.session.add(challenge)
    db.session.commit()
    return challenge
