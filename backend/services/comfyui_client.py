# services/comfyui_client.py
import asyncio
import aiohttp
import json
import uuid
import websockets
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class ComfyUIClient:
    def __init__(self, server_url: str = "http://127.0.0.1:8188", ws_url: str = "ws://127.0.0.1:8188"):
        self.server_url = server_url
        self.ws_url = ws_url
        self.client_id = str(uuid.uuid4())
        
    async def queue_prompt(self, workflow: Dict[str, Any]) -> str:
        """Queue a workflow for execution"""
        prompt_data = {
            "prompt": workflow,
            "client_id": self.client_id
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.server_url}/prompt", json=prompt_data) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("prompt_id")
                else:
                    raise Exception(f"Failed to queue prompt: {response.status}")
    
    async def get_image(self, filename: str, subfolder: str = "", folder_type: str = "output") -> bytes:
        """Download generated image"""
        params = {
            "filename": filename,
            "subfolder": subfolder,
            "type": folder_type
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.server_url}/view", params=params) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    raise Exception(f"Failed to download image: {response.status}")
    
    async def upload_image(self, image_path: Path, overwrite: bool = True) -> Dict[str, str]:
        """Upload image to ComfyUI"""
        data = aiohttp.FormData()
        data.add_field('image', open(image_path, 'rb'), filename=image_path.name)
        if overwrite:
            data.add_field('overwrite', 'true')
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.server_url}/upload/image", data=data) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"Failed to upload image: {response.status}")
    
    async def wait_for_completion(self, prompt_id: str, timeout: int = 300) -> List[Dict[str, Any]]:
        """Wait for workflow completion and return results"""
        results = []
        
        try:
            uri = f"{self.ws_url}/ws?clientId={self.client_id}"
            async with websockets.connect(uri) as websocket:
                start_time = asyncio.get_event_loop().time()
                
                while True:
                    if asyncio.get_event_loop().time() - start_time > timeout:
                        raise TimeoutError("Workflow execution timed out")
                    
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        
                        if data["type"] == "executing":
                            if data["data"]["node"] is None and data["data"]["prompt_id"] == prompt_id:
                                break
                        
                        elif data["type"] == "executed":
                            if data["data"]["prompt_id"] == prompt_id:
                                results.append(data["data"])
                                
                    except asyncio.TimeoutError:
                        continue
                        
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            raise
            
        return results
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """Get ComfyUI system stats"""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.server_url}/system_stats") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {}
    
    async def interrupt_execution(self) -> bool:
        """Interrupt current execution"""
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.server_url}/interrupt") as response:
                return response.status == 200