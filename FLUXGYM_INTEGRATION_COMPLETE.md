# FluxGym/Kohya Integration - Complete Implementation Guide

## 🎯 Overview

This document provides a comprehensive overview of the complete FluxGym/Kohya integration with cloud provider support (fal.ai and RunPod). The system now intelligently routes training and inference based on GPU availability.

## ✅ What's Been Implemented

### 1. **GPU Detection & Provider Selection**

#### Backend (`/api/training/gpu-status`)
- Real-time GPU status monitoring
- Memory and utilization tracking
- Automatic provider recommendation based on GPU availability
- System resource monitoring (CPU, RAM, disk)

**Location:** `backend/routers/training.py:25-49`

#### Frontend (Training UI)
- Live GPU status display showing:
  - GPU count and availability
  - Memory usage per GPU
  - Visual status indicators (Available/Busy/None)
- Provider selection dropdown:
  - **Auto** - Automatically selects best provider
  - **Local GPU (FluxGym/Kohya)** - Uses local GPU (disabled if no GPU)
  - **RunPod** - Cloud GPU rental
  - **fal.ai** - Managed cloud training
- Real-time recommendation based on GPU status

**Location:** `frontend/src/components/products/ProductTraining.jsx:253-308`

### 2. **Training Provider Routing**

#### Logic Flow
```
User clicks "Start Training"
  ↓
Frontend sends provider selection to backend
  ↓
Backend checks:
  - If provider = 'local' → Use FluxGym
  - If provider = 'runpod' → Use RunPod
  - If provider = 'fal' → Use fal.ai
  - If provider = 'auto' or null:
      ├─ GPU available & not busy → FluxGym (local)
      └─ GPU busy or unavailable → Cloud (RunPod/fal)
  ↓
Route to appropriate training service
  ↓
Monitor and track progress
```

#### FluxGym/Kohya (Local Training)
**Status:** ✅ **Fully Functional**

- Auto-detects FluxGym/sd-scripts installation
- Prepares datasets with automatic captioning
- Generates training scripts with optimal parameters
- Streams real-time progress (steps, loss, learning rate)
- Saves trained LoRA models locally

**Location:** `backend/services/fluxgym_service.py:1-401`

#### RunPod (Cloud GPU)
**Status:** ⚠️ **Partially Implemented**

**What Works:**
- Pod creation with GPU type selection
- Status monitoring
- Training job tracking in database

**What Needs Configuration:**
1. **API Key Required:** Set `RUNPOD_API_KEY` in environment
2. **Dataset Upload:** Currently uses placeholder - requires:
   - S3/cloud storage bucket setup, OR
   - Direct SSH/SCP access to pods
3. **Command Execution:** Uses RunPod SDK - may need GraphQL API integration
4. **Model Download:** Needs reverse transfer mechanism from pod to local storage

**To Enable Full RunPod Support:**
```bash
# 1. Install RunPod SDK
pip install runpod

# 2. Set environment variables
export RUNPOD_API_KEY="your-runpod-api-key"
export RUNPOD_GPU_TYPE="NVIDIA RTX A4000"

# 3. Configure S3 for dataset storage (optional but recommended)
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
export S3_BUCKET="your-training-bucket"
```

**Location:** `backend/services/runpod_service.py:1-494`

#### fal.ai (Managed Cloud)
**Status:** ✅ **API Ready** (UI needs integration for deployment)

**What Works:**
- Image generation via fal.ai
- API communication layer
- Cost tracking

**What Needs Setup:**
1. **API Key Required:** Set `FAL_KEY` in environment
2. **Deployment UI:** Backend endpoints exist but no frontend integration for:
   - Deploying trained models to fal.ai
   - Viewing deployed models
   - Selecting fal.ai models for generation

**Location:** `backend/services/fal_service.py`

### 3. **Inference/Image Generation with Cloud Fallback**

#### New Smart Routing
**Status:** ✅ **Fully Implemented**

The inference service now automatically checks GPU availability before generating:

```python
# Automatic decision flow
if GPU is busy with training:
    → Use fal.ai for generation
elif ComfyUI is unavailable:
    → Use fal.ai for generation
else:
    → Use local ComfyUI (free, fast)
```

**Features:**
- GPU occupancy detection (>70% memory or utilization)
- ComfyUI health checks
- Automatic fallback to fal.ai
- Manual provider forcing via API parameter

**Location:** `backend/services/inference_service.py:83-572`

**API Usage:**
```javascript
// Auto mode (recommended)
POST /api/generation/generate
{
  "prompt": "a red car",
  // No provider specified - auto-selects
}

// Force specific provider
POST /api/generation/generate
{
  "prompt": "a red car",
  "force_provider": "fal"  // or "local"
}
```

