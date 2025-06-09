// frontend/src/components/history/History.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid
} from '@mui/material';
import HistoryFilter from './HistoryFilter';
import HistoryItem from './HistoryItem';
import { generationService } from '../../services/generationService';

const History = () => {
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    product_id: '',
    page: 1,
    limit: 20
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (filters.page - 1) * filters.limit,
        limit: filters.limit,
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.product_id && { product_id: filters.product_id })
      };

      const response = await generationService.getGenerations(params);
      setGenerations(response.generations);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteGeneration = async (generationId) => {
    try {
      await generationService.deleteGeneration(generationId);
      setGenerations(prev => prev.filter(g => g.id !== generationId));
    } catch (error) {
      console.error('Failed to delete generation:', error);
    }
  };
   return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Generation History
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        View and manage your image generation history
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <HistoryFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} md={9}>
          <HistoryItem
            generations={generations}
            loading={loading}
            total={total}
            page={filters.page}
            limit={filters.limit}
            onPageChange={handlePageChange}
            onDeleteGeneration={handleDeleteGeneration}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default History;
