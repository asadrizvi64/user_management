import os
import shutil
from pathlib import Path
from typing import List
from PIL import Image
from slugify import slugify

class DatasetManager:
    def __init__(self, datasets_path: Path):
        self.datasets_path = datasets_path
    
    async def create_dataset(
        self,
        product_name: str,
        images: List[str],
        captions: List[str],
        resolution: int = 512
    ) -> Path:
        """Create a training dataset from uploaded images and captions"""
        
        dataset_name = slugify(product_name)
        dataset_path = self.datasets_path / dataset_name
        
        # Create dataset directory
        dataset_path.mkdir(exist_ok=True)
        
        # Process each image and caption pair
        for i, (image_path, caption) in enumerate(zip(images, captions)):
            # Copy and resize image
            image_filename = f"image_{i:04d}.jpg"
            new_image_path = dataset_path / image_filename
            
            self._resize_and_save_image(image_path, new_image_path, resolution)
            
            # Save caption
            caption_filename = f"image_{i:04d}.txt"
            caption_path = dataset_path / caption_filename
            
            with open(caption_path, 'w', encoding='utf-8') as f:
                f.write(caption)
        
        return dataset_path
    
    def _resize_and_save_image(self, source_path: str, target_path: Path, size: int):
        """Resize and save an image"""
        with Image.open(source_path) as img:
            # Calculate new dimensions maintaining aspect ratio
            width, height = img.size
            if width < height:
                new_width = size
                new_height = int((size / width) * height)
            else:
                new_height = size
                new_width = int((size / height) * width)
            
            # Resize and save
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            img_resized.save(target_path, "JPEG", quality=95)
