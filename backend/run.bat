@echo off
REM Startup script for Windows

echo ========================================
echo AI Model Training Platform - Backend
echo ========================================
echo.

REM Set environment variables
set DATABASE_URL=sqlite:///./product_training.db
set SECRET_KEY=your-secret-key-change-this-in-production
set ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000,http://localhost:5173

echo Starting backend server...
echo Database: SQLite (product_training.db)
echo Server: http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo Health Check: http://localhost:8001/health
echo.

python app/main.py
