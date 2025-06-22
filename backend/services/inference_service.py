# services/inference_service.py
import asyncio
import logging
import time
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from .comfyui_client import ComfyUIClient
from .workflow_manager import WorkflowManager
from models.generation import Generation
from models.product import Product

logger = logging.getLogger(__name__)

class InferenceService:
    """Handles all inference operations using ComfyUI with your exact workflows"""
    
    def __init__(self, comfyui_url: str = "http://127.0.0.1:8188"):
        self.client = ComfyUIClient(comfyui_url, comfyui_url.replace("http", "ws"))
        self.workflow_manager = WorkflowManager()  # Use your workflow manager
        self.storage_path = Path("storage")
        self.comfyui_models_path = self._find_comfyui_models_path()
    
    def _find_comfyui_models_path(self) -> Optional[Path]:
        """Try to find ComfyUI models directory"""
        possible_paths = [
            Path("ComfyUI/models"),
            Path("../ComfyUI/models"),
            Path("../../ComfyUI/models"),
            Path("/opt/ComfyUI/models"),
            Path.home() / "ComfyUI/models",
            Path("C:/ComfyUI/models"),
            Path("D:/ComfyUI/models"),
            Path.cwd() / "ComfyUI/models",
            Path.cwd().parent / "ComfyUI/models",
            Path.cwd().parent.parent / "ComfyUI/models"
        ]
        
        for path in possible_paths:
            if path.exists():
                logger.info(f"Found ComfyUI models at: {path}")
                return path
        
        logger.warning("ComfyUI models path not found. Creating fallback directory.")
        fallback_path = Path("storage/comfyui_models")
        fallback_path.mkdir(parents=True, exist_ok=True)
        return fallback_path
    
    def _install_lora_to_comfyui(self, product: Product) -> Optional[str]:
        """Install LoRA model to ComfyUI models directory"""
        
        if not self.comfyui_models_path or not product.model_path:
            return None
        
        model_path = Path(product.model_path)
        if not model_path.exists():
            return None
        
        try:
            # Copy to ComfyUI loras directory
            lora_dir = self.comfyui_models_path / "loras"
            lora_dir.mkdir(exist_ok=True)
            
            lora_filename = f"{product.name.replace(' ', '_').lower()}.safetensors"
            destination = lora_dir / lora_filename
            
            if not destination.exists():
                shutil.copy2(model_path, destination)
                logger.info(f"Installed LoRA {product.name} to ComfyUI")
            
            return lora_filename
            
        except Exception as e:
            logger.error(f"Failed to install LoRA to ComfyUI: {e}")
            return None
    
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        product_id: Optional[int] = None,
        width: int = 1024,
        height: int = 1024,
        steps: int = 20,
        cfg: float = 3.5,
        seed: int = -1,
        num_images: int = 1,
        db: Session = None,
        user_id: int = None
    ) -> Dict[str, Any]:
        """Generate images using ComfyUI (basic text-to-image for now)"""
        
        start_time = time.time()
        generated_images = []
        
        try:
            # Get model information if product specified
            lora_name = None
            
            if product_id and db:
                product = db.query(Product).filter(Product.id == product_id).first()
                if product:
                    # Install model to ComfyUI
                    lora_filename = self._install_lora_to_comfyui(product)
                    if lora_filename:
                        lora_name = lora_filename
                        
                        # Add trigger word to prompt if not present
                        if product.trigger_word and product.trigger_word not in prompt:
                            prompt = f"{product.trigger_word} {prompt}"
            
            # For basic generation, we'll use a simple workflow
            workflow = self._create_basic_text_to_image_workflow(
                prompt=prompt,
                negative_prompt=negative_prompt,
                width=width,
                height=height,
                steps=steps,
                cfg=cfg,
                seed=seed,
                lora_name=lora_name
            )
            
            # Generate each image
            for i in range(num_images):
                # Queue and execute
                prompt_id = await self.client.queue_prompt(workflow)
                results = await self.client.wait_for_completion(prompt_id)
                
                # Download generated images
                for result in results:
                    if "output" in result and "images" in result["output"]:
                        for image_info in result["output"]["images"]:
                            # Download image from ComfyUI
                            image_data = await self.client.get_image(
                                image_info["filename"],
                                image_info.get("subfolder", "")
                            )
                            
                            # Save to our storage
                            output_path = self._create_output_path("generated")
                            with open(output_path, "wb") as f:
                                f.write(image_data)
                            
                            generated_images.append(str(output_path))
            
            execution_time = time.time() - start_time
            cost = self._calculate_cost(steps, width * height, num_images)
            
            # Save generation record to database
            if db and user_id:
                generation = Generation(
                    prompt=prompt,
                    negative_prompt=negative_prompt if negative_prompt else None,
                    product_id=product_id,
                    image_paths=generated_images,
                    parameters={
                        "width": width, "height": height, "steps": steps,
                        "cfg": cfg, "seed": seed, "num_images": num_images,
                        "lora_name": lora_name
                    },
                    execution_time=execution_time,
                    cost=cost,
                    user_id=user_id
                )
                
                db.add(generation)
                db.commit()
                db.refresh(generation)
                
                return {
                    "id": generation.id,
                    "images": generated_images,
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "product_id": product_id,
                    "parameters": generation.parameters,
                    "execution_time": execution_time,
                    "cost": cost,
                    "status": "completed"
                }
            else:
                return {
                    "images": generated_images,
                    "prompt": prompt,
                    "execution_time": execution_time,
                    "cost": cost,
                    "status": "completed"
                }
                
        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            return {
                "error": str(e),
                "status": "failed",
                "execution_time": time.time() - start_time
            }
    
    async def inpaint_image(
        self,
        prompt: str,
        image_path: str,
        mask_path: str,
        negative_prompt: str = "",
        product_id: Optional[int] = None,
        steps: int = 30,
        cfg: float = 1.0,
        denoise: float = 1.0,
        seed: int = -1,
        db: Session = None,
        user_id: int = None
    ) -> Dict[str, Any]:
        """Perform inpainting using your exact ComfyUI workflow"""
        
        start_time = time.time()
        
        try:
            # Upload images to ComfyUI
            image_upload = await self.client.upload_image(Path(image_path))
            
            # Get model information if product specified
            lora_name = None
            lora_strength = 1.0
            
            if product_id and db:
                product = db.query(Product).filter(Product.id == product_id).first()
                if product:
                    lora_filename = self._install_lora_to_comfyui(product)
                    if lora_filename:
                        lora_name = lora_filename
                        
                        if product.trigger_word and product.trigger_word not in prompt:
                            prompt = f"{product.trigger_word} {prompt}"
            
            # Get your exact inpainting workflow
            workflow = self.workflow_manager.get_workflow_for_inpainting(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image_filename=image_upload["name"],
                lora_name=lora_name,
                lora_strength=lora_strength,
                steps=steps,
                cfg=cfg,
                seed=seed,
                guidance=40.0  # Default guidance for flux inpainting
            )
            
            if not workflow:
                raise Exception("Could not load inpainting workflow")
            
            logger.info(f"Using inpainting workflow with {len(workflow)} nodes")
            
            # Execute workflow
            prompt_id = await self.client.queue_prompt(workflow)
            results = await self.client.wait_for_completion(prompt_id, timeout=600)  # 10 min timeout for inpainting
            
            # Download result
            result_images = []
            for result in results:
                if "output" in result and "images" in result["output"]:
                    for image_info in result["output"]["images"]:
                        image_data = await self.client.get_image(
                            image_info["filename"],
                            image_info.get("subfolder", "")
                        )
                        
                        output_path = self._create_output_path("inpaint")
                        with open(output_path, "wb") as f:
                            f.write(image_data)
                        
                        result_images.append(str(output_path))
            
            execution_time = time.time() - start_time
            cost = self._calculate_cost(steps, 1024 * 1024, 1) * 1.5  # Inpainting costs more
            
            return {
                "result_images": result_images,
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "execution_time": execution_time,
                "cost": cost,
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Inpainting failed: {e}")
            return {
                "error": str(e),
                "status": "failed",
                "execution_time": time.time() - start_time
            }
    
    def _create_basic_text_to_image_workflow(
        self,
        prompt: str,
        negative_prompt: str,
        width: int,
        height: int,
        steps: int,
        cfg: float,
        seed: int,
        lora_name: str = None
    ) -> Dict[str, Any]:
        """Create a basic text-to-image workflow for ComfyUI API"""
        
        workflow = {
            "1": {
                "inputs": {"width": width, "height": height, "batch_size": 1},
                "class_type": "EmptyLatentImage",
                "_meta": {"title": "Empty Latent Image"}
            },
            "2": {
                "inputs": {"text": prompt, "clip": ["11", 0]},
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "CLIP Text Encode (Prompt)"}
            },
            "3": {
                "inputs": {"text": negative_prompt, "clip": ["11", 0]},
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "CLIP Text Encode (Negative)"}
            },
            "4": {
                "inputs": {
                    "seed": seed if seed != -1 else 42,
                    "steps": steps,
                    "cfg": cfg,
                    "sampler_name": "euler",
                    "scheduler": "simple",
                    "positive": ["2", 0],
                    "negative": ["3", 0],
                    "model": ["10", 0] if not lora_name else ["13", 0],
                    "latent_image": ["1", 0]
                },
                "class_type": "KSampler",
                "_meta": {"title": "KSampler"}
            },
            "5": {
                "inputs": {"samples": ["4", 0], "vae": ["12", 0]},
                "class_type": "VAEDecode",
                "_meta": {"title": "VAE Decode"}
            },
            "6": {
                "inputs": {"filename_prefix": "generated", "images": ["5", 0]},
                "class_type": "SaveImage",
                "_meta": {"title": "Save Image"}
            },
            "10": {
                "inputs": {"unet_name": "flux1-dev.safetensors"},
                "class_type": "UNETLoader",
                "_meta": {"title": "Load Diffusion Model"}
            },
            "11": {
                "inputs": {
                    "clip_name1": "t5xxl_fp16.safetensors",
                    "clip_name2": "clip_l.safetensors",
                    "type": "flux"
                },
                "class_type": "DualCLIPLoader",
                "_meta": {"title": "DualCLIPLoader"}
            },
            "12": {
                "inputs": {"vae_name": "ae.safetensors"},
                "class_type": "VAELoader",
                "_meta": {"title": "Load VAE"}
            }
        }
        
        # Add LoRA if provided
        if lora_name:
            workflow["13"] = {
                "inputs": {
                    "lora_name": lora_name,
                    "strength_model": 1.0,
                    "strength_clip": 1.0,
                    "model": ["10", 0],
                    "clip": ["11", 0]
                },
                "class_type": "LoraLoader",
                "_meta": {"title": "Load LoRA"}
            }
            # Update connections to use LoRA
            workflow["2"]["inputs"]["clip"] = ["13", 1]
            workflow["3"]["inputs"]["clip"] = ["13", 1]
            workflow["4"]["inputs"]["model"] = ["13", 0]
        
        return workflow
    
    async def get_comfyui_status(self) -> Dict[str, Any]:
        """Get ComfyUI system status"""
        try:
            stats = await self.client.get_system_stats()
            
            return {
                "status": "online",
                "system_stats": stats,
                "models_path": str(self.comfyui_models_path) if self.comfyui_models_path else None,
                "workflows_available": [
                    "flux_inpainting",
                    "basic_text_to_image"
                ]
            }
        except Exception as e:
            return {
                "status": "offline",
                "error": str(e)
            }
    
    def _create_output_path(self, prefix: str = "generated") -> Path:
        """Create a unique path for generation output"""
        import uuid
        output_dir = self.storage_path / "generated"
        output_dir.mkdir(exist_ok=True)
        
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
        return output_dir / filename
    
    def _calculate_cost(self, steps: int, resolution: int, num_images: int) -> float:
        """Calculate generation cost based on parameters"""
        base_cost = 0.02
        step_multiplier = steps / 20
        resolution_multiplier = resolution / (1024 * 1024)
        
        return round(base_cost * step_multiplier * resolution_multiplier * num_images, 4)