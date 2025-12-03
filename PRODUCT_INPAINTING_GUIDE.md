# Product Inpainting with LoRA Integration Guide

## Overview

This guide explains the complete pipeline for training product LoRAs and using them for AI-powered inpainting to place products into any scene with realistic lighting, shadows, and perspective.

## Architecture

### Backend Components

1. **ComfyUI Workflow (`product_inpainting_lora.json`)**
   - FLUX fill inpainting model (`flux-fill-inpainting-fp8-yogotatara.safetensors`)
   - LoRA loader for product models
   - Separate mask support via `LoadImageMask` node
   - Differential diffusion for smooth blending
   - Customizable parameters (guidance, steps, CFG, LoRA strength)

2. **Workflow Manager (`workflow_manager.py`)**
   - `get_workflow_for_product_inpainting()` method
   - Dynamic LoRA loading and configuration
   - Automatic trigger word integration
   - Parameter validation and defaults

3. **Inference Service (`inference_service.py`)**
   - `inpaint_product()` method
   - Automatic LoRA installation to ComfyUI
   - Image upload and processing
   - Result tracking and database logging

4. **API Endpoint (`/api/inpainting/product-inpaint`)**
   - Multipart form data handling
   - Product validation and access control
   - Parameter validation (LoRA strength, steps, guidance, etc.)
   - Comprehensive error handling

### Frontend Components

1. **ProductInpainting Component**
   - Product selection from trained models
   - Base image upload
   - Interactive mask drawing canvas
   - Mask image upload option
   - Prompt configuration with trigger words
   - Advanced settings (LoRA strength, steps, guidance, seed)
   - Real-time result display
   - Performance metrics (execution time, cost)

2. **Routing**
   - Path: `/products/inpaint`
   - Sidebar navigation: "Product Inpaint"
   - Icon: Palette (🎨)

## Complete Pipeline: Training to Inpainting

### Step 1: Prepare Product Images

1. Collect 10-30 high-quality images of your product
2. Images should show the product from different angles
3. Varied backgrounds and lighting conditions help the model generalize
4. Recommended resolution: 512x512 to 1024x1024

### Step 2: Train Product LoRA

1. Navigate to **Products** → **Create New Product**
2. Fill in product details:
   - **Name**: e.g., "Modern White Sofa"
   - **Description**: Brief description of the product
   - **Trigger Word**: Unique identifier (e.g., "modernsofa", "wht_2")
3. Upload your product images
4. Configure training parameters:
   - **Base Model**: FLUX (recommended)
   - **Steps**: 1000-2000 (default: 1500)
   - **Learning Rate**: 0.0001-0.0005 (default: 0.0002)
   - **Batch Size**: 1-4 (default: 1)
5. Select training provider:
   - **Local**: Use your GPU (requires CUDA)
   - **RunPod**: Cloud GPU (requires API key)
   - **FAL.ai**: Managed cloud training
6. Click **Start Training**
7. Monitor progress in real-time:
   - Epoch progress
   - Loss curves
   - Learning rate
   - Logs
8. Wait for training to complete (10-30 minutes depending on provider)

### Step 3: Product Inpainting

Once your product LoRA is trained:

1. Navigate to **Product Inpaint** in the sidebar
2. **Select your trained product** from the dropdown
3. **Upload base image**: The scene where you want to place the product
4. **Draw or upload mask**:
   - Use the interactive canvas to draw where the product should appear
   - Adjust brush size as needed
   - OR upload a pre-made mask image (white = product area)
5. **Configure prompt**:
   ```
   An old-style living room with vintage decor, wooden flooring, and
   warm ambient lighting. A modern white two-seater sofa with a compact,
   minimal design and soft upholstered cushions sits naturally in the room.
   The sofa has a rectangular base, no skirt, and a clean silhouette.
   The lighting and shadows on the sofa match the environment.
   Photorealistic, high resolution.
   ```
   - The trigger word is automatically added to the prompt
6. **Set negative prompt** (what to avoid):
   ```
   skirted base, frilly fabric, curved legs, vintage style, floral patterns,
   mismatched lighting, distorted edges, unnatural placement, floating,
   blurry, low resolution
   ```
