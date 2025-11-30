# backend/routers/training.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
import asyncio
from datetime import datetime

from app.database import get_db
from models.training import TrainingJob, TrainingStatus
from models.product import Product
from models.user import User
from schemas.training import (
    TrainingJobCreate, TrainingJobResponse, TrainingProgress,
    TrainingParams, AutoCaptionRequest, AutoCaptionResponse
)
from services.training_service import TrainingService
from services.gpu_manager import GPUManager
from core.security import get_current_user
from utils.file_handler import save_uploaded_file

router = APIRouter()

@router.get("/gpu-status")
async def get_gpu_status(
    current_user: User = Depends(get_current_user)
):
    """Get current GPU status and recommended training provider"""

    gpu_manager = GPUManager()
    gpu_status = gpu_manager.get_gpu_status()
    system_resources = gpu_manager.get_system_resources()

    # Determine recommended provider
    recommended_provider = "local"
    if gpu_status["should_use_cloud"]:
        recommended_provider = "cloud"

    return {
        "gpu_status": gpu_status,
        "system_resources": system_resources,
        "recommended_provider": recommended_provider,
        "providers_available": {
            "local": gpu_status["can_train_locally"],
            "runpod": True,  # Always available if API key configured
            "fal": True      # Always available if API key configured
        }
    }

