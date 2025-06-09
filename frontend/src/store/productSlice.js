import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../services/productService';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await productService.getProducts(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch products');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      return await productService.createProduct(formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ productId, formData }, { rejectWithValue }) => {
    try {
      return await productService.updateProduct(productId, formData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      await productService.deleteProduct(productId);
      return productId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete product');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    total: 0,
    selectedProduct: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      access_level: '',
      page: 1,
      limit: 12
    }
  },
  reducers: {
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProductInList: (state, action) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      
      // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      });
  }
});

export const { setSelectedProduct, updateFilters, clearError, updateProductInList } = productSlice.actions;
export default productSlice.reducer;