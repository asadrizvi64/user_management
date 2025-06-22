# models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    products = relationship("Product", back_populates="creator")
    generations = relationship("Generation", back_populates="user")
    training_jobs = relationship("TrainingJob", back_populates="creator")

# models/product.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class AccessLevel(enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    trigger_word = Column(String(100), nullable=False)
    access_level = Column(Enum(AccessLevel), default=AccessLevel.PUBLIC)
    model_path = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="products")
    generations = relationship("Generation", back_populates="product")

# models/training.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Float, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class TrainingStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TrainingJob(Base):
    __tablename__ = "training_jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True)
    product_name = Column(String(100), nullable=False)
    base_model = Column(String(100), nullable=False)
    trigger_word = Column(String(100), nullable=False)
    config = Column(JSON)
    status = Column(Enum(TrainingStatus), default=TrainingStatus.PENDING)
    progress = Column(Float, default=0.0)
    message = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relationships
    creator = relationship("User", back_populates="training_jobs")

# models/generation.py (update the existing one)
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Generation(Base):
    __tablename__ = "generations"
    
    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text)
    product_id = Column(Integer, ForeignKey("products.id"))
    image_paths = Column(JSON)  # List of generated image paths
    parameters = Column(JSON)  # Generation parameters
    execution_time = Column(Float)  # In seconds
    cost = Column(Float)  # Generation cost
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="generations")
    product = relationship("Product", back_populates="generations")