### 4. **Training Progress Monitoring**

#### Provider Indicator
**Status:** ✅ **Implemented**

The training progress UI now shows which provider is being used:
- **FluxGym (Local)** - Green chip for local GPU training
- **RUNPOD** - Blue chip for RunPod cloud
- **FAL** - Blue chip for fal.ai cloud

**Location:** `frontend/src/components/products/TrainingProgress.jsx:153-160`

### 5. **Database Tracking**

#### TrainingJob Model
```python
class TrainingJob:
    provider: Enum['LOCAL', 'RUNPOD', 'FAL']
    cloud_pod_id: str  # RunPod pod ID or fal job ID
    cloud_metadata: JSON  # Provider-specific data
    status: Enum['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
```

**Location:** `backend/models/training.py:1-79`

## 🔧 Configuration Guide

### Required Environment Variables

```bash
# config.py or .env

# GPU Settings
GPU_MEMORY_THRESHOLD=0.8  # 80% threshold for cloud fallback

# RunPod (Optional - for cloud GPU)
RUNPOD_API_KEY=""  # Get from runpod.io
RUNPOD_ENABLED=false
RUNPOD_GPU_TYPE="NVIDIA RTX A4000"
RUNPOD_DOCKER_IMAGE="runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel"

# fal.ai (Optional - for cloud inference/training)
FAL_KEY=""  # Get from fal.ai
FAL_DEPLOYMENT_ENABLED=false

# AWS S3 (Optional - for RunPod dataset uploads)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
S3_BUCKET=""
```

### Installation Requirements

```bash
# Core dependencies (already in requirements.txt)
pip install GPUtil psutil

# Optional: RunPod support
pip install runpod

# Optional: fal.ai support
pip install fal-client

# Optional: S3 for RunPod datasets
pip install boto3
```

### FluxGym/Kohya Setup

The system auto-detects FluxGym in these locations (relative to backend):
1. `FluxGym/sd-scripts/`
2. `../FluxGym/sd-scripts/`
3. `../../FluxGym/sd-scripts/`
4. `/workspace/FluxGym/sd-scripts/`
5. `~/FluxGym/sd-scripts/`
6. `C:/FluxGym/sd-scripts/`
7. `D:/FluxGym/sd-scripts/`

