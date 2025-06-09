from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Generation(Base):
    __tablename__ = "generations"
    
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text)
    product_id = Column(Integer, ForeignKey("products.id"))
    image_paths = Column(JSON)  # List of generated image paths
    parameters = Column(JSON)  # Generation parameters
    execution_time = Column(Float)  # In seconds
    cost = Column(Float)  # GPU cost
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="generations")
    product = relationship("Product", back_populates="generations")
