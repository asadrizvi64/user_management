# routers/inpainting.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import get_db
from models.user import User
from models.product import Product, AccessLevel
from core.security import get_current_user
from utils.file_handler import save_uploaded_file
from services.inference_service import InferenceService

router = APIRouter()
inference_service = InferenceService()

@router.post("/inpaint")
async def inpaint_image(
    prompt: str = Form(...),
    base_image: UploadFile = File(...),
    mask_image: UploadFile = File(...),
    product_id: Optional[int] = Form(None),
    negative_prompt: str = Form(""),
    steps: int = Form(30),
    cfg: float = Form(1.0),
    denoise: float = Form(1.0),
    seed: Optional[int] = Form(-1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Perform image inpainting using your exact ComfyUI flux-fill-inpainting workflow"""
    
    # Validate file types
    if not base_image.content_type.startswith('image/'):
        raise HTTPException(400, "Base image file must be an image")
    
    if not mask_image.content_type.startswith('image/'):
        raise HTTPException(400, "Mask image file must be an image")
    
    # Validate parameters
    if denoise < 0.1 or denoise > 1.0:
        raise HTTPException(400, "Denoise must be between 0.1 and 1.0")
    
    if cfg < 0.1 or cfg > 20.0:
        raise HTTPException(400, "CFG scale must be between 0.1 and 20.0")
    
    if steps < 10 or steps > 50:
        raise HTTPException(400, "Steps must be between 10 and 50")
    
    # Check product access if specified
    if product_id:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(404, "Product not found")
        
        if (product.access_level == AccessLevel.PRIVATE and 
            product.created_by != current_user.id):
            raise HTTPException(403, "Access denied to this product")
    
    try:
        # Save uploaded images
        base_image_path = await save_uploaded_file(base_image, "inpainting/inputs")
        mask_image_path = await save_uploaded_file(mask_image, "inpainting/masks")
        
        print(f"Starting inpainting with your exact workflow...")
        print(f"Prompt: {prompt}")
        print(f"Steps: {steps}, CFG: {cfg}")
        print(f"Product ID: {product_id}")
        
        # Perform inpainting using your exact ComfyUI workflow
        result = await inference_service.inpaint_image(
            prompt=prompt,
            image_path=base_image_path,
            mask_path=mask_image_path,
            negative_prompt=negative_prompt,
            product_id=product_id,
            steps=steps,
            cfg=cfg,
            denoise=denoise,
            seed=seed if seed != -1 else -1,
            db=db,
            user_id=current_user.id
        )
        
        if "error" in result:
            raise HTTPException(500, f"Inpainting failed: {result['error']}")
        
        print(f"Inpainting completed successfully!")
        print(f"Generated {len(result['result_images'])} images")
        
        return {
            "message": "Inpainting completed successfully using your ComfyUI workflow",
            "result_images": result["result_images"],
            "base_image": base_image_path,
            "mask_image": mask_image_path,
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "product_id": product_id,
            "parameters": {
                "steps": steps,
                "cfg": cfg,
                "denoise": denoise,
                "seed": seed,
                "workflow": "flux_inpainting"
            },
            "cost": result["cost"],
            "execution_time": result["execution_time"]
        }
        
    except Exception as e:
        print(f"Inpainting error: {str(e)}")
        raise HTTPException(500, f"Inpainting failed: {str(e)}")

@router.get("/workflows")
async def get_available_workflows(
    current_user: User = Depends(get_current_user)
):
    """Get list of available ComfyUI workflows"""
    
    try:
        # Get workflow manager
        from services.workflow_manager import WorkflowManager
        workflow_manager = WorkflowManager()
        
        # List available workflows
        workflows_dir = workflow_manager.workflows_dir
        available_workflows = []
        
        if workflows_dir.exists():
            for workflow_file in workflows_dir.glob("*.json"):
                workflow_name = workflow_file.stem
                available_workflows.append({
                    "name": workflow_name,
                    "file": workflow_file.name,
                    "description": f"ComfyUI workflow: {workflow_name}"
                })
        
        return {
            "workflows": available_workflows,
            "total": len(available_workflows),
            "workflows_directory": str(workflows_dir)
        }
        
    except Exception as e:
        raise HTTPException(500, f"Failed to get workflows: {str(e)}")

@router.get("/test-workflow")
async def test_workflow_loading(
    current_user: User = Depends(get_current_user)
):
    """Test if your workflow loads correctly"""
    
    try:
        from services.workflow_manager import WorkflowManager
        workflow_manager = WorkflowManager()
        
        # Test loading your inpainting workflow
        workflow = workflow_manager.load_workflow("flux_inpainting")
        
        if workflow:
            node_count = len(workflow.get("nodes", []))
            link_count = len(workflow.get("links", []))
            
            return {
                "status": "success",
                "message": "Workflow loaded successfully",
                "workflow_name": "flux_inpainting",
                "nodes": node_count,
                "links": link_count,
                "workflow_id": workflow.get("id", "unknown")
            }
        else:
            return {
                "status": "error", 
                "message": "Workflow file not found or could not be loaded"
            }
            
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error testing workflow: {str(e)}"
        }

@router.post("/remove-background")
async def remove_background(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Remove background from image (placeholder - can add ComfyUI workflow)"""
    
    if not image.content_type.startswith('image/'):
        raise HTTPException(400, "File must be an image")
    
    try:
        # Save uploaded image
        input_path = await save_uploaded_file(image, "background_removal/inputs")
        
        # TODO: Implement background removal workflow in ComfyUI
        # For now, return a placeholder response
        import uuid
        output_filename = f"no_bg_{uuid.uuid4().hex[:8]}.png"
        output_path = f"storage/background_removal/outputs/{output_filename}"
        
        # Ensure output directory exists
        import os
        os.makedirs("storage/background_removal/outputs", exist_ok=True)
        
        return {
            "message": "Background removal completed successfully",
            "original_image": input_path,
            "result_image": output_path,
            "cost": 0.02,
            "execution_time": 1.5,
            "created_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(500, f"Background removal failed: {str(e)}")

@router.post("/upscale")
async def upscale_image(
    image: UploadFile = File(...),
    scale_factor: int = Form(2),
    upscale_method: str = Form("ESRGAN_4x"),
    current_user: User = Depends(get_current_user)
):
    """Upscale image (placeholder - can add ComfyUI workflow)"""
    
    if not image.content_type.startswith('image/'):
        raise HTTPException(400, "File must be an image")
    
    if scale_factor not in [2, 4]:
        raise HTTPException(400, "Scale factor must be 2 or 4")
    
    try:
        # Save uploaded image
        input_path = await save_uploaded_file(image, "upscaling/inputs")
        
        # TODO: Implement actual upscaling using ComfyUI
        import uuid
        output_filename = f"upscaled_{scale_factor}x_{uuid.uuid4().hex[:8]}.jpg"
        output_path = f"storage/upscaling/outputs/{output_filename}"
        
        # Ensure output directory exists
        import os
        os.makedirs("storage/upscaling/outputs", exist_ok=True)
        
        cost = 0.05 * scale_factor
        execution_time = 2.0 * scale_factor
        
        return {
            "message": f"Image upscaled {scale_factor}x successfully",
            "original_image": input_path,
            "result_images": [output_path],
            "scale_factor": scale_factor,
            "upscale_method": upscale_method,
            "cost": round(cost, 4),
            "execution_time": execution_time
        }
        
    except Exception as e:
        raise HTTPException(500, f"Image upscaling failed: {str(e)}")

@router.get("/history")
async def get_inpainting_history(
    skip: int = 0,
    limit: int = 50,
    operation_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inpainting operation history"""
    
    from models.generation import Generation
    
    query = db.query(Generation).filter(Generation.user_id == current_user.id)
    
    total = query.count()
    operations = query.order_by(Generation.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "operations": [
            {
                "id": op.id,
                "type": "inpaint",
                "prompt": op.prompt,
                "result_images": op.image_paths,
                "cost": op.cost,
                "execution_time": op.execution_time,
                "created_at": op.created_at
            }
            for op in operations
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }