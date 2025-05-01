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

