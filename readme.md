# Résumé du projet RecruteIA et état actuel du développement

# État du projet RecruteIA - Mars 2025

## Architecture technique

### Backend
- **Langage/Framework** : Python 3.12 / Flask
- **Base de données** : PostgreSQL avec SQLAlchemy
- **Communication temps réel** : Flask-SocketIO avec eventlet
- **Cache** : Redis (pour gestion tokens JWT et sessions)
- **APIs externes** : Intégration Claude/GPT-4o, Whisper pour traitement audio

### Frontend
- **Framework** : Next.js (React)
- **Styles** : Tailwind CSS, HeadlessUI
- **État global** : Contextes React
- **Communication API** : Axios
- **Communication temps réel** : Socket.io-client

### Infrastructure
- **Déploiement** : Docker avec docker-compose
- **Serveur web** : Nginx
- **CI/CD** : GitHub Actions
- **Monitoring** : Prometheus, Grafana, Loki

## Modèles de données

### Utilisateurs et authentification
- **User** : Informations de base utilisateur (UUID comme ID)
- **LoginHistory** : Historique de connexions et sécurité
- **TwoFactorAuth** : Configuration 2FA
- **NotificationPreference** : Préférences de notification

### Recrutement
- **Candidates** : Données des candidats
- **Interviews** : Entretiens planifiés et passés
- **InterviewQuestions** : Questions d'entretien
- **InterviewMetrics** : Métriques d'analyse des entretiens

### Collaboration
- **Team** : Équipes de recruteurs
- **TeamMember** : Membres d'équipe et permissions
- **AIAssistant** : Assistants IA configurables
- **AIGeneratedContent** : Contenu généré par les IA

### Facturation
- **SubscriptionPlan** : Plans d'abonnement
- **Subscription** : Abonnements utilisateurs
- **Payment** : Paiements et factures

## Fonctionnalités implémentées

### Authentification et sécurité
- ✅ Inscription et connexion utilisateurs
- ✅ Gestion de tokens JWT avec blacklist Redis
- ✅ Réinitialisation de mot de passe
- ✅ Authentification à deux facteurs (App, SMS, Email)
- ✅ Historique des connexions et détection d'activité suspecte

### Profil utilisateur
- ✅ Page de profil complète
- ✅ Édition des informations personnelles
- ✅ Gestion de la photo de profil
- ✅ Préférences de notification personnalisables
- ✅ Intégrations avec services externes (OAuth)

### Facturation et abonnements
- ✅ Gestion des plans d'abonnement
- ✅ Intégration Stripe pour paiements
- ✅ Gestion des cartes de paiement
- ✅ Historique de facturation
- ✅ Limitations selon le plan

### Entretiens et analyse
- ✅ Création et planification d'entretiens
- ✅ Interface d'entretien en temps réel
- ✅ Analyse biométrique des expressions faciales
- ✅ Transcription automatique des réponses
- ✅ Analyse des réponses par IA

### Système de notification
- ✅ Notifications en temps réel (WebSockets)
- ✅ Notifications par email
- ✅ Notifications push (navigateur)
- ✅ Centre de notification et historique

### Collaboration
- ✅ Création et gestion d'équipes
- ✅ Partage d'entretiens
- ✅ Système de commentaires horodatés
- ✅ Intégration d'assistants IA spécialisés

## Composants frontend récemment développés

### Page de profil
- `profile.jsx` - Page principale de profil
- `PersonalInfoCard.jsx` - Carte pour informations personnelles
- `SecurityCard.jsx` - Gestion du mot de passe et 2FA
- `NotificationPreferencesCard.jsx` - Préférences de notification
- `IntegrationsCard.jsx` - Gestion des intégrations externes

### Modaux
- `ConfirmActionModal.jsx` - Modal de confirmation générique
- `TwoFactorAuthModal.jsx` - Configuration 2FA
- `PlanSelectorModal.jsx` - Sélection de plan d'abonnement

## Routes API backend récemment développées

### Routes utilisateur
- `GET /api/users/profile` - Obtenir le profil complet
- `PUT /api/users/profile` - Mettre à jour le profil
- `POST /api/users/profile/avatar` - Mettre à jour l'avatar
- `PUT /api/users/profile/password` - Changer le mot de passe

### Routes 2FA
- `POST /api/users/profile/2fa/init` - Initialiser la 2FA
- `POST /api/users/profile/2fa/verify` - Vérifier et activer la 2FA
- `DELETE /api/users/profile/2fa` - Désactiver la 2FA

### Routes notification
- `GET /api/users/profile/notifications` - Préférences de notification
- `PUT /api/users/profile/notifications` - Mettre à jour les préférences
- `GET /api/users/profile/login-history` - Historique de connexion

