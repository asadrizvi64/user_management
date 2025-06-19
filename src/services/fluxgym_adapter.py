"""
FluxGym Adapter Service
Provides a clean interface to FluxGym functionality
"""

import os
import sys
import yaml
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import tempfile
import shutil
from PIL import Image

@dataclass
class FluxGymConfig:
    """Configuration for FluxGym training"""
    base_model: str
    lora_name: str
    concept_sentence: str
    resolution: int = 512
    max_train_epochs: int = 16
    learning_rate: str = "8e-4"
    network_dim: int = 4
    vram: str = "16G"
    num_repeats: int = 10
    sample_prompts: List[str] = None
    sample_every_n_steps: int = 100
    save_every_n_epochs: int = 4
    seed: int = 42
    workers: int = 2
    timestep_sampling: str = "shift"
    guidance_scale: float = 1.0

class FluxGymAdapter:
    """Adapter class for FluxGym integration"""
    
    def __init__(self, fluxgym_path: str = "./fluxgym"):
        self.fluxgym_path = Path(fluxgym_path)
        self.models_config_path = self.fluxgym_path / "models.yaml"
        self.sd_scripts_path = self.fluxgym_path / "sd-scripts"
        
        # Load models configuration
        self.models_config = self._load_models_config()
        
        # Ensure FluxGym is properly setup
        self._verify_setup()
    
    def _load_models_config(self) -> Dict:
        """Load models configuration from FluxGym"""
        try:
            with open(self.models_config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            # Return default configuration if file doesn't exist
            return {
                "flux-dev": {
                    "repo": "cocktailpeanut/xulf-dev",
                    "base": "black-forest-labs/FLUX.1-dev",
                    "file": "flux1-dev.sft"
                }
            }
    
    def _verify_setup(self) -> bool:
        """Verify that FluxGym is properly setup"""
        if not self.fluxgym_path.exists():
            raise RuntimeError(f"FluxGym path not found: {self.fluxgym_path}")
        
        if not self.sd_scripts_path.exists():
            raise RuntimeError(f"sd-scripts not found. Run: cd {self.fluxgym_path} && git clone -b sd3 https://github.com/kohya-ss/sd-scripts")
        
        # Check for required scripts
        required_scripts = [
            "flux_train_network.py",
            "networks/lora_flux.py"
        ]
        
        for script in required_scripts:
            script_path = self.sd_scripts_path / script
            if not script_path.exists():
                raise RuntimeError(f"Required script not found: {script_path}")
        
        return True
    
    def get_available_models(self) -> Dict[str, Dict]:
        """Get list of available base models"""
        return self.models_config
    
    def download_model(self, model_name: str) -> bool:
        """Download a specific model if not already available"""
        if model_name not in self.models_config:
            raise ValueError(f"Unknown model: {model_name}")
        
        model_config = self.models_config[model_name]
        repo = model_config["repo"]
        filename = model_config["file"]
        
        # Determine model folder based on model type
        if model_name in ["flux-dev", "flux-schnell"]:
            model_folder = self.fluxgym_path / "models" / "unet"
        else:
            model_folder = self.fluxgym_path / "models" / "unet" / repo
        
        model_path = model_folder / filename
        
        if model_path.exists():
            print(f"Model {model_name} already exists at {model_path}")
            return True
        
        # Download using huggingface_hub
        try:
            from huggingface_hub import hf_hub_download
            
            model_folder.mkdir(parents=True, exist_ok=True)
            
            print(f"Downloading {model_name} from {repo}...")
            hf_hub_download(
                repo_id=repo,
                filename=filename,
                local_dir=str(model_folder)
            )
            
            print(f"Successfully downloaded {model_name}")
            return True
            
        except Exception as e:
            print(f"Failed to download {model_name}: {e}")
            return False
    
    def download_base_dependencies(self) -> bool:
        """Download base dependencies (VAE, CLIP, T5)"""
        try:
            from huggingface_hub import hf_hub_download
            
            downloads = [
                {
                    "repo": "comfyanonymous/flux_text_encoders",
                    "filename": "clip_l.safetensors",
                    "local_dir": self.fluxgym_path / "models" / "clip"
                },
                {
                    "repo": "comfyanonymous/flux_text_encoders", 
                    "filename": "t5xxl_fp16.safetensors",
                    "local_dir": self.fluxgym_path / "models" / "clip"
                },
                {
                    "repo": "cocktailpeanut/xulf-dev",
                    "filename": "ae.sft",
                    "local_dir": self.fluxgym_path / "models" / "vae"
                }
            ]
            
            for download in downloads:
                local_dir = download["local_dir"]
                local_dir.mkdir(parents=True, exist_ok=True)
                
                file_path = local_dir / download["filename"]
                if file_path.exists():
                    print(f"File already exists: {file_path}")
                    continue
                
                print(f"Downloading {download['filename']}...")
                hf_hub_download(
                    repo_id=download["repo"],
                    filename=download["filename"],
                    local_dir=str(local_dir)
                )
            
            return True
            
        except Exception as e:
            print(f"Failed to download base dependencies: {e}")
            return False
    
    def prepare_dataset(self, images: List[str], output_dir: Path, config: FluxGymConfig) -> Path:
        """Prepare training dataset from images"""
        dataset_dir = output_dir / "dataset"
        dataset_dir.mkdir(parents=True, exist_ok=True)
        
        for i, image_path in enumerate(images):
            # Copy and resize image
            image_name = f"img_{i:04d}.jpg"
            target_image_path = dataset_dir / image_name
            
            # Resize image
            with Image.open(image_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize maintaining aspect ratio
                width, height = img.size
                if width < height:
                    new_width = config.resolution
                    new_height = int((config.resolution / width) * height)
                else:
                    new_height = config.resolution
                    new_width = int((config.resolution / height) * width)
                
                img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                img_resized.save(target_image_path, "JPEG", quality=95)
            
            # Create caption file
            caption_file = dataset_dir / f"img_{i:04d}.txt"
            caption = f"{config.concept_sentence} product image"
            
            with open(caption_file, 'w') as f:
                f.write(caption)
        
        return dataset_dir
    
    def generate_toml_config(self, dataset_dir: Path, config: FluxGymConfig) -> str:
        """Generate TOML configuration for training"""
        toml_content = f"""[general]
shuffle_caption = false
caption_extension = '.txt'
keep_tokens = 1

[[datasets]]
resolution = {config.resolution}
batch_size = 1
keep_tokens = 1

  [[datasets.subsets]]
  image_dir = '{dataset_dir}'
  class_tokens = '{config.concept_sentence}'
  num_repeats = {config.num_repeats}"""
        
        return toml_content
    
    def generate_training_script(self, config: FluxGymConfig, dataset_config_path: Path, output_dir: Path) -> str:
        """Generate training script for FluxGym"""
        
        # Get model paths
        model_config = self.models_config[config.base_model]
        model_file = model_config["file"]
        repo = model_config["repo"]
        
        if config.base_model in ["flux-dev", "flux-schnell"]:
            model_folder = self.fluxgym_path / "models" / "unet"
        else:
            model_folder = self.fluxgym_path / "models" / "unet" / repo
        
        model_path = model_folder / model_file
        clip_path = self.fluxgym_path / "models" / "clip" / "clip_l.safetensors"
        t5_path = self.fluxgym_path / "models" / "clip" / "t5xxl_fp16.safetensors"
        ae_path = self.fluxgym_path / "models" / "vae" / "ae.sft"
        
        # Generate optimizer configuration based on VRAM
        if config.vram == "12G":
            optimizer_config = """--optimizer_type adafactor \\
  --optimizer_args "relative_step=False" "scale_parameter=False" "warmup_init=False" \\
  --split_mode \\
  --network_args "train_blocks=single" \\
  --lr_scheduler constant_with_warmup \\
  --max_grad_norm 0.0 \\"""
        elif config.vram == "16G":
            optimizer_config = """--optimizer_type adafactor \\
  --optimizer_args "relative_step=False" "scale_parameter=False" "warmup_init=False" \\
  --lr_scheduler constant_with_warmup \\
  --max_grad_norm 0.0 \\"""
        else:  # 20G+
            optimizer_config = "--optimizer_type adamw8bit \\"
        
        # Sample configuration
        sample_config = ""
        if config.sample_prompts and config.sample_every_n_steps > 0:
            sample_prompts_file = output_dir / "sample_prompts.txt"
            with open(sample_prompts_file, 'w') as f:
                f.write('\n'.join(config.sample_prompts))
            
            sample_config = f"""--sample_prompts="{sample_prompts_file}" \\
  --sample_every_n_steps="{config.sample_every_n_steps}" \\"""
        
        # Generate script
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
  --pretrained_model_name_or_path "{model_path}" \\
  --clip_l "{clip_path}" \\
  --t5xxl "{t5_path}" \\
  --ae "{ae_path}" \\
  --cache_latents_to_disk \\
  --save_model_as safetensors \\
  --sdpa --persistent_data_loader_workers \\
  --max_data_loader_n_workers {config.workers} \\
  --seed {config.seed} \\
  --gradient_checkpointing \\
  --mixed_precision bf16 \\
  --save_precision bf16 \\
  --network_module networks.lora_flux \\
  --network_dim {config.network_dim} \\
  {optimizer_config}
  {sample_config}
  --learning_rate {config.learning_rate} \\
  --cache_text_encoder_outputs \\
  --cache_text_encoder_outputs_to_disk \\
  --fp8_base \\
  --highvram \\
  --max_train_epochs {config.max_train_epochs} \\
  --save_every_n_epochs {config.save_every_n_epochs} \\
  --dataset_config "{dataset_config_path}" \\
  --output_dir "{output_dir}" \\
  --output_name "{config.lora_name}" \\
  --timestep_sampling {config.timestep_sampling} \\
  --discrete_flow_shift 3.1582 \\
  --model_prediction_type raw \\
  --guidance_scale {config.guidance_scale} \\
  --loss_type l2
"""
        
        return script
    
    def setup_training(self, images: List[str], config: FluxGymConfig, output_dir: Path) -> Tuple[Path, Path]:
        """Setup complete training environment"""
        
        # Ensure base dependencies are downloaded
        self.download_base_dependencies()
        
        # Download the specific model
        self.download_model(config.base_model)
        
        # Prepare dataset
        dataset_dir = self.prepare_dataset(images, output_dir, config)
        
        # Generate TOML config
        toml_content = self.generate_toml_config(dataset_dir, config)
        dataset_config_path = output_dir / "dataset.toml"
        with open(dataset_config_path, 'w') as f:
            f.write(toml_content)
        
        # Generate training script
        script_content = self.generate_training_script(config, dataset_config_path, output_dir)
        script_path = output_dir / "train.sh"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Make script executable
        os.chmod(script_path, 0o755)
        
        # Save sample prompts if provided
        if config.sample_prompts:
            sample_prompts_path = output_dir / "sample_prompts.txt"
            with open(sample_prompts_path, 'w') as f:
                f.write('\n'.join(config.sample_prompts))
        
        return script_path, dataset_config_path
    
    def validate_training_setup(self, config: FluxGymConfig) -> List[str]:
        """Validate training configuration and return any issues"""
        issues = []
        
        # Check model availability
        if config.base_model not in self.models_config:
            issues.append(f"Unknown base model: {config.base_model}")
        
        # Check VRAM requirements
        model_config = self.models_config.get(config.base_model, {})
        min_vram = model_config.get("min_vram_gb", 12)
        vram_gb = int(config.vram.rstrip('G'))
        
        if vram_gb < min_vram:
            issues.append(f"Insufficient VRAM: {config.vram} < {min_vram}GB required for {config.base_model}")
        
        # Check parameter ranges
        if config.max_train_epochs < 1 or config.max_train_epochs > 1000:
            issues.append("max_train_epochs must be between 1 and 1000")
        
        if config.network_dim < 1 or config.network_dim > 128:
            issues.append("network_dim must be between 1 and 128")
        
        if config.resolution < 256 or config.resolution > 2048:
            issues.append("resolution must be between 256 and 2048")
        
        # Check required files
        try:
            self._verify_setup()
        except RuntimeError as e:
            issues.append(str(e))
        
        return issues
    
    def get_model_info(self, model_name: str) -> Optional[Dict]:
        """Get detailed information about a model"""
        return self.models_config.get(model_name)
    
    def estimate_training_time(self, config: FluxGymConfig, num_images: int) -> Dict[str, float]:
        """Estimate training time and resource usage"""
        
        # Base time per epoch in minutes (rough estimates)
        base_times = {
            "12G": 0.8,  # Slower due to optimizations
            "16G": 0.6,
            "20G": 0.4
        }
        
        base_time = base_times.get(config.vram, 0.6)
        
        # Factor in number of images and repeats
        total_steps = config.max_train_epochs * num_images * config.num_repeats
        
        # Estimate time per step
        time_per_step = base_time / max(num_images * config.num_repeats, 1)
        
        total_time_minutes = total_steps * time_per_step
        
        return {
            "estimated_minutes": total_time_minutes,
            "estimated_hours": total_time_minutes / 60,
            "total_steps": total_steps,
            "time_per_step_seconds": time_per_step * 60
        }