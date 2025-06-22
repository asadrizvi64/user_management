# Update your existing schemas/product.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from models.product import AccessLevel

class ProductCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    trigger_word: str = Field(..., min_length=1, max_length=100)
    access_level: AccessLevel = AccessLevel.PUBLIC

class ProductUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    trigger_word: Optional[str] = Field(None, min_length=1, max_length=100)
    access_level: Optional[AccessLevel] = None

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    name: str
    description: Optional[str]
    trigger_word: str
    access_level: AccessLevel
    model_path: Optional[str]
    created_by: int
    created_at: datetime
    status: str  # "ready", "pending", "training"

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    skip: int
    limit: int

class ProductDetailResponse(ProductResponse):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    updated_at: Optional[datetime] = None
    training_jobs: List[Dict[str, Any]] = []