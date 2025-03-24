# Configuration de sécurité pour RecruteIA en production

## 1. Sécurité du système d'exploitation

### Configuration du serveur Linux
```bash
# Mise à jour du système
apt update && apt upgrade -y

# Installation des packages de sécurité essentiels
apt install -y fail2ban ufw unattended-upgrades apparmor

# Configuration des mises à jour automatiques
dpkg-reconfigure -plow unattended-upgrades

# Configuration du pare-feu (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Configuration de fail2ban pour SSH
cat > /etc/fail2ban/jail.d/ssh.local << EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
EOF
systemctl restart fail2ban
```

### Sécurité SSH
```bash
# Éditer /etc/ssh/sshd_config
cat > /etc/ssh/sshd_config.d/hardening.conf << EOF
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 5
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers deployer
Protocol 2
EOF
systemctl restart sshd
```

## 2. Sécurité Docker

### Hardening de Docker
```bash
# Création d'un utilisateur dédié pour Docker
adduser --system --group --shell /bin/bash deployer
usermod -aG docker deployer

# Isolation des containers et limitation des ressources
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}
EOF
systemctl restart docker
```

### Sécurité docker-compose
Ajouter dans le fichier docker-compose.yml pour chaque service:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.50'
      memory: 512M
  restart_policy:
    condition: on-failure
    max_attempts: 3
  update_config:
    parallelism: 1
    delay: 10s
    order: start-first
```

## 3. Sécurité Nginx

### Configuration SSL/TLS
```nginx
# /etc/nginx/conf.d/ssl.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
ssl_dhparam /etc/nginx/ssl/dhparam.pem;  # Générer avec: openssl dhparam -out /etc/nginx/ssl/dhparam.pem 4096
```

### En-têtes de sécurité
```nginx
# /etc/nginx/conf.d/security-headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Permissions-Policy "camera=self, microphone=self, geolocation=(), payment=()" always;
```

## 4. Sécurité applicative

### Variables d'environnement
Créer un fichier `.env` sécurisé:

```bash
#!/bin/bash
# Script pour générer un fichier .env sécurisé
cat > .env << EOF
# Base de données
DB_USER=recrute_app
DB_PASSWORD=$(openssl rand -hex 16)
DB_NAME=recrute_ia_prod

# Clés d'API
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
ANTHROPIC_API_KEY=votre_clé_anthropic
OPENAI_API_KEY=votre_clé_openai

# Paramètres
CORS_ORIGINS=https://recrute-ia.com,https://www.recrute-ia.com
REDIS_URL=redis://redis:6379/0

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=$(openssl rand -hex 12)
EOF

# Sécuriser le fichier
chmod 600 .env
```

### Configuration sécurisée des cookies
Dans l'application Flask, ajouter:

```python
# Configuration des cookies sécurisés
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 heure
```

### Rate Limiting et protection CSRF
Vérifier que ces middlewares sont correctement activés:

```python
# app/middleware/rate_limiting.py
def configure_rate_limiting(app):
    limiter = Limiter(
        app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri=app.config['REDIS_URI']
    )
    
    # Définir des limites spécifiques pour les routes sensibles
    limiter.limit("5/minute")(app.route('/api/auth/login'))
    limiter.limit("3/minute")(app.route('/api/auth/register'))
    
    return limiter

# Protection CSRF
csrf = CSRFProtect()
csrf.init_app(app)
```

## 5. Sauvegarde et récupération en cas de sinistre

### Configuration des sauvegardes
```bash
# Créer un script de sauvegarde
cat > /opt/recrute-ia/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/recrute-ia"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
mkdir -p "$BACKUP_DIR"

# Sauvegarde des bases de données
docker exec recrute-ia_db_1 pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f /tmp/backup.dump
docker cp recrute-ia_db_1:/tmp/backup.dump "$BACKUP_DIR/db_$DATE.dump"

# Sauvegarde des données importantes
docker run --rm -v recrute-ia_postgres_data:/source -v "$BACKUP_DIR:/backup" alpine tar -czf "/backup/data_$DATE.tar.gz" -C /source .

# Rotation des sauvegardes (conserver 7 jours)
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +7 -delete
find "$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +7 -delete

# Optionnel: transfert vers stockage externe
# aws s3 sync "$BACKUP_DIR" "s3://recrute-ia-backups/"
EOF
chmod +x /opt/recrute-ia/backup.sh

# Ajouter au crontab pour exécution quotidienne
(crontab -l ; echo "0 2 * * * /opt/recrute-ia/backup.sh > /var/log/backup.log 2>&1") | crontab -
```

## 6. Monitoring et alertes

### Configuration de Prometheus pour la détection d'intrusions
Ajouter dans prometheus.yml:

```yaml
# Alertes pour tentatives d'intrusion
rule_files:
  - "/etc/prometheus/rules/security.yml"

# Configuration pour la détection de motifs d'accès anormaux
scrape_configs:
  - job_name: 'nginx_logs'
    static_configs:
      - targets: ['localhost:9913']  # Exporter pour logs nginx
    metric_relabel_configs:
      - source_labels: [http_status]
        regex: ^(4|5).*
        action: keep
```

### Fichier de règles d'alerte
```yaml
# /etc/prometheus/rules/security.yml
groups:
- name: security_alerts
  rules:
  - alert: HighErrorRate
    expr: sum(rate(nginx_http_requests_total{status=~"4.."}[5m])) / sum(rate(nginx_http_requests_total[5m])) > 0.05
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High HTTP error rate detected"
      description: "More than 5% of requests are returning 4xx errors"

  - alert: PossibleBruteForceAttack
    expr: sum(rate(nginx_http_requests_total{status="401"}[5m])) > 10
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Possible brute force attack detected"
      description: "High rate of 401 errors detected in the last 5 minutes"
```

## 7. Audit de sécurité régulier

### Script d'audit
```bash
#!/bin/bash
# /opt/recrute-ia/security_audit.sh

echo "== RecruteIA Security Audit =="
echo "Date: $(date)"
echo

echo "== Checking for outdated packages =="
apt list --upgradable

echo "== Docker security check =="
docker info | grep -E 'Logging Driver|Cgroup Driver|Swarm|AppArmor|Seccomp'

echo "== Open ports check =="
netstat -tulpn | grep LISTEN

echo "== Failed login attempts =="
grep "Failed password" /var/log/auth.log | tail -n 10

echo "== Docker container status =="
docker ps -a

echo "== Recent unusual activity in logs =="
grep -i "error\|warning\|fail" /var/log/syslog | tail -n 20

echo "== Disk space check =="
df -h

echo "== Memory usage =="
free -h

echo "== End of security audit =="
EOF
chmod +x /opt/recrute-ia/security_audit.sh

# Planifier un audit hebdomadaire
(crontab -l ; echo "0 8 * * 1 /opt/recrute-ia/security_audit.sh > /var/log/security_audit.log 2>&1") | crontab -
```

Cette configuration complète de sécurité permet de protéger l'application RecruteIA en environnement de production contre la plupart des menaces courantes et met en place un système de surveillance et d'audit régulier pour détecter rapidement les problèmes potentiels.