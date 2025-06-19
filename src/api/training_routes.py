from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List, Optional
from pydantic import BaseModel
import json
from datetime import datetime
import asyncio

from services.training_service import ProductTrainingService
from models.database import get_db_session
from auth.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/training", tags=["training"])
training_service = ProductTrainingService()

class TrainingConfig(BaseModel):
    base_model: str = "flux-dev"
    trigger_word: str
    product_name: str
    vram: str = "16G"
    max_epochs: int = 16
    learning_rate: str = "8e-4"
    network_dim: int = 4
    resolution: int = 512
    num_repeats: int = 10
    sample_prompts: List[str] = []
    sample_every_n_steps: int = 100
    save_every_n_epochs: int = 4
    seed: int = 42
    workers: int = 2
    timestep_sampling: str = "shift"
    guidance_scale: float = 1.0
    base_caption: str = "product image"

class TrainingStatus(BaseModel):
    product_id: str
    status: str
    progress: int
    started_at: Optional[datetime]
    estimated_completion: Optional[datetime]
    current_epoch: Optional[int]
    total_epochs: Optional[int]
    sample_images: List[str] = []

@router.post("/products/{product_id}/start")
async def start_product_training(
    product_id: str,
    config: TrainingConfig,
    images: List[UploadFile] = File(...),
    current_user = Depends(get_current_user),
    db = Depends(get_db_session)
):
    """Start training for a specific product"""
    
    # Verify product exists and user has access
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if already training
    if product.training_status == "training":
        raise HTTPException(status_code=400, detail="Product is already training")
    
    # Validate images
    if len(images) < 2:
        raise HTTPException(
            status_code=400, 
            detail="At least 2 images required for training"
        )
    
    if len(images) > 150:
        raise HTTPException(
            status_code=400, 
            detail="Maximum 150 images allowed"
        )
    
    # Save uploaded images
    image_paths = []
    for i, image in enumerate(images):
        if not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail=f"File {image.filename} is not an image"
            )
        
        # Save image to temporary location
        image_path = f"/tmp/{product_id}_{i}_{image.filename}"
        with open(image_path, 'wb') as f:
            content = await image.read()
            f.write(content)
        image_paths.append(image_path)
    
    try:
        # Start training
        job_id = await training_service.start_product_training(
            product_id=product_id,
            images=image_paths,
            config=config.dict(),
            user_id=str(current_user.id)
        )
        
        # Update product status in database
        product.training_status = "training"
        product.training_progress = 0
        product.training_config = config.dict()
        product.training_started_at = datetime.utcnow()
        db.commit()
        
        # Create training job record
        training_job = TrainingJob(
            product_id=product_id,
            user_id=current_user.id,
            job_id=job_id,
            status="training",
            config=config.dict(),
            created_at=datetime.utcnow()
        )
        db.add(training_job)
        db.commit()
        
        return {
            "message": "Training started successfully",
            "job_id": job_id,
            "estimated_duration": f"{config.max_epochs * len(images) * config.num_repeats // 60} minutes"
        }
        
    except Exception as e:
        # Update product status on failure
        product.training_status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")

@router.get("/products/{product_id}/status")
async def get_training_status(
    product_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db_session)
):
    """Get training status for a product"""
    
    # Verify product access
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get status from training service
    status = training_service.get_training_status(product_id)
    
    # Get training job from database
    training_job = db.query(TrainingJob).filter(
        TrainingJob.product_id == product_id
    ).order_by(TrainingJob.created_at.desc()).first()
    
    # Merge database and service status
    result = {
        "product_id": product_id,
        "status": product.training_status or status.get("status", "not_started"),
        "progress": product.training_progress or status.get("progress", 0),
        "started_at": product.training_started_at,
        "config": product.training_config,
        "logs_available": status.get("logs_available", False),
        "sample_images": training_service.get_sample_images(product_id)
    }
    
    if training_job:
        result["job_id"] = training_job.job_id
        result["estimated_completion"] = training_job.estimated_completion
    
    return result

@router.get("/products/{product_id}/logs")
async def get_training_logs(
    product_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db_session)
):
    """Get training logs for a product"""
    
    # Verify product access
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    logs = training_service.get_training_logs(product_id)
    
    if logs is None:
        raise HTTPException(status_code=404, detail="Training logs not found")
    
    return {"logs": logs}

@router.post("/products/{product_id}/stop")
async def stop_training(
    product_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db_session)
):
    """Stop ongoing training for a product"""
    
    # Verify product access
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.training_status != "training":
        raise HTTPException(status_code=400, detail="No active training to stop")
    
    try:
        # Stop training process
        await training_service.stop_training(product_id)
        
        # Update database
        product.training_status = "stopped"
        db.commit()
        
        # Update training job
        training_job = db.query(TrainingJob).filter(
            TrainingJob.product_id == product_id,
            TrainingJob.status == "training"
        ).first()
        
        if training_job:
            training_job.status = "stopped"
            training_job.stopped_at = datetime.utcnow()
            db.commit()
        
        return {"message": "Training stopped successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop training: {str(e)}")

