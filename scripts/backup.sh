#!/bin/bash

# Configuration
BACKUP_DIR="/opt/backups/recrute-ia"
DB_CONTAINER="recrute-ia_db_1"
POSTGRES_USER="$DB_USER"
POSTGRES_DB="$DB_NAME"
RETENTION_DAYS=7
DATE=$(date +%Y-%m-%d_%H-%M-%S)
S3_BUCKET="s3://recrute-ia-backups"

# Création du répertoire de backup si inexistant
mkdir -p "$BACKUP_DIR"

# Backup de la base de données
echo "Sauvegarde de la base de données PostgreSQL..."
docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f /tmp/database.dump
docker cp "$DB_CONTAINER":/tmp/database.dump "$BACKUP_DIR/database_$DATE.dump"
docker exec "$DB_CONTAINER" rm /tmp/database.dump

# Backup des volumes importants
echo "Sauvegarde des volumes..."
docker run --rm -v recrute-ia_postgres_data:/source -v "$BACKUP_DIR":/backup alpine tar -czf "/backup/postgres_data_$DATE.tar.gz" -C /source .
docker run --rm -v recrute-ia_backend_logs:/source -v "$BACKUP_DIR":/backup alpine tar -czf "/backup/backend_logs_$DATE.tar.gz" -C /source .

# Compression des sauvegardes
echo "Compression de toutes les sauvegardes..."
tar -czf "$BACKUP_DIR/full_backup_$DATE.tar.gz" -C "$BACKUP_DIR" .

# Synchronisation avec S3 (si AWS CLI est configuré)
if command -v aws &> /dev/null; then
    echo "Envoi des sauvegardes vers S3..."
    aws s3 cp "$BACKUP_DIR/full_backup_$DATE.tar.gz" "$S3_BUCKET/"
fi

# Suppression des anciennes sauvegardes
echo "Nettoyage des anciennes sauvegardes..."
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Sauvegarde terminée avec succès!"