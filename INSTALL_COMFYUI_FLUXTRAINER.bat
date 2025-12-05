@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM COMPLETE ComfyUI + FluxTrainer Installation FROM SCRATCH
REM Just put this .bat anywhere and run it
REM ============================================================

title ComfyUI + FluxTrainer Complete Installer

echo.
echo ============================================================
echo    COMPLETE ComfyUI + FluxTrainer Installation
echo    Everything from scratch - No prerequisites needed
echo ============================================================
echo.

set "INSTALL_DIR=%~dp0ComfyUI_FluxTrainer"

echo This will install:
echo   - ComfyUI Portable (latest)
echo   - ComfyUI-FluxTrainer (LoRA training)
echo   - ComfyUI-KJNodes (utilities)
echo   - rgthree-comfy (debugging)
echo   - All required Python packages
echo.
echo Install location: %INSTALL_DIR%
echo.
echo Press any key to continue or CTRL+C to cancel...
pause >nul

REM ============================================================
REM STEP 1: Check for Git
REM ============================================================
echo.
echo ============================================================
echo STEP 1: Checking Git Installation
echo ============================================================

git --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Git not found! Attempting to download portable Git...
    echo.
    
    REM Create temp folder
    if not exist "%~dp0temp" mkdir "%~dp0temp"
    
    echo Downloading PortableGit...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/PortableGit-2.43.0-64-bit.7z.exe' -OutFile '%~dp0temp\PortableGit.exe'}"
    
    if exist "%~dp0temp\PortableGit.exe" (
        echo Extracting PortableGit...
        "%~dp0temp\PortableGit.exe" -o"%~dp0PortableGit" -y
        set "PATH=%~dp0PortableGit\bin;%PATH%"
        echo [OK] PortableGit installed
    ) else (
        echo [ERROR] Could not download Git!
        echo Please install Git manually from: https://git-scm.com/download/win
        pause
        exit /b 1
    )
) else (
    echo [OK] Git found
)

REM ============================================================
REM STEP 2: Download ComfyUI Portable
REM ============================================================
echo.
echo ============================================================
echo STEP 2: Downloading ComfyUI Portable
echo ============================================================

if exist "%INSTALL_DIR%" (
    echo [INFO] Installation folder already exists
    echo Do you want to update existing installation? ^(Y/N^)
    set /p UPDATE_CHOICE="> "
    if /i "!UPDATE_CHOICE!" neq "Y" (
        echo Skipping ComfyUI download...
        goto :skip_comfy_download
    )
)

echo.
echo Downloading ComfyUI Portable ^(this may take a while...^)
echo File size: ~1.5GB
echo.

REM Create install directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Download using PowerShell with progress
powershell -Command "& {$ProgressPreference = 'Continue'; Write-Host 'Downloading ComfyUI...'; Invoke-WebRequest -Uri 'https://github.com/comfyanonymous/ComfyUI/releases/latest/download/ComfyUI_windows_portable_nvidia.7z' -OutFile '%INSTALL_DIR%\ComfyUI_portable.7z'}"

if not exist "%INSTALL_DIR%\ComfyUI_portable.7z" (
    echo [ERROR] Download failed!
    echo Please download manually from:
    echo https://github.com/comfyanonymous/ComfyUI/releases
    pause
    exit /b 1
)

echo [OK] Download complete
echo.

REM ============================================================
REM STEP 3: Extract ComfyUI
REM ============================================================
echo ============================================================
echo STEP 3: Extracting ComfyUI
echo ============================================================

REM Check for 7zip
where 7z >nul 2>&1
if errorlevel 1 (
    REM Try common locations
    if exist "C:\Program Files\7-Zip\7z.exe" (
        set "SEVENZIP=C:\Program Files\7-Zip\7z.exe"
    ) else if exist "C:\Program Files (x86)\7-Zip\7z.exe" (
        set "SEVENZIP=C:\Program Files (x86)\7-Zip\7z.exe"
    ) else (
        echo [INFO] 7-Zip not found, downloading...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://www.7-zip.org/a/7zr.exe' -OutFile '%INSTALL_DIR%\7zr.exe'}"
        set "SEVENZIP=%INSTALL_DIR%\7zr.exe"
    )
) else (
    set "SEVENZIP=7z"
)

echo Extracting... ^(this takes a few minutes^)
"%SEVENZIP%" x "%INSTALL_DIR%\ComfyUI_portable.7z" -o"%INSTALL_DIR%" -y

