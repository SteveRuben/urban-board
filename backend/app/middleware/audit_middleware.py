import functools

from flask import request

from ..services.audit_service import AuditService

from .auth_middleware import get_current_user


def audit_action(action, entity_type, description_template=None):
    """
    Décorateur pour auditer automatiquement les méthodes des services.
    
    Usage:
    @audit_action('create', 'invitation', 'Invitation envoyée à {email}')
    def create_invitation(self, organization_id, email, ...):
        ...
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            # Exécution de la méthode originale
            result = func(self, *args, **kwargs)
            
            # Récupération des informations pour l'audit
            # La structure exacte dépend de vos conventions de méthodes
            try:
                # Supposons que organization_id est toujours le premier argument
                organization_id = args[0]
                
                # Pour user_id, on peut soit le passer explicitement, soit l'obtenir du contexte
                user_id = kwargs.get('created_by') or kwargs.get('user_id') or get_current_user().id
                
                # Pour entity_id, on peut le récupérer du résultat si c'est un objet
                entity_id = getattr(result, 'id', None)
                if entity_id is None and isinstance(result, dict):
                    entity_id = result.get('id')
                
                # Préparation de la description
                description = description_template
                if description_template:
                    # Formatage de la description avec les arguments et le résultat
                    format_args = {**kwargs}
                    if isinstance(result, dict):
                        format_args.update(result)
                    elif hasattr(result, '__dict__'):
                        format_args.update(result.__dict__)
                    description = description_template.format(**format_args)
                
                # Création du log d'audit
                audit_service = AuditService()
                audit_service.log_action(
                    organization_id=organization_id,
                    user_id=user_id,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    description=description,
                    request=request
                )
            except Exception as e:
                # Log l'erreur mais ne perturbe pas l'exécution normale
                print(f"Erreur lors de l'audit: {str(e)}")
            
            return result
        return wrapper
    return decorator