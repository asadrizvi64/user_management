import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Alert, CircularProgress
} from '@mui/material';
import PromptInput from './PromptInput';
import ProductSelector from './ProductSelector';
import GeneratedImages from './GeneratedImages';
import { generationService } from '../../services/generationService';
import { productService } from '../../services/productService';

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
      const response = await productService.getProducts();
      setProducts(response.products);
    } catch (error) {
      setError('Failed to load products');
    }
  };

  const handleGenerate = async (generationParams) => {
    setIsGenerating(true);
    setError('');
    
    try {
      const requestData = {
        ...generationParams,
        product_id: selectedProduct?.id
      };
      
      const result = await generationService.generateImages(requestData);
      setGeneratedImages(prev => [result, ...prev]);
      setSuccess('Images generated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to generate images');
    } finally {
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