REM Move contents up if nested
if exist "%INSTALL_DIR%\ComfyUI_windows_portable" (
    echo Reorganizing folder structure...
    xcopy /E /Y /Q "%INSTALL_DIR%\ComfyUI_windows_portable\*" "%INSTALL_DIR%\"
    rmdir /S /Q "%INSTALL_DIR%\ComfyUI_windows_portable" 2>nul
)

REM Cleanup
del "%INSTALL_DIR%\ComfyUI_portable.7z" 2>nul

echo [OK] Extraction complete

:skip_comfy_download

REM Set paths
set "COMFY_ROOT=%INSTALL_DIR%"
set "PYTHON=%COMFY_ROOT%\python_embeded\python.exe"
set "PIP=%PYTHON% -m pip"
set "CUSTOM_NODES=%COMFY_ROOT%\ComfyUI\custom_nodes"
set "MODELS_DIR=%COMFY_ROOT%\ComfyUI\models"

REM Verify extraction
if not exist "%PYTHON%" (
    echo [ERROR] ComfyUI extraction failed - python not found!
    echo Expected: %PYTHON%
    pause
    exit /b 1
)

echo.
echo [OK] ComfyUI installed at: %COMFY_ROOT%

REM ============================================================
REM STEP 4: Install FluxTrainer Custom Nodes
REM ============================================================
echo.
echo ============================================================
echo STEP 4: Installing FluxTrainer Custom Nodes
echo ============================================================

cd /d "%CUSTOM_NODES%"

REM Install ComfyUI-FluxTrainer
echo.
echo [1/3] Installing ComfyUI-FluxTrainer...
if exist "ComfyUI-FluxTrainer" (
    cd ComfyUI-FluxTrainer
    git pull
    cd ..
) else (
    git clone https://github.com/kijai/ComfyUI-FluxTrainer
)

REM Install ComfyUI-KJNodes
echo.
echo [2/3] Installing ComfyUI-KJNodes...
if exist "ComfyUI-KJNodes" (
    cd ComfyUI-KJNodes
    git pull
    cd ..
) else (
    git clone https://github.com/kijai/ComfyUI-KJNodes
)

REM Install rgthree-comfy
echo.
echo [3/3] Installing rgthree-comfy...
if exist "rgthree-comfy" (
    cd rgthree-comfy
    git pull
    cd ..
) else (
    git clone https://github.com/rgthree/rgthree-comfy
)

echo.
echo [OK] All custom nodes installed

REM ============================================================
REM STEP 5: Install Python Dependencies
REM ============================================================
echo.
echo ============================================================
echo STEP 5: Installing Python Dependencies
echo ============================================================

cd /d "%COMFY_ROOT%"

echo Installing FluxTrainer requirements...
%PIP% install -r "%CUSTOM_NODES%\ComfyUI-FluxTrainer\requirements.txt" --quiet

echo Installing KJNodes requirements...
if exist "%CUSTOM_NODES%\ComfyUI-KJNodes\requirements.txt" (
    %PIP% install -r "%CUSTOM_NODES%\ComfyUI-KJNodes\requirements.txt" --quiet
)

echo Installing additional training packages...
%PIP% install bitsandbytes accelerate safetensors prodigyopt --quiet

echo.
echo [OK] Dependencies installed

REM ============================================================
REM STEP 6: Create Folder Structure
REM ============================================================
echo.
echo ============================================================
echo STEP 6: Creating Folder Structure
echo ============================================================

REM Datasets folder
if not exist "%COMFY_ROOT%\datasets" mkdir "%COMFY_ROOT%\datasets"
if not exist "%COMFY_ROOT%\datasets\my_first_lora" mkdir "%COMFY_ROOT%\datasets\my_first_lora"
echo [OK] datasets\

REM LoRA output folders
if not exist "%MODELS_DIR%\loras\trained" mkdir "%MODELS_DIR%\loras\trained"
if not exist "%MODELS_DIR%\loras\Flux" mkdir "%MODELS_DIR%\loras\Flux"
echo [OK] models\loras\trained\

REM Diffusion models folder (for flux1-dev)
if not exist "%MODELS_DIR%\diffusion_models" mkdir "%MODELS_DIR%\diffusion_models"
echo [OK] models\diffusion_models\

REM CLIP folder
if not exist "%MODELS_DIR%\clip" mkdir "%MODELS_DIR%\clip"
echo [OK] models\clip\

echo.

REM ============================================================
REM STEP 7: Create Training Workflow
REM ============================================================
echo ============================================================
echo STEP 7: Creating Training Workflow
echo ============================================================

