from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Float, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class TrainingStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TrainingProvider(enum.Enum):
    LOCAL = "local"
    RUNPOD = "runpod"
    FAL = "fal"

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

    # Cloud integration fields
    provider = Column(Enum(TrainingProvider), default=TrainingProvider.LOCAL)
    cloud_pod_id = Column(String(200))  # RunPod pod ID or fal.ai job ID
    cloud_metadata = Column(JSON)  # Additional cloud provider metadata

    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
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
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class DeploymentStatus(enum.Enum):
    PENDING = "pending"
    UPLOADING = "uploading"
    DEPLOYED = "deployed"
    FAILED = "failed"

class ModelDeployment(Base):
    __tablename__ = "model_deployments"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), nullable=False, index=True)
    training_job_id = Column(Integer, ForeignKey("training_jobs.id"), nullable=True)
    provider = Column(String(50), nullable=False)  # "fal", "huggingface", etc.
    status = Column(Enum(DeploymentStatus), default=DeploymentStatus.PENDING)
    lora_url = Column(String(500))  # URL to the deployed LoRA model
    endpoint_url = Column(String(500))  # API endpoint for inference
    trigger_word = Column(String(100))
    deployment_metadata = Column(JSON)  # Additional deployment metadata
    deployed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    deployed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    deployer = relationship("User")
