import api from './api';

export const authService = {
  // Login
  async login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    return response.data;
  },

  // Register
  async register(userData) {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Logout
  logout() {
    localStorage.removeItem('access_token');
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!localStorage.getItem('access_token');
  }
};
