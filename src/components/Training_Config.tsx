import React, { useState, useRef } from 'react';
import { Upload, Settings, Play, Info, X, Plus, Trash2 } from 'lucide-react';

const TrainingConfigModal = ({ 
  isOpen, 
  onClose, 
  productId, 
  productName, 
  onTrainingStart 
}) => {
  const [config, setConfig] = useState({
    base_model: 'flux-dev',
    trigger_word: '',
    product_name: productName || '',
    vram: '16G',
    max_epochs: 16,
    learning_rate: '8e-4',
    network_dim: 4,
    resolution: 512,
    num_repeats: 10,
    sample_prompts: [''],
    sample_every_n_steps: 100,
    save_every_n_epochs: 4,
    seed: 42,
    workers: 2,
    timestep_sampling: 'shift',
    guidance_scale: 1.0,
    base_caption: 'product image'
  });

  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + images.length > 150) {
      alert('Maximum 150 images allowed');
      return;
    }
    if (files.length + images.length < 2) {
      alert('Minimum 2 images required');
      return;
    }
    
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const addSamplePrompt = () => {
    setConfig(prev => ({
      ...prev,
      sample_prompts: [...prev.sample_prompts, '']
    }));
  };

  const updateSamplePrompt = (index, value) => {
    setConfig(prev => ({
      ...prev,
      sample_prompts: prev.sample_prompts.map((prompt, i) => 
        i === index ? value : prompt
      )
    }));
  };

  const removeSamplePrompt = (index) => {
    setConfig(prev => ({
      ...prev,
      sample_prompts: prev.sample_prompts.filter((_, i) => i !== index)
    }));
  };

  const calculateTrainingTime = () => {
    const totalSteps = config.max_epochs * images.length * config.num_repeats;
    const estimatedMinutes = Math.ceil(totalSteps / 60); // Rough estimate
    return estimatedMinutes;
  };

  const handleStartTraining = async () => {
    if (images.length < 2) {
      alert('Please upload at least 2 images');
      return;
    }
    
    if (!config.trigger_word.trim()) {
      alert('Please enter a trigger word');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Add images
      images.forEach(img => {
        formData.append('images', img.file);
      });
      
      // Add config
      formData.append('config', JSON.stringify(config));

      const response = await fetch(`/api/training/products/${productId}/start`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        onTrainingStart(result);
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to start training: ${error.detail}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Train Product Model</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span>Images</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span>Configuration</span>
            </div>
            <div className="w-8 h-px bg-gray-300" />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span>Review</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Image Upload */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Upload Training Images</h3>
                <p className="text-gray-600 mb-4">
                  Upload 2-150 high-quality images of your product. Include various angles, lighting conditions, and contexts.
                </p>
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload images
                </p>
                <p className="text-gray-500">
                  Support JPG, PNG. Max 150 images.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {images.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Uploaded Images ({images.length})</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {images.map(img => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.preview}
                          alt="Training image"
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={images.length < 2}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next: Configuration
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Training Configuration</h3>
                <p className="text-gray-600 mb-4">
                  Configure the training parameters for your product model.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Basic Settings</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trigger Word *
                    </label>
                    <input
                      type="text"
                      value={config.trigger_word}
                      onChange={(e) => handleConfigChange('trigger_word', e.target.value)}
                      placeholder="e.g., MYPRODUCT, BRAND123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      A unique word to trigger your product in prompts
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Model
                    </label>
                    <select
                      value={config.base_model}
                      onChange={(e) => handleConfigChange('base_model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="flux-dev">FLUX.1-dev (Recommended)</option>
                      <option value="flux-schnell">FLUX.1-schnell (Faster)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      VRAM Setting
                    </label>
                    <select
                      value={config.vram}
                      onChange={(e) => handleConfigChange('vram', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="12G">12GB VRAM</option>
                      <option value="16G">16GB VRAM</option>
                      <option value="20G">20GB+ VRAM</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800">Advanced Settings</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Training Epochs
                    </label>
                    <input
                      type="number"
                      value={config.max_epochs}
                      onChange={(e) => handleConfigChange('max_epochs', parseInt(e.target.value))}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Learning Rate
                    </label>
                    <input
                      type="text"
                      value={config.learning_rate}
                      onChange={(e) => handleConfigChange('learning_rate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LoRA Rank
                    </label>
                    <input
                      type="number"
                      value={config.network_dim}
                      onChange={(e) => handleConfigChange('network_dim', parseInt(e.target.value))}
                      min="4"
                      max="128"
                      step="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sample Prompts */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Sample Prompts (Optional)</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add prompts to generate sample images during training to monitor progress.
                </p>
                
                {config.sample_prompts.map((prompt, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => updateSamplePrompt(index, e.target.value)}
                      placeholder={`${config.trigger_word || 'TRIGGER'} on a white background`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {config.sample_prompts.length > 1 && (
                      <button
                        onClick={() => removeSamplePrompt(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  onClick={addSamplePrompt}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Prompt</span>
                </button>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back: Images
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Start */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Review & Start Training</h3>
                <p className="text-gray-600 mb-4">
                  Review your configuration and start the training process.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800">Dataset</h4>
                    <p className="text-gray-600">{images.length} images</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Trigger Word</h4>
                    <p className="text-gray-600">{config.trigger_word}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Base Model</h4>
                    <p className="text-gray-600">{config.base_model}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">VRAM Setting</h4>
                    <p className="text-gray-600">{config.vram}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Training Epochs</h4>
                    <p className="text-gray-600">{config.max_epochs}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Estimated Time</h4>
                    <p className="text-gray-600">{calculateTrainingTime()} minutes</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Training Notes</h4>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Training will run in the background</li>
                      <li>• You can monitor progress on the product dashboard</li>
                      <li>• Sample images will be generated during training</li>
                      <li>• The trained model will be available for download when complete</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back: Configuration
                </button>
                <button
                  onClick={handleStartTraining}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Starting Training...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start Training</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingConfigModal;