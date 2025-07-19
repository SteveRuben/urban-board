# Architecture de la Plateforme de Coding

## Vue d'ensemble

La plateforme de coding RecruteIA utilise une architecture sécurisée basée sur Docker pour l'exécution de code utilisateur. Cette approche garantit l'isolation, la sécurité et la performance.

## Architecture Générale

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Docker        │
│   React/Next.js │◄──►│   Flask/Python   │◄──►│   Containers    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Base de        │
                       │   Données        │
                       │   PostgreSQL     │
                       └──────────────────┘
```

## Composants Principaux

### 1. Service d'Exécution de Code (`CodeExecutionService`)

**Localisation**: `backend/app/services/code_execution_service.py`

**Responsabilités**:
- Gestion des conteneurs Docker
- Validation et sécurisation du code
- Exécution des tests automatisés
- Collecte des métriques de performance

**Langages supportés**:
- Python 3.11
- JavaScript (Node.js 18)
- Java 17
- C++ (GCC)

### 2. API Routes (`coding_routes.py`)

**Endpoints principaux**:
- `GET /api/coding/languages` - Liste des langages supportés
- `POST /api/coding/execute` - Exécution de code
- `GET /api/coding/exercises` - Liste des exercices
- `POST /api/coding/exercises/{id}/submit` - Soumission de solution

### 3. Modèles de Données

**CodingExercise**:
- Exercices de programmation
- Templates de code
- Cas de test
- Solutions de référence

**CodingSubmission**:
- Soumissions des utilisateurs
- Résultats d'exécution
- Métriques de performance

**CodingSession**:
- Sessions d'entretien
- Suivi du temps
- Évaluation globale

## Sécurité

### Isolation des Conteneurs

Chaque exécution de code se fait dans un conteneur Docker isolé avec:

- **Utilisateur non-privilégié**: `coderunner:coderunner`
- **Réseau désactivé**: Pas d'accès Internet
- **Système de fichiers en lecture seule**
- **Limites de ressources strictes**:
  - Mémoire: 128MB
  - CPU: 50% d'un core
  - Temps d'exécution: 10 secondes max
  - Processus: 50 max

### Validation du Code

Avant l'exécution, le code est validé pour détecter:

- Imports dangereux (`os`, `subprocess`, `socket`)
- Fonctions système (`exec`, `eval`, `system`)
- Patterns malveillants
- Taille excessive

### Sandboxing

Les conteneurs utilisent:

- **Capabilities**: Toutes supprimées (`CAP_DROP=ALL`)
- **Syscalls bloqués**: Mount, reboot, socket, etc.
- **No new privileges**: Empêche l'escalade de privilèges
- **PID limits**: Limite le nombre de processus

## Configuration Docker

### Images Personnalisées

Chaque langage a sa propre image optimisée:

```dockerfile
# Exemple pour Python
FROM python:3.11-alpine
RUN adduser -D coderunner
USER coderunner
WORKDIR /app
```

### Construction des Images

```bash
cd docker/code-execution
chmod +x build-images.sh
./build-images.sh
```

### Images Créées

- `recruteai/code-runner:python`
- `recruteai/code-runner:node`
- `recruteai/code-runner:java`
- `recruteai/code-runner:cpp`

## Flux d'Exécution

### 1. Soumission de Code

```javascript
// Frontend
const result = await codingService.executeCode(
  code,
  language,
  testCases,
  exerciseId
);
```

### 2. Validation Backend

```python
# Backend
validation = codingService.validateCode(code, language)
if not validation.isValid:
    return error_response(validation.errors)
```

### 3. Création du Conteneur

```python
container = docker_client.containers.create(
    image=f'recruteai/code-runner:{language}',
    volumes={temp_dir: {'bind': '/app', 'mode': 'ro'}},
    mem_limit='128m',
    cpu_quota=50000,
    network_disabled=True,
    user='coderunner'
)
```

### 4. Exécution et Collecte

```python
# Compilation si nécessaire
if 'compile_command' in lang_config:
    compile_result = container.exec_run(compile_command)

# Exécution
exec_result = container.exec_run(run_command, timeout=10)

# Nettoyage
container.stop()
container.remove()
```

## Métriques et Monitoring

### Métriques Collectées

- **Temps d'exécution**: Précision à la milliseconde
- **Utilisation mémoire**: Peak memory usage
- **Taux de réussite**: Par exercice et utilisateur
- **Erreurs**: Classification et fréquence

### Monitoring Docker

```python
# Statistiques du conteneur
stats = container.stats(stream=False)
memory_usage = stats['memory_stats']['usage']
cpu_usage = stats['cpu_stats']['cpu_usage']['total_usage']
```

## Performance

### Optimisations

1. **Images Alpine**: Images légères (~50MB vs 1GB+)
2. **Réutilisation**: Pool de conteneurs pré-créés
3. **Cache**: Templates et résultats fréquents
4. **Parallélisation**: Exécutions simultanées

### Benchmarks

- **Démarrage conteneur**: ~200ms
- **Exécution Python simple**: ~50ms
- **Compilation Java**: ~2s
- **Nettoyage**: ~100ms

## Déploiement

### Prérequis

- Docker Engine 20.10+
- Python 3.11+
- PostgreSQL 13+
- 2GB RAM minimum
- 10GB espace disque

### Installation

```bash
# 1. Construire les images Docker
cd docker/code-execution
./build-images.sh

# 2. Configurer la base de données
flask db upgrade

# 3. Démarrer le service
python app.py
```

### Variables d'Environnement

```bash
DOCKER_HOST=unix:///var/run/docker.sock
CODE_EXECUTION_TIMEOUT=10
MAX_CONCURRENT_EXECUTIONS=5
TEMP_DIR=/tmp/code_execution
```

## Monitoring et Logs

### Logs Structurés

```python
logger.info("Code execution started", extra={
    'user_id': user_id,
    'exercise_id': exercise_id,
    'language': language,
    'code_length': len(code)
})
```

### Métriques Prometheus

- `code_executions_total{language, status}`
- `code_execution_duration_seconds{language}`
- `docker_containers_active`
- `memory_usage_bytes{language}`

## Troubleshooting

### Problèmes Courants

1. **Docker non disponible**
   - Vérifier: `docker ps`
   - Solution: Redémarrer Docker daemon

2. **Timeout d'exécution**
   - Cause: Code infini ou trop lent
   - Solution: Optimiser les limites

3. **Erreur de mémoire**
   - Cause: Limite de 128MB dépassée
   - Solution: Optimiser l'algorithme

### Debug Mode

```python
# Activer les logs détaillés
logging.getLogger('docker').setLevel(logging.DEBUG)
```

## Sécurité Avancée

### Audit Trail

Toutes les exécutions sont loggées avec:
- Code source (hashé)
- Résultats d'exécution
- Métriques de performance
- Timestamp et utilisateur

### Détection d'Anomalies

- Tentatives d'évasion de sandbox
- Utilisation excessive de ressources
- Patterns de code malveillant

### Compliance

- **GDPR**: Anonymisation des données
- **SOC2**: Audit trail complet
- **ISO27001**: Chiffrement et accès contrôlé

## Roadmap

### Version 2.0

- [ ] Support GPU pour ML/AI
- [ ] Exécution distribuée (Kubernetes)
- [ ] IDE intégré avec LSP
- [ ] Collaboration temps réel
- [ ] Tests de performance automatisés

### Version 2.1

- [ ] Support WebAssembly
- [ ] Langages additionnels (Rust, Go, C#)
- [ ] Debugging interactif
- [ ] Profiling avancé
- [ ] Intelligence artificielle pour hints