### Routes intégration
- `GET /api/integrations` - Liste des intégrations disponibles
- `GET /api/integrations/{id}/auth-url` - URL d'authentification OAuth
- `DELETE /api/integrations/{id}` - Déconnecter une intégration

## Services backend récemment développés

### `UserService`
- `get_full_profile()` - Récupère toutes les données de profil
- `update_profile()` - Met à jour le profil utilisateur
- `update_avatar()` - Gestion des avatars
- `update_password()` - Sécurité et historique

### `AuthService`
- `login()` - Authentification avec historique
- `logout()` - Déconnexion avec révocation de token
- `refresh_token()` - Rafraîchissement de tokens
- `reset_password()` - Gestion de réinitialisation

### Middleware d'authentification
- `token_required` - Décorateur authentification
- `record_login_attempt()` - Enregistrement historique
- `parse_user_agent()` - Analyse de l'appareil
- `get_location_from_ip()` - Géolocalisation approximative

## Dépendances requises

### Backend
```
flask==2.2.3
flask-sqlalchemy==3.0.3
sqlalchemy==2.0.7
flask-migrate==4.0.4
flask-cors==3.0.10
flask-socketio==5.3.3
eventlet==0.33.3
pyjwt==2.6.0
redis==4.5.4
psycopg2-binary==2.9.5
werkzeug==2.3.6
geoip2==4.6.0
pyotp==2.9.0
qrcode==7.4.2
pillow==9.5.0
python-dotenv==1.0.0
```

### Frontend
```
next@13.4.12
react@18.2.0
react-dom@18.2.0
tailwindcss@3.3.3
@headlessui/react@1.7.15
@heroicons/react@2.0.18
axios@1.4.0
socket.io-client@4.7.1
```

## Problèmes connus et défis

1. **Compatibilité base de données**
   - Champs JSON nécessitent PostgreSQL ou adaptation
   - ID utilisateurs en UUID string vs integer

2. **Gestion des erreurs WebSocket**
   - Reconnexion après déconnexion
   - État de connexion incohérent sur certains navigateurs

3. **Performance de l'analyse biométrique**
   - Optimisation traitement vidéo
   - Charge CPU/GPU sur certains navigateurs

4. **Complétion des tests**
   - Tests unitaires backend à compléter
   - Tests E2E à implémenter

5. **Documentation**
   - Documentation API à finaliser
   - Guides utilisateurs à créer

## Prochaines étapes suggérées

1. **Tests et correction de bugs**
   - Vérifier l'intégration profil frontend/backend
   - Tester tous les scénarios d'authentification
   - Assurer compatibilité navigateurs

2. **Optimisation performances**
   - Mise en cache des résultats d'analyse
   - Optimisation des requêtes SQL
   - Lazy loading des composants lourds

3. **Finalisation interface entretien**
   - Intégration complète avec IA
   - Amélioration UI interactive
   - Optimisation temps réel

4. **Documentation et déploiement**
   - Finaliser documentation développeur
   - Créer guides utilisateurs
   - Configurer environnement de staging

## Code développé récemment

Nous avons récemment travaillé sur plusieurs composants clés :

1. **Modèles backend pour la sécurité et le profil**
   - `LoginHistory` pour suivre les tentatives de connexion
   - `TwoFactorAuth` pour l'authentification à deux facteurs
   - `NotificationPreference` pour les préférences de notification

2. **Mise à jour du middleware d'authentification**
   - Intégration de l'historique de connexion
   - Amélioration de la sécurité avec analyse des sessions

3. **Interface de profil utilisateur**
   - Composants React pour la gestion du profil
   - Formulaires et modaux pour l'édition des informations

4. **Mise à jour des services d'authentification**
   - Intégration de l'enregistrement des connexions
   - Support de différentes méthodes 2FA

## Erreurs résolues

1. **Problème avec les importations datetime**
   - Solution : Standardisation des imports `from datetime import datetime`

2. **Problème avec les champs JSON dans SQLAlchemy**
   - Solution : Utilisation de `sqlalchemy.dialects.postgresql.JSON`

3. **Problème avec les UUID dans les modèles**
   - Solution : Adaptation des modèles pour utiliser `String(36)` pour les IDs

Document généré le 25 mars 2025

# Résumé du projet RecruteIA - État actuel

## Aperçu du projet

RecruteIA est une plateforme de recrutement assistée par IA permettant de mener des entretiens avec deux modes de fonctionnement :
- **Mode autonome** : l'IA mène l'entretien seule avec le candidat
- **Mode collaboratif** : le recruteur mène l'entretien avec l'assistance de l'IA (suggestions, analyses)

## Architecture technique

