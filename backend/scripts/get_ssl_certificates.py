#!/usr/bin/env python3
# scripts/get_ssl_certificates.py

import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import subprocess

# Adaptez ce chemin pour importer vos modèles
sys.path.append('.')
from ..app.models.organization import OrganizationDomain

# Configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost/recrute_ia')
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def get_certificate(domain_name):
    """Obtient un certificat SSL pour un domaine en utilisant certbot"""
    cmd = [
        'certbot', 'certonly',
        '--nginx',  # Utilisez le plugin Nginx
        '--non-interactive',
        '--agree-tos',
        '-m',  os.environ.get('ADMIN_MAIL','admin@recrute-ia.com'),  # Adresse email pour les notifications
        '-d', domain_name
    ]
    
    print(f"Getting certificate for {domain_name}...")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"Success: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        return False

def main():
    """Fonction principale qui obtient des certificats pour tous les domaines vérifiés"""
    # Récupérer tous les domaines vérifiés
    domains = session.query(OrganizationDomain).filter(
        OrganizationDomain.is_verified == True
    ).all()
    
    success_count = 0
    for domain in domains:
        if get_certificate(domain.domain):
            success_count += 1
    
    print(f"Successfully obtained certificates for {success_count} out of {len(domains)} domains")
    
    # Si des certificats ont été obtenus, regénérer les configurations Nginx
    if success_count > 0:
        os.system('generate_domain_configs.py')

if __name__ == "__main__":
    main()