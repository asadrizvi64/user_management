# services/gpu_manager.py
import logging
from typing import Dict, Optional
import psutil

logger = logging.getLogger(__name__)

class GPUManager:
    """Manage GPU availability and decide whether to use local or cloud GPU"""

    def __init__(self, memory_threshold: float = 0.8):
        self.memory_threshold = memory_threshold  # 80% threshold by default

    def is_gpu_available(self) -> bool:
        """Check if NVIDIA GPU is available"""
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            return len(gpus) > 0
        except Exception as e:
            logger.warning(f"GPU check failed: {e}")
            return False

    def get_gpu_status(self) -> Dict:
        """Get current GPU status and availability"""

        status = {
            "available": False,
            "gpu_count": 0,
            "gpus": [],
            "can_train_locally": False,
            "should_use_cloud": False,
            "reason": ""
        }

        try:
            import GPUtil
            gpus = GPUtil.getGPUs()

            if not gpus:
                status["reason"] = "No GPU detected"
                status["should_use_cloud"] = True
                return status

            status["available"] = True
            status["gpu_count"] = len(gpus)

            # Check each GPU
            for gpu in gpus:
                gpu_info = {
                    "id": gpu.id,
                    "name": gpu.name,
                    "memory_total": gpu.memoryTotal,
                    "memory_used": gpu.memoryUsed,
                    "memory_free": gpu.memoryFree,
                    "memory_util": gpu.memoryUtil,
                    "gpu_util": gpu.load,
                    "temperature": gpu.temperature
                }
                status["gpus"].append(gpu_info)

                # Check if any GPU is available for training
                if gpu.memoryUtil < self.memory_threshold and gpu.load < 0.9:
                    status["can_train_locally"] = True

            # Decide if should use cloud
            if not status["can_train_locally"]:
                status["should_use_cloud"] = True
                status["reason"] = f"All GPUs are busy (memory util > {self.memory_threshold*100}% or GPU util > 90%)"
            else:
                status["reason"] = "GPU available for local training"

        except ImportError:
            logger.warning("GPUtil not available, assuming no GPU")
            status["reason"] = "GPUtil not installed"
            status["should_use_cloud"] = True
        except Exception as e:
            logger.error(f"Error checking GPU status: {e}")
            status["reason"] = f"Error: {str(e)}"
            status["should_use_cloud"] = True

        return status

    def get_best_gpu_id(self) -> Optional[int]:
        """Get the ID of the GPU with most free memory"""

        try:
            import GPUtil
            gpus = GPUtil.getGPUs()

            if not gpus:
                return None

            # Filter GPUs that are not too busy
            available_gpus = [
                gpu for gpu in gpus
                if gpu.memoryUtil < self.memory_threshold and gpu.load < 0.9
            ]

            if not available_gpus:
                return None

            # Return GPU with most free memory
            best_gpu = max(available_gpus, key=lambda g: g.memoryFree)
            return best_gpu.id

        except Exception as e:
            logger.error(f"Error finding best GPU: {e}")
            return None

    def is_gpu_occupied_for_inference(self) -> bool:
        """Check if GPU is currently being used for inference"""

        status = self.get_gpu_status()

        # If any GPU has high utilization, assume it's being used for inference
        for gpu in status.get("gpus", []):
            if gpu["gpu_util"] > 0.7 or gpu["memory_util"] > 0.7:
                logger.info(f"GPU {gpu['id']} is occupied (GPU util: {gpu['gpu_util']:.1%}, Memory util: {gpu['memory_util']:.1%})")
                return True

        return False

    def get_system_resources(self) -> Dict:
        """Get overall system resource usage"""

        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "cpu_count": psutil.cpu_count(),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_available_gb": psutil.virtual_memory().available / (1024**3),
            "memory_total_gb": psutil.virtual_memory().total / (1024**3),
            "disk_usage_percent": psutil.disk_usage('/').percent
        }

    def should_use_runpod(self) -> Dict[str, any]:
        """Decide if RunPod should be used based on current GPU status"""

        gpu_status = self.get_gpu_status()
        system_resources = self.get_system_resources()

        use_runpod = gpu_status["should_use_cloud"]

        decision = {
            "use_runpod": use_runpod,
            "reason": gpu_status["reason"],
            "gpu_status": gpu_status,
            "system_resources": system_resources
        }

        return decision
