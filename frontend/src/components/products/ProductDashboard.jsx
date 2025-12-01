import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardContent, CardActions, Typography,
  Button, Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Avatar, IconButton, Menu, MenuItem, Alert,
  FormControl, InputLabel, Select, Pagination
} from '@mui/material';
import {
  Add, MoreVert, Edit, Delete, Download, ModelTraining,
  PhotoLibrary, Public, Lock, Search, AutoAwesome
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 4
      }}>
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
              animation: 'fadeIn 0.5s ease-out'
            }}
          >
            AI Products
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.9375rem' }}>
            Manage your AI models and training datasets
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.2,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              boxShadow: '0 6px 20px 0 rgba(59, 130, 246, 0.5)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          Create Product
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            backdropFilter: 'blur(10px)',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            backdropFilter: 'blur(10px)',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{
        mb: 4,
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap',
        animation: 'fadeIn 0.6s ease-out'
      }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                border: '1px solid rgba(59, 130, 246, 0.3)',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
              '&.Mui-focused': {
                border: '1px solid rgba(59, 130, 246, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
              }
            },
            '& input': {
              color: '#F1F5F9'
            },
            '& input::placeholder': {
              color: '#64748B',
              opacity: 1
            }
          }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#64748B', fontSize: 20 }} />
          }}
        />

        <FormControl
          sx={{ minWidth: 150 }}
          size="small"
        >
          <InputLabel sx={{ color: '#94A3B8' }}>Access Level</InputLabel>
          <Select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value)}
            label="Access Level"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F1F5F9',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                border: '1px solid rgba(59, 130, 246, 0.3)',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
              },
              '&.Mui-focused': {
                border: '1px solid rgba(59, 130, 246, 0.5)',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
              }
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" sx={{ ml: 'auto', color: '#64748B', fontSize: '0.875rem' }}>
          {total} {total === 1 ? 'product' : 'products'}
        </Typography>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={product.id}
            sx={{
              animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 12px 24px -10px rgba(59, 130, 246, 0.3)',
                  background: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 2.5
                }}>
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3B82F6',
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
                        fontWeight: 600,
                        background: product.access_level === 'public'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(234, 179, 8, 0.15)',
                        color: product.access_level === 'public' ? '#22C55E' : '#EAB308',
                        border: '1px solid',
                        borderColor: product.access_level === 'public'
                          ? 'rgba(34, 197, 94, 0.3)'
                          : 'rgba(234, 179, 8, 0.3)',
                        '& .MuiChip-icon': {
                          color: 'inherit',
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, product)}
                      sx={{
                        color: '#64748B',
                        '&:hover': {
                          color: '#3B82F6',
                          bgcolor: 'rgba(59, 130, 246, 0.1)'
                        }
                      }}
                    >
                      <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                <Typography
                  variant="h6"
                  gutterBottom
                  noWrap
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: '#F1F5F9',
                    mb: 1
                  }}
                >
                  {product.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mb: 2.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    color: '#94A3B8'
                  }}
                >
                  {product.description || 'No description provided'}
                </Typography>

                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748B',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Trigger Word
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={product.trigger_word}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#A78BFA',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
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
                  startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
                  sx={{
                    flex: 1,
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    color: '#3B82F6',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#3B82F6',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                    },
                    '&.Mui-disabled': {
                      borderColor: 'rgba(100, 116, 139, 0.2)',
                      color: '#64748B'
                    }
                  }}
                >
                  Generate
                </Button>

                {canManageProduct(product) && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ModelTraining sx={{ fontSize: 16 }} />}
                    onClick={() => navigate(`/products/${product.id}/train`)}
                    sx={{
                      flex: 1,
                      color: '#8B5CF6',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(139, 92, 246, 0.1)',
                      }
                    }}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#94A3B8',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                  }
                }
              }
            }}
          />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            mt: 1
          },
          '& .MuiMenuItem-root': {
            color: '#F1F5F9',
            '&:hover': {
              bgcolor: 'rgba(59, 130, 246, 0.1)',
            }
          }
        }}
      >
        {canManageProduct(menuProduct) && (
          <MenuItem onClick={handleEdit}>
            <Edit sx={{ mr: 2, fontSize: 18 }} />
            Edit
          </MenuItem>
        )}

        <MenuItem onClick={handleTrain}>
          <ModelTraining sx={{ mr: 2, fontSize: 18 }} />
          Train Model
        </MenuItem>

        {menuProduct?.status === 'ready' && (
          <MenuItem onClick={handleDownload}>
            <Download sx={{ mr: 2, fontSize: 18 }} />
            Download Model
          </MenuItem>
        )}

        {canManageProduct(menuProduct) && (
          <MenuItem onClick={handleDeleteClick} sx={{ color: '#EF4444 !important' }}>
            <Delete sx={{ mr: 2, fontSize: 18 }} />
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
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 600 }}>
          Create New Product
        </DialogTitle>
        <DialogContent>
          <CreateProduct
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ color: '#F1F5F9', fontWeight: 600 }}>
          Delete Product
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94A3B8' }}>
            Are you sure you want to delete "{selectedProduct?.name}"?
            This action cannot be undone and will permanently remove the product and its model files.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#94A3B8',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(148, 163, 184, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: '#EF4444',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#DC2626',
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' },
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.5)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default ProductDashboard;
