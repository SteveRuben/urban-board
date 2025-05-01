Pour intégrer Google Meet et automatiser l'envoi de notifications par email lors de la planification d'entretiens, 
voici une approche structurée:

# Architecture de l'intégration

## Utilisation de l'API Google Calendar

Google Meet est intégré nativement à Google Calendar
Les réunions Google Meet sont créées via l'API Google Calendar

## Flux d'intégration

 - Création de l'entretien dans RecruteIA
 - Génération automatique d'une réunion Google Meet via l'API
 - Récupération du lien de la réunion
 - Ajout du lien dans l'email de notification

## Étapes d'implémentation technique
1. Configuration Google Workspace / Cloud Platform

    Créer un projet dans Google Cloud Console
    Activer l'API Google Calendar
    Configurer les identifiants OAuth 2.0
    Définir les scopes nécessaires (calendar, calendar.events)

2. Développement backend
3. Intégration avec votre système d'emails existant
4. Mise à jour du modèle de données
5. Mise à jour des templates d'email