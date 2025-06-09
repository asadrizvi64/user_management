import React, { useState } from 'react';
import {
  TextField, Button, Box, FormControl, InputLabel, Select, MenuItem,
  Slider, Typography, Accordion, AccordionSummary, AccordionDetails,
  Grid, Chip
} from '@mui/material';
import { ExpandMore, AutoFixHigh } from '@mui/icons-material';

const PromptInput = ({ onGenerate, isGenerating, selectedProduct }) => {
  const [formData, setFormData] = useState({
    prompt: '',
    negative_prompt: 'blurry, low quality, distorted, bad anatomy',
    num_images: 1,
    aspect_ratio: '1:1',
    guidance_scale: 7.5,
    num_inference_steps: 50,
    seed: null
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.prompt.trim()) return;
    onGenerate(formData);
  };

  const addTriggerWord = () => {
    if (!selectedProduct?.trigger_word) return;
    
    const triggerWord = selectedProduct.trigger_word;
    if (!formData.prompt.includes(triggerWord)) {
      setFormData(prev => ({
        ...prev,
        prompt: triggerWord + ' ' + prev.prompt
      }));
    }
  };

  const generateRandomSeed = () => {
    setFormData(prev => ({
      ...prev,
      seed: Math.floor(Math.random() * 1000000)
    }));
  };

  return (
    <Box>
      {/* Product Trigger Word Helper */}
      {selectedProduct && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Trigger word for {selectedProduct.name}:
          </Typography>
          <Chip
            label={selectedProduct.trigger_word}
            onClick={addTriggerWord}
            clickable
            color="primary"
            size="small"
            icon={<AutoFixHigh />}
          />
        </Box>
      )}

      {/* Main Prompt */}
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Prompt"
        value={formData.prompt}
        onChange={(e) => handleChange('prompt', e.target.value)}
        placeholder={selectedProduct ? 
          `${selectedProduct.trigger_word} your description here...` : 
          'Describe what you want to generate...'
        }
        margin="normal"
        required
      />

      {/* Negative Prompt */}
      <TextField
        fullWidth
        multiline
        rows={2}
        label="Negative Prompt"
        value={formData.negative_prompt}
        onChange={(e) => handleChange('negative_prompt', e.target.value)}
        margin="normal"
        helperText="Describe what you don't want in the image"
      />

      {/* Basic Settings */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Images</InputLabel>
            <Select
              value={formData.num_images}
              onChange={(e) => handleChange('num_images', e.target.value)}
            >
              {[1, 2, 3, 4].map(num => (
                <MenuItem key={num} value={num}>{num}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Aspect Ratio</InputLabel>
            <Select
              value={formData.aspect_ratio}
              onChange={(e) => handleChange('aspect_ratio', e.target.value)}
            >
              {aspectRatios.map(ratio => (
                <MenuItem key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Advanced Settings */}
      <Accordion expanded={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ mt: 2 }}>
            {/* Guidance Scale */}
            <Typography gutterBottom>
              Guidance Scale: {formData.guidance_scale}
            </Typography>
            <Slider
              value={formData.guidance_scale}
              onChange={(e, value) => handleChange('guidance_scale', value)}
              min={1}
              max={20}
              step={0.5}
              marks={[
                { value: 1, label: '1' },
                { value: 7.5, label: '7.5' },
                { value: 15, label: '15' },
                { value: 20, label: '20' }
              ]}
            />

            {/* Inference Steps */}
            <Typography gutterBottom sx={{ mt: 2 }}>
              Inference Steps: {formData.num_inference_steps}
            </Typography>
            <Slider
              value={formData.num_inference_steps}
              onChange={(e, value) => handleChange('num_inference_steps', value)}
              min={10}
              max={100}
              step={5}
              marks={[
                { value: 20, label: '20' },
                { value: 50, label: '50' },
                { value: 100, label: '100' }
              ]}
            />

            {/* Seed */}
            <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Seed (optional)"
                type="number"
                value={formData.seed || ''}
                onChange={(e) => handleChange('seed', e.target.value ? parseInt(e.target.value) : null)}
                sx={{ flexGrow: 1 }}
              />
              <Button onClick={generateRandomSeed} variant="outlined">
                Random
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Generate Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={isGenerating || !formData.prompt.trim()}
        sx={{ mt: 3 }}
      >
        {isGenerating ? 'Generating...' : 'Generate Images'}
      </Button>
    </Box>
  );
};

export default PromptInput;
