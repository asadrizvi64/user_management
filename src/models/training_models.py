from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    products = relationship("Product", back_populates="user")
    training_jobs = relationship("TrainingJob", back_populates="user")

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    access_level = Column(String(20), default="private")  # private, public
    
    # Training-related fields
    training_status = Column(String(50), default="not_started")  # not_started, pending, training, completed, failed, stopped, cancelled
    training_progress = Column(Integer, default=0)  # 0-100
    training_config = Column(JSON)  # Training configuration
    training_started_at = Column(DateTime)
    training_completed_at = Column(DateTime)
    model_path = Column(String(255))  # Path to trained model file
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="products")
    training_jobs = relationship("TrainingJob", back_populates="product")
    access_permissions = relationship("ProductAccess", back_populates="product")

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), unique=True, index=True)  # Unique job identifier
    product_id = Column(Integer, ForeignKey("products.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Job status and progress
    status = Column(String(50), default="pending")  # pending, training, completed, failed, stopped, cancelled
    progress = Column(Integer, default=0)  # 0-100
    current_epoch = Column(Integer, default=0)
    total_epochs = Column(Integer)
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer)
    
    # Configuration and metadata
    config = Column(JSON)  # Training configuration used for this job
    logs = Column(Text)  # Training logs
    error_message = Column(Text)  # Error message if failed
    
    # Resource usage tracking
    gpu_hours = Column(Float, default=0.0)  # GPU hours used
    estimated_cost = Column(Float, default=0.0)  # Estimated cost in USD
    
    # Timing
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    stopped_at = Column(DateTime)
    estimated_completion = Column(DateTime)
    
    # Process management
    process_id = Column(Integer)  # System process ID
    worker_node = Column(String(100))  # Node/server running the job
    
    # Relationships
    product = relationship("Product", back_populates="training_jobs")
    user = relationship("User", back_populates="training_jobs")
    sample_images = relationship("TrainingSample", back_populates="training_job")

class TrainingSample(Base):
    __tablename__ = "training_samples"
    
    id = Column(Integer, primary_key=True, index=True)
    training_job_id = Column(Integer, ForeignKey("training_jobs.id"))
    
    # Sample details
    step = Column(Integer)  # Training step when generated
    epoch = Column(Integer)  # Training epoch when generated
    prompt = Column(Text)  # Prompt used for generation
    image_path = Column(String(255))  # Path to sample image
    generation_time = Column(Float)  # Time taken to generate (seconds)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    training_job = relationship("TrainingJob", back_populates="sample_images")

class ProductAccess(Base):
    __tablename__ = "product_access"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    access_type = Column(String(20), default="read")  # read, write, admin
    granted_by = Column(Integer, ForeignKey("users.id"))
    granted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="access_permissions")

class TrainingQueue(Base):
    __tablename__ = "training_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    training_job_id = Column(Integer, ForeignKey("training_jobs.id"))
    priority = Column(Integer, default=0)  # Higher number = higher priority
    queued_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    estimated_start_time = Column(DateTime)
    
    # Queue management
    queue_position = Column(Integer)
    resource_requirements = Column(JSON)  # VRAM, CPU, etc.

class SystemResources(Base):
    __tablename__ = "system_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    node_name = Column(String(100), unique=True)
    
    # Hardware specs
    gpu_count = Column(Integer, default=0)
    gpu_memory_total = Column(Integer, default=0)  # Total VRAM in MB
    gpu_memory_available = Column(Integer, default=0)  # Available VRAM in MB
    cpu_count = Column(Integer, default=0)
    ram_total = Column(Integer, default=0)  # Total RAM in MB
    ram_available = Column(Integer, default=0)  # Available RAM in MB
    
    # Status
    is_active = Column(Boolean, default=True)
    current_jobs = Column(Integer, default=0)
    max_concurrent_jobs = Column(Integer, default=1)
    
    # Monitoring
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TrainingMetrics(Base):
    __tablename__ = "training_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    training_job_id = Column(Integer, ForeignKey("training_jobs.id"))
    
    # Metrics
    step = Column(Integer)
    epoch = Column(Integer)
    loss = Column(Float)
    learning_rate = Column(Float)
    gpu_utilization = Column(Float)
    memory_usage = Column(Integer)  # Memory usage in MB
    
    # Timing
    step_time = Column(Float)  # Time per step in seconds
    eta_seconds = Column(Integer)  # Estimated time to completion
    
    # Metadata
    timestamp = Column(DateTime, default=datetime.utcnow)

