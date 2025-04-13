# Étape de build
FROM python:3.12-slim AS builder

# Installer les outils de build et Rust
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    curl \
    pkg-config \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Installer Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Créer un environnement virtuel
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copier et installer les dépendances
COPY requirements.txt .
COPY install_whisper.py .
RUN pip install --no-cache-dir wheel
RUN pip wheel --no-cache-dir -r requirements.txt -w /wheels

# Étape finale


# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=development

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Installer seulement les dépendances système nécessaires pour l'exécution
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libpq-dev \
#     ffmpeg \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

# Copier l'environnement virtuel et les roues précompilées
COPY --from=builder /wheels /wheels
COPY --from=builder /opt/venv /opt/venv

# Activer l'environnement virtuel
ENV PATH="/opt/venv/bin:$PATH"

# Copier les fichiers nécessaires
COPY requirements.txt .
COPY install_whisper.py .

# Exécuter le script d'installation de whisper
RUN python install_whisper.py

# Installer les paquets depuis les roues précompilées
RUN pip install --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

# Copier le reste du code source de l'application
COPY . .

# Créer le répertoire db s'il n'existe pas (pour la base de données SQLite en développement)
RUN mkdir -p var/app-instance && chmod -R 777 var/app-instance

# Exposer le port sur lequel l'application va écouter
EXPOSE 5000

# Commande pour démarrer l'application
CMD ["python", "wsgi.py"]