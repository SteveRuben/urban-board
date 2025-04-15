from ..models.audit_log import AuditLog
from app import db

class AuditService:
    def log_action(self, organization_id, user_id, action, entity_type, entity_id=None, 
                   description=None, metadata=None, request=None):
        """
        Enregistre une action dans les logs d'audit.
        
        Args:
            organization_id: ID de l'organisation
            user_id: ID de l'utilisateur (peut être None pour actions système)
            action: Type d'action (create, update, delete, login, etc.)
            entity_type: Type d'entité concernée (user, interview, invitation, etc.)
            entity_id: ID de l'entité concernée (optionnel)
            description: Description détaillée de l'action (optionnel)
            metadata: Données supplémentaires au format JSON (optionnel)
            request: Objet request Flask pour extraire IP et User-Agent (optionnel)
        """
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', '')
        
        audit_log = AuditLog(
            organization_id=organization_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            metadata=metadata,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.session.add(audit_log)
        db.session.commit()
        
        return audit_log
    
    def get_organization_logs(self, organization_id, filters=None, page=1, per_page=50):
        """
        Récupère les logs d'audit d'une organisation avec possibilité de filtrage.
        """
        query = AuditLog.query.filter_by(organization_id=organization_id)
        
        if filters:
            if 'user_id' in filters:
                query = query.filter_by(user_id=filters['user_id'])
            if 'action' in filters:
                query = query.filter_by(action=filters['action'])
            if 'entity_type' in filters:
                query = query.filter_by(entity_type=filters['entity_type'])
            if 'entity_id' in filters:
                query = query.filter_by(entity_id=filters['entity_id'])
            if 'date_from' in filters:
                query = query.filter(AuditLog.created_at >= filters['date_from'])
            if 'date_to' in filters:
                query = query.filter(AuditLog.created_at <= filters['date_to'])
                
        # Tri par date (plus récent d'abord)
        query = query.order_by(AuditLog.created_at.desc())
        
        # Pagination
        paginated_logs = query.paginate(page=page, per_page=per_page)
        
        return paginated_logs
    
    def get_entity_history(self, organization_id, entity_type, entity_id):
        """
        Récupère l'historique complet d'une entité spécifique.
        """
        return AuditLog.query.filter_by(
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id
        ).order_by(AuditLog.created_at).all()