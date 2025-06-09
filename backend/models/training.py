from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class TrainingStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True)  # UUID for external tracking
    product_name = Column(String(100), nullable=False)
    base_model = Column(String(100), nullable=False)
    trigger_word = Column(String(100), nullable=False)
    config = Column(JSON)  # Training parameters
    status = Column(Enum(TrainingStatus), default=TrainingStatus.PENDING)
    progress = Column(Float, default=0.0)  # 0-100
    message = Column(Text)  # Status message
    logs = Column(Text)  # Training logs
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relationships
    creator = relationship("User", back_populates="training_jobs")

class TrainingDataset(Base):
    __tablename__ = "training_datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    training_job_id = Column(Integer, ForeignKey("training_jobs.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    caption = Column(Text, nullable=False)
    uploaded_at = Column(DateTime)
