# backend/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os

from app.database import get_db
from models.product import Product, AccessLevel
from models.user import User, UserRole
from models.training import TrainingJob, TrainingStatus
from schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, 
    ProductListResponse, ProductDetailResponse
)
from services.product_service import ProductService
from core.security import get_current_user
from utils.file_handler import save_uploaded_file

router = APIRouter()

@router.post("/", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    description: str = Form(""),
    trigger_word: str = Form(...),
    access_level: str = Form("public"),
    model_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product"""
    
    # Check if product name already exists
    existing = db.query(Product).filter(Product.name == name).first()
    if existing:
        raise HTTPException(400, "Product with this name already exists")
    
    # Save model file if provided
    model_path = None
    if model_file:
        if not model_file.filename.endswith(('.safetensors', '.ckpt', '.pt')):
            raise HTTPException(400, "Invalid model file format")
        
        model_path = await save_uploaded_file(model_file, "products")
    
    # Create product
    product = Product(
        name=name,
        description=description,
        trigger_word=trigger_word,
        access_level=AccessLevel(access_level),
        model_path=model_path,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        trigger_word=product.trigger_word,
        access_level=product.access_level,
        model_path=product.model_path,
        created_by=product.created_by,
        created_at=product.created_at,
        status="ready" if model_path else "pending"
    )

@router.get("/", response_model=ProductListResponse)
async def get_products(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    access_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of products accessible to current user"""
    
    query = db.query(Product)
    
    # Filter by access level and user permissions
    if current_user.role != UserRole.ADMIN:
        # Non-admin users can only see public products and their own private products
        query = query.filter(
            (Product.access_level == AccessLevel.PUBLIC) |
            ((Product.access_level == AccessLevel.PRIVATE) & 
             (Product.created_by == current_user.id))
        )
    
    # Apply filters
    if search:
        query = query.filter(
            Product.name.contains(search) | 
            Product.description.contains(search)
        )
    
    if access_level:
        query = query.filter(Product.access_level == AccessLevel(access_level))
    
    # Get total count and paginated results
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return ProductListResponse(
        products=[
            ProductResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                trigger_word=p.trigger_word,
                access_level=p.access_level,
                model_path=p.model_path,
                created_by=p.created_by,
                created_at=p.created_at,
                status="ready" if p.model_path else "pending"
            )
            for p in products
        ],
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/{product_id}", response_model=ProductDetailResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get product details"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    
    # Check access permissions
    if (product.access_level == AccessLevel.PRIVATE and 
        product.created_by != current_user.id and 
        current_user.role != UserRole.ADMIN):
        raise HTTPException(403, "Access denied to this product")
    
    # Get training jobs for this product
    training_jobs = db.query(TrainingJob).filter(
        TrainingJob.product_name == product.name
    ).order_by(TrainingJob.created_at.desc()).limit(5).all()
    
    return ProductDetailResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        trigger_word=product.trigger_word,
        access_level=product.access_level,
        model_path=product.model_path,
        created_by=product.created_by,
        created_at=product.created_at,
        updated_at=product.updated_at,
        status="ready" if product.model_path else "pending",
        training_jobs=[
            {
                "id": job.id,
                "status": job.status,
                "progress": job.progress or 0,
                "created_at": job.created_at,
                "completed_at": job.completed_at
            }
            for job in training_jobs
        ]
    )

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    trigger_word: Optional[str] = Form(None),
    access_level: Optional[str] = Form(None),
    model_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update product"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    
    # Check permissions
    if (product.created_by != current_user.id and 
        current_user.role != UserRole.ADMIN):
        raise HTTPException(403, "Permission denied")
    
    # Update fields
    if name is not None:
        # Check for duplicate name
        existing = db.query(Product).filter(
            Product.name == name,
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(400, "Product name already exists")
        product.name = name
    
    if description is not None:
        product.description = description
    
    if trigger_word is not None:
        product.trigger_word = trigger_word
    
    if access_level is not None:
        product.access_level = AccessLevel(access_level)
    
    if model_file:
        if not model_file.filename.endswith(('.safetensors', '.ckpt', '.pt')):
            raise HTTPException(400, "Invalid model file format")
        
        # Delete old model file if exists
        if product.model_path and os.path.exists(product.model_path):
            os.remove(product.model_path)
        
        product.model_path = await save_uploaded_file(model_file, "products")
    
    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        trigger_word=product.trigger_word,
        access_level=product.access_level,
        model_path=product.model_path,
        created_by=product.created_by,
        created_at=product.created_at,
        status="ready" if product.model_path else "pending"
    )

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete product"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    
    # Check permissions
    if (product.created_by != current_user.id and 
        current_user.role != UserRole.ADMIN):
        raise HTTPException(403, "Permission denied")
    
    # Delete model file if exists
    if product.model_path and os.path.exists(product.model_path):
        os.remove(product.model_path)
    
    # Delete product
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}

@router.get("/{product_id}/download")
async def download_product_model(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download product model file"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    
    # Check access permissions
    if (product.access_level == AccessLevel.PRIVATE and 
        product.created_by != current_user.id and 
        current_user.role != UserRole.ADMIN):
        raise HTTPException(403, "Access denied to this product")
    
    if not product.model_path or not os.path.exists(product.model_path):
        raise HTTPException(404, "Model file not found")
    
    return FileResponse(
        product.model_path,
        filename=f"{product.name}.safetensors",
        media_type="application/octet-stream"
    )

@router.post("/{product_id}/train")
async def train_product_from_existing(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start training for an existing product (redirect to training endpoint)"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    
    # Check permissions
    if (product.created_by != current_user.id and 
        current_user.role != UserRole.ADMIN):
        raise HTTPException(403, "Permission denied")
    
    return {
        "message": "Use the training endpoint to start training",
        "redirect": f"/api/training/start",
        "product_data": {
            "name": product.name,
            "trigger_word": product.trigger_word,
            "description": product.description
        }
    }