### Backend
- **Langage/Framework** : Python 3.12 / Flask
- **Base de données** : PostgreSQL avec SQLAlchemy
- **Communication temps réel** : Flask-SocketIO
- **APIs externes** : Intégration Claude/GPT-4o, Whisper pour traitement audio
- **Routes principales** : 
  - `/interviews/` (gestion des entretiens)
  - `/ai-assistants/` (gestion des assistants IA)
  - `/interviews/<id>/facial-analysis` (analyse biométrique)

### Frontend
- **Framework** : Next.js (React)
- **Styles** : Tailwind CSS
- **État global** : Contextes React
- **Communication API** : Axios
- **Communication temps réel** : Socket.io-client

## Modèles de données

Nous avons examiné plusieurs modèles clés :
- `Interview` : Entretien avec mode autonome ou collaboratif
- `Question` et `Response` : Questions et réponses de l'entretien
- `Evaluation` : Évaluations des réponses par l'IA
- `AIAssistant` : Assistant IA configurable
- `AIGeneratedContent` : Contenu généré par les IA

## Fonctionnalités implémentées

### Composants frontend développés

1. **Services**
   - `interviewService.js` : Service d'intégration avec l'API d'entretien
   - `aiAssistantService.js` : Service pour les interactions avec les assistants IA
   - `speechService.js` : Service de synthèse vocale pour l'IA

2. **Contexte global**
   - `InterviewContext.jsx` : Gestion de l'état global des entretiens

3. **Composants d'interface**
   - `AIInterviewer.jsx` : Composant d'IA avec synthèse vocale
   - `AutonomousInterface.jsx` : Interface pour le mode autonome
   - `CollaborativeInterface.jsx` : Interface pour le mode collaboratif
   - `InterviewController.jsx` : Contrôleur qui charge l'interface appropriée
   - `SuggestedQuestions.jsx` : Affichage des suggestions de questions
   - `AIContentsPanel.jsx` : Affichage des contenus générés par l'IA
   - `RequestAIAnalysis.jsx` : Demande d'analyse par l'IA
   - `AIAssistantChat.jsx` : Chat avec l'assistant IA

### Fonctionnalités IA intégrées

1. **Synthèse vocale** : L'IA peut poser des questions vocalement dans les deux modes
2. **Analyse biométrique** : Capture et analyse des expressions faciales
3. **Suggestions de questions** : En mode collaboratif, l'IA suggère des questions
4. **Chat IA** : Interface de chat pour discuter avec l'IA pendant l'entretien
5. **Évaluation automatique** : Analyse des réponses des candidats
6. **Transitions automatiques** : En mode autonome, gestion fluide de l'entretien

## Derniers développements

Nous venons de terminer l'implémentation des interfaces pour les deux modes d'entretien :

1. **Mode autonome** avec :
   - Synthèse vocale automatique des questions
   - Transitions automatiques entre les questions
   - Contrôles pour mettre en pause, reprendre ou accélérer l'entretien

2. **Mode collaboratif** avec :
   - Panel de suggestions de questions
   - Chat flottant pour communiquer avec l'assistant IA
   - Synthèse vocale des questions sélectionnées

## Prochaines étapes potentielles

1. Amélioration de l'interface de création et configuration des assistants IA
2. Développement d'un tableau de bord d'analyse post-entretien
3. Amélioration de la reconnaissance vocale pour des interactions bidirectionnelles
4. Intégration d'analyses plus avancées des réponses des candidats
5. Création de modèles d'entretien prédéfinis pour différents postes

## Fichiers et composants développés

- `services/speechService.js`
- `services/interviewService.js`
- `services/aiAssistantService.js`
- `contexts/InterviewContext.jsx`
- `components/interview/AIInterviewer.jsx`
- `components/interview/AutonomousInterface.jsx`
- `components/interview/CollaborativeInterface.jsx`
- `components/interview/InterviewController.jsx`
- `components/interview/AIContentsPanel.jsx`
- `components/interview/RequestAIAnalysis.jsx`
- `components/interview/AIAssistantChat.jsx`
- `components/interview/SuggestedQuestions.jsx`
- `components/interview/FacialAnalysis.jsx`
- `components/interview/BiometricDashboard.jsx`
- `components/interview/VideoStream.jsx`
- `.github/workflow/ci.yml`
- `.gitignore`
- `backend/.env`
- `backend/.env.example`
- `backend/app/__init__.py`
- `backend/app/config.py`
- `backend/app/data/notifications.json`
- `backend/app/middleware/auth_middleware.py`
- `backend/app/middleware/rate_limit.py`
- `backend/app/models/__init__.py`
- `backend/app/models/biometric.py`
- `backend/app/models/biometric_data.py`
- `backend/app/models/collaboration.py`
- `backend/app/models/evaluation.py`
- `backend/app/models/interview.py`
- `backend/app/models/login_history.py`
- `backend/app/models/notification.py`
- `backend/app/models/notification_setting.py`
- `backend/app/models/payment.py`
- `backend/app/models/plan.py`
- `backend/app/models/question.py`
- `backend/app/models/response.py`
- `backend/app/models/subscription.py`
- `backend/app/models/two_factor_auth.py`
- `backend/app/models/user.py`
- `backend/app/routes/__init__.py`
- `backend/app/routes/admin_routes.py`
- `backend/app/routes/ai_collaboration_routes.py`
- `backend/app/routes/ai_routes.py`
- `backend/app/routes/auth_routes.py`
- `backend/app/routes/biometric_routes.py`
- `backend/app/routes/collaboration_routes.py`
- `backend/app/routes/integration_routes.py`
- `backend/app/routes/interview.py`
- `backend/app/routes/notification.py`
- `backend/app/routes/resume.py`
- `backend/app/routes/subscription_routes.py`
- `backend/app/routes/user.py`
- `backend/app/services/__init__.py`
- `backend/app/services/ai_collaboration_service.py`
- `backend/app/services/ai_interview_service.py`
- `backend/app/services/auth_service.py`
- `backend/app/services/biometric_service.py`
- `backend/app/services/collaboration_service.py`
- `backend/app/services/email_notification_service.py`
- `backend/app/services/interview_service.py`
- `backend/app/services/llm_service.py`
- `backend/app/services/notification_service.py`
- `backend/app/services/payment_service.py`
- `backend/app/services/resume_analyzer.py`
- `backend/app/services/user_service.py`
- `backend/app/services/websocket_service.py`
- `backend/app/socket_handlers.py`
- `backend/app/static/uploads/avatars/35d2cc6f-234b-441c-a78f-d302061d3bd9.png`
- `backend/app/static/uploads/avatars/695df557-6822-47db-89c2-61239788bdb2.png`
- `backend/app/templates/emails/interview_completed.html`
- `backend/app/utils/__init__.py`
- `backend/app/utils/helpers.py`
- `backend/correction_g_currrent_user.py`
- `backend/install_whisper.py`
- `backend/requirements.txt`
- `backend/wsgi.py`
- `docker/checklist.md`
- `docker/config/prometheus/prometheus.yml`
- `docker/config/prometheus/rules/security.yml`
- `docker/config/promtail/promtail-config.yml`
- `docker/deploy.md`
- `docker/docker-compose.monitoring.yml`
- `docker/docker-compose.yml`
- `docker/Dockerfile.backend`
- `docker/Dockerfile.frontend`
- `docker/nginx/conf.d/security-headers.conf`
- `docker/nginx/conf.d/ssl.conf`
- `docker/nginx/nginx.conf`
- `frontend/.env.local`
- `frontend/.env.local.example`
- `frontend/package.json`
- `frontend/pages/_app.js`
- `frontend/pages/auth/forgot-password.jsx`
- `frontend/pages/auth/login.jsx`
- `frontend/pages/auth/register.jsx`
- `frontend/pages/auth/reset-password.jsx`
- `frontend/pages/billing.jsx`
- `frontend/pages/dashboard.jsx`
- `frontend/pages/index.jsx`
- `frontend/pages/interviews/[id].jsx`
- `frontend/pages/interviews/create.jsx`
- `frontend/pages/interviews/index.jsx`
- `frontend/pages/interviews/new.jsx`
- `frontend/pages/notifications/index.jsx`
- `frontend/pages/notifications/settings.jsx`
- `frontend/pages/pricing.jsx`
- `frontend/pages/resumes/analyze.jsx`
- `frontend/pages/settings/profile.jsx`
- `frontend/postcss.config.js`
- `frontend/public/favicon.ico`
- `frontend/public/icons/google-calendar.svg`
- `frontend/public/icons/lever.svg`
- `frontend/public/icons/microsoft-365.svg`
- `frontend/public/icons/slack.svg`
- `frontend/public/images/avatars/default.png`
- `frontend/public/images/avatars/notion-avatar-1742897597760.png`
- `frontend/public/images/avatars/notion-avatar-1742898078423.png`
- `frontend/public/images/default-avatar.png.png`
- `frontend/public/images/login-illustration.svg`
- `frontend/public/logo.svg`
- `frontend/services/aiAssistantService.js`
- `frontend/services/ai-interview-service.js`
- `frontend/services/interviewService.js`
- `frontend/services/payment-service.js`
- `frontend/services/subscription-service.js`
- `frontend/services/user-service.js`
- `frontend/services/websocket-service.js`
- `frontend/styles/globals.css`
- `frontend/tailwind.config.js`
- `frontend/utils/api.js`
- `frontend/utils/dateUtils.js`
- `frontend/utils/helpers.js`
- `readme.md`
- `scripts/backup.sh`
- `scripts/restore.sh`
- `scripts/security_audit.sh`

Cette architecture permet une expérience fluide dans les deux modes d'entretien et offre une base solide pour les évolutions futures du projet.