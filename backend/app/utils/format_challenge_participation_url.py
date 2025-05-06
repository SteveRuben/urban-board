from flask import current_app

def format_challenge_participation_url(token_id):
    """
    Génère l'URL de participation complète à partir d'un token UUID.

    Args:
        token_id (UUID): L'identifiant unique du token de participation.

    Returns:
        str: L'URL complète de participation.
    """

    api_base_url = current_app.config.get("API_BASE_URL", "http://localhost:5000/api")

    return f"{api_base_url}/challenges/participate/{token_id}"
