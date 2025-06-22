# services/fluxgym_service.py
import os
import sys
import asyncio
import shutil
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Optional, AsyncGenerator
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class FluxGymService:
    """Direct integration with existing FluxGym installation"""
    
    def __init__(self, fluxgym_path: str = None):
        # Auto-detect your FluxGym path
        if fluxgym_path is None:
            fluxgym_path = self._find_fluxgym_path()
        
        self.fluxgym_path = Path(fluxgym_path)
        self.datasets_path = Path("storage/datasets")
        self.outputs_path = Path("storage/trained_models") 
        
        # Create directories
        self.datasets_path.mkdir(parents=True, exist_ok=True)
        self.outputs_path.mkdir(parents=True, exist_ok=True)
        
        # Verify FluxGym exists
        if not self.fluxgym_path.exists():
            raise Exception(f"FluxGym not found at {fluxgym_path}. Please ensure it's accessible.")
        
        logger.info(f"✅ FluxGym initialized at: {self.fluxgym_path.absolute()}")
    
    def _find_fluxgym_path(self) -> str:
        """Find FluxGym installation - your specific setup"""
        
        # Your specific paths based on your directory structure
        possible_paths = [
            "../training-engine/sd-scripts",           # Most likely location
            "../training-engine",                      # Alternative location
            "../../training-engine/sd-scripts",       # If running from deeper directory
            "training-engine/sd-scripts",              # If moved to backend
            "../training-engine/fluxgym",              # If FluxGym is separate
        ]
        
        for path in possible_paths:
            path_obj = Path(path)
            if path_obj.exists():
                # Check if it has sd-scripts or FluxGym files
                key_files = [
                    "flux_train_network.py",
                    "train_network.py",
                    "networks",
                    "library"
                ]
                
                found_files = []
                for file in key_files:
                    if (path_obj / file).exists():
                        found_files.append(file)
                
                if found_files:  # If we found any FluxGym/sd-scripts files
                    logger.info(f"Found FluxGym/sd-scripts at: {path_obj.absolute()}")
                    logger.info(f"Key files found: {found_files}")
                    return str(path_obj)
        
        logger.warning("FluxGym not found in expected locations:")
        for path in possible_paths:
            logger.warning(f"  - {Path(path).absolute()} - {'✅' if Path(path).exists() else '❌'}")
        
        # Default to your known path
        return "../training-engine/sd-scripts"
    
    async def prepare_dataset(self, product_name: str, image_paths: List[str], trigger_word: str) -> Path:
        """Prepare dataset for FluxGym training"""
        
        dataset_dir = self.datasets_path / product_name.replace(" ", "_").lower()
        dataset_dir.mkdir(exist_ok=True)
        
        # Clear existing files
        for file in dataset_dir.iterdir():
            if file.is_file():
                file.unlink()
        
        # Copy images and create caption files
        valid_images = 0
        for i, image_path in enumerate(image_paths):
            src_path = Path(image_path)
            if not src_path.exists():
                logger.warning(f"Image not found: {image_path}")
                continue
            
            # Copy image with consistent naming
            dst_image = dataset_dir / f"image_{i:04d}.jpg"
            shutil.copy2(src_path, dst_image)
            
            # Create simple caption file (FluxGym will enhance with Florence)
            caption_file = dataset_dir / f"image_{i:04d}.txt"
            with open(caption_file, 'w', encoding='utf-8') as f:
                f.write(f"{trigger_word}")
            
            valid_images += 1
        
        logger.info(f"Prepared dataset with {valid_images} images at {dataset_dir}")
        return dataset_dir
    
    async def start_training(self, product_name: str, dataset_path: Path, trigger_word: str, training_config: Dict, job_id: str) -> Dict[str, any]:
        """Start training using sd-scripts with FluxGym configuration"""
        
        try:
            output_dir = self.outputs_path / product_name.replace(" ", "_").lower()
            output_dir.mkdir(exist_ok=True)
            
            # Create training script that uses sd-scripts
            training_script = self._create_training_script(dataset_path, output_dir, trigger_word, training_config, job_id)
            
            # Set up environment for sd-scripts
            env = os.environ.copy()
            env.update({
                'PYTHONPATH': str(self.fluxgym_path),
                'CUDA_VISIBLE_DEVICES': training_config.get('gpu_id', '0'),
                'TRAINING_JOB_ID': job_id
            })
            
            # Start training process
            process = await asyncio.create_subprocess_exec(
                sys.executable, str(training_script),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                env=env,
                cwd=str(self.fluxgym_path)
            )
            
            logger.info(f"Started training process for {product_name} (Job: {job_id})")
            
            return {
                "success": True,
                "process": process,
                "output_dir": str(output_dir),
                "training_script": str(training_script)
            }
            
        except Exception as e:
            logger.error(f"Failed to start FluxGym training: {e}")
            return {"success": False, "error": str(e)}
    
    def _create_training_script(self, dataset_path: Path, output_dir: Path, trigger_word: str, config: Dict, job_id: str) -> Path:
        """Create a Python script that runs sd-scripts training"""
        
        params = {
            "dataset_path": str(dataset_path),
            "output_dir": str(output_dir),
            "output_name": output_dir.name,
            "trigger_word": trigger_word,
            "steps": config.get("max_train_steps", 1000),
            "learning_rate": float(config.get("learning_rate", "1e-4")),
            "batch_size": config.get("batch_size", 1),
            "lora_rank": config.get("lora_rank", 16),
            "lora_alpha": config.get("lora_alpha", 16),
            "resolution": config.get("resolution", 1024),
            "save_every": config.get("save_every_n_steps", 500),
            "sample_every": config.get("sample_every_n_steps", 500),
            "seed": config.get("seed", -1),
            "mixed_precision": config.get("mixed_precision", "bf16")
        }
        
        # Create the training script content using proper string formatting
        script_content = f'''import os
import sys
import subprocess
from pathlib import Path

def run_flux_training():
    """Run FLUX LoRA training using sd-scripts"""
    
    print(f"Starting FLUX training for job {job_id}")
    print(f"Dataset: {params['dataset_path']}")
    print(f"Output: {params['output_dir']}")
    print(f"Steps: {params['steps']}")
    print(f"Learning Rate: {params['learning_rate']}")
    
    try:
        # Configure training arguments for sd-scripts
        train_args = [
            sys.executable, "flux_train_network.py",
            
            # Model and paths
            "--pretrained_model_name_or_path", "black-forest-labs/FLUX.1-dev",
            "--dataset_config", str(Path("{params['output_dir']}") / "dataset.toml"),
            "--output_dir", "{params['output_dir']}",
            "--output_name", "{params['output_name']}",
            
            # Training parameters
            "--max_train_steps", str({params['steps']}),
            "--learning_rate", str({params['learning_rate']}),
            "--train_batch_size", str({params['batch_size']}),
            "--mixed_precision", "{params['mixed_precision']}",
            "--seed", str({params['seed']}),
            
            # LoRA parameters
            "--network_module", "networks.lora_flux",
            "--network_dim", str({params['lora_rank']}),
            "--network_alpha", str({params['lora_alpha']}),
            
            # Save and sample
            "--save_every_n_steps", str({params['save_every']}),
            "--sample_every_n_steps", str({params['sample_every']}),
            "--sample_prompts", "{params['trigger_word']} high quality",
            
            # Optimization
            "--optimizer_type", "adamw8bit",
            "--lr_scheduler", "cosine",
            "--gradient_checkpointing",
            "--fp8_base",
            
            # Misc
            "--resolution", str({params['resolution']}),
            "--cache_latents",
            "--save_model_as", "safetensors"
        ]
        
        # Create dataset config
        dataset_config = """[general]
shuffle_caption = false
caption_extension = '.txt'
keep_tokens = 1

[[datasets]]
resolution = {resolution}
batch_size = {batch_size}

  [[datasets.subsets]]
  image_dir = '{dataset_path}'
  class_tokens = '{trigger_word}'
  num_repeats = 10
""".format(
            resolution=params['resolution'],
            batch_size=params['batch_size'],
            dataset_path=params['dataset_path'],
            trigger_word=params['trigger_word']
        )
        
        # Save dataset config
        config_path = Path("{params['output_dir']}") / "dataset.toml"
        with open(config_path, 'w') as f:
            f.write(dataset_config)
        
        print("Starting sd-scripts training...")
        print(f"Command: {{' '.join(train_args[:5])}}...")
        
        # Run the training
        result = subprocess.run(train_args, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Training completed successfully for job {job_id}")
            
            # Find the generated model
            model_files = list(Path("{params['output_dir']}").glob("*.safetensors"))
            if model_files:
                print(f"Model saved: {{model_files[0]}}")
            else:
                print("Warning: No model file found after training")
        else:
            print(f"Training failed for job {job_id}")
            print(f"Error: {{result.stderr}}")
            sys.exit(1)
        
    except Exception as e:
        print(f"Training failed for job {job_id}: {{e}}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    run_flux_training()
'''
        
        # Save the training script
        script_path = self.outputs_path / f"train_{job_id}.py"
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        logger.info(f"Created training script: {script_path}")
        return script_path
    
    async def monitor_training(self, process: asyncio.subprocess.Process, job_id: str) -> AsyncGenerator[Dict, None]:
        """Monitor sd-scripts training progress"""
        
        current_step = 0
        total_steps = 1000
        
        try:
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                
                line_str = line.decode('utf-8').strip()
                if line_str:
                    logger.info(f"Training[{job_id}]: {line_str}")
                    
                    # Parse sd-scripts training output
                    progress_data = self._parse_training_output(line_str)
                    if progress_data:
                        current_step = progress_data.get("step", current_step)
                        total_steps = progress_data.get("total_steps", total_steps)
                        
                        yield {
                            "job_id": job_id,
                            "step": current_step,
                            "total_steps": total_steps,
                            "progress": (current_step / total_steps) * 100,
                            "status": "training",
                            "message": line_str,
                            "loss": progress_data.get("loss"),
                            "learning_rate": progress_data.get("lr")
                        }
                
                await asyncio.sleep(0.1)
                
        except Exception as e:
            logger.error(f"Error monitoring training: {e}")
            yield {"job_id": job_id, "status": "error", "message": str(e)}
    
    def _parse_training_output(self, line: str) -> Optional[Dict]:
        """Parse sd-scripts training output for progress information"""
        
        import re
        progress_data = {}
        
        # Parse step information - sd-scripts format
        step_match = re.search(r'step\s+(\d+)/(\d+)', line, re.IGNORECASE)
        if step_match:
            progress_data["step"] = int(step_match.group(1))
            progress_data["total_steps"] = int(step_match.group(2))
        
        # Parse loss
        loss_match = re.search(r'loss:\s*([0-9.]+)', line, re.IGNORECASE)
        if loss_match:
            progress_data["loss"] = float(loss_match.group(1))
        
        # Parse learning rate
        lr_match = re.search(r'lr:\s*([0-9.e-]+)', line, re.IGNORECASE)
        if lr_match:
            progress_data["lr"] = float(lr_match.group(1))
        
        return progress_data if progress_data else None
    
    def get_trained_model_path(self, product_name: str) -> Optional[Path]:
        """Get path to the trained model"""
        
        output_dir = self.outputs_path / product_name.replace(" ", "_").lower()
        
        # Look for .safetensors files
        safetensors_files = list(output_dir.glob("*.safetensors"))
        if safetensors_files:
            # Return the most recent file
            return max(safetensors_files, key=lambda x: x.stat().st_mtime)
        
        return None
    
    async def cleanup_training_files(self, product_name: str, job_id: str):
        """Clean up temporary training files"""
        
        # Remove training script
        script_path = self.outputs_path / f"train_{job_id}.py"
        if script_path.exists():
            script_path.unlink()
        
        # Optionally keep dataset for retraining
        # dataset_dir = self.datasets_path / product_name.replace(" ", "_").lower()
        # if dataset_dir.exists():
        #     shutil.rmtree(dataset_dir)
        
        logger.info(f"Cleaned up training files for {product_name}")
    
    def get_fluxgym_status(self) -> Dict[str, any]:
        """Get FluxGym/sd-scripts status"""
        
        status = {
            "path": str(self.fluxgym_path.absolute()),
            "exists": self.fluxgym_path.exists(),
            "key_files": {}
        }
        
        # Check for important sd-scripts files
        key_files = [
            "flux_train_network.py",
            "train_network.py",
            "networks/lora_flux.py",
            "library/train_util.py"
        ]
        
        for file in key_files:
            file_path = self.fluxgym_path / file
            status["key_files"][file] = file_path.exists()
        
        return status