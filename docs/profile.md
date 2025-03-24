# Routes API Backend pour le Profil Utilisateur

## Routes pour la Gestion du Profil

| Méthode | Route                                | Description                                | Corps de Requête                                                                                       | Réponse                                   |
|---------|--------------------------------------|--------------------------------------------|--------------------------------------------------------------------------------------------------------|-------------------------------------------|
| GET     | `/api/users/profile`                 | Récupérer les informations de profil       | -                                                                                                      | Données complètes du profil utilisateur   |
| PUT     | `/api/users/profile`                 | Mettre à jour les informations de profil   | `{ first_name, last_name, email, job_title, company, phone }`                                          | Données mises à jour du profil utilisateur |
| POST    | `/api/users/profile/avatar`          | Mettre à jour l'avatar                     | FormData avec champ 'avatar'                                                                           | `{ avatar_url, message }`                 |
| PUT     | `/api/users/profile/password`        | Changer le mot de passe                    | `{ current_password, new_password }`                                                                   | `{ message, last_password_change }`       |
| GET     | `/api/users/profile/login-history`   | Récupérer l'historique des connexions      | -                                                                                                      | Liste des connexions avec détails         |

## Routes pour l'Authentification à Deux Facteurs

| Méthode | Route                                | Description                               | Corps de Requête                   | Réponse                                        |
|---------|--------------------------------------|-------------------------------------------|------------------------------------|-------------------------------------------------|
| POST    | `/api/users/profile/2fa/init`        | Initialiser la configuration 2FA          | -                                  | `{ qrCode, secretKey, backupCodes }`            |
| POST    | `/api/users/profile/2fa/verify`      | Vérifier le code d'authentification       | `{ method, code }`                 | `{ success, message }`                          |
| DELETE  | `/api/users/profile/2fa`             | Désactiver l'authentification 2FA         | -                                  | `{ success, message }`                          |

## Routes pour les Préférences de Notification

| Méthode | Route                                | Description                                | Corps de Requête                                 | Réponse                                   |
|---------|--------------------------------------|--------------------------------------------|-------------------------------------------------|-------------------------------------------|
| GET     | `/api/users/profile/notifications`   | Récupérer les préférences de notification  | -                                               | Objet avec toutes les préférences         |
| PUT     | `/api/users/profile/notifications`   | Mettre à jour les préférences              | Objet avec les préférences (email, push, desktop) | Préférences mises à jour                  |

## Routes pour les Intégrations

| Méthode | Route                                | Description                               | Corps de Requête                   | Réponse                                      |
|---------|--------------------------------------|-------------------------------------------|------------------------------------|-------------------------------------------------|
| GET     | `/api/integrations`                  | Récupérer toutes les intégrations         | -                                  | Liste des intégrations disponibles           |
| GET     | `/api/integrations/{id}/auth-url`    | Obtenir l'URL d'authentification          | -                                  | `{ authUrl }`                                |
| POST    | `/api/integrations/{id}/callback`    | Callback OAuth pour l'intégration         | Paramètres de callback             | `{ success, integration_details }`           |
| DELETE  | `/api/integrations/{id}`             | Déconnecter une intégration               | -                                  | `{ success, message }`                       |

## Format des Données de Profil

```json
{
  "id": 123,
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@example.com",
  "job_title": "Recruteur Senior",
  "company": "Acme Inc",
  "phone": "+33612345678",
  "avatar_url": "https://example.com/avatars/123.jpg",
  "last_password_change": "2023-03-15T10:30:00Z",
  "two_factor_enabled": true,
  "two_factor_method": "app",
  "notification_preferences": {
    "email": {
      "newMessages": true,
      "interviewReminders": true,
      "weeklyReports": true,
      "marketingEmails": false
    },
    "push": {
      "newMessages": true,
      "interviewReminders": true,
      "candidateUpdates": true,
      "teamNotifications": true
    },
    "desktop": {
      "newMessages": true,
      "interviewReminders": true,
      "candidateUpdates": false,
      "teamNotifications": true
    }
  },
  "integrations": [
    {
      "id": "calendar",
      "connected": true,
      "connected_at": "2023-02-10T14:22:00Z"
    },
    {
      "id": "slack",
      "connected": false,
      "connected_at": null
    }
  ],
  "login_history": [
    {
      "timestamp": "2023-03-20T09:15:00Z",
      "device": "Chrome/Windows",
      "location": "Paris, France",
      "status": "success"
    },
    {
      "timestamp": "2023-03-18T16:42:00Z",
      "device": "Firefox/Windows",
      "location": "Paris, France",
      "status": "success"
    }
  ]
}
```

## Modèles de Réponse pour l'Authentification à Deux Facteurs

### Initialisation de la 2FA

```json
{
  "qrCode": "base64_encoded_qr_code_image",
  "secretKey": "JBSWY3DPEHPK3PXP",
  "backupCodes": [
    "12345678",
    "23456789",
    "34567890",
    "45678901",
    "56789012",
    "67890123",
    "78901234",
    "89012345"
  ],
  "method": "app"
}
```

### Vérification de Code 2FA

```json
{
  "success": true,
  "message": "Authentification à deux facteurs activée avec succès"
}
```