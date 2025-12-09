from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class AccessLevel(enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    trigger_word = Column(String(100), nullable=False)
    model_path = Column(String(500))  # Path to trained model file
    access_level = Column(Enum(AccessLevel), default=AccessLevel.PUBLIC)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Multi-tenant field - products belong to an organization
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="products")
    organization = relationship("Organization", back_populates="products")
    generations = relationship("Generation", back_populates="product")
