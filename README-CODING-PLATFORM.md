# 🚀 RecruteIA - Plateforme de Coding Complète

## Vue d'ensemble

RecruteIA intègre maintenant une **plateforme de coding complète** avec exécution sécurisée de code via Docker, permettant d'évaluer les compétences techniques des développeurs en temps réel.

## ✨ Fonctionnalités Principales

### 🔒 **Exécution Sécurisée**
- **Conteneurs Docker isolés** pour chaque exécution
- **Utilisateurs non-privilégiés** dans les conteneurs
- **Limites de ressources** strictes (128MB RAM, 50% CPU, 10s timeout)
- **Réseau désactivé** et système de fichiers en lecture seule
- **Validation du code** contre les patterns malveillants

### 🌐 **Support Multi-Langages**
- **Python 3.11** avec Alpine Linux
- **JavaScript/Node.js 18** optimisé
- **Java 17** avec JVM limitée
- **C++** avec GCC et outils de développement

### 🎯 **Interface Complète**
- **Éditeur de code interactif** avec coloration syntaxique
- **Exécution en temps réel** avec feedback immédiat
- **Tests automatisés** avec validation des résultats
- **Solutions d'exemple** pour l'apprentissage
- **Métriques détaillées** (temps, mémoire, score)

### 📊 **Administration Avancée**
- **Gestion des exercices** avec interface intuitive
- **Statistiques détaillées** par utilisateur et exercice
- **Sessions d'entretien** avec suivi temps réel
- **Rapports de performance** et analytics

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Docker        │
│   Next.js/React│◄──►│   Flask/Python   │◄──►│   Containers    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   + Redis        │
                       └──────────────────┘
```

## 🚀 Démarrage Rapide

### Prérequis
- **Docker Desktop** installé et en cours d'exécution
- **Git** pour cloner le repository
- **Bash** pour exécuter les scripts (Windows: Git Bash ou WSL)

### Installation Automatique

```bash
# 1. Cloner le repository
git clone <repository-url>
cd recruteai

# 2. Rendre le script exécutable
chmod +x scripts/start-dev.sh

# 3. Démarrer l'environnement complet
./scripts/start-dev.sh
```

Le script va automatiquement :
- ✅ Vérifier Docker
- 🐳 Construire les images de code
- 🗃️ Initialiser la base de données
- 🔧 Démarrer tous les services
- 🧪 Valider le fonctionnement

### Accès aux Services

Une fois démarré, vous pouvez accéder à :

- **🌐 Application**: http://localhost:3000
- **🔧 API Backend**: http://localhost:5000
- **📊 Monitoring** (optionnel): http://localhost:9090

## 🧪 Test de la Plateforme

### 1. Mode Démonstration
Visitez http://localhost:3000/demo/coding-platform pour tester :
- Sélection d'exercices
- Édition de code en temps réel
- Exécution sécurisée
- Validation automatique

### 2. Mode Administration
Connectez-vous et allez sur http://localhost:3000/coding-admin pour :
- Créer de nouveaux exercices
- Gérer les langages supportés
- Consulter les statistiques
- Analyser les soumissions

### 3. API Testing

```bash
# Vérifier l'état du service
curl http://localhost:5000/api/coding/health

# Lister les langages supportés
curl http://localhost:5000/api/coding/languages

# Exécuter du code (nécessite authentification)
curl -X POST http://localhost:5000/api/coding/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "code": "print(\"Hello World\")",
    "language": "python"
  }'
```

## 🔧 Configuration Avancée

### Variables d'Environnement

```bash
# Backend
FLASK_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key
DOCKER_HOST=unix:///var/run/docker.sock

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NODE_ENV=development
```

### Limites de Sécurité

```json
{
  "container_limits": {
    "memory": "128m",
    "cpu_quota": 50000,
    "timeout": 10
  },
  "security_options": {
    "user": "coderunner:coderunner",
    "network_disabled": true,
    "read_only": true
  }
}
```

## 📚 Utilisation

### Créer un Exercice

```python
# Via l'API
exercise = {
    "title": "Fibonacci Sequence",
    "description": "Implémentez la suite de Fibonacci",
    "difficulty": "moyen",
    "supported_languages": ["python", "javascript"],
    "code_templates": {
        "python": "def fibonacci(n):\n    # Votre code ici\n    pass"
    },
    "test_cases": [
        {"input": "n = 5", "expected": "5", "description": "5ème nombre"}
    ]
}
```

### Exécuter du Code

```typescript
// Frontend
const result = await codingService.executeCode(
  "def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
  "python",
  [{ input: "n = 5", expected: "5" }]
);
```

### Analyser les Résultats

```python
# Backend - Résultat d'exécution
{
    "success": true,
    "output": "5",
    "execution_time": 0.045,
    "memory_usage": "12MB",
    "test_results": [
        {
            "test_case": 1,
            "passed": true,
            "input": "n = 5",
            "expected": "5",
            "actual": "5"
        }
    ]
}
```

## 🛠️ Développement

### Structure du Projet

```
recruteai/
├── backend/
│   ├── app/
│   │   ├── services/code_execution_service.py  # Service principal
│   │   ├── routes/coding_routes.py             # API routes
│   │   └── models/coding_exercise.py           # Modèles DB
│   └── migrations/add_coding_tables.sql        # Schema DB
├── frontend/
│   ├── src/
│   │   ├── services/coding-service.ts          # Client API
│   │   ├── pages/demo/coding-platform.tsx     # Interface démo
│   │   └── pages/coding-admin/                 # Administration
│   └── Dockerfile.dev
├── docker/
│   └── code-execution/                         # Images Docker
│       ├── Dockerfile.python
│       ├── Dockerfile.node
│       ├── Dockerfile.java
│       └── Dockerfile.cpp
└── scripts/start-dev.sh                       # Script de démarrage
```

### Commandes Utiles

```bash
# Voir les logs
docker-compose -f docker-compose.dev.yml logs -f [service]

