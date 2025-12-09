from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.database import Base


class Organization(Base):
    """
    Organization/Tenant model for multi-tenant support.
    Each admin (client) belongs to an organization and can manage workers within it.
    """
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Contact information
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    # Status and limits
    is_active = Column(Boolean, default=True, nullable=False)
    max_workers = Column(Integer, default=10, nullable=False)  # Limit on number of workers
    max_storage_gb = Column(Integer, default=100, nullable=False)  # Storage limit

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    users = relationship("User", back_populates="organization")
    products = relationship("Product", back_populates="organization")
    generations = relationship("Generation", back_populates="organization")
    training_jobs = relationship("TrainingJob", back_populates="organization")
    reports = relationship("Report", back_populates="organization")

    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', active={self.is_active})>"
