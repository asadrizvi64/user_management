import React, { useState, useEffect } from 'react';
import {
  Paper, TextField, Button, FormControl, InputLabel, Select,
  MenuItem, Box, Typography, Divider
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { productService } from '../../services/productService';

const HistoryFilter = ({ filters, onFilterChange, loading }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productService.getProducts({ limit: 100 });
      setProducts(response.products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleClear = () => {
    onFilterChange({
      start_date: '',
      end_date: '',
      product_id: ''
    });
  };

  // Set default date range to last 30 days
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filters</Typography>
      </Box>

      <TextField
        fullWidth
        type="date"
        label="Start Date"
        value={filters.start_date}
        onChange={(e) => handleChange('start_date', e.target.value)}
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        fullWidth
        type="date"
        label="End Date"
        value={filters.end_date}
        onChange={(e) => handleChange('end_date', e.target.value)}
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Product</InputLabel>
        <Select
          value={filters.product_id}
          onChange={(e) => handleChange('product_id', e.target.value)}
        >
          <MenuItem value="">All Products</MenuItem>
          {products.map(product => (
            <MenuItem key={product.id} value={product.id}>
              {product.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<Clear />}
          onClick={handleClear}
          size="small"
          fullWidth
        >
          Clear
        </Button>
      </Box>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="textSecondary">
          Quick Filters:
        </Typography>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => handleChange('start_date', getDefaultStartDate())}
          >
            Last 30 days
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              const date = new Date();
              date.setDate(date.getDate() - 7);
              handleChange('start_date', date.toISOString().split('T')[0]);
            }}
          >
            Last 7 days
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => {
              const date = new Date();
              handleChange('start_date', date.toISOString().split('T')[0]);
            }}
          >
            Today
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default HistoryFilter;