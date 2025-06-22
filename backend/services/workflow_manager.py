# services/workflow_manager.py
import json
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class WorkflowManager:
    """Manages ComfyUI workflows from JSON files and code templates"""
    
    def __init__(self):
        self.workflows_dir = Path("workflows")
        self.workflows_dir.mkdir(exist_ok=True)
        
        # Create your exact workflow on first run
        self._create_default_workflows()
    
    def _create_default_workflows(self):
        """Create default workflows including your exact ComfyUI_00180_ workflow"""
        
        # Your exact workflow from ComfyUI_00180_.json
        inpainting_workflow = {
            "id": "8463aed3-daaa-483c-b79c-5cd15d9ca3ef",
            "revision": 0,
            "last_node_id": 53,
            "last_link_id": 115,
            "nodes": [
                {
                    "id": 45,
                    "type": "MarkdownNote",
                    "pos": [-225, 255],
                    "size": [225, 88],
                    "flags": {},
                    "order": 0,
                    "mode": 0,
                    "inputs": [],
                    "outputs": [],
                    "properties": {},
                    "widgets_values": ["🛈 [Learn more about this workflow](https://comfyanonymous.github.io/ComfyUI_examples/flux/#fill-inpainting-model)"],
                    "color": "#432",
                    "bgcolor": "#653"
                },
                {
                    "id": 17,
                    "type": "LoadImage",
                    "pos": [-672.7769775390625, 410.4849853515625],
                    "size": [315, 314],
                    "flags": {},
                    "order": 5,
                    "mode": 0,
                    "inputs": [
                        {"name": "image", "type": "COMBO", "widget": {"name": "image"}},
                        {"name": "upload", "type": "IMAGEUPLOAD", "widget": {"name": "upload"}}
                    ],
                    "outputs": [
                        {"name": "IMAGE", "type": "IMAGE", "slot_index": 0, "links": [99]},
                        {"name": "MASK", "type": "MASK", "slot_index": 1, "links": [114, 115]}
                    ],
                    "properties": {"Node name for S&R": "LoadImage"},
                    "widgets_values": ["clipspace-mask-7657017.699999988.png [temp]", "image"]
                },
                {
                    "id": 23,
                    "type": "CLIPTextEncode",
                    "pos": [144, -7],
                    "size": [422.8500061035156, 164.30999755859375],
                    "flags": {},
                    "order": 7,
                    "mode": 0,
                    "inputs": [
                        {"name": "clip", "type": "CLIP", "link": 62}
                    ],
                    "outputs": [
                        {"name": "CONDITIONING", "type": "CONDITIONING", "slot_index": 0, "links": [41]}
                    ],
                    "title": "CLIP Text Encode (Positive Prompt)",
                    "properties": {"Node name for S&R": "CLIPTextEncode"},
                    "widgets_values": ["PLACEHOLDER_PROMPT"],
                    "color": "#232",
                    "bgcolor": "#353"
                },
                {
                    "id": 7,
                    "type": "CLIPTextEncode",
                    "pos": [129.10528564453125, 267.1751708984375],
                    "size": [425.2799987792969, 180.61000061035156],
                    "flags": {"collapsed": False},
                    "order": 8,
                    "mode": 0,
                    "inputs": [
                        {"name": "clip", "type": "CLIP", "link": 63}
                    ],
                    "outputs": [
                        {"name": "CONDITIONING", "type": "CONDITIONING", "slot_index": 0, "links": [81]}
                    ],
                    "title": "CLIP Text Encode (Negative Prompt)",
                    "properties": {"Node name for S&R": "CLIPTextEncode"},
                    "widgets_values": ["PLACEHOLDER_NEGATIVE"],
                    "color": "#322",
                    "bgcolor": "#533"
                },
                {
                    "id": 31,
                    "type": "UNETLoader",
                    "pos": [210.9736785888672, -212.93853759765625],
                    "size": [315, 82],
                    "flags": {},
                    "order": 4,
                    "mode": 0,
                    "inputs": [
                        {"name": "unet_name", "type": "COMBO", "widget": {"name": "unet_name"}},
                        {"name": "weight_dtype", "type": "COMBO", "widget": {"name": "weight_dtype"}}
                    ],
                    "outputs": [
                        {"name": "MODEL", "type": "MODEL", "slot_index": 0, "links": [112]}
                    ],
                    "properties": {"Node name for S&R": "UNETLoader"},
                    "widgets_values": ["flux-fill-inpainting-fp8-yogotatara.safetensors", "default"]
                },
                {
                    "id": 52,
                    "type": "LoraLoaderModelOnly",
                    "pos": [653.0259399414062, -213.81820678710938],
                    "size": [270, 82],
                    "flags": {},
                    "order": 9,
                    "mode": 0,
                    "inputs": [
                        {"name": "model", "type": "MODEL", "link": 112},
                        {"name": "lora_name", "type": "COMBO"},
                        {"name": "strength_model", "type": "FLOAT", "widget": {"name": "strength_model"}}
                    ],
                    "outputs": [
                        {"name": "MODEL", "type": "MODEL", "links": [113]}
                    ],
                    "properties": {"Node name for S&R": "LoraLoaderModelOnly"},
                    "widgets_values": ["PLACEHOLDER_LORA", 1]
                },
                {
                    "id": 34,
                    "type": "DualCLIPLoader",
                    "pos": [-237, 79],
                    "size": [315, 130],
                    "flags": {},
                    "order": 2,
                    "mode": 0,
                    "inputs": [
                        {"name": "clip_name1", "type": "COMBO", "widget": {"name": "clip_name1"}},
                        {"name": "clip_name2", "type": "COMBO", "widget": {"name": "clip_name2"}},
                        {"name": "type", "type": "COMBO", "widget": {"name": "type"}},
                        {"name": "device", "type": "COMBO", "widget": {"name": "device"}}
                    ],
                    "outputs": [
                        {"name": "CLIP", "type": "CLIP", "links": [62, 63]}
                    ],
                    "properties": {"Node name for S&R": "DualCLIPLoader"},
                    "widgets_values": ["clip_l.safetensors", "t5xxl_fp8_e4m3fn_scaled.safetensors", "flux", "default"]
                },
                {
                    "id": 32,
                    "type": "VAELoader",
                    "pos": [970.080078125, 541.090576171875],
                    "size": [315, 58],
                    "flags": {},
                    "order": 3,
                    "mode": 0,
                    "inputs": [
                        {"name": "vae_name", "type": "COMBO", "widget": {"name": "vae_name"}}
                    ],
                    "outputs": [
                        {"name": "VAE", "type": "VAE", "slot_index": 0, "links": [60, 82]}
                    ],
                    "properties": {"Node name for S&R": "VAELoader"},
                    "widgets_values": ["ae.safetensors"]
                },
                {
                    "id": 26,
                    "type": "FluxGuidance",
                    "pos": [655.7194213867188, 14.350879669189453],
                    "size": [317.3999938964844, 58],
                    "flags": {},
                    "order": 11,
                    "mode": 0,
                    "inputs": [
                        {"name": "conditioning", "type": "CONDITIONING", "link": 41},
                        {"name": "guidance", "type": "FLOAT", "widget": {"name": "guidance"}}
                    ],
                    "outputs": [
                        {"name": "CONDITIONING", "type": "CONDITIONING", "slot_index": 0, "links": [80]}
                    ],
                    "properties": {"Node name for S&R": "FluxGuidance"},
                    "widgets_values": [40]
                },
                {
                    "id": 38,
                    "type": "InpaintModelConditioning",
                    "pos": [587.98681640625, 232.97775268554688],
                    "size": [302.3999938964844, 138],
                    "flags": {},
                    "order": 13,
                    "mode": 0,
                    "inputs": [
                        {"name": "positive", "type": "CONDITIONING", "link": 80},
                        {"name": "negative", "type": "CONDITIONING", "link": 81},
                        {"name": "vae", "type": "VAE", "link": 82},
                        {"name": "pixels", "type": "IMAGE", "link": 99},
                        {"name": "mask", "type": "MASK", "link": 115},
                        {"name": "noise_mask", "type": "BOOLEAN", "widget": {"name": "noise_mask"}}
                    ],
                    "outputs": [
                        {"name": "positive", "type": "CONDITIONING", "slot_index": 0, "links": [77]},
                        {"name": "negative", "type": "CONDITIONING", "slot_index": 1, "links": [78]},
                        {"name": "latent", "type": "LATENT", "slot_index": 2, "links": [88]}
                    ],
                    "properties": {"Node name for S&R": "InpaintModelConditioning"},
                    "widgets_values": [True]
                },
                {
                    "id": 39,
                    "type": "DifferentialDiffusion",
                    "pos": [1001, -68],
                    "size": [277.20001220703125, 26],
                    "flags": {},
                    "order": 12,
                    "mode": 0,
                    "inputs": [
                        {"name": "model", "type": "MODEL", "link": 113}
                    ],
                    "outputs": [
                        {"name": "MODEL", "type": "MODEL", "slot_index": 0, "links": [86]}
                    ],
                    "properties": {"Node name for S&R": "DifferentialDiffusion"},
                    "widgets_values": []
                },
                {
                    "id": 3,
                    "type": "KSampler",
                    "pos": [968.228759765625, 203.60238647460938],
                    "size": [315, 262],
                    "flags": {},
                    "order": 14,
                    "mode": 0,
                    "inputs": [
                        {"name": "model", "type": "MODEL", "link": 86},
                        {"name": "positive", "type": "CONDITIONING", "link": 77},
                        {"name": "negative", "type": "CONDITIONING", "link": 78},
                        {"name": "latent_image", "type": "LATENT", "link": 88},
                        {"name": "seed", "type": "INT", "widget": {"name": "seed"}},
                        {"name": "steps", "type": "INT", "widget": {"name": "steps"}},
                        {"name": "cfg", "type": "FLOAT", "widget": {"name": "cfg"}},
                        {"name": "sampler_name", "type": "COMBO", "widget": {"name": "sampler_name"}},
                        {"name": "scheduler", "type": "COMBO", "widget": {"name": "scheduler"}},
                        {"name": "denoise", "type": "FLOAT", "widget": {"name": "denoise"}}
                    ],
                    "outputs": [
                        {"name": "LATENT", "type": "LATENT", "slot_index": 0, "links": [111]}
                    ],
                    "properties": {"Node name for S&R": "KSampler"},
                    "widgets_values": ["PLACEHOLDER_SEED", "randomize", "PLACEHOLDER_STEPS", "PLACEHOLDER_CFG", "dpmpp_2m", "simple", 1]
                },
                {
                    "id": 8,
                    "type": "VAEDecode",
                    "pos": [1719.1300048828125, 141.19219970703125],
                    "size": [210, 46],
                    "flags": {},
                    "order": 15,
                    "mode": 0,
                    "inputs": [
                        {"name": "samples", "type": "LATENT", "link": 111},
                        {"name": "vae", "type": "VAE", "link": 60}
                    ],
                    "outputs": [
                        {"name": "IMAGE", "type": "IMAGE", "slot_index": 0, "links": [95]}
                    ],
                    "properties": {"Node name for S&R": "VAEDecode"},
                    "widgets_values": []
                },
                {
                    "id": 9,
                    "type": "SaveImage",
                    "pos": [1877, 101],
                    "size": [828.9500122070312, 893.8499755859375],
                    "flags": {},
                    "order": 16,
                    "mode": 0,
                    "inputs": [
                        {"name": "images", "type": "IMAGE", "link": 95},
                        {"name": "filename_prefix", "type": "STRING", "widget": {"name": "filename_prefix"}}
                    ],
                    "outputs": [],
                    "properties": {"Node name for S&R": "SaveImage"},
                    "widgets_values": ["ComfyUI"]
                }
            ],
            "links": [
                [41, 23, 0, 26, 0, "CONDITIONING"],
                [60, 32, 0, 8, 1, "VAE"],
                [62, 34, 0, 23, 0, "CLIP"],
                [63, 34, 0, 7, 0, "CLIP"],
                [77, 38, 0, 3, 1, "CONDITIONING"],
                [78, 38, 1, 3, 2, "CONDITIONING"],
                [80, 26, 0, 38, 0, "CONDITIONING"],
                [81, 7, 0, 38, 1, "CONDITIONING"],
                [82, 32, 0, 38, 2, "VAE"],
                [86, 39, 0, 3, 0, "MODEL"],
                [88, 38, 2, 3, 3, "LATENT"],
                [95, 8, 0, 9, 0, "IMAGE"],
                [99, 17, 0, 38, 3, "IMAGE"],
                [111, 3, 0, 8, 0, "LATENT"],
                [112, 31, 0, 52, 0, "MODEL"],
                [113, 52, 0, 39, 0, "MODEL"],
                [114, 17, 1, 49, 0, "MASK"],
                [115, 17, 1, 38, 4, "MASK"]
            ],
            "groups": [],
            "config": {},
            "extra": {
                "ds": {"scale": 1.21, "offset": [1603.827047417336, 46.65658328064205]},
                "frontendVersion": "1.18.9"
            },
            "version": 0.4
        }
        
        # Save the workflow
        workflow_file = self.workflows_dir / "flux_inpainting.json"
        if not workflow_file.exists():
            with open(workflow_file, 'w') as f:
                json.dump(inpainting_workflow, f, indent=2)
            logger.info(f"Created default inpainting workflow at {workflow_file}")
    
    def load_workflow(self, workflow_name: str) -> Optional[Dict[str, Any]]:
        """Load a workflow from JSON file"""
        workflow_file = self.workflows_dir / f"{workflow_name}.json"
        
        if not workflow_file.exists():
            logger.warning(f"Workflow file not found: {workflow_file}")
            return None
        
        try:
            with open(workflow_file, 'r') as f:
                workflow = json.load(f)
            logger.info(f"Loaded workflow: {workflow_name}")
            return workflow
        except Exception as e:
            logger.error(f"Error loading workflow {workflow_name}: {e}")
            return None
    
    def customize_workflow_for_api(
        self,
        workflow: Dict[str, Any],
        prompt: str,
        negative_prompt: str = "",
        image_filename: str = None,
        lora_name: str = None,
        lora_strength: float = 1.0,
        steps: int = 30,
        cfg: float = 1.0,
        seed: int = -1,
        guidance: float = 40.0
    ) -> Dict[str, Any]:
        """Customize workflow for API usage - converts UI format to API format"""
        
        # Convert from UI format to API format
        api_workflow = {}
        
        # Process nodes
        for node in workflow.get("nodes", []):
            node_id = str(node["id"])
            
            api_workflow[node_id] = {
                "inputs": {},
                "class_type": node["type"],
                "_meta": {"title": node.get("title", node["type"])}
            }
            
            # Handle widget values (node parameters)
            if "widgets_values" in node:
                widgets = node["widgets_values"][:]  # Copy the list
                
                # Replace placeholders based on node type
                if node["type"] == "CLIPTextEncode":
                    if "Positive" in node.get("title", ""):
                        widgets[0] = prompt
                    elif "Negative" in node.get("title", ""):
                        widgets[0] = negative_prompt
                
                elif node["type"] == "LoadImage" and image_filename:
                    widgets[0] = image_filename
                
                elif node["type"] == "LoraLoaderModelOnly" and lora_name:
                    widgets[0] = lora_name
                    widgets[1] = lora_strength
                
                elif node["type"] == "KSampler":
                    if len(widgets) >= 7:
                        widgets[0] = seed if seed != -1 else widgets[0]
                        widgets[2] = steps
                        widgets[3] = cfg
                
                elif node["type"] == "FluxGuidance":
                    widgets[0] = guidance
                
                # Add widget values as individual inputs for ComfyUI API
                input_names = self._get_input_names_for_node_type(node["type"])
                for i, widget_value in enumerate(widgets):
                    if i < len(input_names):
                        api_workflow[node_id]["inputs"][input_names[i]] = widget_value
        
        # Process links
        for link in workflow.get("links", []):
            link_id, from_node, from_socket, to_node, to_socket, data_type = link
            
            from_node_id = str(from_node)
            to_node_id = str(to_node)
            
            if to_node_id in api_workflow:
                # Get input name for this socket
                to_node_data = next((n for n in workflow["nodes"] if n["id"] == to_node), None)
                if to_node_data and "inputs" in to_node_data:
                    if to_socket < len(to_node_data["inputs"]):
                        input_name = to_node_data["inputs"][to_socket]["name"]
                        api_workflow[to_node_id]["inputs"][input_name] = [from_node_id, from_socket]
        
        return api_workflow
    
    def _get_input_names_for_node_type(self, node_type: str) -> list:
        """Get input parameter names for different node types"""
        
        input_mappings = {
            "CLIPTextEncode": ["text"],
            "LoadImage": ["image", "upload"],
            "LoraLoaderModelOnly": ["lora_name", "strength_model"],
            "KSampler": ["seed", "control_after_generate", "steps", "cfg", "sampler_name", "scheduler", "denoise"],
            "FluxGuidance": ["guidance"],
            "SaveImage": ["filename_prefix"],
            "UNETLoader": ["unet_name", "weight_dtype"],
            "VAELoader": ["vae_name"],
            "DualCLIPLoader": ["clip_name1", "clip_name2", "type", "device"],
            "InpaintModelConditioning": ["noise_mask"]
        }
        
        return input_mappings.get(node_type, [])
    
    def get_workflow_for_inpainting(
        self,
        prompt: str,
        negative_prompt: str,
        image_filename: str,
        lora_name: str = None,
        lora_strength: float = 1.0,
        steps: int = 30,
        cfg: float = 1.0,
        seed: int = -1,
        guidance: float = 40.0
    ) -> Optional[Dict[str, Any]]:
        """Get your exact inpainting workflow ready for ComfyUI API"""
        
        # Load the workflow
        workflow = self.load_workflow("flux_inpainting")
        if not workflow:
            logger.error("Could not load flux_inpainting workflow")
            return None
        
        # Customize it for API usage
        api_workflow = self.customize_workflow_for_api(
            workflow,
            prompt=prompt,
            negative_prompt=negative_prompt,
            image_filename=image_filename,
            lora_name=lora_name,
            lora_strength=lora_strength,
            steps=steps,
            cfg=cfg,
            seed=seed,
            guidance=guidance
        )
        
        return api_workflow