import os
from typing import List

class Settings:
    # App settings
    APP_NAME: str = "Product Training Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./product_training.db")
    
    # File storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "storage")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    
    # CORS
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    
    # Training settings
    MAX_TRAINING_IMAGES: int = int(os.getenv("MAX_TRAINING_IMAGES", "150"))
    DEFAULT_TRAINING_RESOLUTION: int = int(os.getenv("DEFAULT_TRAINING_RESOLUTION", "512"))
    
    # GPU settings
    CUDA_VISIBLE_DEVICES: str = os.getenv("CUDA_VISIBLE_DEVICES", "0")

settings = Settings()