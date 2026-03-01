/**
 * Items (Catalog) API Service
 */

import api from './api';

export const itemsApi = {
  // Search/list items
  search: (params = {}) => api.get('/api/items', { params }),
  
  // Create custom item
  create: (data) => api.post('/api/items', data),
  
  // Update item (pod-created items only)
  update: (id, data) => api.patch(`/api/items/${id}/user`, data),
};
