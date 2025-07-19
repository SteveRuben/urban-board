#!/bin/bash

# Script pour construire toutes les images Docker pour l'exécution de code

set -e

echo "🐳 Construction des images Docker pour l'exécution de code..."

# Répertoire des Dockerfiles
DOCKER_DIR="$(dirname "$0")"

# Construire l'image Python
echo "📦 Construction de l'image Python..."
docker build -f "$DOCKER_DIR/Dockerfile.python" -t recruteai/code-runner:python "$DOCKER_DIR"

# Construire l'image Node.js
echo "📦 Construction de l'image Node.js..."
docker build -f "$DOCKER_DIR/Dockerfile.node" -t recruteai/code-runner:node "$DOCKER_DIR"

# Construire l'image Java
echo "📦 Construction de l'image Java..."
docker build -f "$DOCKER_DIR/Dockerfile.java" -t recruteai/code-runner:java "$DOCKER_DIR"

# Construire l'image C++
echo "📦 Construction de l'image C++..."
docker build -f "$DOCKER_DIR/Dockerfile.cpp" -t recruteai/code-runner:cpp "$DOCKER_DIR"

echo "✅ Toutes les images ont été construites avec succès!"

# Afficher les images créées
echo "📋 Images disponibles:"
docker images | grep "recruteai/code-runner"

echo ""
echo "🚀 Pour tester une image, utilisez:"
echo "   docker run --rm -it recruteai/code-runner:python python --version"
echo "   docker run --rm -it recruteai/code-runner:node node --version"
echo "   docker run --rm -it recruteai/code-runner:java java --version"
echo "   docker run --rm -it recruteai/code-runner:cpp g++ --version"