@router.get("/products/{product_id}/model/download")
async def download_trained_model(
    product_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db_session)
):
    """Download trained model file"""
    
    from fastapi.responses import FileResponse
    
    # Verify product access
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.user_id == current_user.id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.training_status != "completed":
        raise HTTPException(status_code=400, detail="Training not completed")
    
    model_path = training_service.download_model(product_id)
    
    if not model_path:
        raise HTTPException(status_code=404, detail="Trained model not found")
    
    return FileResponse(
        path=model_path,
        filename=f"{product.name}_lora.safetensors",
        media_type="application/octet-stream"
    )

@router.get("/jobs")
async def list_training_jobs(
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db = Depends(get_db_session)
):
    """List training jobs (admin only for all jobs, users see only their own)"""
    
    query = db.query(TrainingJob)
    
    # Non-admin users can only see their own jobs
    if not current_user.is_admin:
        query = query.filter(TrainingJob.user_id == current_user.id)
    else:
        # Admin can filter by user_id
        if user_id:
            query = query.filter(TrainingJob.user_id == user_id)
    
    # Filter by status
    if status:
        query = query.filter(TrainingJob.status == status)
    
    jobs = query.order_by(TrainingJob.created_at.desc()).all()
    
    return {
        "jobs": [
            {
                "id": job.id,
                "product_id": job.product_id,
                "user_id": job.user_id,
                "job_id": job.job_id,
                "status": job.status,
                "progress": job.progress,
                "created_at": job.created_at,
                "started_at": job.started_at,
                "completed_at": job.completed_at,
                "config": job.config
            }
            for job in jobs
        ]
    }

@router.delete("/jobs/{job_id}")
async def cancel_training_job(
    job_id: str,
    current_user = Depends(get_current_user),
    db = Depends(get_db_session)
):
    """Cancel a specific training job"""
    
    training_job = db.query(TrainingJob).filter(TrainingJob.job_id == job_id).first()
    
    if not training_job:
        raise HTTPException(status_code=404, detail="Training job not found")
    
    # Check permissions
    if not current_user.is_admin and training_job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if training_job.status not in ["training", "pending"]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or failed job")
    
    try:
        # Stop the training process
        await training_service.stop_training(training_job.product_id)
        
        # Update job status
        training_job.status = "cancelled"
        training_job.stopped_at = datetime.utcnow()
        
        # Update product status
        product = db.query(Product).filter(Product.id == training_job.product_id).first()
        if product:
            product.training_status = "cancelled"
        
        db.commit()
        
        return {"message": "Training job cancelled successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")

@router.get("/queue")
async def get_training_queue(
    current_user = Depends(require_admin),
    db = Depends(get_db_session)
):
    """Get current training queue (admin only)"""
    
    # Get pending and running jobs
    pending_jobs = db.query(TrainingJob).filter(
        TrainingJob.status == "pending"
    ).order_by(TrainingJob.created_at).all()
    
    running_jobs = db.query(TrainingJob).filter(
        TrainingJob.status == "training"
    ).all()
    
    return {
        "queue": {
            "running": len(running_jobs),
            "pending": len(pending_jobs),
            "jobs": [
                {
                    "job_id": job.job_id,
                    "product_id": job.product_id,
                    "user_id": job.user_id,
                    "status": job.status,
                    "created_at": job.created_at,
                    "estimated_duration": "Unknown"  # Could calculate based on config
                }
                for job in (running_jobs + pending_jobs)
            ]
        }
    }

@router.get("/stats")
async def get_training_stats(
    current_user = Depends(require_admin),
    db = Depends(get_db_session)
):
    """Get training statistics (admin only)"""
    
    from sqlalchemy import func, extract
    
    # Total jobs by status
    status_stats = db.query(
        TrainingJob.status,
        func.count(TrainingJob.id)
    ).group_by(TrainingJob.status).all()
    
    # Jobs per day (last 30 days)
    daily_stats = db.query(
        func.date(TrainingJob.created_at).label('date'),
        func.count(TrainingJob.id).label('count')
    ).filter(
        TrainingJob.created_at >= datetime.utcnow() - timedelta(days=30)
    ).group_by(func.date(TrainingJob.created_at)).all()
    
    # Most active users
    user_stats = db.query(
        TrainingJob.user_id,
        func.count(TrainingJob.id).label('job_count')
    ).group_by(TrainingJob.user_id).order_by(
        func.count(TrainingJob.id).desc()
    ).limit(10).all()
    
    return {
        "status_distribution": {status: count for status, count in status_stats},
        "daily_jobs": [
            {"date": str(date), "count": count} 
            for date, count in daily_stats
        ],
        "top_users": [
            {"user_id": user_id, "job_count": count}
            for user_id, count in user_stats
        ]
    }