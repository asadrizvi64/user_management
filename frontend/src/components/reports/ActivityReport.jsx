import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, TextField, Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Chip, CircularProgress, Card, CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TrendingUp, People, Image, ModelTraining } from '@mui/icons-material';
import { reportService } from '../../services/reportService';

const ActivityReport = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange.start.toISOString().split('T')[0],
        end_date: dateRange.end.toISOString().split('T')[0]
      };
      
      const data = await reportService.getUserActivityReport(params);
      setReportData(data);
    } catch (error) {
      console.error('Failed to load report:', error);
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
          Report Period
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
            <Button variant="contained" onClick={loadReport}>
              Generate Report
            </Button>
          </Box>
        </LocalizationProvider>
      </Paper>

      {reportData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">{reportData.active_users}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Active Users
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
                    <Image sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">{reportData.total_generations}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Generations
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
                    <ModelTraining sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">{reportData.total_training_jobs}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Training Jobs
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
                    <TrendingUp sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4">${reportData.total_cost?.toFixed(2) || '0.00'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Cost
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Users Table */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Users by Activity
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Generations</TableCell>
                    <TableCell align="right">Training Jobs</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.top_users?.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar>{user.username.charAt(0).toUpperCase()}</Avatar>
                          <Typography>{user.username}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{user.generations}</TableCell>
                      <TableCell align="right">{user.training_jobs}</TableCell>
                      <TableCell align="right">${user.total_cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ActivityReport;
