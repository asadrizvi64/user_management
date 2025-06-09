# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging
from sqlalchemy.orm import Session

from .database import engine, get_db
from models import user, product, generation, training, report
from routers import auth, users, products, generation as gen_router, training as training_router, inpainting, reports
from core.logging import setup_logging
from config import settings

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Product Training Platform")
    
    # Create directories
    os.makedirs("storage/uploads", exist_ok=True)
    os.makedirs("storage/generated", exist_ok=True)
    os.makedirs("storage/products", exist_ok=True)
    os.makedirs("storage/datasets", exist_ok=True)
    os.makedirs("storage/temp", exist_ok=True)
    os.makedirs("training-engine/outputs", exist_ok=True)
    os.makedirs("training-engine/datasets", exist_ok=True)
    
    # Create database tables
    user.Base.metadata.create_all(bind=engine)
    product.Base.metadata.create_all(bind=engine)
    generation.Base.metadata.create_all(bind=engine)
    training.Base.metadata.create_all(bind=engine)
    report.Base.metadata.create_all(bind=engine)
    
    yield
    
    # Shutdown
    logger.info("Shutting down Product Training Platform")

app = FastAPI(
    title="Product Training Platform",
    description="Enterprise image generation and product training platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(gen_router.router, prefix="/api/generation", tags=["generation"])
app.include_router(training_router.router, prefix="/api/training", tags=["training"])
app.include_router(inpainting.router, prefix="/api/inpainting", tags=["inpainting"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
async def root():
    return {"message": "Product Training Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )