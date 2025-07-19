# Dockerfile pour l'exécution sécurisée de code C++
FROM gcc:alpine

# Créer un utilisateur non-privilégié
RUN addgroup -g 1000 coderunner && \
    adduser -D -s /bin/sh -u 1000 -G coderunner coderunner

# Installer les dépendances de base
RUN apk add --no-cache \
    make \
    cmake \
    gdb

# Créer le répertoire de travail
WORKDIR /app

# Changer les permissions
RUN chown -R coderunner:coderunner /app

# Passer à l'utilisateur non-privilégié
USER coderunner

# Point d'entrée par défaut
CMD ["g++"]