#!/usr/bin/env python3
# scripts/generate_domain_configs.py

import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from pathlib import Path

# Adaptez ce chemin pour importer vos modèles
sys.path.append('.')
from ..app.models.organization import OrganizationDomain

# Configuration
NGINX_CUSTOM_DOMAINS_DIR = '/etc/nginx/conf.d/custom-domains'
SSL_CERT_DIR = '/etc/letsencrypt/live'
BACKEND_SERVICE = 'http://localhost:8000'

# Connexion à la base de données
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost/recrute_ia')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def generate_domain_config(domain_name):
    """Génère un fichier de configuration Nginx pour un domaine personnalisé"""
    
    # Vérifier si les certificats existent
    ssl_cert_path = Path(f"{SSL_CERT_DIR}/{domain_name}/fullchain.pem")
    ssl_key_path = Path(f"{SSL_CERT_DIR}/{domain_name}/privkey.pem")
    
    has_ssl = ssl_cert_path.exists() and ssl_key_path.exists()
    
    # Créer le contenu de la configuration
    if has_ssl:
        # Configuration avec HTTPS
        config = f"""
            server {{
                listen 80;
                listen [::]:80;
                server_name {domain_name};
                
                # Redirection vers HTTPS
                location / {{
                    return 301 https://$host$request_uri;
                }}
            }}

            server {{
                listen 443 ssl http2;
                listen [::]:443 ssl http2;
                server_name {domain_name};
                
                # Certificats SSL
                ssl_certificate {ssl_cert_path};
                ssl_certificate_key {ssl_key_path};
                include /etc/letsencrypt/options-ssl-nginx.conf;
                ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
                
                # Proxy vers l'application
                location / {{
                    proxy_pass {BACKEND_SERVICE};
                    proxy_set_header Host $host;
                    proxy_set_header X-Real-IP $remote_addr;
                    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                    proxy_set_header X-Forwarded-Proto $scheme;
                }}
            }}
            """
    else:
        # Configuration sans HTTPS (HTTP uniquement)
        config = f"""
                server {{
                    listen 80;
                    listen [::]:80;
                    server_name {domain_name};
                    
                    # Proxy vers l'application
                    location / {{
                        proxy_pass {BACKEND_SERVICE};
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                        proxy_set_header X-Forwarded-Proto $scheme;
                    }}
                }}
                """
    
    # Écrire le fichier de configuration
    config_path = Path(f"{NGINX_CUSTOM_DOMAINS_DIR}/{domain_name.replace('.', '_')}.conf")
    config_path.write_text(config)
    print(f"Generated configuration for {domain_name}")
    return config_path

def main():
    """Fonction principale qui génère les configurations pour tous les domaines vérifiés"""
    # Créer le répertoire s'il n'existe pas
    Path(NGINX_CUSTOM_DOMAINS_DIR).mkdir(parents=True, exist_ok=True)
    
    # Récupérer tous les domaines vérifiés
    domains = session.query(OrganizationDomain).filter(
        OrganizationDomain.is_verified == True
    ).all()
    
    # Supprimer les anciennes configurations
    for old_config in Path(NGINX_CUSTOM_DOMAINS_DIR).glob('*.conf'):
        old_config.unlink()
        print(f"Removed old configuration: {old_config}")
    
    # Générer les nouvelles configurations
    configs = []
    for domain in domains:
        config_path = generate_domain_config(domain.domain)
        configs.append(config_path)
    
    print(f"Generated {len(configs)} domain configurations")
    
    # Tester la configuration Nginx
    test_result = os.system('nginx -t')
    if test_result == 0:
        print("Nginx configuration test successful")
        # Recharger Nginx
        os.system('nginx -s reload')
        print("Nginx reloaded successfully")
    else:
        print("ERROR: Nginx configuration test failed")
        print("Reverting changes...")
        # Supprimer les configurations qui ont été générées
        for config in configs:
            config.unlink()
        print("Changes reverted")

if __name__ == "__main__":
    main()