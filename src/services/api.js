const API_URL = 'http://localhost:5000/api';

export const api = {
  // Get all products
  getAllProducts: async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Get product by barcode
  getProductByBarcode: async (barcode) => {
    try {
      const response = await fetch(`${API_URL}/products/barcode/${barcode}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Search products
  searchProducts: async (query) => {
    try {
      const response = await fetch(`${API_URL}/products/search/${query}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Get product detail
  getProduct: async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Add to history
  addToHistory: async (productId) => {
    try {
      const response = await fetch(`${API_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Get history
  getHistory: async () => {
    try {
      const response = await fetch(`${API_URL}/history`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: error.message };
    }
  },

  // Clear all history
  clearHistory: async () => {
    try {
      const response = await fetch(`${API_URL}/history/clear`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};