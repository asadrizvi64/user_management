from PIL import Image, ImageOps
from typing import Tuple, Optional
import io

def resize_image(
    image_data: bytes,
    size: Tuple[int, int],
    maintain_aspect: bool = True
) -> bytes:
    """Resize an image while optionally maintaining aspect ratio"""
    
    with Image.open(io.BytesIO(image_data)) as img:
        if maintain_aspect:
            # Resize maintaining aspect ratio
            img.thumbnail(size, Image.Resampling.LANCZOS)
        else:
            # Resize to exact dimensions
            img = img.resize(size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Save to bytes
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=95)
        return output.getvalue()

def create_thumbnail(image_data: bytes, size: int = 256) -> bytes:
    """Create a thumbnail from image data"""
    return resize_image(image_data, (size, size), maintain_aspect=True)

def validate_image(file_data: bytes) -> bool:
    """Validate if the file data is a valid image"""
    try:
        with Image.open(io.BytesIO(file_data)) as img:
            img.verify()
        return True
    except Exception:
        return False
