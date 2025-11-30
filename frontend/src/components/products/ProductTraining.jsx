// frontend/src/components/products/ProductTraining.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Grid, Box, Alert, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Table, TableBody, TableCell, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { ExpandMore, CloudUpload, AutoFixHigh, PlayArrow } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { trainingService } from '../../services/trainingService';
import { productService } from '../../services/productService';

const ProductTraining = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    productName: '',
    baseModel: 'flux-dev',
    triggerWord: '',
    resolution: 512,
    maxTrainEpochs: 16,
    learningRate: '8e-4',
    networkDim: 4,
    vram: '20G',
    numRepeats: 10,
    sampleEveryNSteps: 0,
    provider: 'auto'  // 'auto', 'local', 'runpod', 'fal'
  });

  const [images, setImages] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [baseModels, setBaseModels] = useState({});
  const [gpuStatus, setGpuStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadBaseModels();
    loadGpuStatus();
    if (productId) {
      loadProductData();
    }
  }, [productId]);

  const loadBaseModels = async () => {
    try {
      const response = await trainingService.getBaseModels();
      setBaseModels(response.models);
    } catch (error) {
      setError('Failed to load base models');
    }
  };

  const loadGpuStatus = async () => {
    try {
      const response = await trainingService.getGpuStatus();
      setGpuStatus(response);
    } catch (error) {
      console.error('Failed to load GPU status:', error);
      // Don't show error to user, GPU status is optional info
    }
  };

  const loadProductData = async () => {
    try {
      const product = await productService.getProduct(productId);
      setFormData(prev => ({
        ...prev,
        productName: product.name,
        triggerWord: product.trigger_word
      }));
    } catch (error) {
      setError('Failed to load product data');
    }
  };

  // File upload handling
  const onDrop = (acceptedFiles) => {
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...imageFiles]);
    
    // Add empty captions for new images
    const newCaptions = new Array(imageFiles.length).fill('');
    setCaptions(prev => [...prev, ...newCaptions]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 150
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setCaptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCaption = (index, caption) => {
    setCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  const generateAutoCaptions = async () => {
    if (images.length === 0) {
      setError('Please upload images first');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      images.forEach(image => formData.append('images', image));
      formData.append('trigger_word', formData.triggerWord);

      const response = await trainingService.generateAutoCaptions(formData);
      setCaptions(response.captions);
      setSuccess('Auto-captions generated successfully');
    } catch (error) {
      setError('Failed to generate captions');
    } finally {
      setIsLoading(false);
    }
  };

  const startTraining = async () => {
    if (images.length < 2) {
      setError('Please upload at least 2 images');
      return;
    }

    if (!formData.productName || !formData.triggerWord) {
      setError('Please fill in product name and trigger word');
      return;
    }

    setIsLoading(true);
    try {
      const trainingFormData = new FormData();
      
      // Add form fields
      trainingFormData.append('product_name', formData.productName);
      trainingFormData.append('base_model', formData.baseModel);
      trainingFormData.append('trigger_word', formData.triggerWord);
      trainingFormData.append('training_params', JSON.stringify({
        resolution: formData.resolution,
        max_train_epochs: formData.maxTrainEpochs,
        learning_rate: formData.learningRate,
        network_dim: formData.networkDim,
        vram: formData.vram,
        num_repeats: formData.numRepeats,
        sample_every_n_steps: formData.sampleEveryNSteps
      }));
      trainingFormData.append('captions', JSON.stringify(captions));

      // Add provider selection (only if not 'auto')
      if (formData.provider !== 'auto') {
        trainingFormData.append('provider', formData.provider);
      }

      // Add images
      images.forEach(image => trainingFormData.append('images', image));

      const response = await trainingService.startTraining(trainingFormData);
      setSuccess('Training started successfully!');
      
      // Navigate to training monitor
      setTimeout(() => {
        navigate(`/training/${response.id}`);
      }, 2000);
      
    } catch (error) {
      setError('Failed to start training');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {productId ? 'Retrain Product' : 'Train New Product'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Step 1: Product Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 1: Product Info
            </Typography>
            
            <TextField
              fullWidth
              label="Product Name"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Trigger Word"
              value={formData.triggerWord}
              onChange={(e) => setFormData(prev => ({ ...prev, triggerWord: e.target.value }))}
              margin="normal"
              required
              helperText="Unique word to trigger this product in prompts"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Base Model</InputLabel>
              <Select
                value={formData.baseModel}
                onChange={(e) => setFormData(prev => ({ ...prev, baseModel: e.target.value }))}
              >
                {Object.keys(baseModels).map(model => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>VRAM</InputLabel>
              <Select
                value={formData.vram}
                onChange={(e) => setFormData(prev => ({ ...prev, vram: e.target.value }))}
              >
                <MenuItem value="12G">12GB</MenuItem>
                <MenuItem value="16G">16GB</MenuItem>
                <MenuItem value="20G">20GB+</MenuItem>
              </Select>
            </FormControl>

            {/* GPU Status Display */}
            {gpuStatus && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" gutterBottom>
                  GPU Status
                </Typography>
                {gpuStatus.gpu_status.available ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {gpuStatus.gpu_status.gpu_count} GPU(s) detected
                    </Typography>
                    {gpuStatus.gpu_status.gpus.map((gpu, idx) => (
                      <Typography key={idx} variant="caption" display="block">
                        {gpu.name}: {gpu.memory_free}MB free / {gpu.memory_total}MB total
                      </Typography>
                    ))}
                    <Chip
                      label={gpuStatus.gpu_status.can_train_locally ? "GPU Available" : "GPU Busy"}
                      color={gpuStatus.gpu_status.can_train_locally ? "success" : "warning"}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </>
                ) : (
                  <Chip label="No GPU Detected" color="warning" size="small" />
                )}
              </Box>
            )}

            {/* Provider Selection */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Training Provider</InputLabel>
              <Select
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
              >
                <MenuItem value="auto">
                  Auto (Recommended: {gpuStatus?.recommended_provider === 'local' ? 'Local GPU' : 'Cloud'})
                </MenuItem>
                <MenuItem value="local" disabled={gpuStatus && !gpuStatus.gpu_status.available}>
                  Local GPU (FluxGym/Kohya)
                </MenuItem>
                <MenuItem value="runpod">
                  RunPod (Cloud GPU)
                </MenuItem>
                <MenuItem value="fal">
                  fal.ai (Cloud Training)
                </MenuItem>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {formData.provider === 'auto' && 'Automatically selects best provider based on GPU availability'}
                {formData.provider === 'local' && 'Uses local GPU with FluxGym/Kohya (free, faster)'}
                {formData.provider === 'runpod' && 'Rents cloud GPU on RunPod (pay per minute)'}
                {formData.provider === 'fal' && 'Uses fal.ai managed training (pay per job)'}
              </Typography>
            </FormControl>
          </Paper>
        </Grid>

        {/* Step 2: Dataset */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 2: Training Dataset
            </Typography>
            
            {/* Image Upload */}
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                mb: 2,
                backgroundColor: isDragActive ? '#f5f5f5' : 'inherit'
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
              <Typography>
                {isDragActive
                  ? 'Drop images here...'
                  : 'Drag & drop images here, or click to select'
                }
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Supports JPG, PNG, WebP. Max 150 images.
              </Typography>
            </Box>

            {images.length > 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    {images.length} images uploaded
                  </Typography>
                  <Button
                    startIcon={<AutoFixHigh />}
                    onClick={generateAutoCaptions}
                    disabled={isLoading}
                  >
                    Generate Auto Captions
                  </Button>
                </Box>

                {/* Image and Caption List */}
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {images.map((image, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 8
                        }}
                      />
                      <TextField
                        fullWidth
                        label={`Caption ${index + 1}`}
                        value={captions[index] || ''}
                        onChange={(e) => updateCaption(index, e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                      <Button
                        color="error"
                        onClick={() => removeImage(index)}
                        size="small"
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12}>
          <Accordion expanded={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Advanced Training Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Resolution"
                    type="number"
                    value={formData.resolution}
                    onChange={(e) => setFormData(prev => ({ ...prev, resolution: parseInt(e.target.value) }))}
                    inputProps={{ min: 256, max: 1024, step: 64 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Max Epochs"
                    type="number"
                    value={formData.maxTrainEpochs}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxTrainEpochs: parseInt(e.target.value) }))}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Learning Rate"
                    value={formData.learningRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, learningRate: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Network Dimension"
                    type="number"
                    value={formData.networkDim}
                    onChange={(e) => setFormData(prev => ({ ...prev, networkDim: parseInt(e.target.value) }))}
                    inputProps={{ min: 4, max: 128, step: 4 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Repeats per Image"
                    type="number"
                    value={formData.numRepeats}
                    onChange={(e) => setFormData(prev => ({ ...prev, numRepeats: parseInt(e.target.value) }))}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Sample Every N Steps"
                    type="number"
                    value={formData.sampleEveryNSteps}
                    onChange={(e) => setFormData(prev => ({ ...prev, sampleEveryNSteps: parseInt(e.target.value) }))}
                    inputProps={{ min: 0 }}
                    helperText="0 = no samples"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Start Training Button */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={startTraining}
              disabled={isLoading || images.length < 2}
              sx={{ minWidth: 200 }}
            >
              {isLoading ? 'Starting...' : 'Start Training'}
            </Button>
          </Box>
          
          {isLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 1 }}>
                Preparing training job...
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductTraining;