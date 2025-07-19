# Dockerfile pour l'exécution sécurisée de code Java
FROM openjdk:17-alpine

# Créer un utilisateur non-privilégié
RUN addgroup -g 1000 coderunner && \
    adduser -D -s /bin/sh -u 1000 -G coderunner coderunner

# Créer le répertoire de travail
WORKDIR /app

# Changer les permissions
RUN chown -R coderunner:coderunner /app

# Passer à l'utilisateur non-privilégié
USER coderunner

# Variables d'environnement pour limiter la JVM
ENV JAVA_OPTS="-Xmx128m -Xms64m -XX:MaxMetaspaceSize=64m"

# Point d'entrée par défaut
CMD ["java"]