# Redémarrer un service
docker-compose -f docker-compose.dev.yml restart backend

# Shell dans un conteneur
docker-compose -f docker-compose.dev.yml exec backend bash

# Reconstruire les images de code
cd docker/code-execution && ./build-images.sh

# Arrêter tous les services
docker-compose -f docker-compose.dev.yml down
```

### Ajouter un Nouveau Langage

1. **Créer le Dockerfile**
```dockerfile
# docker/code-execution/Dockerfile.rust
FROM rust:alpine
RUN adduser -D coderunner
USER coderunner
WORKDIR /app
```

2. **Mettre à jour le service**
```python
# backend/app/services/code_execution_service.py
'rust': {
    'image': 'recruteai/code-runner:rust',
    'file_extension': '.rs',
    'compile_command': ['rustc', '/app/code.rs', '-o', '/app/code'],
    'run_command': ['/app/code']
}
```

3. **Ajouter au script de build**
```bash
# docker/code-execution/build-images.sh
docker build -f Dockerfile.rust -t recruteai/code-runner:rust .
```

## 🔍 Monitoring et Debug

### Logs Structurés

```python
logger.info("Code execution started", extra={
    'user_id': user_id,
    'exercise_id': exercise_id,
    'language': language,
    'execution_time': execution_time
})
```

### Métriques Prometheus

- `code_executions_total{language, status}`
- `code_execution_duration_seconds{language}`
- `docker_containers_active`
- `memory_usage_bytes{language}`

### Health Checks

```bash
# Service principal
curl http://localhost:5000/health

# Service de coding
curl http://localhost:5000/api/coding/health

# Docker disponible
docker ps
```

## 🚨 Troubleshooting

### Problèmes Courants

**1. Docker non disponible**
```bash
# Vérifier Docker
docker --version
docker ps

# Redémarrer Docker Desktop
```

**2. Conteneurs qui ne démarrent pas**
```bash
# Voir les logs
docker-compose -f docker-compose.dev.yml logs [service]

# Reconstruire
docker-compose -f docker-compose.dev.yml build --no-cache
```

**3. Erreurs d'exécution de code**
```bash
# Vérifier les images
docker images | grep recruteai/code-runner

# Reconstruire les images
cd docker/code-execution && ./build-images.sh
```

**4. Base de données**
```bash
# Réinitialiser la DB
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d postgres
```

### Mode Debug

```bash
# Activer les logs détaillés
export FLASK_DEBUG=1
export LOG_LEVEL=DEBUG

# Redémarrer le backend
docker-compose -f docker-compose.dev.yml restart backend
```

## 🔐 Sécurité

### Bonnes Pratiques

- ✅ **Jamais d'exécution directe** sur l'hôte
- ✅ **Conteneurs éphémères** supprimés après usage
- ✅ **Validation stricte** du code avant exécution
- ✅ **Limites de ressources** appliquées
- ✅ **Audit trail** complet des exécutions

### Patterns Bloqués

```python
BLOCKED_PATTERNS = [
    'import os', 'import subprocess', 'import socket',
    'require("fs")', 'require("child_process")',
    'System.exit', 'Runtime.getRuntime()',
    '#include <cstdlib>', 'system('
]
```

## 📈 Performance

### Benchmarks

- **Démarrage conteneur**: ~200ms
- **Exécution Python simple**: ~50ms
- **Compilation Java**: ~2s
- **Nettoyage**: ~100ms

### Optimisations

- Images Alpine légères (~50MB vs 1GB+)
- Pool de conteneurs pré-créés
- Cache des templates et résultats
- Exécutions parallèles

## 🎯 Prochaines Étapes

### Roadmap v2.0

- [ ] **Support GPU** pour ML/AI
- [ ] **Kubernetes** pour la scalabilité
- [ ] **IDE intégré** avec LSP
- [ ] **Collaboration temps réel**
- [ ] **Tests de performance** automatisés

### Contributions

1. Fork le repository
2. Créer une branche feature
3. Implémenter les changements
4. Ajouter des tests
5. Soumettre une Pull Request

## 📞 Support

- **Documentation**: `/docs/coding-platform-architecture.md`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**🎉 Félicitations ! Vous avez maintenant une plateforme de coding complète et sécurisée intégrée à RecruteIA !**