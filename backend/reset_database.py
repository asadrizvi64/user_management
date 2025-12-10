"""
Database Reset Script
Deletes the existing database and recreates it with the latest schema.
Use this when database schema changes require a fresh start.
"""
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def reset_database():
    """Delete old database and create a new one with current schema"""

    # Path to the database file
    db_path = Path("product_training.db")

    print("=" * 60)
    print("DATABASE RESET SCRIPT")
    print("=" * 60)
    print()

    # Check if database exists
    if db_path.exists():
        print(f"Found existing database: {db_path}")
        response = input("This will delete all existing data. Continue? (yes/no): ")

        if response.lower() != 'yes':
            print("Aborted.")
            return

        # Delete the database file
        try:
            db_path.unlink()
            print(f"✓ Deleted old database: {db_path}")
        except Exception as e:
            print(f"✗ Error deleting database: {e}")
            return
    else:
        print("No existing database found.")

    print()
    print("Creating new database with updated schema...")
    print()

    # Import and run database initialization
    try:
        from app.database import init_database
        init_database()
        print()
        print("=" * 60)
        print("DATABASE RESET COMPLETE")
        print("=" * 60)
        print()
        print("Default accounts created:")
        print("  Super Admin: superadmin / superadmin123")
        print("  Admin:       admin / admin123")
        print("  Worker:      worker / worker123")
        print()
        print("You can now start the server with: run.bat")
        print("=" * 60)
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return

if __name__ == "__main__":
    reset_database()
