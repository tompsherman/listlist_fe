/**
 * Items (Catalog) API Service
 */

import api from './api';

export const itemsApi = {
  // Search/list items
  search: (params = {}) => api.get('/api/items', { params }),
  
  // Create custom item
  create: (data) => api.post('/api/items', data),
};
