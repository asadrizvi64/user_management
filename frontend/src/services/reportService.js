import api from './api';

export const reportService = {
  // Get user activity report (admin only)
  async getUserActivityReport(params = {}) {
    const response = await api.get('/api/reports/user-activity', { params });
    return response.data;
  },

  // Get cost analysis report (admin only)
  async getCostAnalysisReport(params = {}) {
    const response = await api.get('/api/reports/cost-analysis', { params });
    return response.data;
  },

  // Get generation statistics
  async getGenerationStats(params = {}) {
    const response = await api.get('/api/reports/generation-stats', { params });
    return response.data;
  }
};
