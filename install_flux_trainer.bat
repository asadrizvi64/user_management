@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM ComfyUI-FluxTrainer Complete Installation Script
REM Place this file in your ComfyUI root directory and run it
REM ============================================================

title ComfyUI FluxTrainer Installer

echo.
echo ============================================================
echo    ComfyUI-FluxTrainer Complete Installation
echo    LoRA Training Integration for ComfyUI
echo ============================================================
echo.

REM Detect ComfyUI installation type
set "COMFY_ROOT=%~dp0"
set "COMFY_ROOT=%COMFY_ROOT:~0,-1%"

REM Check if we're in portable or standard installation
if exist "%COMFY_ROOT%\python_embeded" (
    echo [INFO] Detected: ComfyUI Portable Installation
    set "PYTHON=%COMFY_ROOT%\python_embeded\python.exe"
    set "PIP=%COMFY_ROOT%\python_embeded\python.exe -m pip"
    set "CUSTOM_NODES=%COMFY_ROOT%\ComfyUI\custom_nodes"
    set "MODELS_DIR=%COMFY_ROOT%\ComfyUI\models"
) else if exist "%COMFY_ROOT%\venv" (
    echo [INFO] Detected: ComfyUI with venv
    set "PYTHON=%COMFY_ROOT%\venv\Scripts\python.exe"
    set "PIP=%COMFY_ROOT%\venv\Scripts\pip.exe"
    set "CUSTOM_NODES=%COMFY_ROOT%\custom_nodes"
    set "MODELS_DIR=%COMFY_ROOT%\models"
) else if exist "%COMFY_ROOT%\custom_nodes" (
    echo [INFO] Detected: Standard ComfyUI Installation
    set "PYTHON=python"
    set "PIP=pip"
    set "CUSTOM_NODES=%COMFY_ROOT%\custom_nodes"
    set "MODELS_DIR=%COMFY_ROOT%\models"
) else (
    echo [ERROR] Cannot detect ComfyUI installation!
    echo Please place this script in your ComfyUI root directory.
    echo.
    echo Expected structure:
    echo   ComfyUI_windows_portable\  ^(portable^)
    echo   or
    echo   ComfyUI\  ^(standard^)
    echo.
    pause
    exit /b 1
)

echo [INFO] ComfyUI Root: %COMFY_ROOT%
echo [INFO] Custom Nodes: %CUSTOM_NODES%
echo [INFO] Models Dir: %MODELS_DIR%
echo [INFO] Python: %PYTHON%
echo.

REM Check for Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo [OK] Git found

REM Check Python
%PYTHON% --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found at expected location!
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('%PYTHON% --version 2^>^&1') do set PYVER=%%i
echo [OK] Python %PYVER% found
echo.

REM ============================================================
REM STEP 1: Install ComfyUI-FluxTrainer
REM ============================================================
echo ============================================================
echo STEP 1: Installing ComfyUI-FluxTrainer
echo ============================================================

cd /d "%CUSTOM_NODES%"

if exist "ComfyUI-FluxTrainer" (
    echo [INFO] ComfyUI-FluxTrainer already exists, updating...
    cd ComfyUI-FluxTrainer
    git pull
    cd ..
) else (
    echo [INFO] Cloning ComfyUI-FluxTrainer...
    git clone https://github.com/kijai/ComfyUI-FluxTrainer
)

if not exist "ComfyUI-FluxTrainer" (
    echo [ERROR] Failed to clone ComfyUI-FluxTrainer!
    pause
    exit /b 1
)
echo [OK] ComfyUI-FluxTrainer installed
echo.

REM ============================================================
REM STEP 2: Install ComfyUI-KJNodes (Required dependency)
REM ============================================================
echo ============================================================
echo STEP 2: Installing ComfyUI-KJNodes ^(Required^)
echo ============================================================

if exist "ComfyUI-KJNodes" (
    echo [INFO] ComfyUI-KJNodes already exists, updating...
    cd ComfyUI-KJNodes
    git pull
    cd ..
) else (
    echo [INFO] Cloning ComfyUI-KJNodes...
    git clone https://github.com/kijai/ComfyUI-KJNodes
)
echo [OK] ComfyUI-KJNodes installed
echo.

