#!/bin/bash

echo "Setting up Product Training Platform..."

# Create necessary directories
mkdir -p storage/{uploads,generated,products,datasets,temp}
mkdir -p training-engine/{models,outputs,datasets}
mkdir -p training-engine/models/{clip,unet,vae}
mkdir -p database/migrations

# Copy environment file
if [ ! -f .env ]; then
    cp config/development.env .env
    echo "Created .env file from template. Please update with your settings."
fi

# Make scripts executable
chmod +x scripts/*.sh

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Clone sd-scripts if not exists
if [ ! -d "training-engine/sd-scripts" ]; then
    echo "Cloning sd-scripts..."
    cd training-engine
    git clone -b sd3 https://github.com/kohya-ss/sd-scripts
    cd sd-scripts
    pip install -r requirements.txt
    cd ../..
fi

# Copy models.yaml if not exists
if [ ! -f "training-engine/models.yaml" ]; then
    echo "Creating models.yaml..."
    cat > training-engine/models.yaml << 'EOF'
flux-dev:
    repo: cocktailpeanut/xulf-dev
    base: black-forest-labs/FLUX.1-dev
    license: other
    license_name: flux-1-dev-non-commercial-license
    license_link: https://huggingface.co/black-forest-labs/FLUX.1-dev/blob/main/LICENSE.md
    file: flux1-dev.sft
flux-schnell:
    repo: black-forest-labs/FLUX.1-schnell
    base: black-forest-labs/FLUX.1-schnell
    license: apache-2.0
    file: flux1-schnell.safetensors
EOF
fi

echo "Setup complete!"
echo "To start the application:"
echo "1. Update .env file with your configuration"
echo "2. Run: docker-compose up -d"
echo "3. Access the application at http://localhost"

