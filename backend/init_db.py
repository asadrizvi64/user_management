#!/usr/bin/env python
"""
Database initialization script
Run this to create all database tables and default admin user
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set DATABASE_URL to SQLite
os.environ.setdefault("DATABASE_URL", "sqlite:///./product_training.db")

from app.database import init_database

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  DATABASE INITIALIZATION - MULTI-TENANT SYSTEM")
    print("=" * 60)
    print()
    init_database()
    print()
    print("=" * 60)
    print("  Database initialized successfully!")
    print("=" * 60)
    print()
    print("Default User Credentials:")
    print("-" * 60)
    print()
    print("1. SUPER ADMIN (System Owner):")
    print("   Username: superadmin")
    print("   Password: superadmin123")
    print("   Role:     SUPER_ADMIN")
    print("   Access:   Full system access, manage all organizations")
    print()
    print("2. ORGANIZATION ADMIN (Sample Org):")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Role:     ADMIN")
    print("   Access:   Manage workers in Sample Organization")
    print()
    print("3. WORKER (Sample Org):")
    print("   Username: worker")
    print("   Password: worker123")
    print("   Role:     WORKER")
    print("   Access:   Use image generator tools")
    print()
    print("-" * 60)
    print("⚠️  IMPORTANT: Change all default passwords after first login!")
    print("=" * 60)
    print()
