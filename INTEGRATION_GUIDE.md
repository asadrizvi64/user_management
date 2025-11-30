# FluxGym + fal.ai + RunPod Integration Guide

This guide explains how to use the FluxGym LoRA training platform with fal.ai deployment and RunPod GPU fallback.

## Features

### 🎨 FluxGym Training
- Train FLUX LoRA models locally using your GPU
- Automatic dataset preparation and captioning
- Real-time training progress monitoring
- Supports FLUX.1-dev and FLUX.1-schnell models

### ☁️ RunPod GPU Fallback
- Automatically uses RunPod cloud GPU when your local GPU is busy
- Seamless fallback when GPU memory > 80% (configurable)
- Perfect for when your GPU is occupied with inference
- Pay only for what you use

### 🚀 fal.ai Deployment
- Deploy trained LoRA models to fal.ai for fast inference
- Generate images without using your local GPU
- Scalable and production-ready endpoints
- Built-in FLUX + LoRA support

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# fal.ai Configuration
FAL_KEY=your_fal_ai_api_key_here
FAL_DEPLOYMENT_ENABLED=true

# RunPod Configuration
RUNPOD_API_KEY=your_runpod_api_key_here
RUNPOD_ENABLED=true
RUNPOD_GPU_TYPE=NVIDIA RTX A4000

# GPU Threshold (0.8 = 80%)
GPU_MEMORY_THRESHOLD=0.8
```

#### Getting API Keys:

**fal.ai:**
1. Go to https://fal.ai
2. Sign up / Log in
3. Navigate to Dashboard > Keys
4. Create a new API key
5. Copy and paste into `FAL_KEY`

**RunPod:**
1. Go to https://runpod.io
2. Sign up / Log in
3. Navigate to Settings > API Keys
4. Create a new API key
5. Copy and paste into `RUNPOD_API_KEY`

### 3. Run Database Migration

```bash
cd backend
sqlite3 product_training.db < migrations/add_cloud_fields.sql
```

Or if using Alembic:
```bash
alembic upgrade head
```

### 4. Start the Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

## Usage Workflows

### Workflow 1: Local Training + fal.ai Deployment

Perfect for: Local training with cloud inference

1. **Train locally:**
```bash
POST /training/start
{
  "product_name": "my_product",
  "base_model": "flux-dev",
  "trigger_word": "MYPRODUCT",
  "images": [...],
  "training_params": {...}
}
```

2. **Wait for training to complete**, then **deploy to fal.ai:**
```bash
POST /training/deploy-to-fal
{
  "product_name": "my_product",
  "trigger_word": "MYPRODUCT"
}
```

3. **Generate images using fal.ai:**
```bash
POST /training/generate-with-fal
{
  "product_name": "my_product",
  "prompt": "MYPRODUCT in a futuristic city",
  "num_images": 4,
  "guidance_scale": 3.5
}
```

### Workflow 2: Automatic RunPod Fallback

Perfect for: When your local GPU is busy with inference

1. **Enable RunPod** in `.env`:
```bash
RUNPOD_ENABLED=true
GPU_MEMORY_THRESHOLD=0.8
```

2. **Start training** (system automatically decides):
```bash
POST /training/start
{
  "product_name": "my_product",
  ...
}
```

The system will:
- Check local GPU availability
- If GPU memory > 80% → Use RunPod
- If GPU available → Use local

3. **Monitor GPU status:**
```bash
GET /training/gpu-status
```

Response:
```json
{
  "use_runpod": true,
  "reason": "All GPUs are busy (memory util > 80%)",
  "gpu_status": {
    "available": true,
    "gpus": [{
      "id": 0,
      "memory_util": 0.95,
      "gpu_util": 0.85
    }]
  }
}
```

### Workflow 3: Full Cloud Workflow

Perfect for: No local GPU or scaling production

1. **Force RunPod training:**
```bash
POST /training/start
{
  "product_name": "my_product",
  "force_provider": "runpod",  # Force RunPod
  ...
}
```

2. **Deploy to fal.ai after training:**
```bash
POST /training/deploy-to-fal
{
  "product_name": "my_product",
  "trigger_word": "MYPRODUCT"
}
```

3. **Use fal.ai for all inference** - no local GPU needed!

## API Endpoints

### Training Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/training/start` | POST | Start training (auto-selects provider) |
| `/training/jobs` | GET | List all training jobs |
| `/training/jobs/{id}` | GET | Get job details |
| `/training/jobs/{id}/stop` | POST | Stop training job |

### Cloud Integration Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/training/gpu-status` | GET | Check GPU status and cloud decision |
| `/training/system-status` | GET | Complete system status |
| `/training/deploy-to-fal` | POST | Deploy model to fal.ai |
| `/training/generate-with-fal` | POST | Generate images via fal.ai |
| `/training/deployed-models` | GET | List fal.ai deployed models |

### Example: Check System Status

```bash
GET /training/system-status
```

