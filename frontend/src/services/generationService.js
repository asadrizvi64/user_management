import api from './api';

export const generationService = {
  // Generate images
  async generateImages(requestData) {
    const response = await api.post('/api/generation/generate', requestData);
    return response.data;
  },

  // Get generation history
  async getGenerations(params = {}) {
    const response = await api.get('/api/generation/history', { params });
    return response.data;
  },

  // Get specific generation
  async getGeneration(generationId) {
    const response = await api.get(`/api/generation/${generationId}`);
    return response.data;
  },

  // Delete generation
  async deleteGeneration(generationId) {
    const response = await api.delete(`/api/generation/${generationId}`);
    return response.data;
  }
};