Documentation de lancement du backend

1. Créer et activer un environnement virtuel (recommandé)

Pour Linux/macOS
    python -m venv venv
    source venv/bin/activate
Pour Windows
    python -m venv venv
    venv\Scripts\activate

2. Installer les dépendances

    pip install -r requirements.txt

3. Configuration de la base de données

    Initialiser la gestion des migrations
        flask db init
    Créer le script de migration initial
        flask db migrate
    Appliquer les migrations
        flask db upgrade
Lancement de l'application

    python wsgi.py

    38  rm -rf migrations
 1839  rm -f *.db
 1840  rm -f instance/*.db
 1841  flask db init
 1842  flask db migrate -m "Fresh start - initial migration"
 1843  flask db upgrade