# database.py (place this in backend/ directory)
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL from environment variable or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./product_training.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Initialize database with tables and default data"""

    # Import all models to ensure they're registered
    from models.user import User, UserRole
    from models.organization import Organization
    from models.product import Product, AccessLevel
    from models.training import TrainingJob, TrainingStatus
    from models.generation import Generation
    from models.report import Report

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create default super admin, organization, and admin users if they don't exist
    db = SessionLocal()
    try:
        from core.security import get_password_hash
        from datetime import datetime

        # Create super admin (no organization)
        super_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if not super_admin:
            super_admin = User(
                username="superadmin",
                email="superadmin@example.com",
                hashed_password=get_password_hash("superadmin123"),
                full_name="Super Administrator",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                organization_id=None,  # Super admin has no organization
                created_by=None,
                created_at=datetime.utcnow()
            )
            db.add(super_admin)
            db.commit()
            print("✓ Created super admin user: superadmin / superadmin123")

        # Create sample organization
        sample_org = db.query(Organization).filter(Organization.name == "Sample Organization").first()
        if not sample_org:
            sample_org = Organization(
                name="Sample Organization",
                description="A sample organization for testing",
                contact_email="admin@sampleorg.com",
                contact_phone="+1234567890",
                max_workers=50,
                max_storage_gb=500,
                is_active=True,
                created_at=datetime.utcnow()
            )
            db.add(sample_org)
            db.commit()
            db.refresh(sample_org)
            print(f"✓ Created sample organization: {sample_org.name} (ID: {sample_org.id})")

        # Create sample admin for the organization
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@sampleorg.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Organization Admin",
                role=UserRole.ADMIN,
                is_active=True,
                organization_id=sample_org.id,
                created_by=super_admin.id if super_admin else None,
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()
            print(f"✓ Created sample admin user: admin / admin123 (Org ID: {sample_org.id})")

        # Create sample worker for the organization
        worker_user = db.query(User).filter(User.username == "worker").first()
        if not worker_user:
            worker_user = User(
                username="worker",
                email="worker@sampleorg.com",
                hashed_password=get_password_hash("worker123"),
                full_name="Sample Worker",
                role=UserRole.WORKER,
                is_active=True,
                organization_id=sample_org.id,
                created_by=admin_user.id if admin_user else None,
                created_at=datetime.utcnow()
            )
            db.add(worker_user)
            db.commit()
            print(f"✓ Created sample worker user: worker / worker123 (Org ID: {sample_org.id})")

    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()