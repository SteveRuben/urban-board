# backend/models/organization.py
from datetime import datetime
import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app import db

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses
    CHAR(36), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            return uuid.UUID(value)


class Organization(db.Model):
    __tablename__ = 'organizations'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    trial_ends_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Initialize relationships
    domains = None
    members = None
    ai_assistants = None
    job_postings = None  # Add this line
    
    
    def __repr__(self):
        return f"<Organization {self.name}>"


class OrganizationDomain(db.Model):
    __tablename__ = "organization_domains"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    organization = None
    
    __table_args__ = (
        UniqueConstraint('domain', name='uq_organization_domain'),
    )
    
    def __repr__(self):
        return f"<OrganizationDomain {self.domain}>"


class OrganizationMember(db.Model):
    __tablename__ = "organization_members"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    organization = None
    user = None
    
    __table_args__ = (
        UniqueConstraint('organization_id', 'user_id', name='uq_org_member'),
    )
    
    def __repr__(self):
        return f"<OrganizationMember {self.organization_id}:{self.user_id}>"


# Set up relationships after all models are defined
#def setup_relationships():
#    from ..models.user import User  # Import here to avoid circular imports
#    
#    OrganizationDomain.organization = db.relationship(Organization, back_populates="domains")
#    OrganizationMember.organization = db.relationship(
#        "Organization", 
#        back_populates="members"
#    )
#    OrganizationMember.user = db.relationship(
#        User,
#        back_populates="organizations"
#    )
#    
#    Organization.domains = db.relationship(OrganizationDomain, 
#                                     back_populates="organization", 
#                                     cascade="all, delete-orphan")
#    Organization.members = db.relationship(OrganizationMember,
#                                     back_populates="organization",
#                                     cascade="all, delete-orphan")

def setup_organization_relationships():
    """Fonction pour configurer les relations après l'initialisation des modèles"""
    from .user import User
    from .ai_assistant import AIAssistant
    
    # Configuration des relations pour Organization
    Organization.domains = relationship(
        "OrganizationDomain", 
        back_populates="organization", 
        cascade="all, delete-orphan"
    )
    Organization.members = relationship(
        "OrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan"
    )
    
    Organization.ai_assistants = relationship(
        "AIAssistant",
        back_populates="organization",
        foreign_keys="AIAssistant.organization_id",
        cascade="all, delete-orphan"
    )
    
    # Add this relationship configuration
    Organization.job_postings = relationship(
        "JobPosting",
        back_populates="organization",
        cascade="all, delete-orphan"
    )
    
    # Configuration des relations pour OrganizationDomain
    OrganizationDomain.organization = relationship(
        "Organization", 
        back_populates="domains"
    )
    
    # Configuration des relations pour OrganizationMember
    OrganizationMember.organization = relationship(
        "Organization", 
        back_populates="members"
    )
    OrganizationMember.user = relationship(
        User,
        back_populates="organizations"
    )

    