**Ensure FluxGym is installed with:**
- `flux_train_network.py`
- `train_network.py`
- `networks/` directory
- `library/` directory

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Interface                          │
│  ┌──────────────────────┐        ┌──────────────────────────┐  │
│  │  ProductTraining.jsx │        │  TrainingProgress.jsx    │  │
│  │  - GPU Status        │        │  - Provider Indicator    │  │
│  │  - Provider Select   │        │  - Progress Monitor      │  │
│  └──────────────────────┘        └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Backend API Layer                          │
│  ┌──────────────────────┐        ┌──────────────────────────┐  │
│  │  /api/training/*     │        │  /api/generation/*       │  │
│  │  - start             │        │  - generate              │  │
│  │  - gpu-status        │        │  - fallback logic        │  │
│  └──────────────────────┘        └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ FluxGym  │  │ RunPod   │  │ fal.ai   │  │ GPU Manager  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ (Detection)  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Execution Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Local    │  │ RunPod   │  │ fal.ai   │  │ ComfyUI      │   │
│  │ GPU      │  │ Pod      │  │ API      │  │ (Inference)  │   │
│  │ (Kohya)  │  │ (Cloud)  │  │ (Cloud)  │  │ (Local)      │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Usage Examples

### Training with Auto Provider Selection

```javascript
// Frontend automatically detects GPU and selects provider
const formData = new FormData();
formData.append('product_name', 'my_product');
formData.append('trigger_word', 'myproduct');
formData.append('provider', 'auto');  // Let system decide
// ... add images and params

const response = await trainingService.startTraining(formData);
// System will use FluxGym if GPU available, cloud otherwise
```

### Forcing Specific Provider

```javascript
// Force RunPod even if local GPU available
formData.append('provider', 'runpod');

// Force local GPU (will fail if not available)
formData.append('provider', 'local');

// Force fal.ai
formData.append('provider', 'fal');
```

### Image Generation with Fallback

```python
# Backend automatically checks GPU before generating
result = await inference_service.generate_image(
    prompt="a red car",
    product_id=123,
    # No force_provider - uses auto logic
)

# If GPU is busy training:
# → Routes to fal.ai automatically
# User sees "provider": "fal" in response

# If GPU is free:
# → Uses local ComfyUI
# User sees "provider": "local" in response
```

## 📝 API Endpoints

### Training

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/training/gpu-status` | GET | Get GPU status and recommendations |
| `/api/training/start` | POST | Start training with optional provider |
| `/api/training/jobs/{id}` | GET | Get training job details |
| `/api/training/jobs/{id}/progress` | GET | Stream training progress (SSE) |
| `/api/training/jobs/{id}/stop` | POST | Stop training job |

### Generation

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generation/generate` | POST | Generate images (auto fallback) |
| `/api/generation/history` | GET | Get generation history |

### Deployment (fal.ai)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/training/deploy-to-fal` | POST | Deploy LoRA to fal.ai |
| `/api/training/generate-with-fal` | POST | Generate with fal.ai |
| `/api/training/deployed-models` | GET | List deployed models |

## 🐛 Troubleshooting

### GPU Not Detected

```bash
# Check if GPUtil is installed
pip install GPUtil

# Test GPU detection
python -c "import GPUtil; print(GPUtil.getGPUs())"
```

### RunPod Training Fails

**Common Issues:**
1. **API Key Not Set:** Check `RUNPOD_API_KEY` in environment
2. **Pod Creation Failed:** Check RunPod account balance
3. **Dataset Upload Failed:** Need S3 configuration (see above)
4. **Command Execution Failed:** Check RunPod logs in dashboard

**Solution:**
```bash
# Check RunPod status
curl -X POST https://api.runpod.io/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{"query": "{ myself { id credits { balance } } }"}'
```

### fal.ai Generation Fails

**Common Issues:**
1. **API Key Not Set:** Check `FAL_KEY` in environment
2. **Insufficient Credits:** Check fal.ai account balance

**Solution:**
```bash
# Test fal.ai connection
python -c "import fal_client; print(fal_client.submit('fal-ai/flux/dev', arguments={'prompt': 'test'}))"
```

### FluxGym Not Found

**Solution:**
```bash
# Clone FluxGym to a supported location
cd /path/to/user_management
git clone https://github.com/derrian-distro/LoRA_Easy_Training_Scripts.git FluxGym

# Or create symlink
ln -s /existing/fluxgym/path FluxGym
```

## 🔮 Future Enhancements

### Planned Features

1. **Cost Tracking Dashboard**
   - Real-time cost monitoring for RunPod/fal.ai
   - Budget limits and alerts
   - Cost per training job/generation

2. **Provider Performance Comparison**
   - Speed benchmarks (local vs cloud)
   - Quality comparison
   - Cost-benefit analysis

3. **Advanced RunPod Integration**
   - Direct SSH access to pods
   - Real-time log streaming
   - Custom Docker images

4. **fal.ai Deployment UI**
   - One-click model deployment
   - Deployed model management
   - Version control

5. **Multi-GPU Support**
   - Distribute training across multiple GPUs
   - GPU selection preference

6. **Queue Management**
   - Training job queue when GPU busy
   - Priority scheduling
   - Estimated wait times

## 📄 License & Credits

### FluxGym/Kohya
- **sd-scripts:** https://github.com/kohya-ss/sd-scripts
- **FluxGym:** https://github.com/derrian-distro/LoRA_Easy_Training_Scripts

### Cloud Providers
- **RunPod:** https://runpod.io
- **fal.ai:** https://fal.ai

## 🆘 Support

If you encounter issues:

1. Check GPU status: `/api/training/gpu-status`
2. Review backend logs for errors
3. Verify API keys are configured
4. Test each provider independently

## 📊 Integration Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Local GPU Detection | ✅ Complete | Real-time monitoring |
| FluxGym Training | ✅ Complete | Fully functional |
| Provider Selection UI | ✅ Complete | Auto + manual options |
| Training Progress Monitor | ✅ Complete | With provider indicator |
| Inference GPU Check | ✅ Complete | Auto fallback to cloud |
| RunPod Pod Creation | ✅ Complete | Needs API key |
| RunPod Dataset Upload | ⚠️ Partial | Needs S3 or SSH |
| RunPod Training Execution | ⚠️ Partial | Basic implementation |
| fal.ai Generation | ✅ Complete | Needs API key |
| fal.ai Training | ⚠️ Partial | API ready, no UI |
| fal.ai Deployment | ⚠️ Partial | Backend only |
| Cost Tracking | ⚠️ Partial | Database ready, no UI |

---

**Last Updated:** 2025-11-30

**Integration Status:** 🟢 Core Functionality Complete | 🟡 Cloud Providers Need Configuration
