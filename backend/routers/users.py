# backend/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from models.user import User, UserRole
from models.organization import Organization
from schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from core.security import (
    get_current_user,
    get_current_admin_user,
    get_current_super_admin_user,
    get_password_hash,
    check_user_access,
    can_create_user
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/", response_model=UserListResponse)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    organization_id: Optional[int] = None,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get users list with multi-tenant filtering.
    - Super admins can see all users across all organizations
    - Admins can only see users in their own organization
    """
    query = db.query(User)

    # Apply organization filtering based on user role
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can filter by organization_id or see all
        if organization_id is not None:
            query = query.filter(User.organization_id == organization_id)
    else:
        # Admins can only see users in their organization
        query = query.filter(User.organization_id == current_user.organization_id)

    # Apply search filter
    if search:
        query = query.filter(
            (User.username.contains(search)) |
            (User.email.contains(search)) |
            (User.full_name.contains(search))
        )

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    return UserListResponse(
        users=[UserResponse.from_orm(user) for user in users],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user by ID.
    - Super admins can view any user
    - Admins can view users in their organization
    - Workers can only view themselves
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not check_user_access(current_user, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return UserResponse.from_orm(user)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create new user with multi-tenant support.
    - Super admins can create any user in any organization
    - Admins can only create workers in their own organization
    """
    # Validate organization_id is provided for non-super-admin users
    if user_data.role != UserRole.SUPER_ADMIN and user_data.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="organization_id is required for admin and worker roles"
        )

    # Check if current user can create this type of user
    if not can_create_user(current_user, user_data.role, user_data.organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create this type of user"
        )

    # Validate organization exists
    if user_data.organization_id is not None:
        org = db.query(Organization).filter(
            Organization.id == user_data.organization_id
        ).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        if not org.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add users to inactive organization"
            )

    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # Create user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        organization_id=user_data.organization_id,
        created_by=current_user.id,
        is_active=True,
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse.from_orm(new_user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile.
    - Super admins can update any user
    - Admins can update users in their organization
    - Workers can only update themselves (limited fields)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not check_user_access(current_user, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Workers can only update their own profile (limited fields)
    if current_user.role == UserRole.WORKER:
        # Workers can only update themselves
        if user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Workers can only update their own profile"
            )
        # Workers cannot change role or is_active
        if user_data.role is not None or user_data.is_active is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Workers cannot change role or status"
            )

    # Update fields
    update_data = user_data.dict(exclude_unset=True)

    if "email" in update_data:
        # Check if email is already taken
        existing = db.query(User).filter(
            User.email == update_data["email"],
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    if "username" in update_data:
        # Check if username is already taken
        existing = db.query(User).filter(
            User.username == update_data["username"],
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return UserResponse.from_orm(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete user.
    - Super admins can delete any user
    - Admins can only delete workers in their organization
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not check_user_access(current_user, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Admins can only delete workers
    if current_user.role == UserRole.ADMIN and user.role != UserRole.WORKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins can only delete workers"
        )

    db.delete(user)
    db.commit()

    return None


@router.post("/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Toggle user active status.
    - Super admins can toggle any user
    - Admins can only toggle workers in their organization
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own status"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not check_user_access(current_user, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    user.is_active = not user.is_active
    db.commit()

    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully",
        "is_active": user.is_active
    }


@router.get("/organization/{organization_id}/workers", response_model=List[UserResponse])
async def get_organization_workers(
    organization_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all workers for an organization.
    - Super admins can view workers for any organization
    - Admins can only view workers in their own organization
    """
    # Check access to organization
    if current_user.role != UserRole.SUPER_ADMIN:
        if current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this organization"
            )

    workers = db.query(User).filter(
        User.organization_id == organization_id,
        User.role == UserRole.WORKER
    ).all()

    return [UserResponse.from_orm(worker) for worker in workers]
