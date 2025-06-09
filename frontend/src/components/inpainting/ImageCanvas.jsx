import React, { useRef } from 'react';
import {
  Box, Button, Typography, Paper
} from '@mui/material';
import { CloudUpload, Image } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

const ImageCanvas = ({ image, onImageUpload, title }) => {
  const fileInputRef = useRef();

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    noClick: !!image
  });

  const handleManualUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <Box>
      {!image ? (
        <Paper
          {...getRootProps()}
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDragActive ? '#f5f5f5' : 'inherit',
            '&:hover': { backgroundColor: '#f9f9f9' }
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {title || 'Upload Image'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isDragActive
              ? 'Drop the image here...'
              : 'Drag & drop an image here, or click to select'
            }
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Box
            sx={{
              position: 'relative',
              border: '2px solid #ddd',
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2
            }}
          >
            <img
              src={image}
              alt="Canvas"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '400px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </Box>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={handleManualUpload}
            startIcon={<Image />}
          >
            Change Image
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </Box>
      )}
    </Box>
  );
};

export default ImageCanvas;