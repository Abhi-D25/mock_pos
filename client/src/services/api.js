const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_KEY = import.meta.env.VITE_API_KEY || 'minghin-pos-api-key-2026';

// Helper function for making API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add API key for protected endpoints
  if (options.requiresAuth !== false) {
    headers['X-API-Key'] = API_KEY;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

// Orders API
export const ordersApi = {
  // Create new order
  create: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  // Get all orders
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const query = params.toString();
    return apiRequest(`/orders${query ? '?' + query : ''}`);
  },

  // Get single order
  getById: async (orderId) => {
    return apiRequest(`/orders/${orderId}`, { requiresAuth: false });
  },

  // Update order
  update: async (orderId, updates) => {
    return apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Cancel order
  cancel: async (orderId) => {
    return apiRequest(`/orders/${orderId}`, {
      method: 'DELETE'
    });
  },

  // Get statistics
  getStats: async () => {
    return apiRequest('/orders/stats');
  }
};

// Payments API
export const paymentsApi = {
  // Process payment
  process: async (paymentData) => {
    return apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
      requiresAuth: false
    });
  },

  // Get payment by ID
  getById: async (paymentId) => {
    return apiRequest(`/payments/${paymentId}`, { requiresAuth: false });
  },

  // Get payments for order
  getByOrderId: async (orderId) => {
    return apiRequest(`/payments/order/${orderId}`, { requiresAuth: false });
  }
};

// Menu API
export const menuApi = {
  // Get full menu
  getAll: async () => {
    return apiRequest('/menu', { requiresAuth: false });
  },

  // Get menu by category
  getByCategory: async (category) => {
    return apiRequest(`/menu/${category}`, { requiresAuth: false });
  },

  // Get single item
  getItem: async (itemId) => {
    return apiRequest(`/menu/item/${itemId}`, { requiresAuth: false });
  },

  // Search menu
  search: async (query) => {
    return apiRequest(`/menu/search/query?q=${encodeURIComponent(query)}`, { requiresAuth: false });
  }
};

export default {
  orders: ordersApi,
  payments: paymentsApi,
  menu: menuApi
};
