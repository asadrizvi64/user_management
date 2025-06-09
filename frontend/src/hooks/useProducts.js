import { useState, useEffect } from 'react';
import { productService } from '../services/productService';

export const useProducts = (params = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(params);
      setProducts(response.products);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [JSON.stringify(params)]);

  const createProduct = async (formData) => {
    const newProduct = await productService.createProduct(formData);
    await loadProducts(); // Refresh list
    return newProduct;
  };

  const updateProduct = async (productId, formData) => {
    const updatedProduct = await productService.updateProduct(productId, formData);
    await loadProducts(); // Refresh list
    return updatedProduct;
  };

  const deleteProduct = async (productId) => {
    await productService.deleteProduct(productId);
    await loadProducts(); // Refresh list
  };

  return {
    products,
    loading,
    error,
    total,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};