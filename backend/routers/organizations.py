from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from models.user import User, UserRole
from models.organization import Organization
from models.product import Product
from models.generation import Generation
from models.training import TrainingJob
from schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationStats
)
from core.security import (
    get_current_user,
    get_current_super_admin_user,
    check_organization_access
)

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List organizations.
    - Super admins can see all organizations
    - Admins and workers can only see their own organization
    """
    query = db.query(Organization)

    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can see all organizations
        organizations = query.offset(skip).limit(limit).all()
    else:
        # Others can only see their own organization
        if current_user.organization_id is None:
            return []
        organizations = query.filter(
            Organization.id == current_user.organization_id
        ).all()

    return organizations


@router.get("/{organization_id}", response_model=OrganizationResponse)
async def get_organization(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get organization by ID.
    Users can only access their own organization unless they are super admin.
    """
    if not check_organization_access(current_user, organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this organization"
        )

    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    return organization


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    organization_data: OrganizationCreate,
    current_user: User = Depends(get_current_super_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new organization.
    Only super admins can create organizations.
    """
    # Check if organization name already exists
    existing_org = db.query(Organization).filter(
        Organization.name == organization_data.name
    ).first()

    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this name already exists"
        )

    # Create new organization
    new_org = Organization(
        name=organization_data.name,
        description=organization_data.description,
        contact_email=organization_data.contact_email,
        contact_phone=organization_data.contact_phone,
        max_workers=organization_data.max_workers,
        max_storage_gb=organization_data.max_storage_gb,
        is_active=True
    )

    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    return new_org


@router.put("/{organization_id}", response_model=OrganizationResponse)
async def update_organization(
    organization_id: int,
    organization_data: OrganizationUpdate,
    current_user: User = Depends(get_current_super_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update organization details.
    Only super admins can update organizations.
    """
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Update fields if provided
    update_data = organization_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(organization, field, value)

    db.commit()
    db.refresh(organization)

    return organization


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    organization_id: int,
    current_user: User = Depends(get_current_super_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete an organization.
    Only super admins can delete organizations.
    """
    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Check if organization has users
    user_count = db.query(User).filter(
        User.organization_id == organization_id
    ).count()

    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete organization with {user_count} users. Remove users first."
        )

    db.delete(organization)
    db.commit()

    return None


@router.get("/{organization_id}/stats", response_model=OrganizationStats)
async def get_organization_stats(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics for an organization.
    Users can only access stats for their own organization unless they are super admin.
    """
    if not check_organization_access(current_user, organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this organization"
        )

    organization = db.query(Organization).filter(
        Organization.id == organization_id
    ).first()

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )

    # Calculate statistics
    total_users = db.query(User).filter(
        User.organization_id == organization_id
    ).count()

    total_workers = db.query(User).filter(
        User.organization_id == organization_id,
        User.role == UserRole.WORKER
    ).count()

    total_products = db.query(Product).filter(
        Product.organization_id == organization_id
    ).count()

    total_generations = db.query(Generation).filter(
        Generation.organization_id == organization_id
    ).count()

    total_training_jobs = db.query(TrainingJob).filter(
        TrainingJob.organization_id == organization_id
    ).count()

    # Placeholder for storage calculation (you can implement this based on actual file storage)
    storage_used_gb = 0.0

    return OrganizationStats(
        organization_id=organization.id,
        organization_name=organization.name,
        total_users=total_users,
        total_workers=total_workers,
        total_products=total_products,
        total_generations=total_generations,
        total_training_jobs=total_training_jobs,
        storage_used_gb=storage_used_gb
    )
