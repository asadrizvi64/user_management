import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile
from typing import Optional

async def save_uploaded_file(
    file: UploadFile,
    directory: str,
    filename: Optional[str] = None
) -> str:
    """Save an uploaded file and return the file path"""
    
    # Create directory if it doesn't exist
    storage_dir = Path("storage") / directory
    storage_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename if not provided
    if not filename:
        file_extension = Path(file.filename).suffix
        filename = f"{uuid.uuid4()}{file_extension}"
    
    file_path = storage_dir / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return str(file_path)

def delete_file(file_path: str) -> bool:
    """Delete a file if it exists"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception:
        return False
