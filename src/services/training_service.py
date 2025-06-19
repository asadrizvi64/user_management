import os
import sys
import json
import shutil
import asyncio
import subprocess
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime
import yaml
from PIL import Image
from slugify import slugify

class ProductTrainingService:
    def __init__(self, base_path: str = "./"):
        self.base_path = Path(base_path)
        self.fluxgym_path = self.base_path / "fluxgym"
        self.storage_path = self.base_path / "storage"
        self.products_path = self.storage_path / "products"
        
        # Ensure directories exist
        self.products_path.mkdir(parents=True, exist_ok=True)
        
    async def start_product_training(
        self, 
        product_id: str, 
        images: List[str], 
        config: Dict,
        user_id: str
    ) -> str:
        """Start training for a product"""
        
        # Create product training directory
        product_dir = self.products_path / product_id
        product_dir.mkdir(exist_ok=True)
        
        dataset_dir = product_dir / "dataset"
        dataset_dir.mkdir(exist_ok=True)
        
        # Prepare dataset
        await self._prepare_dataset(images, dataset_dir, config)
        
        # Generate training configuration
        training_config = self._generate_training_config(product_id, config)
        
        # Start training process
        job_id = await self._start_training_process(product_id, training_config)
        
        return job_id
    
    async def _prepare_dataset(self, images: List[str], dataset_dir: Path, config: Dict):
        """Prepare training dataset from uploaded images"""
        
        trigger_word = config.get("trigger_word", "PRODUCT")
        resolution = config.get("resolution", 512)
        
        for i, image_path in enumerate(images):
            # Copy and resize image
            image_name = f"img_{i:04d}.jpg"
            target_image_path = dataset_dir / image_name
            
            # Resize image
            with Image.open(image_path) as img:
                # Resize maintaining aspect ratio
                width, height = img.size
                if width < height:
                    new_width = resolution
                    new_height = int((resolution/width) * height)
                else:
                    new_height = resolution
                    new_width = int((resolution/height) * width)
                
                img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                img_resized.save(target_image_path, "JPEG", quality=95)
            
            # Create caption file
            caption_file = dataset_dir / f"img_{i:04d}.txt"
            caption = f"{trigger_word} {config.get('base_caption', 'product image')}"
            
            with open(caption_file, 'w') as f:
                f.write(caption)
    
    def _generate_training_config(self, product_id: str, config: Dict) -> Dict:
        """Generate FluxGym training configuration"""
        
        product_name = slugify(config.get("product_name", product_id))
        
        return {
            "base_model": config.get("base_model", "flux-dev"),
            "lora_name": product_name,
            "concept_sentence": config.get("trigger_word", "PRODUCT"),
            "resolution": config.get("resolution", 512),
            "max_train_epochs": config.get("max_epochs", 16),
            "learning_rate": config.get("learning_rate", "8e-4"),
            "network_dim": config.get("network_dim", 4),
            "vram": config.get("vram", "16G"),
            "num_repeats": config.get("num_repeats", 10),
            "sample_prompts": config.get("sample_prompts", []),
            "sample_every_n_steps": config.get("sample_every_n_steps", 100),
            "save_every_n_epochs": config.get("save_every_n_epochs", 4),
            "seed": config.get("seed", 42),
            "workers": config.get("workers", 2),
            "timestep_sampling": config.get("timestep_sampling", "shift"),
            "guidance_scale": config.get("guidance_scale", 1.0)
        }
    
    async def _start_training_process(self, product_id: str, config: Dict) -> str:
        """Start the actual training process using FluxGym"""
        
        product_dir = self.products_path / product_id
        dataset_dir = product_dir / "dataset"
        output_dir = product_dir / "models"
        output_dir.mkdir(exist_ok=True)
        
        # Generate training script
        training_script = self._generate_training_script(config, dataset_dir, output_dir)
        
        # Save training script
        script_path = product_dir / "train.sh"
        with open(script_path, 'w') as f:
            f.write(training_script)
        
        # Make script executable
        os.chmod(script_path, 0o755)
        
        # Save configuration
        config_path = product_dir / "training_config.json"
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        # Start training process
        job_id = f"train_{product_id}_{int(datetime.now().timestamp())}"
        
        # Run training in background
        asyncio.create_task(self._execute_training(job_id, script_path, product_dir))
        
        return job_id
    
    def _generate_training_script(self, config: Dict, dataset_dir: Path, output_dir: Path) -> str:
        """Generate bash training script for FluxGym"""
        
        # Map VRAM setting to optimizer configuration
        vram = config["vram"]
        if vram == "12G":
            optimizer_config = """--optimizer_type adafactor \\
  --optimizer_args "relative_step=False" "scale_parameter=False" "warmup_init=False" \\
  --split_mode \\
  --network_args "train_blocks=single" \\
  --lr_scheduler constant_with_warmup \\
  --max_grad_norm 0.0 \\"""
        elif vram == "16G":
            optimizer_config = """--optimizer_type adafactor \\
  --optimizer_args "relative_step=False" "scale_parameter=False" "warmup_init=False" \\
  --lr_scheduler constant_with_warmup \\
  --max_grad_norm 0.0 \\"""
        else:  # 20G+
            optimizer_config = "--optimizer_type adamw8bit \\"
        
        # Sample configuration
        sample_config = ""
        if config["sample_prompts"] and config["sample_every_n_steps"] > 0:
            sample_prompts_file = output_dir / "sample_prompts.txt"
            with open(sample_prompts_file, 'w') as f:
                f.write('\n'.join(config["sample_prompts"]))
            
            sample_config = f"""--sample_prompts="{sample_prompts_file}" \\
  --sample_every_n_steps="{config['sample_every_n_steps']}" \\"""
        
        # Generate TOML dataset configuration
        toml_config = f"""[general]
shuffle_caption = false
caption_extension = '.txt'
keep_tokens = 1

[[datasets]]
resolution = {config['resolution']}
batch_size = 1
keep_tokens = 1

  [[datasets.subsets]]
  image_dir = '{dataset_dir}'
  class_tokens = '{config['concept_sentence']}'
  num_repeats = {config['num_repeats']}"""
        
        dataset_config_path = output_dir / "dataset.toml"
        with open(dataset_config_path, 'w') as f:
            f.write(toml_config)
        
        # Model paths
        fluxgym_models = self.fluxgym_path / "models"
        
        script = f"""#!/bin/bash
cd "{self.fluxgym_path}"

# Activate virtual environment if it exists
if [ -d "env" ]; then
    source env/bin/activate
fi

# Start training
accelerate launch \\
  --mixed_precision bf16 \\
  --num_cpu_threads_per_process 1 \\
  sd-scripts/flux_train_network.py \\
  --pretrained_model_name_or_path "{fluxgym_models}/unet/flux1-dev.sft" \\
  --clip_l "{fluxgym_models}/clip/clip_l.safetensors" \\
  --t5xxl "{fluxgym_models}/clip/t5xxl_fp16.safetensors" \\
  --ae "{fluxgym_models}/vae/ae.sft" \\
  --cache_latents_to_disk \\
  --save_model_as safetensors \\
  --sdpa --persistent_data_loader_workers \\
  --max_data_loader_n_workers {config['workers']} \\
  --seed {config['seed']} \\
  --gradient_checkpointing \\
  --mixed_precision bf16 \\
  --save_precision bf16 \\
  --network_module networks.lora_flux \\
  --network_dim {config['network_dim']} \\
  {optimizer_config}
  {sample_config}
  --learning_rate {config['learning_rate']} \\
  --cache_text_encoder_outputs \\
  --cache_text_encoder_outputs_to_disk \\
  --fp8_base \\
  --highvram \\
  --max_train_epochs {config['max_train_epochs']} \\
  --save_every_n_epochs {config['save_every_n_epochs']} \\
  --dataset_config "{dataset_config_path}" \\
  --output_dir "{output_dir}" \\
  --output_name "{config['lora_name']}" \\
  --timestep_sampling {config['timestep_sampling']} \\
  --discrete_flow_shift 3.1582 \\
  --model_prediction_type raw \\
  --guidance_scale {config['guidance_scale']} \\
  --loss_type l2
"""
        
        return script
    
    async def _execute_training(self, job_id: str, script_path: Path, product_dir: Path):
        """Execute training script and monitor progress"""
        
        log_file = product_dir / "training.log"
        
        try:
            # Start training process
            process = await asyncio.create_subprocess_exec(
                "bash", str(script_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=str(self.fluxgym_path)
            )
            
            # Monitor output and log progress
            with open(log_file, 'w') as f:
                async for line in process.stdout:
                    line_str = line.decode('utf-8')
                    f.write(line_str)
                    f.flush()
                    
                    # Parse progress from output
                    await self._parse_training_progress(job_id, line_str)
            
            # Wait for completion
            await process.wait()
            
            if process.returncode == 0:
                await self._on_training_complete(job_id, product_dir)
            else:
                await self._on_training_failed(job_id, product_dir)
                
        except Exception as e:
            await self._on_training_failed(job_id, product_dir, str(e))
    
    async def _parse_training_progress(self, job_id: str, log_line: str):
        """Parse training progress from log output"""
        
        # Look for epoch progress indicators
        if "epoch" in log_line.lower() and "/" in log_line:
            # Extract epoch information
            # This would depend on the exact format of FluxGym output
            pass
        
        # Look for step progress
        if "step" in log_line.lower():
            # Extract step information
            pass
        
        # Look for sample image generation
        if "sample" in log_line.lower() and ".png" in log_line:
            # Extract sample image path
            pass
    
    async def _on_training_complete(self, job_id: str, product_dir: Path):
        """Handle successful training completion"""
        
        # Update database status
        # Move final model to proper location
        # Generate README
        # Notify frontend
        pass
    
    async def _on_training_failed(self, job_id: str, product_dir: Path, error: str = None):
        """Handle training failure"""
        
        # Update database status
        # Log error
        # Notify frontend
        pass
    
    def get_training_status(self, product_id: str) -> Dict:
        """Get current training status for a product"""
        
        product_dir = self.products_path / product_id
        
        if not product_dir.exists():
            return {"status": "not_found"}
        
        # Check for training artifacts
        log_file = product_dir / "training.log"
        config_file = product_dir / "training_config.json"
        model_dir = product_dir / "models"
        
        status = {
            "status": "unknown",
            "progress": 0,
            "logs_available": log_file.exists(),
            "config": None
        }
        
        if config_file.exists():
            with open(config_file, 'r') as f:
                status["config"] = json.load(f)
        
        # Check for completed models
        if model_dir.exists():
            model_files = list(model_dir.glob("*.safetensors"))
            if model_files:
                status["status"] = "completed"
                status["progress"] = 100
                status["model_path"] = str(model_files[0])
        
        return status
    
    def get_training_logs(self, product_id: str) -> Optional[str]:
        """Get training logs for a product"""
        
        log_file = self.products_path / product_id / "training.log"
        
        if log_file.exists():
            with open(log_file, 'r') as f:
                return f.read()
        
        return None
    
    def get_sample_images(self, product_id: str) -> List[str]:
        """Get sample images generated during training"""
        
        sample_dir = self.products_path / product_id / "models" / "sample"
        
        if not sample_dir.exists():
            return []
        
        sample_files = list(sample_dir.glob("*.png"))
        return [str(f) for f in sample_files]
    
    def download_model(self, product_id: str) -> Optional[str]:
        """Get path to trained model for download"""
        
        model_dir = self.products_path / product_id / "models"
        
        if model_dir.exists():
            model_files = list(model_dir.glob("*.safetensors"))
            if model_files:
                return str(model_files[0])
        
        return None