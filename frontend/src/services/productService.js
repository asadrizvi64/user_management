import api from './api';

export const productService = {
  // Create product
  async createProduct(formData) {
    const response = await api.post('/api/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get products
  async getProducts(params = {}) {
    const response = await api.get('/api/products/', { params });
    return response.data;
  },

  // Get specific product
  async getProduct(productId) {
    const response = await api.get(`/api/products/${productId}`);
    return response.data;
  },

  // Update product
  async updateProduct(productId, formData) {
    const response = await api.put(`/api/products/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete product
  async deleteProduct(productId) {
    const response = await api.delete(`/api/products/${productId}`);
    return response.data;
  },

  // Download product model
  async downloadProduct(productId) {
    const response = await api.get(`/api/products/${productId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }
};