@router.post("/start", response_model=TrainingJobResponse)
async def start_training(
    background_tasks: BackgroundTasks,
    product_name: str = Form(...),
    base_model: str = Form(...),
    trigger_word: str = Form(...),
    training_params: str = Form(...),  # JSON string
    images: List[UploadFile] = File(...),
    captions: str = Form(...),  # JSON array string
    provider: Optional[str] = Form(None),  # Optional: 'local', 'runpod', or 'fal'
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start training a new product model with specified or auto-selected provider"""
    
    try:
        # Parse parameters
        params = json.loads(training_params)
        caption_list = json.loads(captions)
        
        # Validate inputs
        if len(images) != len(caption_list):
            raise HTTPException(400, "Number of images must match number of captions")
        
        if len(images) < 2:
            raise HTTPException(400, "At least 2 images are required for training")
        
        if len(images) > 150:
            raise HTTPException(400, "Maximum 150 images allowed")
        
        # Save uploaded images
        image_paths = []
        for image in images:
            if not image.content_type.startswith('image/'):
                raise HTTPException(400, f"File {image.filename} is not an image")
            
            file_path = await save_uploaded_file(image, "datasets")
            image_paths.append(file_path)
        
        # Create training job in database
        training_job = TrainingJob(
            product_name=product_name,
            base_model=base_model,
            trigger_word=trigger_word,
            config=params,
            status=TrainingStatus.PENDING,
            created_by=current_user.id,
            created_at=datetime.utcnow()
        )
        
        db.add(training_job)
        db.commit()
        db.refresh(training_job)
        
        # Start training in background
        training_service = TrainingService()
        background_tasks.add_task(
            training_service.start_training_job,
            training_job.id,
            product_name,
            base_model,
            trigger_word,
            image_paths,
            caption_list,
            params,
            current_user.id,
            provider  # Pass provider selection
        )
        
        return TrainingJobResponse(
            id=training_job.id,
            product_name=training_job.product_name,
            status=training_job.status,
            progress=0,
            created_at=training_job.created_at,
            message="Training job started successfully"
        )
        
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON in parameters or captions")
    except Exception as e:
        raise HTTPException(500, f"Failed to start training: {str(e)}")

@router.get("/jobs", response_model=List[TrainingJobResponse])
async def get_training_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all training jobs for the current user"""
    
    jobs = db.query(TrainingJob).filter(
        TrainingJob.created_by == current_user.id
    ).order_by(TrainingJob.created_at.desc()).all()
    
    return [
        TrainingJobResponse(
            id=job.id,
            product_name=job.product_name,
            status=job.status,
            progress=job.progress or 0,
            created_at=job.created_at,
            completed_at=job.completed_at,
            message=job.message
        )
        for job in jobs
    ]

@router.get("/jobs/{job_id}", response_model=TrainingJobResponse)
async def get_training_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific training job"""
    
    job = db.query(TrainingJob).filter(
        TrainingJob.id == job_id,
        TrainingJob.created_by == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(404, "Training job not found")
    
    return TrainingJobResponse(
        id=job.id,
        product_name=job.product_name,
        status=job.status,
        progress=job.progress or 0,
        created_at=job.created_at,
        completed_at=job.completed_at,
        message=job.message,
        config=job.config
    )

@router.get("/jobs/{job_id}/progress")
async def stream_training_progress(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stream real-time training progress"""
    
    job = db.query(TrainingJob).filter(
        TrainingJob.id == job_id,
        TrainingJob.created_by == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(404, "Training job not found")
    
    async def generate():
        training_service = TrainingService()
        async for progress in training_service.monitor_training(job.external_id):
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(0.1)
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.get("/jobs/{job_id}/logs")
async def get_training_logs(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get training logs for a job"""
    
    job = db.query(TrainingJob).filter(
        TrainingJob.id == job_id,
        TrainingJob.created_by == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(404, "Training job not found")
    
    training_service = TrainingService()
    logs = await training_service.get_training_logs(job.external_id)
    
    return {"logs": logs}

@router.post("/jobs/{job_id}/stop")
async def stop_training_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Stop a running training job"""
    
    job = db.query(TrainingJob).filter(
        TrainingJob.id == job_id,
        TrainingJob.created_by == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(404, "Training job not found")
    
    if job.status not in [TrainingStatus.RUNNING, TrainingStatus.PENDING]:
        raise HTTPException(400, "Job is not running")
    
    training_service = TrainingService()
    success = await training_service.stop_training(job.external_id)
    
    if success:
        job.status = TrainingStatus.CANCELLED
        job.completed_at = datetime.utcnow()
        db.commit()
        
        return {"message": "Training job stopped successfully"}
    else:
        raise HTTPException(500, "Failed to stop training job")

@router.post("/auto-caption", response_model=AutoCaptionResponse)
async def generate_auto_captions(
    images: List[UploadFile] = File(...),
    trigger_word: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    """Generate automatic captions for uploaded images"""
    
    try:
        # Save uploaded images temporarily
        image_paths = []
        for image in images:
            if not image.content_type.startswith('image/'):
                raise HTTPException(400, f"File {image.filename} is not an image")
            
            file_path = await save_uploaded_file(image, "temp")
            image_paths.append(file_path)
        
        # Generate captions
        training_service = TrainingService()
        captions = await training_service.generate_auto_captions(
            image_paths, trigger_word
        )
        
        return AutoCaptionResponse(
            captions=captions,
            count=len(captions)
        )
        
    except Exception as e:
        raise HTTPException(500, f"Failed to generate captions: {str(e)}")

@router.get("/base-models")
async def get_base_models():
    """Get available base models for training"""
    
    training_service = TrainingService()
    models = training_service.get_available_base_models()
    
    return {"models": models}

@router.get("/training-params")
async def get_default_training_params():
    """Get default training parameters"""

    return {
        "params": {
            "resolution": 512,
            "seed": 42,
            "workers": 2,
            "learning_rate": "8e-4",
            "network_dim": 4,
            "max_train_epochs": 16,
            "save_every_n_epochs": 4,
            "timestep_sampling": "shift",
            "guidance_scale": 1.0,
            "vram": "20G",
            "num_repeats": 10,
            "sample_every_n_steps": 0
        }
    }

# Cloud GPU Integration Endpoints

@router.get("/gpu-status")
async def get_gpu_status(
    current_user: User = Depends(get_current_user)
):
    """Get current GPU status and cloud provider decision"""

    training_service = TrainingService()
    status = training_service.get_gpu_status()

    return status

@router.get("/system-status")
async def get_system_status(
    current_user: User = Depends(get_current_user)
):
    """Get complete training system status including cloud services"""

    training_service = TrainingService()
    status = training_service.get_system_status()

    return status

@router.post("/deploy-to-fal")
async def deploy_to_fal(
    product_name: str = Form(...),
    trigger_word: str = Form(...),
    metadata: Optional[str] = Form(None),  # JSON string
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deploy trained model to fal.ai for inference"""

    try:
        # Parse metadata if provided
        metadata_dict = json.loads(metadata) if metadata else None

        training_service = TrainingService()
        result = await training_service.deploy_to_fal(
            product_name=product_name,
            trigger_word=trigger_word,
            user_id=current_user.id,
            metadata=metadata_dict
        )

        if result["success"]:
            return result
        else:
            raise HTTPException(500, result.get("error", "Deployment failed"))

    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON in metadata")
    except Exception as e:
        raise HTTPException(500, f"Failed to deploy to fal.ai: {str(e)}")

@router.post("/generate-with-fal")
async def generate_with_fal(
    product_name: str = Form(...),
    prompt: str = Form(...),
    num_images: int = Form(1),
    image_size: str = Form("landscape_4_3"),
    num_inference_steps: int = Form(28),
    guidance_scale: float = Form(3.5),
    lora_scale: float = Form(1.0),
    current_user: User = Depends(get_current_user)
):
    """Generate image using fal.ai deployed model"""

    try:
        training_service = TrainingService()
        result = await training_service.generate_with_fal(
            product_name=product_name,
            prompt=prompt,
            num_images=num_images,
            image_size=image_size,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            lora_scale=lora_scale
        )

        if result["success"]:
            return result
        else:
            raise HTTPException(500, result.get("error", "Generation failed"))

    except Exception as e:
        raise HTTPException(500, f"Failed to generate image: {str(e)}")

@router.get("/deployed-models")
async def get_deployed_models(
    current_user: User = Depends(get_current_user)
):
    """Get list of all models deployed to fal.ai"""

    training_service = TrainingService()
    models = training_service.get_deployed_models()

    return {"models": models}