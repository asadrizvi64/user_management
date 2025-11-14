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
    print("Initializing database...")
    print("=" * 50)
    init_database()
    print("=" * 50)
    print("Database initialized successfully!")
    print()
    print("Default admin credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print()
    print("IMPORTANT: Change the admin password after first login!")
