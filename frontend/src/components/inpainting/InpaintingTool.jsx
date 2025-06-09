import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Alert,
  FormControl, InputLabel, Select, MenuItem, TextField, Slider,
  CircularProgress
} from '@mui/material';
import { CloudUpload, Brush, AutoFixHigh } from '@mui/icons-material';
import ImageCanvas from './ImageCanvas';
import MaskEditor from './MaskEditor';
import { productService } from '../../services/productService';
import { generationService } from '../../services/generationService';

const InpaintingTool = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [baseImage, setBaseImage] = useState(null);
  const [maskImage, setMaskImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [settings, setSettings] = useState({
    prompt: '',
    negative_prompt: 'blurry, low quality, distorted',
    strength: 0.8,
    guidance_scale: 7.5,
    num_inference_steps: 50
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.products.filter(p => p.status === 'ready'));
    } catch (error) {
      setError('Failed to load products');
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBaseImage(e.target.result);
      setMaskImage(null);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMaskUpdate = (maskDataUrl) => {
    setMaskImage(maskDataUrl);
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const processInpainting = async () => {
    if (!baseImage || !maskImage || !selectedProduct || !settings.prompt.trim()) {
      setError('Please provide base image, mask, product, and prompt');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Convert data URLs to blobs
      const baseBlob = await fetch(baseImage).then(r => r.blob());
      const maskBlob = await fetch(maskImage).then(r => r.blob());

      const formData = new FormData();
      formData.append('base_image', baseBlob, 'base.jpg');
      formData.append('mask_image', maskBlob, 'mask.png');
      formData.append('product_id', selectedProduct.id);
      formData.append('prompt', settings.prompt);
      formData.append('negative_prompt', settings.negative_prompt);
      formData.append('strength', settings.strength);
      formData.append('guidance_scale', settings.guidance_scale);
      formData.append('num_inference_steps', settings.num_inference_steps);

      const response = await fetch('/api/inpainting/process', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Inpainting failed');
      }

      const result = await response.json();
      setResultImage(result.result_image);
      setSuccess('Inpainting completed successfully!');
    } catch (error) {
      setError('Failed to process inpainting');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'inpainted-result.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Inpainting Tool
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Replace parts of images with your trained products
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Controls Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Product Selection
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Product</InputLabel>
              <Select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct(product);
                }}
              >
                {products.map(product => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} ({product.trigger_word})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Inpainting Settings
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Prompt"
              value={settings.prompt}
              onChange={(e) => handleSettingChange('prompt', e.target.value)}
              margin="normal"
              placeholder={selectedProduct ? 
                `${selectedProduct.trigger_word} your description...` : 
                'Describe what to paint in the masked area...'
              }
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Negative Prompt"
              value={settings.negative_prompt}
              onChange={(e) => handleSettingChange('negative_prompt', e.target.value)}
              margin="normal"
            />

            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Strength: {settings.strength}
              </Typography>
              <Slider
                value={settings.strength}
                onChange={(e, value) => handleSettingChange('strength', value)}
                min={0.1}
                max={1.0}
                step={0.1}
                marks={[
                  { value: 0.1, label: '0.1' },
                  { value: 0.5, label: '0.5' },
                  { value: 1.0, label: '1.0' }
                ]}
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Guidance Scale: {settings.guidance_scale}
              </Typography>
              <Slider
                value={settings.guidance_scale}
                onChange={(e, value) => handleSettingChange('guidance_scale', value)}
                min={1}
                max={20}
                step={0.5}
                marks={[
                  { value: 1, label: '1' },
                  { value: 7.5, label: '7.5' },
                  { value: 15, label: '15' },
                  { value: 20, label: '20' }
                ]}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={processInpainting}
              disabled={isProcessing || !baseImage || !maskImage || !selectedProduct}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <AutoFixHigh />}
              sx={{ mt: 3 }}
            >
              {isProcessing ? 'Processing...' : 'Process Inpainting'}
            </Button>
          </Paper>
        </Grid>

        {/* Canvas Area */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* Base Image Upload */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Base Image
                </Typography>
                <ImageCanvas
                  image={baseImage}
                  onImageUpload={handleImageUpload}
                  title="Upload Base Image"
                />
              </Paper>
            </Grid>

            {/* Mask Editor */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Mask Editor
                </Typography>
                <MaskEditor
                  baseImage={baseImage}
                  onMaskUpdate={handleMaskUpdate}
                />
              </Paper>
            </Grid>

            {/* Result */}
            {resultImage && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Result
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={downloadResult}
                      startIcon={<CloudUpload />}
                    >
                      Download
                    </Button>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={resultImage}
                      alt="Inpainting result"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '500px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InpaintingTool;
