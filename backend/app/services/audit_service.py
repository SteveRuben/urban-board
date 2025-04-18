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
            if 'date_from' in filters and filters['date_from']:
                from datetime import datetime
                try:
                    date_from = datetime.fromisoformat(filters['date_from'])
                    query = query.filter(AuditLog.created_at >= date_from)
                except ValueError:
                    pass
            
            if 'date_to' in filters and filters['date_to']:
                from datetime import datetime
                try:
                    date_to = datetime.fromisoformat(filters['date_to'])
                    query = query.filter(AuditLog.created_at <= date_to)
                except ValueError:
                    pass
            
            if 'search' in filters and filters['search']:
                search = f"%{filters['search']}%"
                query = query.filter(AuditLog.description.ilike(search))
                
        # Tri par date (plus récent d'abord)
        query = query.order_by(AuditLog.created_at.desc())
        
        # Pagination
        paginated_logs = query.paginate(page=page, per_page=per_page)
        
        return paginated_logs
    
    def get_entity_history(self, organization_id, entity_type, entity_id):
        """
        Récupère l'historique complet d'une entité spécifique.
        
        Args:
            organization_id: ID de l'organisation
            entity_type: Type d'entité (user, interview, invitation, etc.)
            entity_id: ID de l'entité
            
        Returns:
            Liste des logs concernant cette entité, triés par date
        """
        return AuditLog.query.filter_by(
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id
        ).order_by(AuditLog.created_at).all()
    
    def get_user_actions(self, organization_id, user_id, page=1, per_page=50):
        """
        Récupère toutes les actions d'un utilisateur spécifique.
        
        Args:
            organization_id: ID de l'organisation
            user_id: ID de l'utilisateur
            page: Numéro de page pour la pagination (par défaut: 1)
            per_page: Nombre d'éléments par page (par défaut: 50)
            
        Returns:
            Objet de pagination contenant les logs
        """
        query = AuditLog.query.filter_by(
            organization_id=organization_id,
            user_id=user_id
        ).order_by(AuditLog.created_at.desc())
        
        return query.paginate(page=page, per_page=per_page)
    
    def get_recent_actions(self, organization_id, limit=10):
        """
        Récupère les actions les plus récentes d'une organisation.
        
        Args:
            organization_id: ID de l'organisation
            limit: Nombre maximum d'actions à récupérer (par défaut: 10)
            
        Returns:
            Liste des logs les plus récents
        """
        return AuditLog.query.filter_by(
            organization_id=organization_id
        ).order_by(AuditLog.created_at.desc()).limit(limit).all()
    
    def export_logs(self, organization_id, filters=None, format='csv'):
        """
        Exporte les logs d'audit d'une organisation dans un format spécifique.
        
        Args:
            organization_id: ID de l'organisation
            filters: Dictionnaire de filtres (optionnel)
            format: Format d'export ('csv' ou 'json', par défaut: 'csv')
            
        Returns:
            Données au format demandé
        """
        # Récupérer tous les logs sans pagination
        query = AuditLog.query.filter_by(organization_id=organization_id)
        
        if filters:
            if 'user_id' in filters and filters['user_id']:
                query = query.filter_by(user_id=filters['user_id'])
            
            if 'action' in filters and filters['action']:
                query = query.filter_by(action=filters['action'])
            
            if 'entity_type' in filters and filters['entity_type']:
                query = query.filter_by(entity_type=filters['entity_type'])
            
            if 'date_from' in filters and filters['date_from']:
                from datetime import datetime
                try:
                    date_from = datetime.fromisoformat(filters['date_from'])
                    query = query.filter(AuditLog.created_at >= date_from)
                except ValueError:
                    pass
            
            if 'date_to' in filters and filters['date_to']:
                from datetime import datetime
                try:
                    date_to = datetime.fromisoformat(filters['date_to'])
                    query = query.filter(AuditLog.created_at <= date_to)
                except ValueError:
                    pass
        
        logs = query.order_by(AuditLog.created_at.desc()).all()
        
        if format.lower() == 'json':
            return json.dumps([log.to_dict() for log in logs])
        
        # Format CSV par défaut
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # En-têtes
        writer.writerow([
            'ID', 'Date', 'Utilisateur', 'Email', 'Action', 'Type Entité', 
            'ID Entité', 'Description', 'Adresse IP'
        ])
        
        # Données
        for log in logs:
            user_name = log.user.name if log.user else 'Système'
            user_email = log.user.email if log.user else '-'
            
            writer.writerow([
                log.id,
                log.created_at.isoformat(),
                user_name,
                user_email,
                log.action,
                log.entity_type,
                log.entity_id or '-',
                log.description,
                log.ip_address or '-'
            ])
        
        return output.getvalue()
    
    def purge_old_logs(self, organization_id, days_to_keep=365):
        """
        Supprime les logs d'audit plus anciens qu'une certaine durée.
        
        Args:
            organization_id: ID de l'organisation
            days_to_keep: Nombre de jours à conserver (par défaut: 365)
            
        Returns:
            Nombre de logs supprimés
        """
        from datetime import datetime, timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        # Compter les logs à supprimer
        count_to_delete = AuditLog.query.filter(
            AuditLog.organization_id == organization_id,
            AuditLog.created_at < cutoff_date
        ).count()
        
        # Supprimer les logs
        if count_to_delete > 0:
            AuditLog.query.filter(
                AuditLog.organization_id == organization_id,
                AuditLog.created_at < cutoff_date
            ).delete()
            
            db.session.commit()
        
        return count_to_delete