import React, { useState } from 'react';
import {
  Box, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Alert, CircularProgress, Typography, Paper
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { productService } from '../../services/productService';

const CreateProduct = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_word: '',
    access_level: 'public'
  });
  const [modelFile, setModelFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && (file.name.endsWith('.safetensors') || file.name.endsWith('.ckpt') || file.name.endsWith('.pt'))) {
      setModelFile(file);
      setError('');
    } else {
      setError('Please upload a valid model file (.safetensors, .ckpt, or .pt)');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.safetensors', '.ckpt', '.pt']
    },
    maxFiles: 1
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateTriggerWord = () => {
    const name = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const triggerWord = name.substring(0, 6) + Math.floor(Math.random() * 100);
    setFormData(prev => ({ ...prev, trigger_word: triggerWord }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.trigger_word) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('trigger_word', formData.trigger_word);
      submitData.append('access_level', formData.access_level);
      
      if (modelFile) {
        submitData.append('model_file', modelFile);
      }

      const newProduct = await productService.createProduct(submitData);
      onSuccess(newProduct);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        fullWidth
        label="Product Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        margin="normal"
        required
        helperText="Give your product a descriptive name"
      />

      <TextField
        fullWidth
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        margin="normal"
        multiline
        rows={3}
        helperText="Optional description of what this product represents"
      />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Trigger Word"
          value={formData.trigger_word}
          onChange={(e) => handleChange('trigger_word', e.target.value)}
          margin="normal"
          required
          helperText="Unique word to activate this product in prompts"
          sx={{ flexGrow: 1 }}
        />
        <Button 
          onClick={generateTriggerWord}
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Generate
        </Button>
      </Box>

      <FormControl fullWidth margin="normal">
        <InputLabel>Access Level</InputLabel>
        <Select
          value={formData.access_level}
          onChange={(e) => handleChange('access_level', e.target.value)}
        >
          <MenuItem value="public">Public - Visible to all users</MenuItem>
          <MenuItem value="private">Private - Only visible to you</MenuItem>
        </Select>
      </FormControl>

      {/* Model File Upload */}
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
        Pre-trained Model (Optional)
      </Typography>
      
      <Paper
        {...getRootProps()}
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f5f5f5' : 'inherit',
          '&:hover': { backgroundColor: '#f9f9f9' }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
        {modelFile ? (
          <Typography>
            Selected: {modelFile.name}
          </Typography>
        ) : (
          <Box>
            <Typography>
              {isDragActive
                ? 'Drop the model file here...'
                : 'Drag & drop a model file here, or click to select'
              }
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Supports .safetensors, .ckpt, .pt files
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateProduct;