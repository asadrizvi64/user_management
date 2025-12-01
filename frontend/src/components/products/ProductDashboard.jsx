import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, CardActions, Typography,
  Button, Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, IconButton, Menu, MenuItem, Alert,
  FormControl, InputLabel, Select, Pagination
} from '@mui/material';
import {
  Add, MoreVert, Edit, Delete, Download, ModelTraining,
  PhotoLibrary, Public, Lock, Search
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
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
    if (!product || !user) return false;
    return isAdmin || product.created_by === user.id;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#0F172A' }}>
              Products
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your trained models and products
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ px: 3 }}
          >
            Create Product
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', p: 3, backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          size="small"
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: '1.25rem' }} />
          }}
        />

        <FormControl sx={{ minWidth: 150 }} size="small">
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

        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontWeight: 500 }}>
          {total} {total === 1 ? 'product' : 'products'}
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
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PhotoLibrary sx={{ fontSize: '1.25rem', color: '#64748B' }} />
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, product)}
                    sx={{ color: '#64748B' }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>

                <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 600, fontSize: '1rem', mb: 1 }}>
                  {product.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.5rem',
                    lineHeight: 1.4,
                  }}
                >
                  {product.description || 'No description provided'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={product.access_level === 'public' ? <Public sx={{ fontSize: '0.875rem' }} /> : <Lock sx={{ fontSize: '0.875rem' }} />}
                    label={product.access_level}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: product.access_level === 'public' ? '#059669' : '#64748B',
                      color: product.access_level === 'public' ? '#059669' : '#64748B',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={product.status}
                    size="small"
                    sx={{
                      backgroundColor: product.status === 'ready' ? '#F0FDF4' : '#FEF3C7',
                      color: product.status === 'ready' ? '#059669' : '#D97706',
                      fontWeight: 500,
                      border: '1px solid',
                      borderColor: product.status === 'ready' ? '#BBF7D0' : '#FDE68A',
                    }}
                  />
                </Box>

                <Box sx={{ pt: 2, borderTop: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                    Trigger word
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', color: '#0F172A', mt: 0.5 }}>
                    {product.trigger_word}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => navigate('/editor')}
                  disabled={product.status !== 'ready'}
                  variant="outlined"
                  fullWidth
                >
                  Generate
                </Button>

                {canManageProduct(product) && (
                  <Button
                    size="small"
                    startIcon={<ModelTraining fontSize="small" />}
                    onClick={() => navigate(`/products/${product.id}/train`)}
                    variant="outlined"
                    fullWidth
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
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default ProductDashboard;