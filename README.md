# Product Training Platform

A comprehensive platform for training and managing product-specific AI models using FLUX LoRA technology. This application integrates FluxGym's training capabilities into a multi-user enterprise platform.

## Features

### Core Functionality
- **Product Training**: Train custom FLUX LoRA models for specific products
- **Image Generation**: Generate product images using trained models
- **Inpainting**: Replace parts of images with trained products
- **User Management**: Multi-user support with admin controls
- **History Tracking**: Track all generation activities
- **Reports**: Detailed analytics and cost tracking

### Training Features (FluxGym Integration)
- **Low VRAM Support**: 12GB/16GB/20GB VRAM configurations
- **Auto-Captioning**: AI-powered image captioning using Florence-2
- **Real-time Monitoring**: Live training progress tracking
- **Multiple Base Models**: Support for FLUX-dev, FLUX-schnell, and custom models
- **Advanced Configuration**: Full access to Kohya script parameters

## Architecture

### Backend (FastAPI)
- **Training Service**: Integrates FluxGym's training engine
- **Product Management**: CRUD operations for trained models
- **User Authentication**: JWT-based auth with role management
- **File Handling**: Image upload and model storage
- **Database**: PostgreSQL with SQLAlchemy ORM

### Frontend (React)
- **Material-UI**: Modern responsive interface
- **Redux**: State management
- **Real-time Updates**: WebSocket progress streaming
- **File Upload**: Drag-and-drop image handling

### Training Engine
- **FluxGym Integration**: Direct integration of FluxGym components
- **Kohya Scripts**: Full support for sd-scripts functionality
- **GPU Optimization**: VRAM-aware training configurations
- **Model Management**: Automatic model downloading and organization

## Quick Start

### Prerequisites
- Docker and Docker Compose
- NVIDIA GPU with CUDA support
- 12GB+ VRAM for training

### Installation

1. **Clone and Setup**
```bash
git clone <repository-url>
cd product-training-platform
chmod +x scripts/setup.sh
./scripts/setup.sh
```

2. **Configure Environment**
```bash
cp config/development.env .env
# Edit .env with your settings
```

3. **Download Base Models**
```bash
./scripts/download_models.sh
```

4. **Start the Platform**
```bash
docker-compose up -d
```

5. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Training Monitor: Real-time progress in the UI

## Usage Guide

### 1. Creating Your First Product

1. **Login** to the platform
2. Navigate to **Products** → **New Product**
3. **Upload Images** (2-150 images recommended)
4. **Set Trigger Word** (unique identifier for your product)
5. **Configure Training Parameters**:
   - Resolution: 512px (recommended)
   - Epochs: 16 (adjust based on dataset size)
   - VRAM: Select based on your GPU
6. **Generate Auto-Captions** or edit manually
7. **Start Training**

### 2. Using Trained Products

1. Go to **Image Editor**
2. **Select Your Product** from the dropdown
3. **Write a Prompt** including your trigger word
4. **Generate Images** with your trained product
5. **Download** or **Edit** results

### 3. Advanced Features

- **Inpainting**: Replace parts of existing images
- **Batch Processing**: Generate multiple variations
- **History Tracking**: Review all your generations
- **Model Downloads**: Export trained models

## Training Parameters Guide

### Basic Settings
- **Resolution**: 512px for most products, 768px for detailed items
- **Epochs**: 12-20 for most datasets
- **Learning Rate**: 8e-4 (default), lower for fine-tuning
- **Network Dimension**: 4-16, higher for complex products

### VRAM Optimization
- **12GB**: Use split_mode and single block training
- **16GB**: Standard configuration with optimizations
- **20GB+**: Full featured training with samples

### Advanced Options
- **Timestep Sampling**: "shift" for FLUX models
- **Guidance Scale**: 1.0 for FLUX, adjust for creativity
- **Sample Generation**: Monitor training progress visually

## File Structure from FluxGym

### Required Files from FluxGym Repository

Copy these files/directories:

1. **Complete sd-scripts directory**:
```bash
git clone -b sd3 https://github.com/kohya-ss/sd-scripts training-engine/sd-scripts
```

