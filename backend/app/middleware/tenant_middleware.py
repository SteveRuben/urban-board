# backend/middlewares/tenant_middleware.py
from flask import g, request
from functools import wraps
from services.organization_service import OrganizationService

def setup_tenant_middleware(app):
    """Configure le middleware de tenant pour l'application Flask"""
    
    @app.before_request
    def resolve_tenant():
        """Résout l'organisation à partir du domaine et l'ajoute au contexte g"""
        # Ignorer les requêtes d'assets statiques
        if request.path.startswith('/static/'):
            return
            
        host = request.host.split(':')[0]  # Enlever le port s'il est présent
        organization_service = OrganizationService()
        
        # Chercher l'organisation correspondant au domaine
        organization = organization_service.get_organization_by_domain(host)
        
        # Ajouter l'organisation au contexte global de Flask
        g.organization = organization

def get_current_organization():
    """Helper pour obtenir l'organisation courante depuis le contexte Flask"""
    from flask import g
    if hasattr(g, 'organization'):
        return g.organization
    return None

def organization_required(f):
    """Décorateur pour requérir une organisation valide"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import abort
        
        organization = get_current_organization()
        if not organization:
            abort(404, description="Organization not found")
        return f(*args, **kwargs)
    return decorated_function