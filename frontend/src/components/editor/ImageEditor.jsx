import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ImageIcon from '@mui/icons-material/Image';
import SchoolIcon from '@mui/icons-material/School';
import BrushIcon from '@mui/icons-material/Brush';
import CategoryIcon from '@mui/icons-material/Category';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function ImageEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      title: 'Generate Images',
      description: 'Create stunning images using trained FLUX models',
      icon: <ImageIcon sx={{ fontSize: 60 }} />,
      color: '#667eea',
      action: () => navigate('/generation'),
      stats: '1024x1024 resolution'
    },
    {
      title: 'Train Models',
      description: 'Train custom LoRA models with your product images',
      icon: <SchoolIcon sx={{ fontSize: 60 }} />,
      color: '#764ba2',
      action: () => navigate('/training'),
      stats: '5-150 images'
    },
    {
      title: 'Inpainting',
      description: 'Edit and replace parts of images with AI',
      icon: <BrushIcon sx={{ fontSize: 60 }} />,
      color: '#f093fb',
      action: () => navigate('/inpainting'),
      stats: 'FLUX Fill model'
    },
    {
      title: 'Manage Products',
      description: 'View and manage your trained product models',
      icon: <CategoryIcon sx={{ fontSize: 60 }} />,
      color: '#4facfe',
      action: () => navigate('/products'),
      stats: 'Public & Private'
    },
    {
      title: 'View History',
      description: 'Browse your generation history and downloads',
      icon: <HistoryIcon sx={{ fontSize: 60 }} />,
      color: '#43e97b',
      action: () => navigate('/history'),
      stats: 'All generations'
    },
    {
      title: 'Reports',
      description: 'View analytics and cost tracking',
      icon: <AssessmentIcon sx={{ fontSize: 60 }} />,
      color: '#fa709a',
      action: () => navigate('/reports'),
      stats: user?.role === 'admin' ? 'Admin only' : 'Your stats',
      adminOnly: true
    }
  ];

  // Filter features based on user role
  const visibleFeatures = features.filter(
    feature => !feature.adminOnly || user?.role === 'admin'
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome back, {user?.username || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          What would you like to create today?
        </Typography>
      </Box>

      {/* Feature Cards Grid */}
      <Grid container spacing={3}>
        {visibleFeatures.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              elevation={3}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}05 100%)`,
                border: `1px solid ${feature.color}30`,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 24px ${feature.color}40`,
                  borderColor: feature.color,
                }
              }}
              onClick={feature.action}
            >
              <CardContent sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: `${feature.color}20`,
                      color: feature.color,
                      margin: '0 auto 16px',
                      border: `2px solid ${feature.color}40`
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                    {feature.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {feature.description}
                  </Typography>
                </Box>

                <Box>
                  <Chip 
                    label={feature.stats} 
                    size="small" 
                    sx={{ 
                      bgcolor: `${feature.color}20`,
                      color: feature.color,
                      fontWeight: 500,
                      mb: 2
                    }} 
                  />
                  
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: feature.color,
                      '&:hover': {
                        bgcolor: feature.color,
                        opacity: 0.9
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </Box>
              </CardContent>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Quick Start Guide */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚀 Quick Start Guide
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
                    1
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Create Product
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Add product name and trigger word
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#764ba2', mb: 1 }}>
                    2
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Upload Images
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    5-150 training images
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f093fb', mb: 1 }}>
                    3
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Train Model
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    15-60 minutes
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#4facfe', mb: 1 }}>
                    4
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Generate
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Create stunning images
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/training')}
                sx={{ borderRadius: 2 }}
              >
                Start Your First Training
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* System Status */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              🔧 System Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#43e97b' }} />
                  <Typography variant="body2">Backend API: Online</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#43e97b' }} />
                  <Typography variant="body2">ComfyUI: Connected</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#43e97b' }} />
                  <Typography variant="body2">FLUX Model: Ready</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}