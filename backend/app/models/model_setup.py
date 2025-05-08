# backend/app/models/model_setup.py
from .user import setup_user_relationships
from .organization import setup_organization_relationships

def setup_all_relationships():
    """Call this function during application initialization"""

    setup_user_relationships()
    setup_organization_relationships()