Response:
```json
{
  "fluxgym": {
    "path": "/path/to/sd-scripts",
    "exists": true,
    "key_files": {...}
  },
  "gpu": {
    "available": true,
    "gpu_count": 1,
    "can_train_locally": false,
    "should_use_cloud": true,
    "reason": "GPU busy with inference"
  },
  "runpod": {
    "available": true,
    "api_key_configured": true,
    "active_pods": 1
  },
  "fal": {
    "available": true,
    "api_key_configured": true,
    "deployed_models_count": 3
  },
  "active_jobs": 1
}
```

## Cost Optimization

### RunPod Costs
- **A4000 (16GB)**: ~$0.34/hour
- **A6000 (48GB)**: ~$0.79/hour
- **A100 (80GB)**: ~$1.89/hour

**Typical LoRA training**: 1000 steps ≈ 30-60 minutes
**Cost per model**: $0.17 - $1.00 (depending on GPU)

### fal.ai Costs
- **Storage**: Free for reasonable usage
- **Inference**: Pay per image generated
- **FLUX + LoRA**: ~$0.05 per image (fast generation)

### Cost Comparison

| Scenario | Local | RunPod + fal.ai |
|----------|-------|-----------------|
| Train 10 models/month | Electricity | ~$3-10 |
| 1000 images/month | Electricity | ~$50 |
| GPU always busy | Can't train | Train anytime |

## Troubleshooting

### RunPod Issues

**Problem**: RunPod training fails to start
```bash
# Check RunPod status
GET /training/system-status

# Verify API key
echo $RUNPOD_API_KEY
```

**Solution**:
- Verify API key is correct
- Check RunPod account has sufficient credits
- Ensure GPU type is available in your region

### fal.ai Issues

**Problem**: Deployment fails
```bash
# Check if model file exists
ls storage/trained_models/my_product/*.safetensors
```

**Solution**:
- Ensure training completed successfully
- Verify FAL_KEY is set correctly
- Check model file is not corrupted

### GPU Detection Issues

**Problem**: GPU not detected
```bash
# Check GPU manually
nvidia-smi

# Check detection in app
GET /training/gpu-status
```

**Solution**:
- Install GPUtil: `pip install GPUtil`
- Verify CUDA drivers are installed
- Check CUDA_VISIBLE_DEVICES setting

## Advanced Configuration

### Custom GPU Threshold

Adjust when to fallback to RunPod:

```bash
# Aggressive cloud usage (>50% triggers RunPod)
GPU_MEMORY_THRESHOLD=0.5

# Conservative (only use RunPod if >95% full)
GPU_MEMORY_THRESHOLD=0.95
```

### Custom RunPod GPU

Available GPU types:
```bash
RUNPOD_GPU_TYPE=NVIDIA RTX A4000  # Budget-friendly
RUNPOD_GPU_TYPE=NVIDIA RTX A5000  # Balanced
RUNPOD_GPU_TYPE=NVIDIA RTX A6000  # More VRAM
RUNPOD_GPU_TYPE=NVIDIA A100       # Best performance
```

### fal.ai Generation Parameters

```javascript
{
  "num_images": 4,              // 1-4 images
  "image_size": "landscape_4_3", // or "square", "portrait_4_3"
  "num_inference_steps": 28,     // 4-50 steps (more = better quality)
  "guidance_scale": 3.5,         // 1.0-20.0 (how closely to follow prompt)
  "lora_scale": 1.0              // 0.0-1.0 (LoRA strength)
}
```

## Architecture

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         v
┌─────────────────────┐
│  Training Service   │
│  ┌───────────────┐  │
│  │ GPU Manager   │──┼──> Check GPU Status
│  └───────────────┘  │
         │             │
         v             │
   GPU Available?      │
         │             │
    ┌────┴────┐        │
    │         │        │
   Yes       No        │
    │         │        │
    v         v        │
┌─────┐  ┌────────┐   │
│Local│  │ RunPod │   │
│Train│  │ Train  │   │
└──┬──┘  └────┬───┘   │
   │          │       │
   └────┬─────┘       │
        v             │
   ┌─────────┐        │
   │ Trained │        │
   │  Model  │        │
   └────┬────┘        │
        │             │
        v             │
   ┌─────────┐        │
   │Deploy to│        │
   │ fal.ai  │        │
   └────┬────┘        │
        v             │
   ┌─────────┐        │
   │Generate │        │
   │ Images  │        │
   └─────────┘        │
                      │
└─────────────────────┘
```

## Support

For issues or questions:
1. Check the logs: `tail -f backend/app.log`
2. Review system status: `GET /training/system-status`
3. Check GPU status: `GET /training/gpu-status`

## Next Steps

1. **Set up your API keys** in `.env`
2. **Run the database migration**
3. **Test the system** with a small training job
4. **Deploy to fal.ai** and test inference
5. **Monitor costs** on RunPod and fal.ai dashboards

Happy training! 🚀
