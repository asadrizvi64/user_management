import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Alert,
  FormControl, InputLabel, Select, MenuItem, TextField, Slider,
  CircularProgress, Card, CardMedia, IconButton, Tooltip, Chip
} from '@mui/material';
import {
  CloudUpload, AutoAwesome, Download, Refresh, Info, Settings
} from '@mui/icons-material';
import { productService } from '../../services/productService';
import axios from 'axios';

const ProductInpainting = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [baseImageFile, setBaseImageFile] = useState(null);
  const [maskImage, setMaskImage] = useState(null);
  const [maskImageFile, setMaskImageFile] = useState(null);
  const [resultImages, setResultImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [executionTime, setExecutionTime] = useState(null);
  const [cost, setCost] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);

  const [params, setParams] = useState({
    prompt: 'An old-style living room with vintage decor, wooden flooring, and warm ambient lighting. A modern white two-seater sofa with a compact, minimal design and soft upholstered cushions sits naturally in the room. The sofa has a rectangular base, no skirt, and a clean silhouette. The lighting and shadows on the sofa match the environment. Photorealistic, high resolution.',
    negative_prompt: 'skirted base, frilly fabric, curved legs, vintage style, floral patterns, mismatched lighting, distorted edges, unnatural placement, floating, blurry, low resolution',
    lora_strength: 1.0,
    steps: 30,
    cfg: 1.0,
    guidance: 40.0,
    seed: -1
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (baseImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = baseImage;
    }
  }, [baseImage]);

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts();
      // Filter products that have trained models
      const trainedProducts = response.products.filter(p => p.model_path);
      setProducts(trainedProducts);

      if (trainedProducts.length === 0) {
        setError('No trained products available. Please train a product first.');
      }
    } catch (error) {
      setError('Failed to load products');
    }
  };

  const handleBaseImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBaseImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBaseImage(e.target.result);
        setResultImages([]);
        // Reset mask when new image is uploaded
        setMaskImage(null);
        setMaskImageFile(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMaskImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMaskImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMaskImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrawing = (e) => {
    if (!baseImage) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x * scaleX, y * scaleY, brushSize, 0, Math.PI * 2);
    ctx.fill();

    // Convert canvas to mask image
    updateMaskFromCanvas();
  };

  const updateMaskFromCanvas = () => {
    const canvas = canvasRef.current;
    setMaskImage(canvas.toDataURL());

    // Convert to blob for upload
    canvas.toBlob((blob) => {
      const file = new File([blob], 'mask.png', { type: 'image/png' });
      setMaskImageFile(file);
    });
  };

  const clearMask = () => {
    if (!baseImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setMaskImage(null);
      setMaskImageFile(null);
    };
    img.src = baseImage;
  };

  const processInpainting = async () => {
    if (!baseImageFile || !maskImageFile || !selectedProduct || !params.prompt.trim()) {
      setError('Please provide base image, mask, product, and prompt');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');
    setResultImages([]);

    try {
      const formData = new FormData();
      formData.append('base_image', baseImageFile);
      formData.append('mask_image', maskImageFile);
      formData.append('product_id', selectedProduct.id);
      formData.append('prompt', params.prompt);
      formData.append('negative_prompt', params.negative_prompt);
      formData.append('lora_strength', params.lora_strength);
      formData.append('steps', params.steps);
      formData.append('cfg', params.cfg);
      formData.append('guidance', params.guidance);
      formData.append('seed', params.seed);

      const response = await axios.post('/api/inpainting/product-inpaint', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setResultImages(response.data.result_images);
      setExecutionTime(response.data.execution_time);
      setCost(response.data.cost);
      setSuccess(`Product inpainted successfully! Generated ${response.data.result_images.length} image(s)`);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to process inpainting';
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = (imagePath) => {
    const link = document.createElement('a');
    link.href = `/${imagePath}`;
    link.download = imagePath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Product Inpainting Studio
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Place your trained products into any scene with AI-powered inpainting
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Left Panel - Controls */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings /> Configuration
            </Typography>

            {/* Product Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Product</InputLabel>
              <Select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct(product);
                }}
              >
                {products.length === 0 && (
                  <MenuItem disabled>No trained products available</MenuItem>
                )}
                {products.map(product => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} ({product.trigger_word})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProduct && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Trigger Word:</strong> {selectedProduct.trigger_word}
                </Typography>
                <Typography variant="body2">
                  <strong>Model:</strong> {selectedProduct.model_path?.split('/').pop()}
                </Typography>
              </Alert>
            )}

            {/* Prompt */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Prompt"
              value={params.prompt}
              onChange={(e) => setParams({ ...params, prompt: e.target.value })}
              sx={{ mb: 2 }}
              helperText="Describe the scene where the product should be placed"
            />

            {/* Negative Prompt */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Negative Prompt"
              value={params.negative_prompt}
              onChange={(e) => setParams({ ...params, negative_prompt: e.target.value })}
              sx={{ mb: 2 }}
              helperText="What to avoid in the generation"
            />

            {/* Advanced Settings */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Advanced Settings
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>LoRA Strength: {params.lora_strength}</Typography>
              <Slider
                value={params.lora_strength}
                onChange={(e, v) => setParams({ ...params, lora_strength: v })}
                min={0}
                max={2}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Steps: {params.steps}</Typography>
              <Slider
                value={params.steps}
                onChange={(e, v) => setParams({ ...params, steps: v })}
                min={10}
                max={50}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Guidance: {params.guidance}</Typography>
              <Slider
                value={params.guidance}
                onChange={(e, v) => setParams({ ...params, guidance: v })}
                min={1}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
            </Box>

            <TextField
              fullWidth
              type="number"
              label="Seed (-1 for random)"
              value={params.seed}
              onChange={(e) => setParams({ ...params, seed: parseInt(e.target.value) })}
              sx={{ mb: 3 }}
            />

            {/* Generate Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={processInpainting}
              disabled={isProcessing || !baseImage || !maskImage || !selectedProduct}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <AutoAwesome />}
            >
              {isProcessing ? 'Generating...' : 'Generate Inpainting'}
            </Button>

            {executionTime && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Chip label={`Time: ${executionTime.toFixed(2)}s`} size="small" sx={{ mr: 1 }} />
                <Chip label={`Cost: $${cost.toFixed(4)}`} size="small" />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Center Panel - Canvas */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Draw Mask
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Upload a base image and draw where you want the product to appear
            </Typography>

            <Box sx={{ mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="base-image-upload"
                type="file"
                onChange={handleBaseImageUpload}
              />
              <label htmlFor="base-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Upload Base Image
                </Button>
              </label>
            </Box>

            {baseImage && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography gutterBottom>Brush Size: {brushSize}px</Typography>
                  <Slider
                    value={brushSize}
                    onChange={(e, v) => setBrushSize(v)}
                    min={5}
                    max={100}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box
                  sx={{
                    border: '2px solid #ccc',
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'crosshair',
                    maxHeight: '500px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ maxWidth: '100%', maxHeight: '500px', display: 'block' }}
                  />
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={clearMask}
                    startIcon={<Refresh />}
                    fullWidth
                  >
                    Clear Mask
                  </Button>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="mask-image-upload"
                    type="file"
                    onChange={handleMaskImageUpload}
                  />
                  <label htmlFor="mask-image-upload" style={{ width: '100%' }}>
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      fullWidth
                    >
                      Upload Mask
                    </Button>
                  </label>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Right Panel - Results */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Results
            </Typography>

            {resultImages.length === 0 && !isProcessing && (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed #ccc',
                  borderRadius: 1
                }}
              >
                <Typography color="textSecondary">
                  Generated images will appear here
                </Typography>
              </Box>
            )}

            {isProcessing && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress size={60} />
                <Typography sx={{ mt: 2 }}>
                  Processing inpainting...
                </Typography>
              </Box>
            )}

            {resultImages.map((imagePath, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardMedia
                  component="img"
                  image={`/${imagePath}`}
                  alt={`Result ${idx + 1}`}
                />
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => downloadResult(imagePath)}
                  >
                    Download
                  </Button>
                </Box>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductInpainting;