7. **Adjust advanced settings**:
   - **LoRA Strength**: 0.0-2.0 (default: 1.0)
     - Higher = more product features
     - Lower = more blending with scene
   - **Steps**: 10-50 (default: 30)
     - More steps = higher quality, slower
   - **Guidance**: 1.0-100.0 (default: 40.0)
     - Controls how closely it follows the prompt
   - **Seed**: -1 for random, or specific value for reproducibility
8. Click **Generate Inpainting**
9. Download results

## API Usage

### Endpoint

```http
POST /api/inpainting/product-inpaint
Content-Type: multipart/form-data
Authorization: Bearer <your_jwt_token>
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `base_image` | File | Yes | - | Scene image |
| `mask_image` | File | Yes | - | Mask image (white = product area) |
| `product_id` | Integer | Yes | - | ID of trained product |
| `prompt` | String | Yes | - | Scene description |
| `negative_prompt` | String | No | Default negative prompt | What to avoid |
| `lora_strength` | Float | No | 1.0 | LoRA strength (0.0-2.0) |
| `steps` | Integer | No | 30 | Sampling steps (10-50) |
| `cfg` | Float | No | 1.0 | CFG scale (0.1-20.0) |
| `guidance` | Float | No | 40.0 | FLUX guidance (1.0-100.0) |
| `seed` | Integer | No | -1 | Random seed |

### Response

```json
{
  "message": "Product 'Modern White Sofa' inpainted successfully into scene",
  "result_images": [
    "storage/inpainting/outputs/inpaint_a1b2c3d4.png"
  ],
  "base_image": "storage/inpainting/inputs/base_xyz.jpg",
  "mask_image": "storage/inpainting/masks/mask_xyz.png",
  "product": {
    "id": 1,
    "name": "Modern White Sofa",
    "trigger_word": "modernsofa",
    "lora_model": "storage/trained_models/modern_white_sofa.safetensors"
  },
  "prompt": "...",
  "negative_prompt": "...",
  "parameters": {
    "steps": 30,
    "cfg": 1.0,
    "guidance": 40.0,
    "lora_strength": 1.0,
    "seed": 42,
    "workflow": "product_inpainting_lora"
  },
  "cost": 0.0234,
  "execution_time": 12.45
}
```

## ComfyUI Workflow Details

The `product_inpainting_lora.json` workflow includes:

### Nodes

1. **LoadImage (Node 17)**: Loads the base scene image
2. **LoadImageMask (Node 54)**: Loads the mask image (alpha channel)
3. **DualCLIPLoader (Node 34)**: Loads CLIP text encoders
4. **CLIPTextEncode (Nodes 23, 7)**: Encode positive and negative prompts
5. **UNETLoader (Node 31)**: Loads FLUX inpainting model
6. **LoraLoaderModelOnly (Node 52)**: Loads product LoRA
7. **FluxGuidance (Node 26)**: Applies guidance to conditioning
8. **InpaintModelConditioning (Node 38)**: Prepares inpainting latents
9. **DifferentialDiffusion (Node 39)**: Smooth blending
10. **KSampler (Node 3)**: Runs diffusion sampling
11. **VAEDecode (Node 8)**: Decodes latents to image
12. **SaveImage (Node 9)**: Saves result

### Parameters (Placeholders)

- `PLACEHOLDER_PROMPT`: Replaced with user prompt + trigger word
- `PLACEHOLDER_NEGATIVE`: Replaced with negative prompt
- `PLACEHOLDER_IMAGE`: Base image filename
- `PLACEHOLDER_MASK`: Mask image filename
- `PLACEHOLDER_LORA`: Product LoRA filename
- `PLACEHOLDER_LORA_STRENGTH`: LoRA strength value
- `PLACEHOLDER_STEPS`: Sampling steps
- `PLACEHOLDER_CFG`: CFG scale
- `PLACEHOLDER_GUIDANCE`: FLUX guidance value
- `PLACEHOLDER_SEED`: Random seed

## Training Providers

### Local (FluxGym/sd-scripts)

- **Pros**: No cost, full control, privacy
- **Cons**: Requires GPU (8GB+ VRAM), slower on weak GPUs
- **Setup**: Auto-detected from `/training-engine/sd-scripts/`
- **Best for**: Development, frequent training, sensitive data

### RunPod

- **Pros**: Powerful GPUs, pay-per-use, scalable
- **Cons**: Requires API key, network latency
- **Setup**: Set `RUNPOD_API_KEY` environment variable
- **Best for**: Production, large batches, no local GPU

### FAL.ai

- **Pros**: Managed service, simple API, reliable
- **Cons**: Higher cost per training
- **Setup**: Set `FAL_KEY` environment variable
- **Best for**: Simplicity, consistency, managed infrastructure

## Tips for Best Results

### Training

1. **Image Quality**: Use high-resolution, well-lit images
2. **Diversity**: Vary angles, backgrounds, and lighting
3. **Quantity**: 15-30 images ideal, minimum 10
4. **Consistency**: Same product, different contexts
5. **Trigger Word**: Short, unique, lowercase (e.g., "prodxyz")

### Inpainting

1. **Mask Accuracy**: Draw precise masks around product area
2. **Prompt Detail**: Describe lighting, perspective, placement
3. **LoRA Strength**:
   - 0.6-0.8 for subtle integration
   - 1.0 for standard use
   - 1.2-1.5 for strong product features
4. **Guidance**: 30-50 for most scenes
5. **Steps**: 30-40 sufficient for high quality
6. **Seed**: Save successful seeds for reproducibility

## Troubleshooting

### Training Fails

- Check GPU availability: `/api/training/gpu-status`
- Verify image formats (JPEG, PNG)
- Ensure sufficient disk space
- Check provider API keys

### Inpainting Issues

**Product doesn't match scene:**
- Increase LoRA strength
- Add more detail to prompt about lighting/perspective

**Product looks artificial:**
- Decrease LoRA strength
- Improve mask precision
- Add more context to prompt

**Wrong style/color:**
- Check trigger word in prompt
- Verify correct product selected
- Review negative prompt

**Slow generation:**
- Reduce steps (30 minimum)
- Check ComfyUI server status
- Monitor GPU usage

## Files Modified/Added

### Backend

- `backend/workflows/product_inpainting_lora.json` - ComfyUI workflow
- `backend/services/workflow_manager.py` - Added `get_workflow_for_product_inpainting()`
- `backend/services/inference_service.py` - Added `inpaint_product()`
- `backend/routers/inpainting.py` - Added `/product-inpaint` endpoint

### Frontend

- `frontend/src/components/products/ProductInpainting.jsx` - Main component
- `frontend/src/App.jsx` - Added route and import
- `frontend/src/components/common/Sidebar.jsx` - Added navigation

## Database Schema

### Generations Table

Product inpainting results are stored in the `generations` table:

```sql
{
  "prompt": "Scene description...",
  "negative_prompt": "What to avoid...",
  "product_id": 1,
  "image_paths": ["storage/inpainting/outputs/result.png"],
  "parameters": {
    "workflow": "product_inpainting_lora",
    "lora_name": "product.safetensors",
    "lora_strength": 1.0,
    "trigger_word": "prodxyz",
    "steps": 30,
    "cfg": 1.0,
    "guidance": 40.0,
    "seed": 42,
    "base_image": "storage/inpainting/inputs/base.jpg",
    "mask_image": "storage/inpainting/masks/mask.png"
  },
  "execution_time": 12.45,
  "cost": 0.0234,
  "user_id": 1,
  "created_at": "2025-12-03T10:30:00Z"
}
```

## Future Enhancements

1. **Batch Inpainting**: Multiple products in one scene
2. **Auto-masking**: AI-powered mask generation
3. **Style Transfer**: Apply scene lighting to product
4. **3D Perspective**: Automatic perspective correction
5. **ControlNet**: Additional control with depth/pose
6. **Video Inpainting**: Animated product placement
7. **Cloud Storage**: S3/GCS integration for models
8. **Model Versioning**: Track LoRA versions and A/B testing

## License

This implementation uses:
- ComfyUI (GPL-3.0)
- FLUX models (subject to Black Forest Labs license)
- sd-scripts (Apache-2.0)

Ensure compliance with all licenses for commercial use.

## Support

For issues or questions:
1. Check logs: `backend/logs/` and browser console
2. Verify ComfyUI status: `http://localhost:8188`
3. Test workflow: `/api/inpainting/test-workflow`
4. Check GPU: `/api/training/gpu-status`
5. Review this guide and API documentation

Happy inpainting! 🎨✨
