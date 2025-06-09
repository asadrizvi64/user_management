import api from './api';

export const trainingService = {
  // Start training
  async startTraining(formData) {
    const response = await api.post('/api/training/start', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 1 minute timeout for file upload
    });
    return response.data;
  },

  // Get training jobs
  async getTrainingJobs() {
    const response = await api.get('/api/training/jobs');
    return response.data;
  },

  // Get specific training job
  async getTrainingJob(jobId) {
    const response = await api.get(`/api/training/jobs/${jobId}`);
    return response.data;
  },

  // Get training logs
  async getTrainingLogs(jobId) {
    const response = await api.get(`/api/training/jobs/${jobId}/logs`);
    return response.data;
  },

  // Stop training
  async stopTraining(jobId) {
    const response = await api.post(`/api/training/jobs/${jobId}/stop`);
    return response.data;
  },

  // Generate auto captions
  async generateAutoCaptions(formData) {
    const response = await api.post('/api/training/auto-caption', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get base models
  async getBaseModels() {
    const response = await api.get('/api/training/base-models');
    return response.data;
  },

  // Get default training parameters
  async getDefaultParams() {
    const response = await api.get('/api/training/training-params');
    return response.data;
  },

  // Stream training progress
  createProgressStream(jobId) {
    return new EventSource(`${api.defaults.baseURL}/api/training/jobs/${jobId}/progress`);
  }
};
