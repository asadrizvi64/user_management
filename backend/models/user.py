# models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class UserRole(enum.Enum):
    """
    User role hierarchy:
    - SUPER_ADMIN: System administrator (you) - can manage all organizations and users
    - ADMIN: Organization admin (your clients) - can manage workers in their organization
    - WORKER: Worker/Artist (created by admins) - uses the image generator tool
    """
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    WORKER = "worker"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.WORKER)
    is_active = Column(Boolean, default=True)

    # Multi-tenant fields
    # Super admins have organization_id = NULL
    # Admins and workers belong to an organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)

    # Track who created this user (for workers created by admins)
    # Super admin and first admins will have created_by = NULL
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    creator = relationship("User", remote_side=[id], backref="created_users")

    products = relationship("Product", back_populates="creator")
    generations = relationship("Generation", back_populates="user")
    training_jobs = relationship("TrainingJob", back_populates="creator")