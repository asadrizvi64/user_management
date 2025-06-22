# backend/routers/reports.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from models.user import User, UserRole
from models.generation import Generation
from models.training import TrainingJob, TrainingStatus
from models.product import Product, AccessLevel
from core.security import get_current_user, get_current_admin_user

router = APIRouter()

@router.get("/user-activity")
async def get_user_activity_report(
    days: int = 30,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user activity report (admin only)"""
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get user statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    new_users = db.query(User).filter(User.created_at >= start_date).count()
    
    # Get users who generated images in the period
    active_generators = db.query(User.id).join(Generation).filter(
        Generation.created_at >= start_date
    ).distinct().count()
    
    # Get generation statistics by user
    generations_by_user = db.query(
        User.username,
        User.email,
        func.count(Generation.id).label('generation_count'),
        func.sum(Generation.cost).label('total_cost')
    ).join(Generation).filter(
        Generation.created_at >= start_date
    ).group_by(User.id).order_by(func.count(Generation.id).desc()).limit(10).all()
    
    # Get daily activity for the period
    daily_activity = db.query(
        func.date(Generation.created_at).label('date'),
        func.count(Generation.id).label('generations'),
        func.count(func.distinct(Generation.user_id)).label('active_users')
    ).filter(
        Generation.created_at >= start_date
    ).group_by(func.date(Generation.created_at)).order_by('date').all()
    
    return {
        "period": f"Last {days} days",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "user_stats": {
            "total_users": total_users,
            "active_users": active_users,
            "new_users": new_users,
            "active_generators": active_generators
        },
        "top_users": [
            {
                "username": item.username,
                "email": item.email,
                "generation_count": item.generation_count,
                "total_cost": round(float(item.total_cost or 0), 4)
            }
            for item in generations_by_user
        ],
        "daily_activity": [
            {
                "date": item.date.isoformat(),
                "generations": item.generations,
                "active_users": item.active_users
            }
            for item in daily_activity
        ]
    }

@router.get("/cost-analysis")
async def get_cost_analysis(
    days: int = 30,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get cost analysis report (admin only)"""
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get total cost statistics
    total_cost = db.query(func.sum(Generation.cost)).filter(
        Generation.created_at >= start_date
    ).scalar() or 0
    
    total_generations = db.query(Generation).filter(
        Generation.created_at >= start_date
    ).count()
    
    avg_cost_per_generation = db.query(func.avg(Generation.cost)).filter(
        Generation.created_at >= start_date
    ).scalar() or 0
    
    # Get cost breakdown by user
    cost_by_user = db.query(
        User.username,
        User.email,
        func.sum(Generation.cost).label('total_cost'),
        func.count(Generation.id).label('generation_count'),
        func.avg(Generation.cost).label('avg_cost')
    ).join(Generation).filter(
        Generation.created_at >= start_date
    ).group_by(User.id).order_by(func.sum(Generation.cost).desc()).limit(10).all()
    
    # Get cost breakdown by product
    cost_by_product = db.query(
        Product.name,
        func.sum(Generation.cost).label('total_cost'),
        func.count(Generation.id).label('usage_count')
    ).join(Generation).filter(
        Generation.created_at >= start_date,
        Generation.product_id.isnot(None)
    ).group_by(Product.id).order_by(func.sum(Generation.cost).desc()).limit(10).all()
    
    # Get daily cost trends
    daily_costs = db.query(
        func.date(Generation.created_at).label('date'),
        func.sum(Generation.cost).label('daily_cost'),
        func.count(Generation.id).label('daily_generations')
    ).filter(
        Generation.created_at >= start_date
    ).group_by(func.date(Generation.created_at)).order_by('date').all()
    
    return {
        "period": f"Last {days} days",
        "summary": {
            "total_cost": round(float(total_cost), 4),
            "total_generations": total_generations,
            "average_cost_per_generation": round(float(avg_cost_per_generation), 4)
        },
        "cost_by_user": [
            {
                "username": item.username,
                "email": item.email,
                "total_cost": round(float(item.total_cost), 4),
                "generation_count": item.generation_count,
                "average_cost": round(float(item.avg_cost), 4)
            }
            for item in cost_by_user
        ],
        "cost_by_product": [
            {
                "product_name": item.name,
                "total_cost": round(float(item.total_cost), 4),
                "usage_count": item.usage_count
            }
            for item in cost_by_product
        ],
        "daily_trends": [
            {
                "date": item.date.isoformat(),
                "cost": round(float(item.daily_cost), 4),
                "generations": item.daily_generations
            }
            for item in daily_costs
        ]
    }

@router.get("/training-summary")
async def get_training_summary(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get training jobs summary (admin only)"""
    
    # Get training statistics
    total_jobs = db.query(TrainingJob).count()
    completed_jobs = db.query(TrainingJob).filter(
        TrainingJob.status == TrainingStatus.COMPLETED
    ).count()
    failed_jobs = db.query(TrainingJob).filter(
        TrainingJob.status == TrainingStatus.FAILED
    ).count()
    running_jobs = db.query(TrainingJob).filter(
        TrainingJob.status == TrainingStatus.RUNNING
    ).count()
    pending_jobs = db.query(TrainingJob).filter(
        TrainingJob.status == TrainingStatus.PENDING
    ).count()
    
    # Get training jobs by user
    jobs_by_user = db.query(
        User.username,
        func.count(TrainingJob.id).label('job_count'),
        func.sum(func.case([(TrainingJob.status == TrainingStatus.COMPLETED, 1)], else_=0)).label('completed'),
        func.sum(func.case([(TrainingJob.status == TrainingStatus.FAILED, 1)], else_=0)).label('failed')
    ).join(TrainingJob, User.id == TrainingJob.created_by).group_by(User.id).order_by(
        func.count(TrainingJob.id).desc()
    ).limit(10).all()
    
    # Get recent training jobs
    recent_jobs = db.query(TrainingJob).order_by(
        TrainingJob.created_at.desc()
    ).limit(10).all()
    
    # Get training jobs by base model
    jobs_by_model = db.query(
        TrainingJob.base_model,
        func.count(TrainingJob.id).label('job_count')
    ).group_by(TrainingJob.base_model).order_by(
        func.count(TrainingJob.id).desc()
    ).all()
    
    return {
        "summary": {
            "total_jobs": total_jobs,
            "completed_jobs": completed_jobs,
            "failed_jobs": failed_jobs,
            "running_jobs": running_jobs,
            "pending_jobs": pending_jobs,
            "success_rate": round((completed_jobs / total_jobs * 100), 2) if total_jobs > 0 else 0
        },
        "jobs_by_user": [
            {
                "username": item.username,
                "total_jobs": item.job_count,
                "completed": item.completed,
                "failed": item.failed,
                "success_rate": round((item.completed / item.job_count * 100), 2) if item.job_count > 0 else 0
            }
            for item in jobs_by_user
        ],
        "jobs_by_model": [
            {
                "base_model": item.base_model,
                "job_count": item.job_count
            }
            for item in jobs_by_model
        ],
        "recent_jobs": [
            {
                "id": job.id,
                "product_name": job.product_name,
                "base_model": job.base_model,
                "status": job.status.value,
                "progress": job.progress or 0,
                "created_at": job.created_at,
                "completed_at": job.completed_at
            }
            for job in recent_jobs
        ]
    }

@router.get("/system-stats")
async def get_system_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get overall system statistics (admin only)"""
    
    # Get product statistics
    total_products = db.query(Product).count()
    public_products = db.query(Product).filter(
        Product.access_level == AccessLevel.PUBLIC
    ).count()
    private_products = db.query(Product).filter(
        Product.access_level == AccessLevel.PRIVATE
    ).count()
    
    # Get generation statistics
    total_generations = db.query(Generation).count()
    total_images = db.query(func.sum(
        func.json_array_length(Generation.image_paths)
    )).scalar() or 0
    
    # Get user role distribution
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).count()
    regular_users = db.query(User).filter(User.role == UserRole.USER).count()
    
    # Get recent activity (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(hours=24)
    recent_generations = db.query(Generation).filter(
        Generation.created_at >= yesterday
    ).count()
    recent_training_jobs = db.query(TrainingJob).filter(
        TrainingJob.created_at >= yesterday
    ).count()
    
    return {
        "products": {
            "total": total_products,
            "public": public_products,
            "private": private_products
        },
        "generations": {
            "total_generations": total_generations,
            "total_images": int(total_images),
            "recent_24h": recent_generations
        },
        "users": {
            "admin_users": admin_users,
            "regular_users": regular_users,
            "total_users": admin_users + regular_users
        },
        "training": {
            "recent_24h": recent_training_jobs
        }
    }

@router.get("/my-stats")
async def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's statistics"""
    
    # Get user's generation count and cost
    generation_stats = db.query(
        func.count(Generation.id).label('count'),
        func.sum(Generation.cost).label('total_cost'),
        func.sum(func.json_array_length(Generation.image_paths)).label('total_images')
    ).filter(Generation.user_id == current_user.id).first()
    
    # Get user's product count
    product_count = db.query(Product).filter(
        Product.created_by == current_user.id
    ).count()
    
    # Get user's training jobs
    training_stats = db.query(
        func.count(TrainingJob.id).label('total'),
        func.sum(func.case([(TrainingJob.status == TrainingStatus.COMPLETED, 1)], else_=0)).label('completed'),
        func.sum(func.case([(TrainingJob.status == TrainingStatus.FAILED, 1)], else_=0)).label('failed'),
        func.sum(func.case([(TrainingJob.status == TrainingStatus.RUNNING, 1)], else_=0)).label('running')
    ).filter(TrainingJob.created_by == current_user.id).first()
    
    # Get recent activity (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_generations = db.query(Generation).filter(
        Generation.user_id == current_user.id,
        Generation.created_at >= week_ago
    ).count()
    
    return {
        "generations": {
            "total_count": generation_stats.count or 0,
            "total_images": int(generation_stats.total_images or 0),
            "total_cost": round(float(generation_stats.total_cost or 0), 4),
            "recent_7_days": recent_generations
        },
        "products": {
            "total_count": product_count
        },
        "training": {
            "total_jobs": training_stats.total or 0,
            "completed": training_stats.completed or 0,
            "failed": training_stats.failed or 0,
            "running": training_stats.running or 0,
            "success_rate": round((training_stats.completed / max(training_stats.total, 1) * 100), 2)
        },
        "account": {
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role.value,
            "member_since": current_user.created_at,
            "last_login": current_user.last_login
        }
    }