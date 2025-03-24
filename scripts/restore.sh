#!/bin/bash

# Vérification des arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <nom_fichier_backup>"
    exit 1
fi

# Configuration
BACKUP_DIR="/opt/backups/recrute-ia"
DB_CONTAINER="recrute-ia_db_1"
POSTGRES_USER="$DB_USER"
POSTGRES_DB="$DB_NAME"
BACKUP_FILE="$1"
TEMP_DIR="/tmp/restore_temp"

# Vérification que le fichier de sauvegarde existe
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "Erreur: Le fichier de sauvegarde '$BACKUP_DIR/$BACKUP_FILE' n'existe pas."
    exit 1
fi

# Création du répertoire temporaire
mkdir -p "$TEMP_DIR"

# Décompression de la sauvegarde
echo "Décompression de la sauvegarde..."
tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C "$TEMP_DIR"

# Extraction du fichier dump de la base de données
DB_DUMP=$(find "$TEMP_DIR" -name "database_*.dump" | sort -r | head -n1)
if [ -z "$DB_DUMP" ]; then
    echo "Erreur: Aucun fichier de dump de base de données trouvé dans la sauvegarde."
    exit 1
fi

# Restauration de la base de données
echo "Restauration de la base de données PostgreSQL..."
docker cp "$DB_DUMP" "$DB_CONTAINER":/tmp/restore.dump
docker exec "$DB_CONTAINER" bash -c "pg_restore -U $POSTGRES_USER -d $POSTGRES_DB -c /tmp/restore.dump"
docker exec "$DB_CONTAINER" rm /tmp/restore.dump

# Restauration des volumes (si nécessaire)
echo "Restauration des volumes..."
POSTGRES_DATA=$(find "$TEMP_DIR" -name "postgres_data_*.tar.gz" | sort -r | head -n1)
if [ -n "$POSTGRES_DATA" ]; then
    echo "Attention: Restaurer le volume postgres_data nécessite d'arrêter les services."
    read -p "Voulez-vous continuer? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Arrêt des services..."
        docker-compose down
        echo "Restauration des données PostgreSQL..."
        docker run --rm -v recrute-ia_postgres_data:/target -v "$POSTGRES_DATA":/backup.tar.gz alpine sh -c "rm -rf /target/* && tar -xzf /backup.tar.gz -C /target"
        echo "Redémarrage des services..."
        docker-compose up -d
    fi
fi

# Nettoyage
echo "Nettoyage des fichiers temporaires..."
rm -rf "$TEMP_DIR"

echo "Restauration terminée avec succès!"