2. **Core Training Files**:
```
training-engine/
├── models.yaml                 # Model configurations
├── requirements.txt            # Training dependencies  
└── scripts/
    ├── train_product.py        # Adapted from app.py
    ├── dataset_creator.py      # Dataset management
    └── model_converter.py      # Model utilities
```

3. **Training Logic Integration**:
- Copy training functions from `app.py`
- Adapt Gradio UI components to React
- Integrate progress monitoring
- Port configuration generation

### Key Adaptations Made

1. **UI Framework Change**: Gradio → React + Material-UI
2. **Architecture**: Single script → Microservices
3. **Database**: File-based → PostgreSQL
4. **User Management**: None → Multi-user with roles
5. **API Integration**: Direct calls → RESTful API
6. **File Handling**: Local → Centralized storage
7. **Progress Tracking**: Logs → Real-time WebSocket streams

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Training Engine Development
```bash
cd training-engine
pip install -r requirements.txt
python -m pytest tests/
```

## Production Deployment

### Environment Variables
```bash
# Security
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:pass@host:5432/db

# Storage
UPLOAD_DIR=/app/storage
MAX_FILE_SIZE=104857600

# GPU Configuration
CUDA_VISIBLE_DEVICES=0,1
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Database Migration
```bash
alembic upgrade head
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Product Management
- `GET /api/products/` - List products
- `POST /api/products/` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/{id}/download` - Download model

### Training Operations
- `POST /api/training/start` - Start training job
- `GET /api/training/jobs` - List training jobs
- `GET /api/training/jobs/{id}` - Get job details
- `GET /api/training/jobs/{id}/progress` - Stream progress (SSE)
- `POST /api/training/jobs/{id}/stop` - Stop training
- `POST /api/training/auto-caption` - Generate captions

### Generation
- `POST /api/generation/generate` - Generate images
- `GET /api/generation/history` - Generation history
- `POST /api/inpainting/process` - Inpainting

### Admin Features
- `GET /api/users/` - List users (admin)
- `POST /api/users/` - Create user (admin)
- `GET /api/reports/activity` - Activity reports (admin)
- `GET /api/reports/costs` - Cost analysis (admin)

## Troubleshooting

### Common Issues

**Training Fails to Start**
- Check GPU availability: `nvidia-smi`
- Verify CUDA_VISIBLE_DEVICES setting
- Ensure sufficient VRAM for chosen settings

**Model Download Errors**
- Check internet connection
- Verify Hugging Face access
- Check disk space in training-engine/models/

**Frontend Connection Issues**
- Verify backend is running on port 8000
- Check CORS settings in backend
- Confirm API_BASE_URL in frontend env

**Training Progress Not Updating**
- Check WebSocket connection
- Verify training process is running
- Check training logs in database

### Performance Optimization

**Training Speed**
- Use appropriate VRAM settings
- Enable mixed precision (bf16)
- Optimize batch size per GPU memory
- Use SSD storage for datasets

**Generation Speed**
- Cache text encoder outputs
- Use optimized model formats
- Enable GPU acceleration
- Batch multiple requests

## Security Considerations

### Production Security
- Change default SECRET_KEY
- Use HTTPS in production
- Configure proper CORS origins
- Set up database authentication
- Regular security updates

### File Upload Security
- Validate file types and sizes
- Scan uploads for malware
- Implement rate limiting
- Use secure file storage

## Contributing

### Code Style
- Backend: Black + isort + flake8
- Frontend: ESLint + Prettier
- Commit messages: Conventional commits

### Testing
```bash
# Backend tests
cd backend && python -m pytest

# Frontend tests  
cd frontend && npm test

# Training tests
cd training-engine && python -m pytest
```

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

## License

This project builds upon FluxGym which is licensed under MIT. See LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: Technical problems
- Discussions: General questions
- Documentation: Check docs/ folder

## Acknowledgments

- **FluxGym**: Original training interface and core functionality
- **Kohya Scripts**: Underlying training engine
- **AI-Toolkit**: UI inspiration and components
- **FLUX Models**: Base model architecture