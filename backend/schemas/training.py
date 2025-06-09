from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from models.training import TrainingStatus

class TrainingParams(BaseModel):
    resolution: int = Field(512, ge=256, le=1024)
    seed: int = Field(42, ge=0)
    workers: int = Field(2, ge=1, le=8)
    learning_rate: str = Field("8e-4")
    network_dim: int = Field(4, ge=4, le=128)
    max_train_epochs: int = Field(16, ge=1, le=100)
    save_every_n_epochs: int = Field(4, ge=1)
    timestep_sampling: str = Field("shift")
    guidance_scale: float = Field(1.0, ge=0.1, le=10.0)
    vram: str = Field("20G")
    num_repeats: int = Field(10, ge=1, le=100)
    sample_every_n_steps: int = Field(0, ge=0)

class TrainingJobCreate(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=100)
    base_model: str
    trigger_word: str = Field(..., min_length=1, max_length=100)
    training_params: TrainingParams
    images: List[str]  # Image file paths
    captions: List[str]

class TrainingJobResponse(BaseModel):
    id: int
    product_name: str
    status: TrainingStatus
    progress: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    message: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class TrainingProgress(BaseModel):
    step: int
    total_steps: int
    status: str
    message: str
    epoch: Optional[int] = None
    loss: Optional[float] = None

class AutoCaptionRequest(BaseModel):
    trigger_word: Optional[str] = ""

class AutoCaptionResponse(BaseModel):
    captions: List[str]
    count: int
