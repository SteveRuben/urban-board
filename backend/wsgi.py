# backend/wsgi.py
import os
from app import create_app
from app import socketio
import logging
from dotenv import load_dotenv

# Charger les variables d'environnement avant d'importer l'application
load_dotenv()

# Configurer le logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)

# Obtenir l'environnement (dev, test, prod) à partir des variables d'environnement
env = os.getenv('FLASK_ENV', 'dev')

# Vérifier si l'environnement est valide
if env not in ['dev', 'test', 'prod']:
    raise ValueError(f"Environnement invalide : {env}. Utiliser 'dev', 'test' ou 'prod'")

# Créer l'application
app = create_app(env)

if __name__ == '__main__':
    # Récupérer le port depuis les variables d'environnement ou utiliser 5000 par défaut
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))
    
    # En mode développement, activer le rechargement automatique
    use_reloader = env == 'dev'
    debug = env == 'dev'

    # Afficher toutes les routes disponibles
print("\n🧭 Liste des routes disponibles :")
for rule in app.url_map.iter_rules():
    methods = ','.join(rule.methods)
    print(f"{rule.endpoint:30s} {methods:20s} {rule.rule}")

    # Démarrer le serveur
    socketio.run(app, host=host, port=port, debug=debug, use_reloader=debug)
    """ app.run(
        host='0.0.0.0',
        port=port,
        debug=app.config['DEBUG'],
        use_reloader=use_reloader
    ) """