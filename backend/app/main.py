# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database setup
from database import engine, Base
from sqlalchemy import text

# Import all models to ensure they're registered
from models.user import User
from models.product import Product  
from models.training import TrainingJob
from models.generation import Generation

# Import routers
from routers import (
    auth, products, training, image_generation, 
    inpainting, users, reports
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="AI Model Training Platform",
    version="1.0.0",
    description="Platform for training and using custom AI models with sd-scripts and ComfyUI"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create storage directories
storage_dirs = [
    "storage/uploads",
    "storage/generated", 
    "storage/products",
    "storage/datasets",
    "storage/trained_models",
    "storage/temp",
    "storage/inpainting/inputs",
    "storage/inpainting/masks",
    "storage/inpainting/outputs",
    "storage/upscaling/inputs",
    "storage/upscaling/outputs",
    "storage/background_removal/inputs",
    "storage/background_removal/outputs",
    "workflows"
]

for dir_path in storage_dirs:
    Path(dir_path).mkdir(parents=True, exist_ok=True)

# Static files for serving generated images
app.mount("/static", StaticFiles(directory="storage"), name="static")

# Include all routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(training.router, prefix="/api/training", tags=["Training"])
app.include_router(image_generation.router, prefix="/api/generation", tags=["Generation"])
app.include_router(inpainting.router, prefix="/api/inpainting", tags=["Inpainting"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
async def root():
    return {
        "message": "AI Model Training Platform API",
        "version": "1.0.0",
        "features": [
            "sd-scripts Integration for FLUX LoRA training",
            "ComfyUI Integration for inference",
            "Image generation with custom models",
            "Advanced inpainting with flux-fill",
            "Multi-user support with role management",
            "Real-time training progress monitoring",
            "Cost tracking and analytics"
        ],
        "endpoints": {
            "health": "/health",
            "system_status": "/api/system/status",
            "auth": "/api/auth/",
            "training": "/api/training/",
            "generation": "/api/generation/",
            "inpainting": "/api/inpainting/"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    
    # Check database connection
    try:
        from database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))  # Fixed: wrap in text()
        db.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Check sd-scripts/FluxGym availability (your actual path)
    fluxgym_paths = [
        Path("../training-engine/sd-scripts"),
        Path("../training-engine"),
        Path("training-engine/sd-scripts"),
        Path("../../training-engine/sd-scripts")
    ]
    
    fluxgym_status = "not_found"
    fluxgym_path = None
    for path in fluxgym_paths:
        if path.exists():
            # Check for key sd-scripts files
            key_files = ["flux_train_network.py", "train_network.py", "networks", "library"]
            found_files = [f for f in key_files if (path / f).exists()]
            
            if found_files:
                fluxgym_status = f"available at {path.absolute()}"
                fluxgym_path = str(path.absolute())
                break
    
    # Check ComfyUI connectivity
    try:
        from services.inference_service import InferenceService
        inference_service = InferenceService()
        comfyui_status = await inference_service.get_comfyui_status()
        comfyui_result = comfyui_status.get("status", "unknown")
    except Exception as e:
        comfyui_result = f"offline: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": Path(__file__).stat().st_mtime,
        "database": db_status,
        "sd_scripts": fluxgym_status,
        "sd_scripts_path": fluxgym_path,
        "comfyui": comfyui_result,
        "storage": "available" if Path("storage").exists() else "not_configured",
        "workflows": "available" if Path("workflows").exists() else "not_configured"
    }

@app.get("/api/system/status")
async def get_system_status():
    """Get detailed system status"""
    
    try:
        from services.training_service import TrainingService
        from services.inference_service import InferenceService
        
        # Initialize services
        training_service = TrainingService()
        inference_service = InferenceService()
        
        # Get training system status
        training_status = training_service.get_system_status()
        
        # Get available models
        available_models = training_service.get_available_base_models()
        
        # Get ComfyUI status
        comfyui_status = await inference_service.get_comfyui_status()
        
        # Get active training jobs
        active_jobs = len(training_service.active_jobs)
        
        # Get storage info
        trained_models_dir = Path("storage/trained_models")
        total_trained_models = len(list(trained_models_dir.glob("**/*.safetensors"))) if trained_models_dir.exists() else 0
        
        return {
            "system": {
                "platform": "sd-scripts + ComfyUI",
                "backend_version": "1.0.0",
                "python_version": sys.version
            },
            "training": {
                "engine": "sd-scripts",
                "status": training_status,
                "available_models": list(available_models.keys()),
                "active_jobs": active_jobs,
                "total_trained_models": total_trained_models
            },
            "inference": {
                "engine": "ComfyUI",
                "status": comfyui_status.get("status", "unknown"),
                "models_path": comfyui_status.get("models_path"),
                "workflows_available": comfyui_status.get("workflows_available", [])
            },
            "storage": {
                "base_path": "storage",
                "directories": storage_dirs,
                "datasets": len(list(Path("storage/datasets").iterdir())) if Path("storage/datasets").exists() else 0,
                "generated_images": len(list(Path("storage/generated").glob("*.png"))) if Path("storage/generated").exists() else 0
            }
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "system": {"status": "error"},
            "training": {"status": "error"},
            "inference": {"status": "error"},
            "storage": {"status": "error"}
        }

@app.get("/api/system/paths")
async def get_system_paths():
    """Get system paths for debugging"""
    
    return {
        "current_working_directory": str(Path.cwd()),
        "script_directory": str(Path(__file__).parent.absolute()),
        "backend_directory": str(Path(__file__).parent.parent.absolute()),
        "project_root": str(Path(__file__).parent.parent.parent.absolute()),
        "python_path": sys.path[:5],  # First 5 entries
        "checked_fluxgym_paths": [
            {
                "path": str(Path("../training-engine/sd-scripts").absolute()),
                "exists": Path("../training-engine/sd-scripts").exists()
            },
            {
                "path": str(Path("../training-engine").absolute()),
                "exists": Path("../training-engine").exists()
            },
            {
                "path": str(Path("training-engine/sd-scripts").absolute()),
                "exists": Path("training-engine/sd-scripts").exists()
            }
        ]
    }

@app.get("/api/test/training")
async def test_training_system():
    """Test the training system initialization"""
    
    try:
        from services.training_service import TrainingService
        
        # Try to initialize training service
        training_service = TrainingService()
        
        # Get status
        status = training_service.get_system_status()
        
        return {
            "status": "success",
            "message": "Training system initialized successfully",
            "training_service_status": status,
            "fluxgym_service_initialized": True
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to initialize training system: {str(e)}",
            "error_type": type(e).__name__
        }

@app.get("/api/test/workflows")
async def test_workflow_system():
    """Test the workflow system"""
    
    try:
        from services.workflow_manager import WorkflowManager
        
        # Initialize workflow manager
        workflow_manager = WorkflowManager()
        
        # Try to load a workflow
        workflow = workflow_manager.load_workflow("flux_inpainting")
        
        if workflow:
            return {
                "status": "success",
                "message": "Workflow system working",
                "workflow_loaded": True,
                "workflow_nodes": len(workflow.get("nodes", [])),
                "workflow_links": len(workflow.get("links", []))
            }
        else:
            return {
                "status": "partial",
                "message": "Workflow manager initialized but no workflow found",
                "workflow_loaded": False
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Workflow system error: {str(e)}",
            "error_type": type(e).__name__
        }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AI Model Training Platform...")
    print("📂 Storage directories created")
    print("🔧 Database tables initialized")
    print("🎯 Server will be available at: http://localhost:8001")
    print("📊 Health check: http://localhost:8001/health")
    print("🔍 System status: http://localhost:8001/api/system/status")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)