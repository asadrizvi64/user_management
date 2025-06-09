import React, { useState } from 'react';
import {
  Container, Typography, Box, Tabs, Tab, Alert
} from '@mui/material';
import { Assessment, TrendingUp, People } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import ActivityReport from './ActivityReport';
import CostAnalysis from './CostAnalysis';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required to view reports.
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Monitor platform usage, costs, and user activity
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<People />} 
            label="User Activity" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrendingUp />} 
            label="Cost Analysis" 
            iconPosition="start"
          />
          <Tab 
            icon={<Assessment />} 
            label="Performance Metrics" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {activeTab === 0 && <ActivityReport />}
      {activeTab === 1 && <CostAnalysis />}
      {activeTab === 2 && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Performance Metrics Coming Soon
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Reports;
