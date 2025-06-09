from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime
import os

from models.product import Product, AccessLevel
from models.user import User, UserRole
from schemas.product import ProductCreate, ProductUpdate

class ProductService:
    def create_product(self, db: Session, product_data: ProductCreate, creator_id: int) -> Product:
        """Create a new product"""
        product = Product(
            name=product_data.name,
            description=product_data.description,
            trigger_word=product_data.trigger_word,
            access_level=product_data.access_level,
            created_by=creator_id,
            created_at=datetime.utcnow()
        )
        
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    
    def get_products_for_user(
        self,
        db: Session,
        user: User,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        access_level: Optional[AccessLevel] = None
    ) -> tuple[List[Product], int]:
        """Get products accessible to a user"""
        
        query = db.query(Product)
        
        # Apply access level filtering
        if user.role != UserRole.ADMIN:
            query = query.filter(
                or_(
                    Product.access_level == AccessLevel.PUBLIC,
                    and_(
                        Product.access_level == AccessLevel.PRIVATE,
                        Product.created_by == user.id
                    )
                )
            )
        
        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    Product.name.contains(search),
                    Product.description.contains(search),
                    Product.trigger_word.contains(search)
                )
            )
        
        # Apply access level filter
        if access_level:
            query = query.filter(Product.access_level == access_level)
        
        total = query.count()
        products = query.offset(skip).limit(limit).all()
        
        return products, total
    
    def get_product_by_id(self, db: Session, product_id: int, user: User) -> Optional[Product]:
        """Get a specific product if user has access"""
        product = db.query(Product).filter(Product.id == product_id).first()
        
        if not product:
            return None
        
        # Check access permissions
        if (product.access_level == AccessLevel.PRIVATE and 
            product.created_by != user.id and 
            user.role != UserRole.ADMIN):
            return None
        
        return product
    
    def update_product(
        self,
        db: Session,
        product_id: int,
        product_data: ProductUpdate,
        user: User
    ) -> Optional[Product]:
        """Update a product if user has permission"""
        product = db.query(Product).filter(Product.id == product_id).first()
        
        if not product:
            return None
        
        # Check permissions
        if product.created_by != user.id and user.role != UserRole.ADMIN:
            return None
        
        # Update fields
        update_data = product_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)
        
        product.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(product)
        
        return product
    
    def delete_product(self, db: Session, product_id: int, user: User) -> bool:
        """Delete a product if user has permission"""
        product = db.query(Product).filter(Product.id == product_id).first()
        
        if not product:
            return False
        
        # Check permissions
        if product.created_by != user.id and user.role != UserRole.ADMIN:
            return False
        
        # Delete model file if exists
        if product.model_path and os.path.exists(product.model_path):
            os.remove(product.model_path)
        
        db.delete(product)
        db.commit()
        return True
