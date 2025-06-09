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
from core.security import get_current_user
from utils.file_handler import save_uploaded_file

router = APIRouter()

@router.post("/start", response_model=TrainingJobResponse)
async def start_training(
    background_tasks: BackgroundTasks,
    product_name: str = Form(...),
    base_model: str = Form(...),
    trigger_word: str = Form(...),
    training_params: str = Form(...),  # JSON string
    images: List[UploadFile] = File(...),
    captions: str = Form(...),  # JSON array string
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start training a new product model"""
    
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
            current_user.id
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