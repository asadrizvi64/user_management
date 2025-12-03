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
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:3001").split(",")
    
    # Training settings
    MAX_TRAINING_IMAGES: int = int(os.getenv("MAX_TRAINING_IMAGES", "150"))
    DEFAULT_TRAINING_RESOLUTION: int = int(os.getenv("DEFAULT_TRAINING_RESOLUTION", "512"))

    # GPU settings
    CUDA_VISIBLE_DEVICES: str = os.getenv("CUDA_VISIBLE_DEVICES", "0")
    GPU_MEMORY_THRESHOLD: float = float(os.getenv("GPU_MEMORY_THRESHOLD", "0.8"))  # 80% threshold for fallback

    # Cloud GPU Services
    # fal.ai settings
    FAL_KEY: str = os.getenv("FAL_KEY", "")
    FAL_DEPLOYMENT_ENABLED: bool = os.getenv("FAL_DEPLOYMENT_ENABLED", "false").lower() == "true"

    # RunPod settings
    RUNPOD_API_KEY: str = os.getenv("RUNPOD_API_KEY", "")
    RUNPOD_GPU_TYPE: str = os.getenv("RUNPOD_GPU_TYPE", "NVIDIA RTX A4000")
    RUNPOD_ENABLED: bool = os.getenv("RUNPOD_ENABLED", "false").lower() == "true"
    RUNPOD_DOCKER_IMAGE: str = os.getenv("RUNPOD_DOCKER_IMAGE", "runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel")

    # ComfyUI settings
    COMFYUI_URL: str = os.getenv("COMFYUI_URL", "http://127.0.0.1:8188")
    COMFYUI_MODELS_PATH: str = os.getenv("COMFYUI_MODELS_PATH", "")

settings = Settings()