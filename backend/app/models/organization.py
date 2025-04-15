# backend/models/organisation.py
from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app import db

class Organization(db.Model):
    __tablename__ = 'organisations'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Plan et facturation
    plan = Column(String(50), default="free")
    trial_ends_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relations
    domains = relationship("OrganizationDomain", back_populates="organization", cascade="all, delete-orphan")
    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    ai_assistants = relationship("AIAssistant", back_populates="organization")
    
    def __repr__(self):
        return f"<Organization {self.name}>"


class OrganizationDomain(db.Model):
    __tablename__ = "organization_domains"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    organization = relationship("Organization", back_populates="domains")
    
    # Contraintes
    __table_args__ = (
        UniqueConstraint('domain', name='uq_organization_domain'),
    )
    
    def __repr__(self):
        return f"<OrganizationDomain {self.domain}>"


class OrganizationMember(db.Model):
    __tablename__ = "organization_members"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member")  # member, admin, owner
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relations
    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="organizations")
    
    # Contraintes
    __table_args__ = (
        UniqueConstraint('organization_id', 'user_id', name='uq_org_member'),
    )
    
    def __repr__(self):
        return f"<OrganizationMember {self.organization_id}:{self.user_id}>"