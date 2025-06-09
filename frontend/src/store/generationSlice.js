import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generationService } from '../services/generationService';

// Async thunks
export const generateImages = createAsyncThunk(
  'generation/generateImages',
  async (requestData, { rejectWithValue }) => {
    try {
      return await generationService.generateImages(requestData);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to generate images');
    }
  }
);

export const fetchGenerationHistory = createAsyncThunk(
  'generation/fetchHistory',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await generationService.getGenerations(params);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch history');
    }
  }
);

export const deleteGeneration = createAsyncThunk(
  'generation/deleteGeneration',
  async (generationId, { rejectWithValue }) => {
    try {
      await generationService.deleteGeneration(generationId);
      return generationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete generation');
    }
  }
);

const generationSlice = createSlice({
  name: 'generation',
  initialState: {
    history: [],
    recentGenerations: [],
    currentGeneration: null,
    isGenerating: false,
    loading: false,
    error: null,
    filters: {
      start_date: '',
      end_date: '',
      product_id: '',
      page: 1,
      limit: 20
    },
    total: 0
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setCurrentGeneration: (state, action) => {
      state.currentGeneration = action.payload;
    },
    addRecentGeneration: (state, action) => {
      state.recentGenerations.unshift(action.payload);
      // Keep only last 10 recent generations
      state.recentGenerations = state.recentGenerations.slice(0, 10);
    }
  },
  extraReducers: (builder) => {
    builder
      // Generate images
      .addCase(generateImages.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateImages.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.currentGeneration = action.payload;
        state.recentGenerations.unshift(action.payload);
        state.recentGenerations = state.recentGenerations.slice(0, 10);
      })
      .addCase(generateImages.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload;
      })
      
      // Fetch history
      .addCase(fetchGenerationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGenerationHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.generations;
        state.total = action.payload.total;
      })
      .addCase(fetchGenerationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete generation
      .addCase(deleteGeneration.fulfilled, (state, action) => {
        state.history = state.history.filter(g => g.id !== action.payload);
        state.recentGenerations = state.recentGenerations.filter(g => g.id !== action.payload);
      });
  }
});

export const { clearError, updateFilters, setCurrentGeneration, addRecentGeneration } = generationSlice.actions;
export default generationSlice.reducer;
