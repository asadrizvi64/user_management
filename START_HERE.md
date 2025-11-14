# Quick Start Guide

## First Time Setup

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
cd backend
python init_db.py
```

This creates the database and default admin user:
- **Username**: `admin`
- **Password**: `admin123`

### 3. Install Frontend Dependencies (if needed)

```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Run Both (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
run.bat
```

**Terminal 2 - Frontend:**
```bash
cd frontend
run.bat
```

### Option 2: Quick Start (Frontend Only - from root)

```bash
run.bat
```

This will start the frontend. Make sure to start the backend separately!

## Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health

## Default Credentials

- Username: `admin`
- Password: `admin123`

**IMPORTANT**: Change this password after first login!

## Troubleshooting

### Backend fails to start

1. Make sure you installed dependencies: `pip install -r requirements.txt`
2. Check if DATABASE_URL is set correctly in run.bat
3. Verify Python version is 3.11+

### Frontend fails to start

1. Install dependencies: `npm install`
2. Make sure backend is running on port 8001
3. Check `.env` file has `VITE_API_URL=http://localhost:8001`

### Can't login

1. Make sure database is initialized: `python backend/init_db.py`
2. Use default credentials: admin/admin123
3. Check backend console for errors

## Next Steps

1. Login with admin credentials
2. Change admin password
3. Create regular user accounts
4. Set up sd-scripts for training (see README.md)
5. Set up ComfyUI for generation (see README.md)

## Full Documentation

See [README.md](README.md) for complete documentation including:
- Database design
- API endpoints
- Training workflow
- Generation workflow
- Configuration options
