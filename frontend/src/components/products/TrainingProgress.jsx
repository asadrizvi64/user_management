import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, LinearProgress, Alert,
  Button, Chip, Card, CardContent, Grid, List, ListItem,
  ListItemText, Divider, IconButton
} from '@mui/material';
import { 
  Stop, Refresh, Download, ArrowBack, 
  CheckCircle, Error, PlayArrow, Pause 
} from '@mui/icons-material';
import { trainingService } from '../../services/trainingService';

const TrainingProgress = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
      connectToProgressStream();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const jobData = await trainingService.getTrainingJob(jobId);
      setJob(jobData);
      setProgress(jobData.progress);
    } catch (error) {
      setError('Failed to load training job details');
    } finally {
      setIsLoading(false);
    }
  };

  const connectToProgressStream = () => {
    const eventSource = new EventSource(`/api/training/jobs/${jobId}/progress`);
    
    eventSource.onmessage = (event) => {
      const progressData = JSON.parse(event.data);
      setProgress(progressData.step);
      
      // Update job status if needed
      if (progressData.status === 'completed') {
        setJob(prev => ({ ...prev, status: 'completed' }));
        eventSource.close();
      } else if (progressData.status === 'failed') {
        setJob(prev => ({ ...prev, status: 'failed' }));
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('Progress stream error:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  };

  const loadLogs = async () => {
    try {
      const response = await trainingService.getTrainingLogs(jobId);
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to load logs');
    }
  };

  const stopTraining = async () => {
    try {
      await trainingService.stopTraining(jobId);
      setJob(prev => ({ ...prev, status: 'cancelled' }));
    } catch (error) {
      setError('Failed to stop training');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      case 'running': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      case 'running': return <PlayArrow />;
      case 'cancelled': return <Pause />;
      default: return <PlayArrow />;
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading training details...</Typography>
        </Box>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Training job not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/products')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Training: {job.product_name}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Training Status</Typography>
                <Chip
                  icon={getStatusIcon(job.status)}
                  label={job.status.toUpperCase()}
                  color={getStatusColor(job.status)}
                  variant="outlined"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Progress: {progress}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Typography variant="body2" color="textSecondary" gutterBottom>
                Started: {new Date(job.created_at).toLocaleString()}
              </Typography>

              {job.completed_at && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Completed: {new Date(job.completed_at).toLocaleString()}
                </Typography>
              )}

              {job.message && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {job.message}
                </Typography>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                {job.status === 'running' && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Stop />}
                    onClick={stopTraining}
                  >
                    Stop Training
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadLogs}
                >
                  Refresh Logs
                </Button>

                {job.status === 'completed' && (
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => navigate(`/products/${job.product_id}/download`)}
                  >
                    Download Model
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Configuration Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Configuration</Typography>
              
              {job.config && (
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Base Model"
                      secondary={job.config.base_model}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Resolution"
                      secondary={`${job.config.resolution}px`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Epochs"
                      secondary={job.config.max_train_epochs}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Learning Rate"
                      secondary={job.config.learning_rate}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Network Dimension"
                      secondary={job.config.network_dim}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Training Logs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Training Logs</Typography>
            
            <Box
              sx={{
                maxHeight: 400,
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <Box key={index} sx={{ mb: 0.5 }}>
                    {log}
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary">
                  No logs available yet...
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TrainingProgress;