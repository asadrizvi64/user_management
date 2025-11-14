@echo off
echo ==========================================
echo   Starting Frontend (Port 3001)
echo ==========================================
echo.

cd frontend

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

if not exist ".env" (
    echo Creating .env file...
    (
        echo VITE_API_URL=http://localhost:8001
        echo VITE_APP_NAME=AI Training Platform
    ) > .env
)

echo Starting Vite dev server...
echo Frontend will be available at: http://localhost:3001
echo Press Ctrl+C to stop
echo.

call npm run dev

pause