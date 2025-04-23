from flask import jsonify
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
        return jsonify({"code":404, "error": "Ressource introuvable"}), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"code":400, "error": "Requête invalide"}), 400

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"code":500, "error": "Erreur interne du serveur"}), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        return jsonify({"code":500, "error": "Une erreur inattendue s'est produite"}), 500
