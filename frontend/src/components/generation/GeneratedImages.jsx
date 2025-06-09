import React, { useState } from 'react';
import {
  Grid, Card, CardMedia, CardContent, CardActions, Button,
  Typography, Box, Dialog, DialogContent, IconButton, Chip,
  Tooltip, Menu, MenuItem
} from '@mui/material';
import {
  Download, Share, Delete, ZoomIn, Close, MoreVert,
  AccessTime, MonetizationOn
} from '@mui/icons-material';

const GeneratedImages = ({ images, isGenerating }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  const handleImageClick = (imagePath) => {
    setSelectedImage(imagePath);
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
  };

  const handleMenuClick = (event, generation) => {
    setAnchorEl(event.currentTarget);
    setSelectedGeneration(generation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGeneration(null);
  };

  const downloadImage = (imagePath, filename) => {
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = filename || 'generated-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatExecutionTime = (seconds) => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatCost = (cost) => {
    return cost ? `$${cost.toFixed(3)}` : 'Free';
  };

  if (images.length === 0 && !isGenerating) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 8,
          color: 'text.secondary'
        }}
      >
        <Typography variant="h6" gutterBottom>
          No images generated yet
        </Typography>
        <Typography variant="body2">
          Use the controls on the left to generate your first images
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={2}>
        {images.map((generation) => (
          generation.image_paths.map((imagePath, imageIndex) => (
            <Grid item xs={12} sm={6} md={4} key={`${generation.id}-${imageIndex}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={imagePath}
                  alt={`Generated image ${imageIndex + 1}`}
                  sx={{ 
                    cursor: 'pointer',
                    objectFit: 'cover'
                  }}
                  onClick={() => handleImageClick(imagePath)}
                />
                
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {generation.prompt}
                  </Typography>
                  
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<AccessTime />}
                      label={formatExecutionTime(generation.execution_time)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<MonetizationOn />}
                      label={formatCost(generation.cost)}
                      size="small"
                      variant="outlined"
                      color={generation.cost ? 'warning' : 'success'}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                  <Box>
                    <Tooltip title="View Full Size">
                      <IconButton 
                        size="small"
                        onClick={() => handleImageClick(imagePath)}
                      >
                        <ZoomIn />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Download">
                      <IconButton 
                        size="small"
                        onClick={() => downloadImage(imagePath, `generated-${generation.id}-${imageIndex + 1}.jpg`)}
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuClick(e, generation)}
                  >
                    <MoreVert />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        ))}
      </Grid>

      {/* Full Size Image Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              zIndex: 1,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
            onClick={handleCloseDialog}
          >
            <Close />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size generated image"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          // Handle share functionality
          handleMenuClose();
        }}>
          <Share sx={{ mr: 2 }} />
          Share
        </MenuItem>
        
        <MenuItem onClick={() => {
          // Handle delete functionality
          handleMenuClose();
        }}>
          <Delete sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default GeneratedImages;