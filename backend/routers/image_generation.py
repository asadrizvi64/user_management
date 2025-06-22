# routers/image_generation.py
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from models.generation import Generation
from models.product import Product, AccessLevel
from models.user import User
from core.security import get_current_user
from services.inference_service import InferenceService

router = APIRouter()

# Initialize inference service
inference_service = InferenceService()

@router.post("/generate")
async def generate_image(
    prompt: str = Form(...),
    negative_prompt: str = Form(""),
    product_id: Optional[int] = Form(None),
    num_images: int = Form(1),
    width: int = Form(1024),
    height: int = Form(1024),
    steps: int = Form(20),
    cfg: float = Form(3.5),
    seed: Optional[int] = Form(-1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate images using ComfyUI with trained models"""
    
    # Validate parameters
    if num_images < 1 or num_images > 4:
        raise HTTPException(400, "Number of images must be between 1 and 4")
    
    if steps < 10 or steps > 100:
        raise HTTPException(400, "Steps must be between 10 and 100")
    
    if cfg < 1.0 or cfg > 20.0:
        raise HTTPException(400, "CFG scale must be between 1.0 and 20.0")
    
    if width not in [512, 768, 1024] or height not in [512, 768, 1024]:
        raise HTTPException(400, "Width and height must be 512, 768, or 1024")
    
    # Check product access if specified
    if product_id:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(404, "Product not found")
        
        # Check if user has access to this product
        if (product.access_level == AccessLevel.PRIVATE and 
            product.created_by != current_user.id):
            raise HTTPException(403, "Access denied to this product")
    
    try:
        # Generate images using ComfyUI
        result = await inference_service.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt,
            product_id=product_id,
            width=width,
            height=height,
            steps=steps,
            cfg=cfg,
            seed=seed if seed != -1 else -1,
            num_images=num_images,
            db=db,
            user_id=current_user.id
        )
        
        if "error" in result:
            raise HTTPException(500, f"Generation failed: {result['error']}")
        
        return result
        
    except Exception as e:
        raise HTTPException(500, f"Generation failed: {str(e)}")

@router.get("/history")
async def get_generation_history(
    skip: int = 0,
    limit: int = 50,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's generation history"""
    
    query = db.query(Generation).filter(Generation.user_id == current_user.id)
    
    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Generation.created_at >= start_dt)
        except ValueError:
            raise HTTPException(400, "Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Generation.created_at <= end_dt)
        except ValueError:
            raise HTTPException(400, "Invalid end_date format. Use YYYY-MM-DD")
    
    # Apply product filter
    if product_id:
        query = query.filter(Generation.product_id == product_id)
    
    total = query.count()
    generations = query.order_by(Generation.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "generations": [
            {
                "id": gen.id,
                "prompt": gen.prompt,
                "negative_prompt": gen.negative_prompt,
                "product_id": gen.product_id,
                "images": gen.image_paths,
                "parameters": gen.parameters,
                "execution_time": gen.execution_time,
                "cost": gen.cost,
                "created_at": gen.created_at
            }
            for gen in generations
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{generation_id}")
async def get_generation(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific generation"""
    
    generation = db.query(Generation).filter(
        Generation.id == generation_id,
        Generation.user_id == current_user.id
    ).first()
    
    if not generation:
        raise HTTPException(404, "Generation not found")
    
    return {
        "id": generation.id,
        "prompt": generation.prompt,
        "negative_prompt": generation.negative_prompt,
        "product_id": generation.product_id,
        "images": generation.image_paths,
        "parameters": generation.parameters,
        "execution_time": generation.execution_time,
        "cost": generation.cost,
        "created_at": generation.created_at
    }

@router.delete("/{generation_id}")
async def delete_generation(
    generation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a generation"""
    
    generation = db.query(Generation).filter(
        Generation.id == generation_id,
        Generation.user_id == current_user.id
    ).first()
    
    if not generation:
        raise HTTPException(404, "Generation not found")
    
    # Delete image files
    import os
    for image_path in generation.image_paths:
        if os.path.exists(image_path):
            os.remove(image_path)
    
    db.delete(generation)
    db.commit()
    
    return {"message": "Generation deleted successfully"}

@router.get("/stats/summary")
async def get_generation_stats(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get generation statistics for current user"""
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get generation count
    total_generations = db.query(Generation).filter(
        Generation.user_id == current_user.id,
        Generation.created_at >= start_date
    ).count()
    
    # Get total cost
    from sqlalchemy import func
    total_cost = db.query(func.sum(Generation.cost)).filter(
        Generation.user_id == current_user.id,
        Generation.created_at >= start_date
    ).scalar() or 0
    
    # Get total images
    generations = db.query(Generation).filter(
        Generation.user_id == current_user.id,
        Generation.created_at >= start_date
    ).all()
    
    total_images = sum(len(gen.image_paths) for gen in generations)
    
    return {
        "period_days": days,
        "total_generations": total_generations,
        "total_images": total_images,
        "total_cost": round(float(total_cost), 4),
        "average_cost_per_generation": round(float(total_cost) / max(total_generations, 1), 4)
    }

@router.get("/comfyui/status")
async def get_comfyui_status(current_user: User = Depends(get_current_user)):
    """Get ComfyUI system status"""
    return await inference_service.get_comfyui_status()

@router.post("/comfyui/interrupt")
async def interrupt_comfyui(current_user: User = Depends(get_current_user)):
    """Interrupt current ComfyUI execution"""
    try:
        success = await inference_service.client.interrupt_execution()
        return {"success": success, "message": "Execution interrupted" if success else "Failed to interrupt"}
    except Exception as e:
        raise HTTPException(500, f"Failed to interrupt: {str(e)}")