from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from models.product import AccessLevel

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    trigger_word: str = Field(..., min_length=1, max_length=100)
    access_level: AccessLevel = AccessLevel.PUBLIC

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    trigger_word: Optional[str] = Field(None, min_length=1, max_length=100)
    access_level: Optional[AccessLevel] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    trigger_word: str
    access_level: AccessLevel
    model_path: Optional[str]
    created_by: int
    created_at: datetime
    status: str  # "ready", "pending", "training"

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    skip: int
    limit: int

class ProductDetailResponse(ProductResponse):
    updated_at: Optional[datetime] = None
    training_jobs: List[Dict[str, Any]] = []