REM ============================================================
REM STEP 3: Install rgthree-comfy (Optional but recommended)
REM ============================================================
echo ============================================================
echo STEP 3: Installing rgthree-comfy ^(Recommended^)
echo ============================================================

if exist "rgthree-comfy" (
    echo [INFO] rgthree-comfy already exists, updating...
    cd rgthree-comfy
    git pull
    cd ..
) else (
    echo [INFO] Cloning rgthree-comfy...
    git clone https://github.com/rgthree/rgthree-comfy
)
echo [OK] rgthree-comfy installed
echo.

REM ============================================================
REM STEP 4: Install Python Dependencies
REM ============================================================
echo ============================================================
echo STEP 4: Installing Python Dependencies
echo ============================================================

echo [INFO] Installing FluxTrainer requirements...
%PIP% install -r "%CUSTOM_NODES%\ComfyUI-FluxTrainer\requirements.txt"

echo [INFO] Installing KJNodes requirements...
if exist "%CUSTOM_NODES%\ComfyUI-KJNodes\requirements.txt" (
    %PIP% install -r "%CUSTOM_NODES%\ComfyUI-KJNodes\requirements.txt"
)

echo [INFO] Installing additional training dependencies...
%PIP% install bitsandbytes accelerate safetensors

echo [OK] Dependencies installed
echo.

REM ============================================================
REM STEP 5: Create Directory Structure
REM ============================================================
echo ============================================================
echo STEP 5: Creating Directory Structure
echo ============================================================

REM Create datasets folder
if not exist "%COMFY_ROOT%\datasets" mkdir "%COMFY_ROOT%\datasets"
echo [OK] Created: datasets\

REM Create sample dataset folder
if not exist "%COMFY_ROOT%\datasets\sample_lora" mkdir "%COMFY_ROOT%\datasets\sample_lora"
echo [OK] Created: datasets\sample_lora\

REM Create training outputs folder
if not exist "%MODELS_DIR%\loras\trained" mkdir "%MODELS_DIR%\loras\trained"
echo [OK] Created: models\loras\trained\

REM Create Flux subfolder in loras
if not exist "%MODELS_DIR%\loras\Flux" mkdir "%MODELS_DIR%\loras\Flux"
echo [OK] Created: models\loras\Flux\

echo.

REM ============================================================
REM STEP 6: Create Training Workflow
REM ============================================================
echo ============================================================
echo STEP 6: Creating Training Workflow
echo ============================================================

