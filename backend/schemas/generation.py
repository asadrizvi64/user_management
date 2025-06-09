from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    negative_prompt: Optional[str] = ""
    product_id: Optional[int] = None
    num_images: int = Field(1, ge=1, le=4)
    aspect_ratio: str = Field("1:1", regex="^(1:1|16:9|9:16|4:3|3:4)$")
    guidance_scale: float = Field(7.5, ge=1.0, le=20.0)
    num_inference_steps: int = Field(50, ge=10, le=100)
    seed: Optional[int] = Field(None, ge=0)

class GenerationResponse(BaseModel):
    id: int
    prompt: str
    negative_prompt: Optional[str]
    product_id: Optional[int]
    image_paths: List[str]
    parameters: Dict[str, Any]
    execution_time: float
    cost: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True

class GenerationListResponse(BaseModel):
    generations: List[GenerationResponse]
    total: int
    skip: int
    limit: int