import api from './api';

export const userService = {
  // Get users (admin only)
  async getUsers(params = {}) {
    const response = await api.get('/api/users/', { params });
    return response.data;
  },

  // Create user (admin only)
  async createUser(userData) {
    const response = await api.post('/api/users/', userData);
    return response.data;
  },

  // Update user
  async updateUser(userId, userData) {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (admin only)
  async deleteUser(userId) {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  },

  // Toggle user status (admin only)
  async toggleUserStatus(userId) {
    const response = await api.post(`/api/users/${userId}/toggle-status`);
    return response.data;
  }
};
