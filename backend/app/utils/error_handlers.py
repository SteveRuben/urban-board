import traceback
from flask import jsonify, current_app
from werkzeug.exceptions import HTTPException

def register_error_handlers(app):

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        response = {
            "error": e.name,
            "description": e.description
        }
        return jsonify(response), e.code

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "code": 404,
            "error": "Ressource introuvable",
            "description": "La ressource demandée est introuvable ou inexistante."
        }), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            "code": 400,
            "error": "Requête invalide",
            "description": str(e.description) if hasattr(e, 'description') else str(e)
        }), 400

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({
            "code": 500,
            "error": "Erreur interne du serveur",
            "description": "Quelque chose s'est mal passé sur le serveur."
        }), 500

    @app.errorhandler(Exception)
    def handle_unexpected_exception(e):
        trace = traceback.format_exc()
        response = {
            "code": 500,
            "error": "Une erreur inattendue s'est produite",
            "exception": str(e)
        }

        # Affiche la trace seulement en mode debug
        if app.config.get("DEBUG", False):
            response["trace"] = trace

        return jsonify(response), 500
