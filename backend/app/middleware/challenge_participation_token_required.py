from functools import wraps
from flask import request, abort, g
from datetime import datetime
from app.models.challenge import UserChallenge

def challenge_participation_token_required(f):
    @wraps(f)
    def decorated_function(token_id, *args, **kwargs):
        participation = UserChallenge.query.filter_by(token_id=token_id).first()

        if not participation:
            abort(404, description="Lien de participation invalide.")

        # Vérifie l'expiration
        if participation.expires_at and datetime.utcnow() > participation.expires_at:
            abort(403, description="Lien expiré. Veuillez contacter l'administrateur.")

        g.participation = participation  # Pour accéder dans la route si besoin

        return f(token_id, *args, **kwargs)
    return decorated_function