REM Create the training workflow JSON
(
echo {
echo   "last_node_id": 20,
echo   "last_link_id": 25,
echo   "nodes": [
echo     {
echo       "id": 1,
echo       "type": "FluxTrainModelSelect",
echo       "pos": [50, 100],
echo       "size": [400, 170],
echo       "flags": {},
echo       "order": 0,
echo       "mode": 0,
echo       "outputs": [{"name": "flux_models", "type": "FLUX_TRAIN_MODELS", "links": [1]}],
echo       "properties": {"Node name for S&R": "FluxTrainModelSelect"},
echo       "widgets_values": ["flux1-dev.safetensors", "ae.safetensors", "clip_l.safetensors", "t5xxl_fp8_e4m3fn_scaled.safetensors"],
echo       "title": "1. Select FLUX Models"
echo     },
echo     {
echo       "id": 2,
echo       "type": "TrainDatasetGeneralConfig",
echo       "pos": [50, 320],
echo       "size": [400, 250],
echo       "flags": {},
echo       "order": 1,
echo       "mode": 0,
echo       "outputs": [{"name": "dataset_config", "type": "DATASET_CONFIG", "links": [2]}],
echo       "properties": {"Node name for S&R": "TrainDatasetGeneralConfig"},
echo       "widgets_values": [1024, 1024, true, ".txt", "triggerword", true, false],
echo       "title": "2. Dataset Config - SET TRIGGER WORD"
echo     },
echo     {
echo       "id": 3,
echo       "type": "TrainDatasetAdd",
echo       "pos": [50, 620],
echo       "size": [400, 180],
echo       "flags": {},
echo       "order": 2,
echo       "mode": 0,
echo       "inputs": [{"name": "dataset_config", "type": "DATASET_CONFIG", "link": 2}],
echo       "outputs": [{"name": "dataset", "type": "TRAIN_DATASET", "links": [3]}],
echo       "properties": {"Node name for S&R": "TrainDatasetAdd"},
echo       "widgets_values": ["PUT_YOUR_DATASET_PATH_HERE", "triggerword", 1, false, false],
echo       "title": "3. Dataset Path - CHANGE THIS"
echo     },
echo     {
echo       "id": 4,
echo       "type": "OptimizerConfig",
echo       "pos": [500, 100],
echo       "size": [350, 200],
echo       "flags": {},
echo       "order": 3,
echo       "mode": 0,
echo       "outputs": [{"name": "optimizer", "type": "OPTIMIZER_CONFIG", "links": [4]}],
echo       "properties": {"Node name for S&R": "OptimizerConfig"},
echo       "widgets_values": ["AdamW8bit", 1.0, true, 0.9, 0.999, 1e-08],
echo       "title": "4. Optimizer - AdamW8bit for 12GB VRAM"
echo     },
echo     {
echo       "id": 5,
echo       "type": "InitFluxLoRATraining",
echo       "pos": [500, 350],
echo       "size": [350, 450],
echo       "flags": {},
echo       "order": 4,
echo       "mode": 0,
echo       "inputs": [
echo         {"name": "flux_models", "type": "FLUX_TRAIN_MODELS", "link": 1},
echo         {"name": "dataset", "type": "TRAIN_DATASET", "link": 3},
echo         {"name": "optimizer", "type": "OPTIMIZER_CONFIG", "link": 4}
echo       ],
echo       "outputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "links": [5]}],
echo       "properties": {"Node name for S&R": "InitFluxLoRATraining"},
echo       "widgets_values": ["models/loras/trained", "my_custom_lora", "My trained LoRA", 64, 64, 0.0001, 0.0001, 1000, 1, true, false, false, 2],
echo       "title": "5. Training Settings"
echo     },
echo     {
echo       "id": 6,
echo       "type": "FluxTrainValidationSettings",
echo       "pos": [900, 100],
echo       "size": [350, 280],
echo       "flags": {},
echo       "order": 5,
echo       "mode": 0,
echo       "outputs": [{"name": "validation_settings", "type": "VALIDATION_SETTINGS", "links": [6]}],
echo       "properties": {"Node name for S&R": "FluxTrainValidationSettings"},
echo       "widgets_values": ["triggerword, your test prompt here", 1024, 1024, 20, 1.0, "euler", "simple", 3.5, 12345],
echo       "title": "6. Validation - Test Prompts"
echo     },
echo     {
echo       "id": 7,
echo       "type": "FluxTrainLoop",
echo       "pos": [900, 430],
echo       "size": [350, 150],
echo       "flags": {},
echo       "order": 6,
echo       "mode": 0,
echo       "inputs": [
echo         {"name": "training_state", "type": "FLUX_TRAIN_STATE", "link": 5},
echo         {"name": "validation_settings", "type": "VALIDATION_SETTINGS", "link": 6}
echo       ],
echo       "outputs": [
echo         {"name": "training_state", "type": "FLUX_TRAIN_STATE", "links": [7, 8]},
echo         {"name": "validation_images", "type": "IMAGE", "links": [9]}
echo       ],
echo       "properties": {"Node name for S&R": "FluxTrainLoop"},
echo       "widgets_values": [100],
echo       "title": "7. Training Loop"
echo     },
echo     {
echo       "id": 8,
echo       "type": "FluxTrainSave",
echo       "pos": [1300, 100],
echo       "size": [300, 150],
echo       "flags": {},
echo       "order": 7,
echo       "mode": 0,
echo       "inputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "link": 7}],
echo       "outputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "links": [10]}],
echo       "properties": {"Node name for S&R": "FluxTrainSave"},
echo       "widgets_values": [200, true],
echo       "title": "8. Save Checkpoints"
echo     },
echo     {
echo       "id": 9,
echo       "type": "FluxTrainEnd",
echo       "pos": [1300, 300],
echo       "size": [300, 80],
echo       "flags": {},
echo       "order": 8,
echo       "mode": 0,
echo       "inputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "link": 10}],
echo       "properties": {"Node name for S&R": "FluxTrainEnd"},
echo       "title": "9. End Training"
echo     },
echo     {
echo       "id": 10,
echo       "type": "PreviewImage",
echo       "pos": [1300, 430],
echo       "size": [300, 300],
echo       "flags": {},
echo       "order": 9,
echo       "mode": 0,
echo       "inputs": [{"name": "images", "type": "IMAGE", "link": 9}],
echo       "properties": {"Node name for S&R": "PreviewImage"},
echo       "title": "Preview Samples"
echo     },
echo     {
echo       "id": 11,
echo       "type": "VisualizeLoss",
echo       "pos": [900, 630],
echo       "size": [350, 200],
echo       "flags": {},
echo       "order": 10,
echo       "mode": 0,
echo       "inputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "link": 8}],
echo       "outputs": [{"name": "loss_graph", "type": "IMAGE", "links": [11]}],
echo       "properties": {"Node name for S&R": "VisualizeLoss"},
echo       "title": "Loss Graph"
echo     },
echo     {
echo       "id": 12,
echo       "type": "PreviewImage",
echo       "pos": [1300, 780],
echo       "size": [300, 200],
echo       "flags": {},
echo       "order": 11,
echo       "mode": 0,
echo       "inputs": [{"name": "images", "type": "IMAGE", "link": 11}],
echo       "properties": {"Node name for S&R": "PreviewImage"},
echo       "title": "Loss Preview"
echo     }
echo   ],
echo   "links": [
echo     [1, 1, 0, 5, 0, "FLUX_TRAIN_MODELS"],
echo     [2, 2, 0, 3, 0, "DATASET_CONFIG"],
echo     [3, 3, 0, 5, 1, "TRAIN_DATASET"],
echo     [4, 4, 0, 5, 2, "OPTIMIZER_CONFIG"],
echo     [5, 5, 0, 7, 0, "FLUX_TRAIN_STATE"],
echo     [6, 6, 0, 7, 1, "VALIDATION_SETTINGS"],
echo     [7, 7, 0, 8, 0, "FLUX_TRAIN_STATE"],
echo     [8, 7, 0, 11, 0, "FLUX_TRAIN_STATE"],
echo     [9, 7, 1, 10, 0, "IMAGE"],
echo     [10, 8, 0, 9, 0, "FLUX_TRAIN_STATE"],
echo     [11, 11, 0, 12, 0, "IMAGE"]
echo   ],
echo   "groups": [
echo     {"title": "Model Selection", "bounding": [40, 70, 420, 220], "color": "#3f789e"},
echo     {"title": "Dataset Setup", "bounding": [40, 290, 420, 530], "color": "#8aa63f"},
echo     {"title": "Training Config", "bounding": [490, 70, 370, 740], "color": "#a6633f"},
echo     {"title": "Training Execution", "bounding": [890, 70, 370, 780], "color": "#3f8a72"},
echo     {"title": "Output", "bounding": [1290, 70, 320, 930], "color": "#8a3f72"}
echo   ],
echo   "config": {},
echo   "extra": {"ds": {"scale": 0.7, "offset": [50, 50]}},
echo   "version": 0.4
echo }
) > "%COMFY_ROOT%\flux_lora_training_workflow.json"