(
echo {
echo   "last_node_id": 15,
echo   "last_link_id": 15,
echo   "nodes": [
echo     {
echo       "id": 1,
echo       "type": "FluxTrainModelSelect",
echo       "pos": [50, 50],
echo       "size": [400, 178],
echo       "flags": {},
echo       "order": 0,
echo       "mode": 0,
echo       "outputs": [{"name": "flux_models", "type": "FLUX_TRAIN_MODELS", "links": [1]}],
echo       "title": "1. SELECT MODELS",
echo       "properties": {},
echo       "widgets_values": ["flux1-dev.safetensors", "ae.safetensors", "clip_l.safetensors", "t5xxl_fp8_e4m3fn_scaled.safetensors"]
echo     },
echo     {
echo       "id": 2,
echo       "type": "TrainDatasetGeneralConfig", 
echo       "pos": [50, 280],
echo       "size": [400, 250],
echo       "flags": {},
echo       "order": 1,
echo       "mode": 0,
echo       "outputs": [{"name": "dataset_config", "type": "DATASET_CONFIG", "links": [2]}],
echo       "title": "2. TRIGGER WORD - CHANGE THIS",
echo       "properties": {},
echo       "widgets_values": [1024, 1024, true, ".txt", "YOURTRIGGER", true, false]
echo     },
echo     {
echo       "id": 3,
echo       "type": "TrainDatasetAdd",
echo       "pos": [50, 580],
echo       "size": [400, 178],
echo       "flags": {},
echo       "order": 2,
echo       "mode": 0,
echo       "inputs": [{"name": "dataset_config", "type": "DATASET_CONFIG", "link": 2}],
echo       "outputs": [{"name": "dataset", "type": "TRAIN_DATASET", "links": [3]}],
echo       "title": "3. DATASET PATH - CHANGE THIS",
echo       "properties": {},
echo       "widgets_values": ["C:/PUT/YOUR/DATASET/PATH/HERE", "YOURTRIGGER", 1, false, false]
echo     },
echo     {
echo       "id": 4,
echo       "type": "OptimizerConfig",
echo       "pos": [500, 50],
echo       "size": [350, 178],
echo       "flags": {},
echo       "order": 3,
echo       "mode": 0,
echo       "outputs": [{"name": "optimizer", "type": "OPTIMIZER_CONFIG", "links": [4]}],
echo       "title": "4. Optimizer (AdamW8bit = Low VRAM)",
echo       "properties": {},
echo       "widgets_values": ["AdamW8bit", 1.0, true, 0.9, 0.999, 1e-08]
echo     },
echo     {
echo       "id": 5,
echo       "type": "InitFluxLoRATraining",
echo       "pos": [500, 280],
echo       "size": [350, 478],
echo       "flags": {},
echo       "order": 4,
echo       "mode": 0,
echo       "inputs": [
echo         {"name": "flux_models", "type": "FLUX_TRAIN_MODELS", "link": 1},
echo         {"name": "dataset", "type": "TRAIN_DATASET", "link": 3},
echo         {"name": "optimizer", "type": "OPTIMIZER_CONFIG", "link": 4}
echo       ],
echo       "outputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "links": [5]}],
echo       "title": "5. TRAINING SETTINGS",
echo       "properties": {},
echo       "widgets_values": ["models/loras/trained", "my_lora", "My custom LoRA", 64, 64, 0.0001, 0.0001, 1000, 1, true, false, false, 2]
echo     },
echo     {
echo       "id": 6,
echo       "type": "FluxTrainValidationSettings",
echo       "pos": [900, 50],
echo       "size": [350, 298],
echo       "flags": {},
echo       "order": 5,
echo       "mode": 0,
echo       "outputs": [{"name": "validation_settings", "type": "VALIDATION_SETTINGS", "links": [6]}],
echo       "title": "6. TEST PROMPT",
echo       "properties": {},
echo       "widgets_values": ["YOURTRIGGER, a photo of your subject", 1024, 1024, 20, 1.0, "euler", "simple", 3.5, 42]
echo     },
echo     {
echo       "id": 7,
echo       "type": "FluxTrainLoop",
echo       "pos": [900, 400],
echo       "size": [350, 130],
echo       "flags": {},
echo       "order": 6,
echo       "mode": 0,
echo       "inputs": [
echo         {"name": "training_state", "type": "FLUX_TRAIN_STATE", "link": 5},
echo         {"name": "validation_settings", "type": "VALIDATION_SETTINGS", "link": 6}
echo       ],
echo       "outputs": [
echo         {"name": "training_state", "type": "FLUX_TRAIN_STATE", "links": [7]},
echo         {"name": "validation_images", "type": "IMAGE", "links": [8]}
echo       ],
echo       "title": "7. TRAINING LOOP",
echo       "properties": {},
echo       "widgets_values": [100]
echo     },
echo     {
echo       "id": 8,
echo       "type": "FluxTrainSave",
echo       "pos": [900, 580],
echo       "size": [350, 130],
echo       "flags": {},
echo       "order": 7,
echo       "mode": 0,
echo       "inputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "link": 7}],
echo       "outputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "links": [9]}],
echo       "title": "8. SAVE CHECKPOINTS",
echo       "properties": {},
echo       "widgets_values": [200, true]
echo     },
echo     {
echo       "id": 9,
echo       "type": "FluxTrainEnd",
echo       "pos": [900, 760],
echo       "size": [350, 60],
echo       "flags": {},
echo       "order": 8,
echo       "mode": 0,
echo       "inputs": [{"name": "training_state", "type": "FLUX_TRAIN_STATE", "link": 9}],
echo       "title": "9. END",
echo       "properties": {}
echo     },
echo     {
echo       "id": 10,
echo       "type": "PreviewImage",
echo       "pos": [1300, 50],
echo       "size": [400, 400],
echo       "flags": {},
echo       "order": 9,
echo       "mode": 0,
echo       "inputs": [{"name": "images", "type": "IMAGE", "link": 8}],
echo       "title": "PREVIEW SAMPLES"
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
echo     [8, 7, 1, 10, 0, "IMAGE"],
echo     [9, 8, 0, 9, 0, "FLUX_TRAIN_STATE"]
echo   ],
echo   "groups": [],
echo   "config": {},
echo   "extra": {"ds": {"scale": 0.6, "offset": [50, 50]}},
echo   "version": 0.4
echo }
) > "%COMFY_ROOT%\flux_lora_training.json"

echo [OK] Created: flux_lora_training.json

REM ============================================================
REM STEP 8: Create Launcher Scripts
REM ============================================================
echo.
echo ============================================================
echo STEP 8: Creating Launcher Scripts
echo ============================================================

REM Main launcher
(
echo @echo off
echo title ComfyUI + FluxTrainer
echo cd /d "%%~dp0"
echo.
echo echo ========================================
echo echo    ComfyUI + FluxTrainer
echo echo ========================================
echo echo.
echo echo Training workflow: flux_lora_training.json
echo echo Put training images in: datasets\your_lora\
echo echo Trained LoRAs save to: ComfyUI\models\loras\trained\
echo echo.
echo echo Starting ComfyUI...
echo echo.
echo.
echo .\python_embeded\python.exe -s ComfyUI\main.py --windows-standalone-build
echo.
echo pause
) > "%COMFY_ROOT%\START_COMFYUI.bat"

echo [OK] Created: START_COMFYUI.bat

REM Model downloader helper
(
echo @echo off
echo title Model Downloader
echo cd /d "%%~dp0"
echo.
echo echo ========================================
echo echo    FLUX Model Downloader
echo echo ========================================
echo echo.
echo echo You need these models for training:
echo echo.
echo echo 1. flux1-dev.safetensors ^(~12GB^)
echo echo    Download from: https://huggingface.co/black-forest-labs/FLUX.1-dev
echo echo    Put in: ComfyUI\models\diffusion_models\
echo echo.
echo echo 2. ae.safetensors ^(VAE, ~335MB^)
echo echo    Download from: https://huggingface.co/black-forest-labs/FLUX.1-dev
echo echo    Put in: ComfyUI\models\vae\
echo echo.
echo echo 3. clip_l.safetensors ^(~246MB^)
echo echo    Download from: https://huggingface.co/comfyanonymous/flux_text_encoders
echo echo    Put in: ComfyUI\models\clip\
echo echo.
echo echo 4. t5xxl_fp8_e4m3fn_scaled.safetensors ^(~4.9GB^)
echo echo    Download from: https://huggingface.co/comfyanonymous/flux_text_encoders
echo echo    Put in: ComfyUI\models\clip\
echo echo.
echo echo ========================================
echo echo.
echo echo Opening download pages in browser...
echo.
echo start https://huggingface.co/black-forest-labs/FLUX.1-dev/tree/main
echo start https://huggingface.co/comfyanonymous/flux_text_encoders
echo.
echo echo.
echo echo After downloading, place files in the correct folders!
echo echo.
echo pause
) > "%COMFY_ROOT%\DOWNLOAD_MODELS.bat"

echo [OK] Created: DOWNLOAD_MODELS.bat

REM ============================================================
REM STEP 9: Create README
REM ============================================================
echo.
echo ============================================================
echo STEP 9: Creating Documentation
echo ============================================================

(
echo # ComfyUI + FluxTrainer - Quick Start
echo.
echo ## STEP 1: Download Required Models
echo.
echo Run `DOWNLOAD_MODELS.bat` or download manually:
echo.
echo ^| Model ^| Size ^| Folder ^|
echo ^|-------|------|--------|
echo ^| flux1-dev.safetensors ^| 12GB ^| ComfyUI\models\diffusion_models\ ^|
echo ^| ae.safetensors ^| 335MB ^| ComfyUI\models\vae\ ^|
echo ^| clip_l.safetensors ^| 246MB ^| ComfyUI\models\clip\ ^|
echo ^| t5xxl_fp8_e4m3fn_scaled.safetensors ^| 4.9GB ^| ComfyUI\models\clip\ ^|
echo.
echo Download from:
echo - https://huggingface.co/black-forest-labs/FLUX.1-dev
echo - https://huggingface.co/comfyanonymous/flux_text_encoders
echo.
echo ## STEP 2: Prepare Training Images
echo.
echo 1. Create folder: `datasets\my_lora\`
echo 2. Add 15-40 high-quality images
echo 3. ^(Optional^) Add .txt caption files with same names
echo.
echo ## STEP 3: Train Your LoRA
echo.
echo 1. Run `START_COMFYUI.bat`
echo 2. Open browser: http://127.0.0.1:8188
echo 3. Load workflow: `flux_lora_training.json`
echo 4. Change these nodes:
echo    - Node 2: Set your trigger word
echo    - Node 3: Set path to your dataset folder
echo    - Node 5: Set output name
echo    - Node 6: Set test prompt with trigger word
echo 5. Click "Queue Prompt"
echo 6. Wait 2-4 hours
echo.
echo ## STEP 4: Use Your LoRA
echo.
echo Find trained LoRA in: `ComfyUI\models\loras\trained\`
echo.
echo Load with `LoraLoaderModelOnly` node in any workflow.
echo.
echo ## Settings for 12GB VRAM
echo.
echo - network_dim: 64
echo - Optimizer: AdamW8bit  
echo - Batch size: 1
echo - gradient_checkpointing: enabled
echo.
echo ## Folder Structure
echo.
echo ```
echo ComfyUI_FluxTrainer\
echo ├── START_COMFYUI.bat        ^<-- Run this
echo ├── DOWNLOAD_MODELS.bat      ^<-- Get models
echo ├── flux_lora_training.json  ^<-- Training workflow
echo ├── datasets\                ^<-- Your training images
echo │   └── my_first_lora\
echo └── ComfyUI\
echo     └── models\
echo         ├── diffusion_models\  ^<-- flux1-dev.safetensors
echo         ├── vae\               ^<-- ae.safetensors
echo         ├── clip\              ^<-- clip_l + t5xxl
echo         └── loras\trained\     ^<-- Output here
echo ```
) > "%COMFY_ROOT%\README.txt"

echo [OK] Created: README.txt

REM ============================================================
REM CLEANUP
REM ============================================================
echo.
echo Cleaning up temporary files...
if exist "%~dp0temp" rmdir /S /Q "%~dp0temp" 2>nul

REM ============================================================
REM FINAL SUMMARY
REM ============================================================
echo.
echo.
echo ============================================================
echo ============================================================
echo.
echo    INSTALLATION COMPLETE!
echo.
echo ============================================================
echo ============================================================
echo.
echo Location: %COMFY_ROOT%
echo.
echo NEXT STEPS:
echo.
echo   1. Run DOWNLOAD_MODELS.bat to get required models
echo      ^(flux1-dev, ae, clip_l, t5xxl - about 17GB total^)
echo.
echo   2. Put 15-40 training images in:
echo      %COMFY_ROOT%\datasets\my_first_lora\
echo.
echo   3. Run START_COMFYUI.bat
echo.
echo   4. Open http://127.0.0.1:8188 in browser
echo.
echo   5. Load flux_lora_training.json workflow
echo.
echo   6. Configure and train!
echo.
echo ============================================================
echo.
echo Opening installation folder...
explorer "%COMFY_ROOT%"
echo.
pause