# Database utility functions
def create_tables(engine):
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)

def get_training_statistics(db_session):
    """Get training statistics for dashboard"""
    from sqlalchemy import func, desc
    
    # Total jobs by status
    status_counts = db_session.query(
        TrainingJob.status,
        func.count(TrainingJob.id)
    ).group_by(TrainingJob.status).all()
    
    # Recent jobs (last 30 days)
    recent_jobs = db_session.query(TrainingJob).filter(
        TrainingJob.created_at >= datetime.utcnow() - timedelta(days=30)
    ).count()
    
    # Average training time
    avg_training_time = db_session.query(
        func.avg(
            func.extract('epoch', TrainingJob.completed_at - TrainingJob.started_at) / 3600
        )
    ).filter(
        TrainingJob.status == 'completed',
        TrainingJob.started_at.isnot(None),
        TrainingJob.completed_at.isnot(None)
    ).scalar()
    
    # Top users by training count
    top_users = db_session.query(
        User.username,
        func.count(TrainingJob.id).label('job_count')
    ).join(TrainingJob).group_by(User.id).order_by(
        desc('job_count')
    ).limit(10).all()
    
    # Resource utilization
    total_gpu_hours = db_session.query(
        func.sum(TrainingJob.gpu_hours)
    ).filter(TrainingJob.status == 'completed').scalar() or 0
    
    return {
        'status_distribution': dict(status_counts),
        'recent_jobs_count': recent_jobs,
        'average_training_hours': round(avg_training_time or 0, 2),
        'top_users': [{'username': u, 'job_count': c} for u, c in top_users],
        'total_gpu_hours': round(total_gpu_hours, 2)
    }

def get_user_training_history(db_session, user_id, limit=50):
    """Get training history for a specific user"""
    jobs = db_session.query(TrainingJob).filter(
        TrainingJob.user_id == user_id
    ).order_by(TrainingJob.created_at.desc()).limit(limit).all()
    
    return [{
        'id': job.id,
        'job_id': job.job_id,
        'product_name': job.product.name if job.product else 'Unknown',
        'status': job.status,
        'progress': job.progress,
        'created_at': job.created_at,
        'started_at': job.started_at,
        'completed_at': job.completed_at,
        'gpu_hours': job.gpu_hours,
        'estimated_cost': job.estimated_cost
    } for job in jobs]

# Migration functions for existing databases
def add_training_columns_to_products(engine):
    """Add training-related columns to existing products table"""
    from sqlalchemy import text
    
    migrations = [
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS training_status VARCHAR(50) DEFAULT 'not_started'",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS training_progress INTEGER DEFAULT 0",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS training_config JSON",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS training_started_at TIMESTAMP",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS training_completed_at TIMESTAMP",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS model_path VARCHAR(255)"
    ]
    
    with engine.connect() as conn:
        for migration in migrations:
            try:
                conn.execute(text(migration))
                conn.commit()
            except Exception as e:
                print(f"Migration failed: {migration}, Error: {e}")
                conn.rollback()

# Example usage and initialization
if __name__ == "__main__":
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Create database engine (example with SQLite)
    engine = create_engine("sqlite:///./training_app.db")
    
    # Create all tables
    create_tables(engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    print("Database tables created successfully!")
    print("Tables created:")
    for table_name in Base.metadata.tables.keys():
        print(f"  - {table_name}")