echo [OK] Training workflow created: flux_lora_training_workflow.json
echo.

REM ============================================================
REM STEP 7: Create README
REM ============================================================
echo ============================================================
echo STEP 7: Creating Documentation
echo ============================================================

(
echo # ComfyUI FluxTrainer - Quick Start Guide
echo.
echo ## Installation Complete!
echo.
echo ### Required Models
echo.
echo Place these models in your ComfyUI models folder:
echo.
echo ^| Model ^| Location ^| Download ^|
echo ^|----^|----^|----^|
echo ^| flux1-dev.safetensors ^| models/diffusion_models/ or models/unet/ ^| HuggingFace ^|
echo ^| ae.safetensors ^| models/vae/ ^| HuggingFace ^|
echo ^| clip_l.safetensors ^| models/clip/ ^| HuggingFace ^|
echo ^| t5xxl_fp8_e4m3fn_scaled.safetensors ^| models/clip/ ^| HuggingFace ^|
echo.
echo ### How to Train a LoRA
echo.
echo 1. **Prepare Training Images**
echo    - Put 15-40 high-quality images in: `datasets/your_lora_name/`
echo    - Optional: Add .txt caption files with same names as images
echo.
echo 2. **Load the Training Workflow**
echo    - Open ComfyUI
echo    - Load: `flux_lora_training_workflow.json`
echo.
echo 3. **Configure Training**
echo    - Node 2: Set your trigger word ^(e.g., "mysofastyle"^)
echo    - Node 3: Set path to your dataset folder
echo    - Node 5: Set output name for your LoRA
echo    - Node 6: Set test prompt with your trigger word
echo.
echo 4. **Start Training**
echo    - Click "Queue Prompt"
echo    - Training takes 2-4 hours depending on settings
echo.
echo 5. **Use Your Trained LoRA**
echo    - Find it in: `models/loras/trained/`
echo    - Load with LoraLoaderModelOnly node
echo.
echo ### Recommended Settings for 12GB VRAM
echo.
echo - network_dim: 64 ^(faces^) or 32-48 ^(styles/objects^)
echo - network_alpha: same as network_dim
echo - Optimizer: AdamW8bit
echo - Learning rate: 0.0001
echo - Steps: 800-1200
echo - Batch size: 1
echo.
echo ### Folder Structure
echo.
echo ```
echo ComfyUI/
echo ├── datasets/
echo │   └── your_lora/
echo │       ├── image1.jpg
echo │       ├── image1.txt ^(optional caption^)
echo │       └── ...
echo ├── models/
echo │   └── loras/
echo │       ├── trained/  ^(output location^)
echo │       └── Flux/     ^(organize flux loras^)
echo └── custom_nodes/
echo     ├── ComfyUI-FluxTrainer/
echo     ├── ComfyUI-KJNodes/
echo     └── rgthree-comfy/
echo ```
echo.
echo ### Troubleshooting
echo.
echo - **CUDA out of memory**: Enable split_mode, reduce batch size
echo - **Missing nodes**: Restart ComfyUI after installation
echo - **Models not found**: Check model paths in FluxTrainModelSelect
echo.
) > "%COMFY_ROOT%\FLUX_TRAINING_README.md"

