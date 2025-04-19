# backend/services/organization_service.py
from datetime import datetime
from models.organization import Organization, OrganizationDomain, OrganizationMember
from models.user import User
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import re
from app import db

class OrganizationService:
   
    
    def create_organization(self, name: str, user_id: str) -> Organization:
        """Crée une nouvelle organisation et ajoute l'utilisateur comme propriétaire"""
        # Générer un slug à partir du nom
        slug = re.sub(r'[^a-z0-9]', '-', name.lower())
        slug = re.sub(r'-+', '-', slug).strip('-')
        
        # Vérifier si le slug existe déjà et ajouter un suffixe si nécessaire
        base_slug = slug
        count = 1
        while self.get_organization_by_slug(slug):
            slug = f"{base_slug}-{count}"
            count += 1
        
        # Créer l'organisation
        organization = Organization(
            id=str(uuid.uuid4()),
            name=name,
            slug=slug,
        )
        db.add(organization)
        
        # Ajouter l'utilisateur comme propriétaire
        member = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=organization.id,
            user_id=user_id,
            role="owner"
        )
        db.add(member)
        
        # Mettre à jour l'organisation active de l'utilisateur
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.current_organization_id = organization.id
        
        db.commit()
        return organization
    
    def get_organization_by_id(self, organization_id: str) -> Optional[Organization]:
        return db.query(Organization).filter(Organization.id == organization_id).first()
    
    def get_organization_by_slug(self, slug: str) -> Optional[Organization]:
        return db.query(Organization).filter(Organization.slug == slug).first()
    
    def get_organizations_for_user(self, user_id: str) -> List[Organization]:
        members = db.query(OrganizationMember).filter(
            OrganizationMember.user_id == user_id
        ).all()
        return [member.organization for member in members]
    
    def add_domain(self, organization_id: str, domain: str, is_primary: bool = False) -> OrganizationDomain:
        """Ajoute un domaine à une organisation"""
        # Vérifier si le domaine existe déjà
        existing = db.query(OrganizationDomain).filter(
            OrganizationDomain.domain == domain
        ).first()
        
        if existing:
            raise ValueError(f"Le domaine {domain} est déjà utilisé par une autre organisation")
        
        # Si c'est le domaine principal, mettre à jour les autres domaines
        if is_primary:
            db.query(OrganizationDomain).filter(
                OrganizationDomain.organization_id == organization_id,
                OrganizationDomain.is_primary == True
            ).update({"is_primary": False})
        
        # Créer le nouveau domaine
        verification_token = str(uuid.uuid4())
        domain_entry = OrganizationDomain(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            domain=domain,
            is_primary=is_primary,
            verification_token=verification_token
        )
        
        db.add(domain_entry)
        db.commit()
        return domain_entry
    
    def verify_domain(self, domain_id: str, token: str) -> bool:
        """Vérifie un domaine avec le token de vérification"""
        domain_entry = db.query(OrganizationDomain).filter(
            OrganizationDomain.id == domain_id
        ).first()
        
        if not domain_entry:
            return False
        
        if domain_entry.verification_token == token:
            domain_entry.is_verified = True
            db.commit()
            return True
            
        return False
    
    def is_member(self, organization_id: str, user_id: str) -> bool:
        """Vérifie si un utilisateur est membre d'une organisation"""
        member = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id
        ).first()
        
        return member is not None

    def get_organization_by_domain(self, domain: str) -> Optional[Organization]:
        """Obtient l'organisation correspondant à un domaine"""
        domain_entry = db.query(OrganizationDomain).filter(
            OrganizationDomain.domain == domain,
            OrganizationDomain.is_verified == True
        ).first()
        
        return domain_entry.organization if domain_entry else None
    
    def add_member(self, organization_id: str, user_id: str, role: str = "member") -> OrganizationMember:
        """Ajoute un membre à l'organisation"""
        # Vérifier que l'utilisateur n'est pas déjà membre
        existing = db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id
        ).first()
        
        if existing:
            # Mettre à jour le rôle si nécessaire
            if existing.role != role:
                existing.role = role
                db.commit()
            return existing
        
        # Ajouter le nouveau membre
        member = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            user_id=user_id,
            role=role
        )
        
        db.add(member)
        db.commit()
        return member
    
    def remove_member(self, organization_id: str, user_id: str) -> bool:
        """Supprime un membre de l'organisation"""
        member = self.db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id
        ).first()
        
        if not member:
            return False
        
        # Vérifier qu'il ne s'agit pas du dernier propriétaire
        if member.role == "owner":
            owner_count = self.db.query(OrganizationMember).filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.role == "owner"
            ).count()
            
            if owner_count <= 1:
                raise ValueError("Impossible de supprimer le dernier propriétaire de l'organisation")
        
        db.delete(member)
        db.commit()
        return True
    
    def update_member_role(self, organization_id: str, user_id: str, new_role: str) -> bool:
        """Met à jour le rôle d'un membre"""
        member = self.db.query(OrganizationMember).filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id
        ).first()
        
        if not member:
            return False
        
        # Vérifier qu'il ne s'agit pas du dernier propriétaire
        if member.role == "owner" and new_role != "owner":
            owner_count = db.query(OrganizationMember).filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.role == "owner"
            ).count()
            
            if owner_count <= 1:
                raise ValueError("Impossible de rétrograder le dernier propriétaire de l'organisation")
        
        member.role = new_role
        db.commit()
        return True
    
    def update_organization(self, organization_id: str, name: str = None, logo_url: str = None, 
                           is_active: bool = None) -> Optional[Organization]:
        """Met à jour les informations d'une organisation"""
        organization = self.get_organization_by_id(organization_id)
        
        if not organization:
            return None
        
        if name is not None:
            organization.name = name
        
        if logo_url is not None:
            organization.logo_url = logo_url
            
        organization.updated_at = datetime.utcnow()
            
        if is_active is not None:
            organization.is_active = is_active
            
        db.commit()
        return organization