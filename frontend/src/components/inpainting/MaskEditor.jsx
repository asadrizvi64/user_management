import React, { useRef, useEffect, useState } from 'react';
import {
  Box, Button, Slider, Typography, ButtonGroup, IconButton,
  Tooltip
} from '@mui/material';
import { Brush, Clear, Undo } from '@mui/icons-material';

const MaskEditor = ({ baseImage, onMaskUpdate }) => {
  const canvasRef = useRef();
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (baseImage && canvasRef.current) {
      initializeCanvas();
    }
  }, [baseImage]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the base image with transparency
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1.0;
      
      // Initialize mask layer
      ctx.globalCompositeOperation = 'source-over';
      saveToHistory();
    };
    img.src = baseImage;
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    setHistory(prev => [...prev.slice(-9), imageData]); // Keep last 10 states
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
      updateMask();
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; // Red for mask
    } else {
      ctx.globalCompositeOperation = 'destination-out';
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw base image
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1.0;
      saveToHistory();
      updateMask();
    };
    img.src = baseImage;
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        updateMask();
      };
      img.src = newHistory[newHistory.length - 1];
    }
  };

  const updateMask = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Create a mask-only canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    
    // Get image data and create binary mask
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i];
      const alpha = data[i + 3];
      
      // If there's red color (mask), make it white, otherwise black
      if (red > 100 && alpha > 100) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A
      } else {
        data[i] = 0;       // R
        data[i + 1] = 0;   // G
        data[i + 2] = 0;   // B
        data[i + 3] = 255; // A
      }
    }
    
    maskCtx.putImageData(imageData, 0, 0);
    const maskDataUrl = maskCanvas.toDataURL();
    onMaskUpdate(maskDataUrl);
  };

  if (!baseImage) {
    return (
      <Box
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #ccc',
          borderRadius: 2,
          color: 'text.secondary'
        }}
      >
        <Typography>Upload a base image first</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Tools */}
      <Box sx={{ mb: 2 }}>
        <ButtonGroup size="small" sx={{ mb: 2 }}>
          <Button
            variant={tool === 'brush' ? 'contained' : 'outlined'}
            onClick={() => setTool('brush')}
            startIcon={<Brush />}
          >
            Brush
          </Button>
          <Button
            variant={tool === 'eraser' ? 'contained' : 'outlined'}
            onClick={() => setTool('eraser')}
          >
            Eraser
          </Button>
        </ButtonGroup>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Clear mask">
            <IconButton onClick={clearMask} size="small">
              <Clear />
            </IconButton>
          </Tooltip>
          <Tooltip title="Undo">
            <IconButton 
              onClick={undo} 
              size="small"
              disabled={history.length <= 1}
            >
              <Undo />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography gutterBottom sx={{ mt: 2 }}>
          Brush Size: {brushSize}px
        </Typography>
        <Slider
          value={brushSize}
          onChange={(e, value) => setBrushSize(value)}
          min={5}
          max={50}
          step={5}
          marks={[
            { value: 5, label: '5' },
            { value: 25, label: '25' },
            { value: 50, label: '50' }
          ]}
        />
      </Box>

      {/* Canvas */}
      <Box
        sx={{
          border: '2px solid #ddd',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: tool === 'brush' ? 'crosshair' : 'grab'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '400px',
            display: 'block'
          }}
        />
      </Box>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Paint over areas you want to replace with the selected product
      </Typography>
    </Box>
  );
};

export default MaskEditor;