echo [OK] README created: FLUX_TRAINING_README.md
echo.

REM ============================================================
REM STEP 8: Create Quick Launch Scripts
REM ============================================================
echo ============================================================
echo STEP 8: Creating Launch Scripts
echo ============================================================

REM Create training launcher
(
echo @echo off
echo title ComfyUI with FluxTrainer
echo cd /d "%%~dp0"
echo.
echo echo Starting ComfyUI with FluxTrainer support...
echo echo.
echo echo Training workflow: flux_lora_training_workflow.json
echo echo Dataset folder: datasets\
echo echo Output folder: models\loras\trained\
echo echo.
echo.
if exist "%COMFY_ROOT%\python_embeded" (
echo .\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build
) else (
echo python main.py
)
echo pause
) > "%COMFY_ROOT%\run_comfyui_trainer.bat"

echo [OK] Created: run_comfyui_trainer.bat
echo.

REM ============================================================
REM FINAL SUMMARY
REM ============================================================
echo.
echo ============================================================
echo    INSTALLATION COMPLETE!
echo ============================================================
echo.
echo Installed Components:
echo   [+] ComfyUI-FluxTrainer - LoRA training nodes
echo   [+] ComfyUI-KJNodes - Required utilities  
echo   [+] rgthree-comfy - Debugging tools
echo.
echo Created Files:
echo   [+] flux_lora_training_workflow.json - Training workflow
echo   [+] FLUX_TRAINING_README.md - Documentation
echo   [+] run_comfyui_trainer.bat - Launcher
echo.
echo Created Folders:
echo   [+] datasets\ - Put training images here
echo   [+] datasets\sample_lora\ - Example folder
echo   [+] models\loras\trained\ - Output location
echo   [+] models\loras\Flux\ - Organize Flux LoRAs
echo.
echo ============================================================
echo    NEXT STEPS
echo ============================================================
echo.
echo 1. Ensure you have these models downloaded:
echo    - flux1-dev.safetensors ^(diffusion_models or unet folder^)
echo    - ae.safetensors ^(vae folder^)
echo    - clip_l.safetensors ^(clip folder^)
echo    - t5xxl_fp8_e4m3fn_scaled.safetensors ^(clip folder^)
echo.
echo 2. Put training images in: datasets\your_lora_name\
echo.
echo 3. Start ComfyUI: run_comfyui_trainer.bat
echo.
echo 4. Load workflow: flux_lora_training_workflow.json
echo.
echo 5. Configure and train!
echo.
echo ============================================================
echo.
pause
