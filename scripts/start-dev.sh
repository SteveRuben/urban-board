#!/bin/bash

# Script de démarrage pour l'environnement de développement RecruteIA
# Inclut la plateforme de coding avec Docker

set -e

echo "🚀 Démarrage de l'environnement de développement RecruteIA"
echo "=================================================="

# Vérifier que Docker est installé et en cours d'exécution
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker Desktop."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Vérifier que Docker Compose est disponible
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas disponible."
    exit 1
fi

# Fonction pour utiliser docker-compose ou docker compose
docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

echo "✅ Docker est disponible"

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/instance
mkdir -p frontend/.next
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Construire les images de base pour l'exécution de code
echo "🐳 Construction des images Docker pour l'exécution de code..."
cd docker/code-execution

# Rendre le script exécutable et le lancer
chmod +x build-images.sh
./build-images.sh

cd ../..

# Démarrer les services principaux
echo "🔧 Démarrage des services principaux..."
docker_compose_cmd -f docker-compose.dev.yml up -d postgres redis

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
timeout=30
while ! docker_compose_cmd -f docker-compose.dev.yml exec postgres pg_isready -U recruteai &> /dev/null; do
    sleep 1
    timeout=$((timeout - 1))
    if [ $timeout -eq 0 ]; then
        echo "❌ Timeout en attendant PostgreSQL"
        exit 1
    fi
done

echo "✅ PostgreSQL est prêt"

# Exécuter les migrations
echo "🗃️ Exécution des migrations de base de données..."
docker_compose_cmd -f docker-compose.dev.yml exec postgres psql -U recruteai -d recruteai_dev -f /docker-entrypoint-initdb.d/add_coding_tables.sql

# Démarrer le backend
echo "🔧 Démarrage du backend..."
docker_compose_cmd -f docker-compose.dev.yml up -d backend

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
timeout=60
while ! curl -s http://localhost:5000/health &> /dev/null; do
    sleep 2
    timeout=$((timeout - 2))
    if [ $timeout -le 0 ]; then
        echo "❌ Timeout en attendant le backend"
        echo "📋 Logs du backend:"
        docker_compose_cmd -f docker-compose.dev.yml logs backend
        exit 1
    fi
done

echo "✅ Backend est prêt"

# Démarrer le frontend
echo "🔧 Démarrage du frontend..."
docker_compose_cmd -f docker-compose.dev.yml up -d frontend

# Attendre que le frontend soit prêt
echo "⏳ Attente du frontend..."
timeout=120
while ! curl -s http://localhost:3000 &> /dev/null; do
    sleep 3
    timeout=$((timeout - 3))
    if [ $timeout -le 0 ]; then
        echo "❌ Timeout en attendant le frontend"
        echo "📋 Logs du frontend:"
        docker_compose_cmd -f docker-compose.dev.yml logs frontend
        exit 1
    fi
done

echo "✅ Frontend est prêt"

# Vérifier l'état du service de coding
echo "🧪 Vérification du service de coding..."
if curl -s http://localhost:5000/api/coding/health | grep -q "healthy\|degraded"; then
    echo "✅ Service de coding opérationnel"
else
    echo "⚠️ Service de coding en mode dégradé (normal si Docker n'est pas accessible depuis le conteneur)"
fi

# Afficher le statut final
echo ""
echo "🎉 Environnement de développement démarré avec succès!"
echo "=================================================="
echo "📱 Frontend:              http://localhost:3000"
echo "🔧 Backend API:           http://localhost:5000"
echo "🗃️ Base de données:       localhost:5432"
echo "🔴 Redis:                 localhost:6379"
echo "📊 Prometheus (optionnel): http://localhost:9090"
echo "📈 Grafana (optionnel):   http://localhost:3001"
echo ""
echo "🧪 Endpoints de test:"
echo "   • Santé API:           http://localhost:5000/health"
echo "   • Service coding:      http://localhost:5000/api/coding/health"
echo "   • Langages supportés:  http://localhost:5000/api/coding/languages"
echo ""
echo "📋 Commandes utiles:"
echo "   • Voir les logs:      docker-compose -f docker-compose.dev.yml logs -f [service]"
echo "   • Arrêter:            docker-compose -f docker-compose.dev.yml down"
echo "   • Redémarrer:         docker-compose -f docker-compose.dev.yml restart [service]"
echo "   • Shell backend:      docker-compose -f docker-compose.dev.yml exec backend bash"
echo "   • Shell frontend:     docker-compose -f docker-compose.dev.yml exec frontend sh"
echo ""
echo "🔍 Pour surveiller les logs en temps réel:"
echo "   docker-compose -f docker-compose.dev.yml logs -f"

# Optionnel: démarrer le monitoring
read -p "🤔 Voulez-vous démarrer le monitoring (Prometheus + Grafana) ? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Démarrage du monitoring..."
    docker_compose_cmd -f docker-compose.dev.yml --profile monitoring up -d
    echo "✅ Monitoring démarré:"
    echo "   • Prometheus: http://localhost:9090"
    echo "   • Grafana:    http://localhost:3001 (admin/admin123)"
fi

echo ""
echo "🚀 Prêt pour le développement! Happy coding! 🎯"