from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from app.database import Base

# Base = declarative_base()

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
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    creator = relationship("User", back_populates="products")
    generations = relationship("Generation", back_populates="product")
