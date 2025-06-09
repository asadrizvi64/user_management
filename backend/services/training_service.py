# backend/services/training_service.py
import uuid
from typing import List, Dict, Optional, AsyncGenerator
from sqlalchemy.orm import Session
from datetime import datetime

from training.flux_trainer import FluxTrainer
from models.training import TrainingJob, TrainingStatus
from app.database import get_db

class TrainingService:
    def __init__(self):
        self.flux_trainer = FluxTrainer()
        self.active_jobs = {}  # Track active training processes
    
    async def start_training_job(
        self,
        job_id: int,
        product_name: str,
        base_model: str,
        trigger_word: str,
        image_paths: List[str],
        captions: List[str],
        params: Dict,
        user_id: int
    ):
        """Start a training job in the background"""
        
        # Generate external job ID for tracking
        external_id = str(uuid.uuid4())
        
        # Update job with external ID
        with next(get_db()) as db:
            job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
            if job:
                job.external_id = external_id
                job.status = TrainingStatus.RUNNING
                job.started_at = datetime.utcnow()
                db.commit()
        
        try:
            # Start training with FluxTrainer
            await self.flux_trainer.start_training(
                product_id=0,  # Will be set after product creation
                product_name=product_name,
                base_model=base_model,
                trigger_word=trigger_word,
                images=image_paths,
                captions=captions,
                training_params=params,
                user_id=user_id
            )
            
            # Update job status to completed
            with next(get_db()) as db:
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.status = TrainingStatus.COMPLETED
                    job.progress = 100.0
                    job.completed_at = datetime.utcnow()
                    job.message = "Training completed successfully"
                    db.commit()
                    
        except Exception as e:
            # Update job status to failed
            with next(get_db()) as db:
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.status = TrainingStatus.FAILED
                    job.completed_at = datetime.utcnow()
                    job.message = f"Training failed: {str(e)}"
                    db.commit()
    
    async def monitor_training(self, external_id: str) -> AsyncGenerator[Dict, None]:
        """Monitor training progress for a job"""
        async for progress in self.flux_trainer.monitor_training(external_id):
            yield progress
    
    async def get_training_logs(self, external_id: str) -> List[str]:
        """Get training logs for a job"""
        return await self.flux_trainer.get_training_logs(external_id)
    
    async def stop_training(self, external_id: str) -> bool:
        """Stop a running training job"""
        return await self.flux_trainer.stop_training(external_id)
    
    async def generate_auto_captions(self, image_paths: List[str], trigger_word: str) -> List[str]:
        """Generate automatic captions for images"""
        return await self.flux_trainer.generate_auto_captions(image_paths, trigger_word)
    
    def get_available_base_models(self) -> Dict:
        """Get available base models"""
        return self.flux_trainer.get_available_base_models()
