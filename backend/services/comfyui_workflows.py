# services/comfyui_workflows.py
from typing import Dict, Any, Optional

class ComfyUIWorkflows:
    """ComfyUI workflow templates for different generation types"""
    
    @staticmethod
    def text_to_image_flux(
        prompt: str,
        negative_prompt: str = "",
        width: int = 1024,
        height: int = 1024,
        steps: int = 20,
        cfg: float = 3.5,
        seed: int = -1,
        lora_path: Optional[str] = None,
        lora_strength: float = 1.0
    ) -> Dict[str, Any]:
        """Create FLUX text-to-image workflow"""
        
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
                    "seed": seed, "steps": steps, "cfg": cfg,
                    "sampler_name": "euler", "scheduler": "simple",
                    "positive": ["2", 0], "negative": ["3", 0],
                    "model": ["10", 0], "latent_image": ["1", 0]
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
                "inputs": {"filename_prefix": "flux_generated", "images": ["5", 0]},
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
        if lora_path:
            workflow["13"] = {
                "inputs": {
                    "lora_name": lora_path,
                    "strength_model": lora_strength,
                    "strength_clip": lora_strength,
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
    
    @staticmethod
    def inpainting_flux_fill(
        prompt: str,
        image_path: str,
        mask_path: str,
        negative_prompt: str = "",
        steps: int = 30,
        cfg: float = 1.0,
        denoise: float = 1.0,
        seed: int = -1,
        lora_path: Optional[str] = None,
        lora_strength: float = 1.0,
        guidance: float = 40.0
    ) -> Dict[str, Any]:
        """Create FLUX inpainting workflow using flux-fill-inpainting model (based on your JSON)"""
        
        workflow = {
            "17": {
                "inputs": {"image": image_path, "upload": "image"},
                "class_type": "LoadImage",
                "_meta": {"title": "Load Image"}
            },
            "23": {
                "inputs": {"text": prompt, "clip": ["34", 0]},
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "CLIP Text Encode (Positive Prompt)"}
            },
            "7": {
                "inputs": {"text": negative_prompt, "clip": ["34", 0]},
                "class_type": "CLIPTextEncode",
                "_meta": {"title": "CLIP Text Encode (Negative Prompt)"}
            },
            "26": {
                "inputs": {"conditioning": ["23", 0], "guidance": guidance},
                "class_type": "FluxGuidance",
                "_meta": {"title": "Flux Guidance"}
            },
            "31": {
                "inputs": {
                    "unet_name": "flux-fill-inpainting-fp8-yogotatara.safetensors",
                    "weight_dtype": "default"
                },
                "class_type": "UNETLoader",
                "_meta": {"title": "Load Diffusion Model"}
            },
            "32": {
                "inputs": {"vae_name": "ae.safetensors"},
                "class_type": "VAELoader",
                "_meta": {"title": "Load VAE"}
            },
            "34": {
                "inputs": {
                    "clip_name1": "clip_l.safetensors",
                    "clip_name2": "t5xxl_fp8_e4m3fn_scaled.safetensors",
                    "type": "flux",
                    "device": "default"
                },
                "class_type": "DualCLIPLoader",
                "_meta": {"title": "DualCLIPLoader"}
            },
            "38": {
                "inputs": {
                    "positive": ["26", 0],
                    "negative": ["7", 0],
                    "vae": ["32", 0],
                    "pixels": ["17", 0],
                    "mask": ["17", 1],
                    "noise_mask": True
                },
                "class_type": "InpaintModelConditioning",
                "_meta": {"title": "Inpaint Model Conditioning"}
            },
            "39": {
                "inputs": {"model": ["31", 0] if not lora_path else ["52", 0]},
                "class_type": "DifferentialDiffusion",
                "_meta": {"title": "Differential Diffusion"}
            },
            "3": {
                "inputs": {
                    "seed": seed, "steps": steps, "cfg": cfg,
                    "sampler_name": "dpmpp_2m", "scheduler": "simple",
                    "positive": ["38", 0], "negative": ["38", 1],
                    "model": ["39", 0], "latent_image": ["38", 2],
                    "denoise": denoise
                },
                "class_type": "KSampler",
                "_meta": {"title": "KSampler"}
            },
            "8": {
                "inputs": {"samples": ["3", 0], "vae": ["32", 0]},
                "class_type": "VAEDecode",
                "_meta": {"title": "VAE Decode"}
            },
            "9": {
                "inputs": {"filename_prefix": "inpaint_result", "images": ["8", 0]},
                "class_type": "SaveImage",
                "_meta": {"title": "Save Image"}
            }
        }
        
        # Add LoRA if provided
        if lora_path:
            workflow["52"] = {
                "inputs": {
                    "model": ["31", 0],
                    "lora_name": lora_path,
                    "strength_model": lora_strength
                },
                "class_type": "LoraLoaderModelOnly",
                "_meta": {"title": "Load LoRA"}
            }
            workflow["39"]["inputs"]["model"] = ["52", 0]
        
        return workflow