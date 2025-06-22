// src/components/editor/ImageEditor.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import PromptInput from './PromptInput';
import GeneratedImages from './GeneratedImages';

// Temporary ProductSelector component (inline until we create the separate file)
const ProductSelector = ({ products, selectedProduct, onProductChange }) => {
  return (
    <FormControl fullWidth>
      <InputLabel>Select Product</InputLabel>
      <Select
        value={selectedProduct?.id || ''}
        onChange={(e) => {
          const product = products.find(p => p.id === e.target.value);
          onProductChange(product);
        }}
        label="Select Product"
      >
        <MenuItem value="">
          <em>No product selected</em>
        </MenuItem>
        {products
          .filter(product => product.status === 'ready')
          .map(product => (
            <MenuItem key={product.id} value={product.id}>
              {product.name} ({product.trigger_word})
            </MenuItem>
          ))}
      </Select>
      
      {selectedProduct && (
        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
          Use "{selectedProduct.trigger_word}" in your prompts to activate this product
        </Typography>
      )}
    </FormControl>
  );
};

const ImageEditor = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Mock data for now - replace with actual API call later
      const mockProducts = [
        {
          id: 1,
          name: 'Demo Product 1',
          trigger_word: 'myproduct1',
          status: 'ready'
        },
        {
          id: 2,
          name: 'Demo Product 2', 
          trigger_word: 'myproduct2',
          status: 'ready'
        }
      ];
      setProducts(mockProducts);
      
      // Uncomment this when backend is ready:
      // const response = await productService.getProducts();
      // setProducts(response.products);
    } catch (error) {
      setError('Failed to load products (using demo data)');
      console.error('Error loading products:', error);
    }
  };

  const handleGenerate = async (generationParams) => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Mock generation for now - replace with actual API call later
      console.log('Generation params:', generationParams);
      
      // Simulate API delay
      setTimeout(() => {
        const mockGeneration = {
          id: Date.now(),
          prompt: generationParams.prompt,
          image_paths: [
            'https://via.placeholder.com/512x512/1976d2/ffffff?text=Generated+Image+1',
            'https://via.placeholder.com/512x512/dc004e/ffffff?text=Generated+Image+2'
          ],
          execution_time: 3.2,
          cost: 0.05,
          created_at: new Date().toISOString()
        };
        
        setGeneratedImages(prev => [mockGeneration, ...prev]);
        setSuccess('Images generated successfully! (Demo)');
        setIsGenerating(false);
        
        setTimeout(() => setSuccess(''), 3000);
      }, 2000);
      
      // Uncomment this when backend is ready:
      /*
      const requestData = {
        ...generationParams,
        product_id: selectedProduct?.id
      };
      
      const result = await generationService.generateImages(requestData);
      setGeneratedImages(prev => [result, ...prev]);
      setSuccess('Images generated successfully!');
      */
      
    } catch (error) {
      setError('Failed to generate images: ' + error.message);
      setIsGenerating(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Image Editor
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Generate images using your trained products
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Left Panel - Controls */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Product Selection
            </Typography>
            <ProductSelector
              products={products}
              selectedProduct={selectedProduct}
              onProductChange={setSelectedProduct}
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generation Settings
            </Typography>
            <PromptInput
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              selectedProduct={selectedProduct}
            />
          </Paper>
        </Grid>

        {/* Right Panel - Results */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generated Images
            </Typography>
            
            {isGenerating && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={60} />
                <Typography variant="body1" sx={{ ml: 2, alignSelf: 'center' }}>
                  Generating images...
                </Typography>
              </Box>
            )}
            
            <GeneratedImages
              images={generatedImages}
              isGenerating={isGenerating}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ImageEditor;