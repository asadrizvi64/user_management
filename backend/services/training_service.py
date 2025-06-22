# services/training_service.py
import uuid
import asyncio
import logging
from typing import List, Dict, Optional, AsyncGenerator
from sqlalchemy.orm import Session
from datetime import datetime

from services.fluxgym_service import FluxGymService
from models.training import TrainingJob, TrainingStatus
from models.product import Product
from database import get_db

logger = logging.getLogger(__name__)

class TrainingService:
    def __init__(self):
        # Initialize FluxGym service with auto-detection
        self.fluxgym_service = FluxGymService()  # Will auto-find your training-engine path
        self.active_jobs = {}  # Track active training processes
        
        logger.info("Training service initialized")
        
        # Log FluxGym status
        status = self.fluxgym_service.get_fluxgym_status()
        logger.info(f"FluxGym status: {status}")
    
    async def start_training_job(
        self,
        job_id: int,
        product_name: str,
        base_model: str,
        trigger_word: str,
        image_paths: List[str],
        captions: List[str],  # Not used with sd-scripts as it generates its own
        params: Dict,
        user_id: int
    ):
        """Start a training job using your sd-scripts installation"""
        
        external_id = str(uuid.uuid4())
        
        try:
            # Update job with external ID and status
            with next(get_db()) as db:
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.external_id = external_id
                    job.status = TrainingStatus.RUNNING
                    job.started_at = datetime.utcnow()
                    job.message = "Preparing dataset for sd-scripts training..."
                    db.commit()
            
            logger.info(f"Starting training job {job_id} (external: {external_id})")
            logger.info(f"Product: {product_name}, Images: {len(image_paths)}")
            
            # Prepare dataset for sd-scripts
            dataset_path = await self.fluxgym_service.prepare_dataset(
                product_name=product_name,
                image_paths=image_paths,
                trigger_word=trigger_word
            )
            
            # Update status
            with next(get_db()) as db:
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.message = "Starting sd-scripts FLUX training..."
                    job.progress = 5.0
                    db.commit()
            
            # Configure training parameters for sd-scripts
            training_config = {
                "base_model": base_model,
                "max_train_steps": params.get("max_train_steps", 1000),
                "learning_rate": params.get("learning_rate", "1e-4"),
                "batch_size": params.get("batch_size", 1),
                "lora_rank": params.get("lora_rank", 16),
                "lora_alpha": params.get("lora_alpha", 16),
                "resolution": params.get("resolution", 1024),
                "save_every_n_steps": params.get("save_every_n_steps", 500),
                "sample_every_n_steps": params.get("sample_every_n_steps", 500),
                "seed": params.get("seed", -1),
                "mixed_precision": params.get("mixed_precision", "bf16"),
                "gpu_id": params.get("gpu_id", "0")
            }
            
            # Start sd-scripts training
            result = await self.fluxgym_service.start_training(
                product_name=product_name,
                dataset_path=dataset_path,
                trigger_word=trigger_word,
                training_config=training_config,
                job_id=external_id
            )
            
            if not result["success"]:
                raise Exception(result["error"])
            
            # Store the process for monitoring
            self.active_jobs[external_id] = {
                "process": result["process"],
                "product_name": product_name,
                "user_id": user_id,
                "job_id": job_id,
                "output_dir": result["output_dir"],
                "training_script": result["training_script"]
            }
            
            # Start monitoring in background
            asyncio.create_task(self._monitor_training_job(external_id))
            
            # Update status
            with next(get_db()) as db:
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.message = "Training started with sd-scripts"
                    job.progress = 10.0
                    db.commit()
                    
            logger.info(f"Successfully started training job {external_id}")
                    
        except Exception as e:
            logger.error(f"Failed to start training job {job_id}: {e}")
            # Update job status to failed
            with next(get_db()) as db:
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.status = TrainingStatus.FAILED
                    job.completed_at = datetime.utcnow()
                    job.message = f"Training failed: {str(e)}"
                    db.commit()
    
    async def _monitor_training_job(self, external_id: str):
        """Monitor an sd-scripts training job"""
        
        job_info = self.active_jobs.get(external_id)
        if not job_info:
            logger.error(f"Job info not found for {external_id}")
            return
        
        process = job_info["process"]
        product_name = job_info["product_name"]
        job_id = job_info["job_id"]
        
        logger.info(f"Starting monitoring for job {external_id}")
        
        try:
            # Monitor training progress
            async for progress in self.fluxgym_service.monitor_training(process, external_id):
                
                # Update database with progress
                with next(get_db()) as db:
                    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                    if job:
                        job.progress = progress.get("progress", job.progress or 0)
                        job.message = progress.get("message", "Training in progress...")
                        db.commit()
                
                logger.debug(f"Progress update for {external_id}: {progress.get('progress', 0):.1f}%")
            
            # Wait for process completion
            await process.wait()
            
            logger.info(f"Training process completed for {external_id}, return code: {process.returncode}")
            
            if process.returncode == 0:
                # Training completed successfully
                await self._handle_training_completion(external_id, job_id, product_name)
            else:
                # Training failed
                await self._handle_training_failure(external_id, job_id, f"Training process failed with code {process.returncode}")
                
        except Exception as e:
            logger.error(f"Error monitoring training job {external_id}: {e}")
            await self._handle_training_failure(external_id, job_id, str(e))
        
        finally:
            # Cleanup
            if external_id in self.active_jobs:
                del self.active_jobs[external_id]
            logger.info(f"Monitoring completed for job {external_id}")
    
    async def _handle_training_completion(self, external_id: str, job_id: int, product_name: str):
        """Handle successful training completion"""
        
        try:
            logger.info(f"Handling training completion for {external_id}")
            
            # Get the trained model path
            model_path = self.fluxgym_service.get_trained_model_path(product_name)
            
            with next(get_db()) as db:
                # Update training job
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.status = TrainingStatus.COMPLETED
                    job.progress = 100.0
                    job.completed_at = datetime.utcnow()
                    job.message = "Training completed successfully with sd-scripts"
                    db.commit()
                
                # Create or update product
                product = db.query(Product).filter(Product.name == product_name).first()
                if product and model_path:
                    product.model_path = str(model_path)
                    product.updated_at = datetime.utcnow()
                    db.commit()
                    
                    logger.info(f"Updated product {product_name} with trained model: {model_path}")
                elif model_path:
                    logger.warning(f"Model trained but product {product_name} not found in database")
                else:
                    logger.warning(f"Training completed but model file not found for {product_name}")
            
            # Cleanup training files
            await self.fluxgym_service.cleanup_training_files(product_name, external_id)
            
            logger.info(f"Training completion handled successfully for {external_id}")
            
        except Exception as e:
            logger.error(f"Error handling training completion: {e}")
            await self._handle_training_failure(external_id, job_id, f"Post-training error: {str(e)}")
    
    async def _handle_training_failure(self, external_id: str, job_id: int, error_message: str):
        """Handle training failure"""
        
        with next(get_db()) as db:
            job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
            if job:
                job.status = TrainingStatus.FAILED
                job.completed_at = datetime.utcnow()
                job.message = error_message
                db.commit()
        
        logger.error(f"Training job {external_id} failed: {error_message}")
    
    async def monitor_training(self, external_id: str) -> AsyncGenerator[Dict, None]:
        """Monitor training progress for API streaming"""
        
        job_info = self.active_jobs.get(external_id)
        if not job_info:
            yield {"error": "Training job not found"}
            return
        
        process = job_info["process"]
        
        try:
            async for progress in self.fluxgym_service.monitor_training(process, external_id):
                yield progress
        except Exception as e:
            yield {"error": str(e)}
    
    async def stop_training(self, external_id: str) -> bool:
        """Stop a running training job"""
        
        job_info = self.active_jobs.get(external_id)
        if not job_info:
            return False
        
        try:
            process = job_info["process"]
            process.terminate()
            
            # Wait a bit for graceful termination
            try:
                await asyncio.wait_for(process.wait(), timeout=10.0)
            except asyncio.TimeoutError:
                # Force kill if it doesn't terminate gracefully
                process.kill()
                await process.wait()
            
            # Update database
            job_id = job_info["job_id"]
            with next(get_db()) as db:
                job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                if job:
                    job.status = TrainingStatus.CANCELLED
                    job.completed_at = datetime.utcnow()
                    job.message = "Training cancelled by user"
                    db.commit()
            
            # Cleanup
            product_name = job_info["product_name"]
            await self.fluxgym_service.cleanup_training_files(product_name, external_id)
            
            if external_id in self.active_jobs:
                del self.active_jobs[external_id]
            
            logger.info(f"Training job {external_id} stopped successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping training job {external_id}: {e}")
            return False
    
    def get_available_base_models(self) -> Dict[str, Dict]:
        """Get available base models for training"""
        return {
            "flux-dev": {
                "name": "FLUX.1 Dev",
                "description": "High-quality model for professional use",
                "license": "Non-commercial",
                "recommended": True,
                "model_path": "black-forest-labs/FLUX.1-dev"
            },
            "flux-schnell": {
                "name": "FLUX.1 Schnell",
                "description": "Fast model for quick iterations", 
                "license": "Apache 2.0",
                "recommended": False,
                "model_path": "black-forest-labs/FLUX.1-schnell"
            }
        }
    
    async def generate_auto_captions(self, image_paths: List[str], trigger_word: str) -> List[str]:
        """Generate automatic captions (sd-scripts handles this internally)"""
        # sd-scripts will handle captioning during training
        return [f"{trigger_word}" for _ in image_paths]
    
    async def get_training_logs(self, external_id: str) -> List[str]:
        """Get training logs for a specific job"""
        job_info = self.active_jobs.get(external_id)
        if not job_info:
            return ["Training job not found or completed"]
        
        return [
            "Training started with sd-scripts",
            "Dataset prepared successfully", 
            "FLUX LoRA training in progress...",
            "Check real-time progress via the monitoring endpoint"
        ]
    
    def get_system_status(self) -> Dict[str, any]:
        """Get training system status"""
        fluxgym_status = self.fluxgym_service.get_fluxgym_status()
        
        return {
            "fluxgym": fluxgym_status,
            "active_jobs": len(self.active_jobs),
            "job_details": {
                job_id: {
                    "product_name": info["product_name"],
                    "user_id": info["user_id"]
                }
                for job_id, info in self.active_jobs.items()
            }
        }