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
    <Box sx={{ py: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9375rem' }}>
            Manage your AI models and training datasets
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
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', border: '1px solid #dc2626' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px', border: '1px solid #059669' }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
            }
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#64748b', fontSize: 20 }} />
          }}
        />

        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Access Level</InputLabel>
          <Select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            label="Access Level"
            sx={{
              backgroundColor: '#ffffff',
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" sx={{ ml: 'auto', color: '#64748b', fontSize: '0.875rem' }}>
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
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px 0 rgb(0 0 0 / 0.08)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: '#eff6ff',
                      color: '#2563eb',
                      width: 44,
                      height: 44,
                    }}
                  >
                    <PhotoLibrary sx={{ fontSize: 22 }} />
                  </Avatar>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                      icon={product.access_level === 'public' ? <Public sx={{ fontSize: 14 }} /> : <Lock sx={{ fontSize: 14 }} />}
                      label={product.access_level}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: product.access_level === 'public' ? '#ecfdf5' : '#fef3c7',
                        color: product.access_level === 'public' ? '#059669' : '#d97706',
                        border: '1px solid',
                        borderColor: product.access_level === 'public' ? '#d1fae5' : '#fde68a',
                        '& .MuiChip-icon': {
                          color: 'inherit',
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, product)}
                      sx={{ color: '#64748b' }}
                    >
                      <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#0f172a', mb: 1 }}>
                  {product.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  {product.description || 'No description provided'}
                </Typography>

                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
                    Trigger Word
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={product.trigger_word}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                  </Box>
                </Box>

                <Chip
                  label={product.status.toUpperCase()}
                  size="small"
                  color={getStatusColor(product.status)}
                  sx={{
                    mt: 'auto',
                    height: 24,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                  }}
                />
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/editor')}
                  disabled={product.status !== 'ready'}
                  sx={{ flex: 1 }}
                >
                  Generate
                </Button>

                {canManageProduct(product) && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ModelTraining sx={{ fontSize: 16 }} />}
                    onClick={() => navigate(`/products/${product.id}/train`)}
                    sx={{ flex: 1 }}
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