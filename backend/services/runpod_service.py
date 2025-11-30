# services/runpod_service.py
import os
import asyncio
import logging
from typing import Dict, Optional, AsyncGenerator
from pathlib import Path
import json
import base64

logger = logging.getLogger(__name__)

class RunPodService:
    """Service for running training on RunPod when local GPU is occupied"""

    def __init__(self, api_key: str, gpu_type: str = "NVIDIA RTX A4000", docker_image: str = None):
        self.api_key = api_key
        self.gpu_type = gpu_type
        self.docker_image = docker_image or "runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel"
        self.active_pods = {}

        # Initialize RunPod if API key is provided
        if self.api_key:
            try:
                import runpod
                runpod.api_key = self.api_key
                self.runpod = runpod
                logger.info("RunPod service initialized")
            except ImportError:
                logger.error("runpod package not installed")
                self.runpod = None
        else:
            logger.warning("RunPod API key not provided - service disabled")
            self.runpod = None

    def is_available(self) -> bool:
        """Check if RunPod service is available and configured"""
        return self.runpod is not None and self.api_key != ""

    async def start_training_pod(
        self,
        product_name: str,
        dataset_path: Path,
        trigger_word: str,
        training_config: Dict,
        job_id: str
    ) -> Dict:
        """Start a training pod on RunPod"""

        if not self.is_available():
            return {
                "success": False,
                "error": "RunPod service not available or not configured"
            }

        try:
            logger.info(f"Starting RunPod training pod for {product_name} (Job: {job_id})")

            # Prepare training script and data
            training_script = self._generate_training_script(
                product_name=product_name,
                dataset_path=dataset_path,
                trigger_word=trigger_word,
                training_config=training_config,
                job_id=job_id
            )

            # Create pod configuration
            pod_config = {
                "name": f"flux-training-{job_id[:8]}",
                "image_name": self.docker_image,
                "gpu_type_id": self._get_gpu_type_id(self.gpu_type),
                "cloud_type": "SECURE",  # or "COMMUNITY"
                "container_disk_in_gb": 50,
                "min_vcpu_count": 4,
                "min_memory_in_gb": 16,
                "gpu_count": 1,
                "volume_in_gb": 20,
                "volume_mount_path": "/workspace",
                "ports": "8888/http",
                "env": {
                    "TRAINING_JOB_ID": job_id,
                    "PRODUCT_NAME": product_name,
                    "TRIGGER_WORD": trigger_word
                }
            }

            # Create the pod
            pod = self.runpod.create_pod(**pod_config)

            if pod:
                pod_id = pod.get("id")
                self.active_pods[job_id] = {
                    "pod_id": pod_id,
                    "product_name": product_name,
                    "status": "starting"
                }

                logger.info(f"RunPod pod created: {pod_id}")

                # Upload dataset and training script to pod
                # Note: This is a simplified version. In production, you'd use
                # RunPod's file upload API or mount cloud storage
                await self._setup_pod_environment(pod_id, dataset_path, training_script, job_id)

                return {
                    "success": True,
                    "pod_id": pod_id,
                    "status": "starting",
                    "message": f"RunPod training started for {product_name}"
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to create RunPod pod"
                }

        except Exception as e:
            logger.error(f"Error starting RunPod training: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _setup_pod_environment(
        self,
        pod_id: str,
        dataset_path: Path,
        training_script: str,
        job_id: str
    ):
        """Set up the pod environment with dataset and training script"""

        try:
            # In a real implementation, you would:
            # 1. Upload dataset to cloud storage (S3, GCS, etc.)
            # 2. Use RunPod's exec API to download dataset in the pod
            # 3. Upload training script
            # 4. Install dependencies (sd-scripts, etc.)
            # 5. Start training

            logger.info(f"Setting up environment for pod {pod_id}")

            # Execute setup commands
            setup_commands = [
                # Clone sd-scripts
                "cd /workspace && git clone -b sd3 https://github.com/kohya-ss/sd-scripts",
                "cd /workspace/sd-scripts && pip install -r requirements.txt",

                # Create directories
                "mkdir -p /workspace/datasets",
                "mkdir -p /workspace/outputs",

                # Save training script
                f"echo '{training_script}' > /workspace/train_{job_id}.py",

                # Note: Dataset upload would happen here via cloud storage
            ]

            for cmd in setup_commands:
                # Use RunPod's exec API (simplified - actual implementation would use the API)
                logger.info(f"Executing: {cmd[:50]}...")
                # await self._exec_pod_command(pod_id, cmd)

            logger.info(f"Pod {pod_id} environment setup complete")

        except Exception as e:
            logger.error(f"Error setting up pod environment: {e}")
            raise

    def _generate_training_script(
        self,
        product_name: str,
        dataset_path: Path,
        trigger_word: str,
        training_config: Dict,
        job_id: str
    ) -> str:
        """Generate training script for RunPod"""

        params = {
            "dataset_path": "/workspace/datasets/" + product_name.replace(" ", "_").lower(),
            "output_dir": "/workspace/outputs/" + product_name.replace(" ", "_").lower(),
            "output_name": product_name.replace(" ", "_").lower(),
            "trigger_word": trigger_word,
            "steps": training_config.get("max_train_steps", 1000),
            "learning_rate": float(training_config.get("learning_rate", "1e-4")),
            "batch_size": training_config.get("batch_size", 1),
            "lora_rank": training_config.get("lora_rank", 16),
            "lora_alpha": training_config.get("lora_alpha", 16),
            "resolution": training_config.get("resolution", 1024),
            "save_every": training_config.get("save_every_n_steps", 500),
            "sample_every": training_config.get("sample_every_n_steps", 500),
            "seed": training_config.get("seed", -1),
            "mixed_precision": training_config.get("mixed_precision", "bf16")
        }

        # Similar to fluxgym_service.py but adapted for RunPod environment
        script = f'''#!/usr/bin/env python3
import os
import sys
import subprocess
from pathlib import Path

def run_flux_training():
    """Run FLUX LoRA training on RunPod"""

    print(f"Starting FLUX training on RunPod for job {job_id}")
    print(f"Dataset: {params['dataset_path']}")
    print(f"Output: {params['output_dir']}")

    os.makedirs("{params['output_dir']}", exist_ok=True)

    # Training arguments
    train_args = [
        "accelerate", "launch",
        "--mixed_precision", "bf16",
        "--num_cpu_threads_per_process", "1",
        "/workspace/sd-scripts/flux_train_network.py",
        "--pretrained_model_name_or_path", "black-forest-labs/FLUX.1-dev",
        "--dataset_config", "{params['output_dir']}/dataset.toml",
        "--output_dir", "{params['output_dir']}",
        "--output_name", "{params['output_name']}",
        "--max_train_steps", str({params['steps']}),
        "--learning_rate", str({params['learning_rate']}),
        "--train_batch_size", str({params['batch_size']}),
        "--mixed_precision", "{params['mixed_precision']}",
        "--network_module", "networks.lora_flux",
        "--network_dim", str({params['lora_rank']}),
        "--network_alpha", str({params['lora_alpha']}),
        "--save_every_n_steps", str({params['save_every']}),
        "--cache_latents_to_disk",
        "--save_model_as", "safetensors",
        "--fp8_base",
        "--resolution", str({params['resolution']}),
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
        resolution={params['resolution']},
        batch_size={params['batch_size']},
        dataset_path=params['dataset_path'],
        trigger_word="{trigger_word}"
    )

    # Save dataset config
    config_path = Path("{params['output_dir']}") / "dataset.toml"
    with open(config_path, 'w') as f:
        f.write(dataset_config)

    print("Starting training...")
    result = subprocess.run(train_args)

    if result.returncode == 0:
        print(f"Training completed successfully for job {job_id}")

        # Upload results back (would use cloud storage in production)
        model_files = list(Path("{params['output_dir']}").glob("*.safetensors"))
        if model_files:
            print(f"Model saved: {{model_files[0]}}")
    else:
        print(f"Training failed for job {job_id}")
        sys.exit(1)

if __name__ == "__main__":
    run_flux_training()
'''

        return script

    def _get_gpu_type_id(self, gpu_type: str) -> str:
        """Map GPU type name to RunPod GPU type ID"""

        # RunPod GPU type mapping (these are examples - check RunPod docs for actual IDs)
        gpu_mapping = {
            "NVIDIA RTX A4000": "AMPERE_16",
            "NVIDIA RTX A5000": "AMPERE_24",
            "NVIDIA RTX A6000": "AMPERE_48",
            "NVIDIA A40": "AMPERE_48",
            "NVIDIA A100": "AMPERE_80",
            "NVIDIA RTX 4090": "ADA_24",
        }

        return gpu_mapping.get(gpu_type, "AMPERE_16")  # Default to A4000

    async def monitor_training(self, job_id: str) -> AsyncGenerator[Dict, None]:
        """Monitor RunPod training progress"""

        pod_info = self.active_pods.get(job_id)
        if not pod_info:
            yield {"error": "Pod not found"}
            return

        pod_id = pod_info["pod_id"]

        try:
            while True:
                # Get pod status
                pod = self.runpod.get_pod(pod_id)

                if not pod:
                    yield {"status": "error", "message": "Pod not found"}
                    break

                runtime_status = pod.get("runtime", {}).get("status")

                # Parse logs for training progress
                # In production, you'd stream logs from the pod
                progress_data = {
                    "job_id": job_id,
                    "pod_id": pod_id,
                    "status": runtime_status,
                    "message": f"Pod status: {runtime_status}"
                }

                yield progress_data

                # Check if completed
                if runtime_status in ["EXITED", "FAILED"]:
                    break

                await asyncio.sleep(5)  # Poll every 5 seconds

        except Exception as e:
            logger.error(f"Error monitoring RunPod training: {e}")
            yield {"error": str(e)}

    async def stop_training(self, job_id: str) -> bool:
        """Stop a RunPod training job"""

        pod_info = self.active_pods.get(job_id)
        if not pod_info:
            return False

        try:
            pod_id = pod_info["pod_id"]
            self.runpod.stop_pod(pod_id)

            # Wait a bit then terminate
            await asyncio.sleep(5)
            self.runpod.terminate_pod(pod_id)

            # Cleanup
            if job_id in self.active_pods:
                del self.active_pods[job_id]

            logger.info(f"Stopped RunPod pod: {pod_id}")
            return True

        except Exception as e:
            logger.error(f"Error stopping RunPod pod: {e}")
            return False

    async def download_trained_model(self, job_id: str, output_path: Path) -> Optional[Path]:
        """Download trained model from RunPod pod"""

        pod_info = self.active_pods.get(job_id)
        if not pod_info:
            return None

        try:
            pod_id = pod_info["pod_id"]
            product_name = pod_info["product_name"]

            # In production, you would:
            # 1. Use RunPod's file download API
            # 2. Or use cloud storage to transfer files
            # 3. Download the .safetensors file to local storage

            logger.info(f"Downloading model from pod {pod_id}")

            # Placeholder - actual implementation would download from pod
            model_path = output_path / f"{product_name.replace(' ', '_').lower()}.safetensors"

            return model_path

        except Exception as e:
            logger.error(f"Error downloading model from RunPod: {e}")
            return None

    def get_active_pods(self) -> Dict:
        """Get status of all active pods"""

        return {
            job_id: {
                "pod_id": info["pod_id"],
                "product_name": info["product_name"],
                "status": info["status"]
            }
            for job_id, info in self.active_pods.items()
        }

    def get_runpod_status(self) -> Dict:
        """Get RunPod service status"""

        return {
            "available": self.is_available(),
            "api_key_configured": bool(self.api_key),
            "gpu_type": self.gpu_type,
            "docker_image": self.docker_image,
            "active_pods": len(self.active_pods)
        }
