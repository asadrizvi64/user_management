import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, TextField, Button,
  CircularProgress, Card, CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { AttachMoney, TrendingUp, TrendingDown, Timeline } from '@mui/icons-material';
import { reportService } from '../../services/reportService';

const CostAnalysis = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    loadCostAnalysis();
  }, []);

  const loadCostAnalysis = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange.start.toISOString().split('T')[0],
        end_date: dateRange.end.toISOString().split('T')[0]
      };
      
      const data = await reportService.getCostAnalysisReport(params);
      setCostData(data);
    } catch (error) {
      console.error('Failed to load cost analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Date Range Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cost Analysis Period
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <DatePicker
              label="Start Date"
              value={dateRange.start}
              onChange={(value) => handleDateChange('start', value)}
              renderInput={(params) => <TextField {...params} />}
            />
            <DatePicker
              label="End Date"
              value={dateRange.end}
              onChange={(value) => handleDateChange('end', value)}
              renderInput={(params) => <TextField {...params} />}
            />
            <Button variant="contained" onClick={loadCostAnalysis}>
              Update Analysis
            </Button>
          </Box>
        </LocalizationProvider>
      </Paper>

      {costData && (
        <>
          {/* Cost Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">${costData.total_cost?.toFixed(2) || '0.00'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Cost
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timeline sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">${costData.generation_cost?.toFixed(2) || '0.00'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Generation Cost
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">${costData.training_cost?.toFixed(2) || '0.00'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Training Cost
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDown sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">
                        ${(costData.total_cost / ((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)))?.toFixed(2) || '0.00'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Daily Average
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Cost Trend Chart */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Cost Trend Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costData.cost_by_day}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}`, 'Cost']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Cost Breakdown Pie Chart */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Cost Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Generation', value: costData.generation_cost || 0 },
                        { name: 'Training', value: costData.training_cost || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Top Users by Cost */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Users by Cost
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData.cost_by_user?.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="username" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}`, 'Cost']} />
                    <Bar dataKey="cost" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CostAnalysis;