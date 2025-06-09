import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, CardActions, Typography,
  Button, Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Avatar, IconButton, Menu, MenuItem, Alert,
  FormControl, InputLabel, Select, Pagination
} from '@mui/material';
import {
  Add, MoreVert, Edit, Delete, Download, ModelTraining,
  PhotoLibrary, Public, Lock, Search
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { productService } from '../../services/productService';
import CreateProduct from './CreateProduct';

const ProductDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters and pagination
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  
  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuProduct, setMenuProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [page, search, accessFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
        ...(search && { search }),
        ...(accessFilter && { access_level: accessFilter })
      };
      
      const response = await productService.getProducts(params);
      setProducts(response.products);
      setTotal(response.total);
      setError('');
    } catch (error) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event, product) => {
    setAnchorEl(event.currentTarget);
    setMenuProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuProduct(null);
  };

  const handleEdit = () => {
    // Navigate to edit product page or open edit dialog
    handleMenuClose();
  };

  const handleTrain = () => {
    navigate(`/products/${menuProduct.id}/train`);
    handleMenuClose();
  };

  const handleDownload = async () => {
    try {
      const blob = await productService.downloadProduct(menuProduct.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${menuProduct.name}.safetensors`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Model downloaded successfully');
    } catch (error) {
      setError('Failed to download model');
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setSelectedProduct(menuProduct);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      await productService.deleteProduct(selectedProduct.id);
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setSuccess('Product deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      setError('Failed to delete product');
    }
  };

  const handleCreateSuccess = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    setCreateDialogOpen(false);
    setSuccess('Product created successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'success';
      case 'training': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const canManageProduct = (product) => {
    return isAdmin || product.created_by === user.id;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Product Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage your trained products and models
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          Create Product
        </Button>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Access Level</InputLabel>
          <Select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            label="Access Level"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="textSecondary" sx={{ ml: 'auto' }}>
          {total} products found
        </Typography>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': { boxShadow: 4 }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PhotoLibrary />
                  </Avatar>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={product.access_level === 'public' ? <Public /> : <Lock />}
                      label={product.access_level}
                      size="small"
                      color={product.access_level === 'public' ? 'success' : 'warning'}
                      variant="outlined"
                    />
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuClick(e, product)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom noWrap>
                  {product.name}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="textSecondary" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {product.description || 'No description provided'}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Trigger Word:
                  </Typography>
                  <Chip
                    label={product.trigger_word}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Chip
                  label={product.status.toUpperCase()}
                  size="small"
                  color={getStatusColor(product.status)}
                  sx={{ mt: 'auto' }}
                />
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate('/editor')}
                  disabled={product.status !== 'ready'}
                >
                  Generate
                </Button>
                
                {canManageProduct(product) && (
                  <Button
                    size="small"
                    startIcon={<ModelTraining />}
                    onClick={() => navigate(`/products/${product.id}/train`)}
                  >
                    Train
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {canManageProduct(menuProduct) && (
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 2 }} />
            Edit
          </MenuItem>
        )}
        
        <MenuItem onClick={handleTrain}>
          <ModelTraining sx={{ mr: 2 }} />
          Train Model
        </MenuItem>
        
        {menuProduct?.status === 'ready' && (
          <MenuItem onClick={handleDownload}>
            <Download sx={{ mr: 2 }} />
            Download Model
          </MenuItem>
        )}
        
        {canManageProduct(menuProduct) && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 2 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Create Product Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Product</DialogTitle>
        <DialogContent>
          <CreateProduct 
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.name}"? 
            This action cannot be undone and will permanently remove the product and its model files.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default ProductDashboard;