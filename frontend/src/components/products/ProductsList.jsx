import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import api from '../../services/api';

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    trigger_word: '',
    access_level: 'public'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products/');
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('description', newProduct.description);
      formData.append('trigger_word', newProduct.trigger_word);
      formData.append('access_level', newProduct.access_level);

      await api.post('/api/products/', formData);
      setOpenDialog(false);
      fetchProducts();
      setNewProduct({ name: '', description: '', trigger_word: '', access_level: 'public' });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create product');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Product
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{product.name}</Typography>
                  {product.access_level === 'public' ? (
                    <PublicIcon color="primary" />
                  ) : (
                    <LockIcon color="action" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {product.description || 'No description'}
                </Typography>
                <Chip 
                  label={product.trigger_word} 
                  size="small" 
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Status: {product.status || 'pending'}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton size="small">
                  <EditIcon />
                </IconButton>
                <IconButton size="small">
                  <DownloadIcon />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Product Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Product</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Product Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Trigger Word"
            value={newProduct.trigger_word}
            onChange={(e) => setNewProduct({ ...newProduct, trigger_word: e.target.value })}
            margin="normal"
            required
            helperText="e.g., 'myproduct' - used in prompts"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProduct} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}