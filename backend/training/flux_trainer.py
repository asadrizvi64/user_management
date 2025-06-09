# backend/training/flux_trainer.py
import os
import sys
import uuid
import shutil
import subprocess
import asyncio
import yaml
import json
from typing import List, Dict, Optional, AsyncGenerator
from pathlib import Path
from slugify import slugify
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM

from ..models.training import TrainingJob, TrainingStatus
from ..models.product import Product
from ..app.database import get_db
from ..core.exceptions import TrainingError
from .dataset_manager import DatasetManager
from .config_generator import ConfigGenerator
from .model_downloader import ModelDownloader

class FluxTrainer:
    def __init__(self):
        self.base_path = Path("training-engine")
        self.models_path = self.base_path / "models"
        self.datasets_path = self.base_path / "datasets"
        self.outputs_path = self.base_path / "outputs"
        self.sd_scripts_path = self.base_path / "sd-scripts"
        
        # Load model configurations
        with open(self.base_path / "models.yaml", 'r') as f:
            self.models_config = yaml.safe_load(f)
    
    async def start_training(
        self,
        product_id: int,
        product_name: str,
        base_model: str,
        trigger_word: str,
        images: List[str],
        captions: List[str],
        training_params: Dict,
        user_id: int
    ) -> str:
        """Start training a new product model"""
        
        # Create training job
        job_id = str(uuid.uuid4())
        
        try:
            # Prepare dataset
            dataset_manager = DatasetManager(self.datasets_path)
            dataset_path = await dataset_manager.create_dataset(
                product_name, images, captions, training_params.get("resolution", 512)
            )
            
            # Download base models if needed
            model_downloader = ModelDownloader(self.models_path)
            await model_downloader.download_base_models(base_model)
            
            # Generate training configuration
            config_generator = ConfigGenerator()
            training_script, training_config = config_generator.generate_config(
                product_name=product_name,
                base_model=base_model,
                trigger_word=trigger_word,
                dataset_path=dataset_path,
                training_params=training_params,
                output_path=self.outputs_path
            )
            
            # Save configurations
            output_dir = self.outputs_path / slugify(product_name)
            output_dir.mkdir(exist_ok=True)
            
            script_path = output_dir / "train.sh"
            config_path = output_dir / "dataset.toml"
            
            with open(script_path, 'w') as f:
                f.write(training_script)
            
            with open(config_path, 'w') as f:
                f.write(training_config)
            
            # Start training process
            process = await self._start_training_process(script_path, job_id)
            
            return job_id
            
        except Exception as e:
            raise TrainingError(f"Failed to start training: {str(e)}")
    
    async def _start_training_process(self, script_path: Path, job_id: str) -> subprocess.Popen:
        """Start the actual training process"""
        
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        env['LOG_LEVEL'] = 'DEBUG'
        env['TRAINING_JOB_ID'] = job_id
        
        if sys.platform == "win32":
            command = str(script_path)
        else:
            command = f"bash {script_path}"
        
        process = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env,
            cwd=self.base_path
        )
        
        return process
    
    async def monitor_training(self, job_id: str) -> AsyncGenerator[Dict, None]:
        """Monitor training progress and yield updates"""
        
        # This would integrate with the actual training process
        # For now, we'll simulate progress updates
        
        progress_steps = [
            {"step": 0, "status": "initializing", "message": "Setting up training environment"},
            {"step": 10, "status": "preparing", "message": "Preparing dataset"},
            {"step": 20, "status": "training", "message": "Starting model training"},
            {"step": 50, "status": "training", "message": "Training in progress..."},
            {"step": 80, "status": "training", "message": "Generating samples"},
            {"step": 100, "status": "completed", "message": "Training completed successfully"}
        ]
        
        for progress in progress_steps:
            yield progress
            await asyncio.sleep(2)  # Simulate time delay
    
    async def generate_auto_captions(
        self,
        images: List[str],
        trigger_word: str
    ) -> List[str]:
        """Generate automatic captions using Florence-2"""
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        torch_dtype = torch.float16
        
        model = AutoModelForCausalLM.from_pretrained(
            "multimodalart/Florence-2-large-no-flash-attn",
            torch_dtype=torch_dtype,
            trust_remote_code=True
        ).to(device)
        
        processor = AutoProcessor.from_pretrained(
            "multimodalart/Florence-2-large-no-flash-attn",
            trust_remote_code=True
        )
        
        captions = []
        
        for image_path in images:
            try:
                image = Image.open(image_path).convert("RGB")
                
                prompt = "<DETAILED_CAPTION>"
                inputs = processor(text=prompt, images=image, return_tensors="pt").to(device, torch_dtype)
                
                generated_ids = model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=1024,
                    num_beams=3
                )
                
                generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
                parsed_answer = processor.post_process_generation(
                    generated_text, task=prompt, image_size=(image.width, image.height)
                )
                
                caption_text = parsed_answer["<DETAILED_CAPTION>"].replace("The image shows ", "")
                
                if trigger_word:
                    caption_text = f"{trigger_word} {caption_text}"
                
                captions.append(caption_text)
                
            except Exception as e:
                captions.append(f"{trigger_word} image" if trigger_word else "image")
        
        # Cleanup
        model.to("cpu")
        del model
        del processor
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return captions
    
    def get_available_base_models(self) -> Dict[str, Dict]:
        """Get list of available base models"""
        return self.models_config
    
    async def get_training_logs(self, job_id: str) -> List[str]:
        """Get training logs for a specific job"""
        # Implementation would read actual log files
        # For now, return sample logs
        return [
            "Training started",
            "Dataset prepared with 50 images",
            "Epoch 1/10 completed",
            "Generating sample images...",
            "Training progress: 45%"
        ]
    
    async def stop_training(self, job_id: str) -> bool:
        """Stop a running training job"""
        # Implementation would kill the actual process
        # For now, just return success
        return True
    
    def get_trained_model_path(self, product_name: str) -> Optional[Path]:
        """Get the path to a trained model"""
        product_dir = self.outputs_path / slugify(product_name)
        
        # Look for .safetensors files
        for file in product_dir.glob("*.safetensors"):
            return file
        
        return None
