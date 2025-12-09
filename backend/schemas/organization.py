from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class OrganizationBase(BaseModel):
    """Base organization schema"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    max_workers: int = Field(10, ge=1, le=1000)
    max_storage_gb: int = Field(100, ge=1, le=10000)


class OrganizationCreate(OrganizationBase):
    """Schema for creating a new organization"""
    pass


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    max_workers: Optional[int] = Field(None, ge=1, le=1000)
    max_storage_gb: Optional[int] = Field(None, ge=1, le=10000)
    is_active: Optional[bool] = None


class OrganizationResponse(OrganizationBase):
    """Schema for organization response"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class OrganizationStats(BaseModel):
    """Schema for organization statistics"""
    organization_id: int
    organization_name: str
    total_users: int
    total_workers: int
    total_products: int
    total_generations: int
    total_training_jobs: int
    storage_used_gb: float
