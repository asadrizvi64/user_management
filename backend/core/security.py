# core/security.py
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from models.user import User, UserRole
from config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token handling
security = HTTPBearer()

# Configuration from settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the username"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    username = verify_token(credentials.credentials)
    if username is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    return user

async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify admin or super_admin role.
    Use this for endpoints that require admin privileges.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_current_super_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user and verify super_admin role only.
    Use this for system-level operations that only super admin can perform.
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user

def check_organization_access(user: User, organization_id: int) -> bool:
    """
    Check if user has access to a specific organization.
    - Super admins have access to all organizations
    - Admins and workers only have access to their own organization
    """
    if user.role == UserRole.SUPER_ADMIN:
        return True
    return user.organization_id == organization_id

def check_user_access(current_user: User, target_user: User) -> bool:
    """
    Check if current user has access to manage/view target user.
    - Super admins can access all users
    - Admins can access users in their organization
    - Workers can only access themselves
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        return True

    if current_user.role == UserRole.ADMIN:
        # Admins can access users in their organization
        return current_user.organization_id == target_user.organization_id

    # Workers can only access themselves
    return current_user.id == target_user.id

def can_create_user(current_user: User, role: UserRole, organization_id: int) -> bool:
    """
    Check if current user can create a user with specified role and organization.
    - Super admins can create any user in any organization
    - Admins can only create workers in their own organization
    - Workers cannot create users
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        return True

    if current_user.role == UserRole.ADMIN:
        # Admins can only create workers in their own organization
        return (
            role == UserRole.WORKER and
            current_user.organization_id == organization_id
        )

    # Workers cannot create users
    return False