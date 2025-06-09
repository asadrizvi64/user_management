#!/bin/bash

echo "Downloading base models for training..."

# Create models directory structure
mkdir -p training-engine/models/{clip,unet,vae}

# Download CLIP models
echo "Downloading CLIP models..."
wget -O training-engine/models/clip/clip_l.safetensors \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors"

wget -O training-engine/models/clip/t5xxl_fp16.safetensors \
    "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors"

# Download VAE
echo "Downloading VAE..."
wget -O training-engine/models/vae/ae.sft \
    "https://huggingface.co/cocktailpeanut/xulf-dev/resolve/main/ae.sft"

# Download FLUX models
echo "Downloading FLUX models..."
wget -O training-engine/models/unet/flux1-dev.sft \
    "https://huggingface.co/cocktailpeanut/xulf-dev/resolve/main/flux1-dev.sft"

wget -O training-engine/models/unet/flux1-schnell.safetensors \
    "https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors"

echo "Model download complete!"

---
