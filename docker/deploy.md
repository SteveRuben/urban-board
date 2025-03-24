2. Pour le serveur de production
Lorsque vous déployez sur le serveur de production, voici l'organisation typique

/opt/recrute-ia/
├── app/                    # Application déployée
│   ├── docker-compose.yml
│   ├── docker-compose.monitoring.yml
│   ├── .env                # Variables d'environnement réelles
│   └── config/             # Copie des fichiers de configuration
├── scripts/
│   ├── backup.sh
│   ├── restore.sh
│   └── security_audit.sh
├── backups/                # Dossier pour les sauvegardes
├── nginx/
│   ├── ssl/                # Certificats SSL
│   │   ├── recrute-ia.crt
│   │   ├── recrute-ia.key
│   │   └── dhparam.pem
└── logs/                   # Logs consolidés