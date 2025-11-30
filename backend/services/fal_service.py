# services/fal_service.py
import os
import logging
from typing import Dict, Optional, List
from pathlib import Path
import asyncio

logger = logging.getLogger(__name__)

class FalService:
    """Service for deploying trained LoRA models to fal.ai"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.deployed_models = {}

        # Initialize fal client if API key is provided
        if self.api_key:
            try:
                import fal_client
                fal_client.api_key = self.api_key
                self.fal = fal_client
                logger.info("fal.ai service initialized")
            except ImportError:
                logger.error("fal-client package not installed")
                self.fal = None
        else:
            logger.warning("fal.ai API key not provided - service disabled")
            self.fal = None

    def is_available(self) -> bool:
        """Check if fal.ai service is available and configured"""
        return self.fal is not None and self.api_key != ""

    async def upload_lora_model(
        self,
        model_path: Path,
        product_name: str,
        trigger_word: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Upload trained LoRA model to fal.ai storage"""

        if not self.is_available():
            return {
                "success": False,
                "error": "fal.ai service not available or not configured"
            }

        try:
            logger.info(f"Uploading LoRA model to fal.ai: {product_name}")

            if not model_path.exists():
                return {
                    "success": False,
                    "error": f"Model file not found: {model_path}"
                }

            # Upload file to fal.ai storage
            # Note: fal.ai uses their storage system
            with open(model_path, 'rb') as f:
                file_url = await self._upload_file(f, model_path.name)

            if not file_url:
                return {
                    "success": False,
                    "error": "Failed to upload file to fal.ai"
                }

            # Store deployment info
            deployment_info = {
                "product_name": product_name,
                "trigger_word": trigger_word,
                "file_url": file_url,
                "model_path": str(model_path),
                "metadata": metadata or {},
                "status": "uploaded"
            }

            self.deployed_models[product_name] = deployment_info

            logger.info(f"Successfully uploaded {product_name} to fal.ai: {file_url}")

            return {
                "success": True,
                "file_url": file_url,
                "deployment_info": deployment_info
            }

        except Exception as e:
            logger.error(f"Error uploading to fal.ai: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _upload_file(self, file, filename: str) -> Optional[str]:
        """Upload file to fal.ai storage"""

        try:
            # Use fal.ai's storage API
            # This is a simplified version - actual implementation depends on fal.ai SDK
            from fal_client import upload_file

            file_url = upload_file(file)
            logger.info(f"File uploaded to fal.ai: {file_url}")

            return file_url

        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            return None

    async def create_flux_lora_endpoint(
        self,
        product_name: str,
        lora_url: str,
        trigger_word: str,
        base_model: str = "black-forest-labs/FLUX.1-dev"
    ) -> Dict:
        """Create a fal.ai endpoint for FLUX + LoRA inference"""

        if not self.is_available():
            return {
                "success": False,
                "error": "fal.ai service not available"
            }

        try:
            logger.info(f"Creating fal.ai endpoint for {product_name}")

            # fal.ai supports FLUX models with LoRA
            # You can use their hosted FLUX endpoint with custom LoRA
            endpoint_config = {
                "model": "fal-ai/flux-lora",  # fal.ai's FLUX LoRA endpoint
                "lora_url": lora_url,
                "trigger_word": trigger_word,
                "base_model": base_model
            }

            # Store endpoint info
            if product_name in self.deployed_models:
                self.deployed_models[product_name]["endpoint_config"] = endpoint_config
                self.deployed_models[product_name]["status"] = "deployed"

            logger.info(f"Created endpoint for {product_name}")

            return {
                "success": True,
                "endpoint": "fal-ai/flux-lora",
                "config": endpoint_config,
                "message": "Use fal.ai/flux-lora endpoint with your LoRA URL"
            }

        except Exception as e:
            logger.error(f"Error creating fal.ai endpoint: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def generate_image(
        self,
        product_name: str,
        prompt: str,
        **kwargs
    ) -> Dict:
        """Generate image using deployed LoRA on fal.ai"""

        if not self.is_available():
            return {
                "success": False,
                "error": "fal.ai service not available"
            }

        deployment = self.deployed_models.get(product_name)
        if not deployment:
            return {
                "success": False,
                "error": f"Model {product_name} not deployed"
            }

        try:
            logger.info(f"Generating image with {product_name} on fal.ai")

            # Prepare request
            lora_url = deployment.get("file_url")
            trigger_word = deployment.get("trigger_word", "")

            # Add trigger word to prompt if not present
            if trigger_word and trigger_word not in prompt:
                prompt = f"{trigger_word} {prompt}"

            # Call fal.ai FLUX LoRA endpoint
            result = await self._call_flux_lora(
                prompt=prompt,
                lora_url=lora_url,
                **kwargs
            )

            return {
                "success": True,
                "images": result.get("images", []),
                "prompt": prompt,
                "product_name": product_name
            }

        except Exception as e:
            logger.error(f"Error generating image on fal.ai: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _call_flux_lora(
        self,
        prompt: str,
        lora_url: str,
        num_images: int = 1,
        image_size: str = "landscape_4_3",
        num_inference_steps: int = 28,
        guidance_scale: float = 3.5,
        lora_scale: float = 1.0,
        **kwargs
    ) -> Dict:
        """Call fal.ai FLUX LoRA endpoint"""

        try:
            # Use fal.ai's subscribe method for async generation
            result = await asyncio.to_thread(
                self.fal.subscribe,
                "fal-ai/flux-lora",
                arguments={
                    "prompt": prompt,
                    "lora_url": lora_url,
                    "num_images": num_images,
                    "image_size": image_size,
                    "num_inference_steps": num_inference_steps,
                    "guidance_scale": guidance_scale,
                    "lora_scale": lora_scale,
                    **kwargs
                }
            )

            return result

        except Exception as e:
            logger.error(f"Error calling fal.ai FLUX LoRA: {e}")
            raise

    async def deploy_model(
        self,
        model_path: Path,
        product_name: str,
        trigger_word: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """Full deployment workflow: upload + create endpoint"""

        # Step 1: Upload LoRA model
        upload_result = await self.upload_lora_model(
            model_path=model_path,
            product_name=product_name,
            trigger_word=trigger_word,
            metadata=metadata
        )

        if not upload_result["success"]:
            return upload_result

        # Step 2: Create endpoint
        lora_url = upload_result["file_url"]
        endpoint_result = await self.create_flux_lora_endpoint(
            product_name=product_name,
            lora_url=lora_url,
            trigger_word=trigger_word
        )

        if not endpoint_result["success"]:
            return endpoint_result

        return {
            "success": True,
            "product_name": product_name,
            "lora_url": lora_url,
            "endpoint": endpoint_result["endpoint"],
            "trigger_word": trigger_word,
            "message": f"Successfully deployed {product_name} to fal.ai"
        }

    async def undeploy_model(self, product_name: str) -> Dict:
        """Remove model from fal.ai (delete from storage)"""

        if product_name not in self.deployed_models:
            return {
                "success": False,
                "error": f"Model {product_name} not found"
            }

        try:
            # In production, you would delete the file from fal.ai storage
            # fal.ai doesn't have a direct delete API in the current SDK
            # but you can manage files through their dashboard

            del self.deployed_models[product_name]

            logger.info(f"Undeployed {product_name} from fal.ai")

            return {
                "success": True,
                "message": f"Model {product_name} undeployed"
            }

        except Exception as e:
            logger.error(f"Error undeploying model: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_deployed_models(self) -> List[Dict]:
        """Get list of all deployed models"""

        return [
            {
                "product_name": name,
                **info
            }
            for name, info in self.deployed_models.items()
        ]

    def get_deployment_info(self, product_name: str) -> Optional[Dict]:
        """Get deployment info for a specific model"""

        return self.deployed_models.get(product_name)

    def get_fal_status(self) -> Dict:
        """Get fal.ai service status"""

        return {
            "available": self.is_available(),
            "api_key_configured": bool(self.api_key),
            "deployed_models_count": len(self.deployed_models),
            "deployed_models": list(self.deployed_models.keys())
        }
