/**
 * Items (Catalog) API Service
 */

import api from './api';

export const itemsApi = {
  // Search/list items (pass podId for proper override merging)
  search: (params = {}) => api.get('/api/items', { params }),
  
  // Create custom item
  create: (data) => api.post('/api/items', data),
  
  // Update item (creates override for global items, edits pod items directly)
  // data must include podId
  update: (id, data) => api.patch(`/api/items/${id}/user`, data),
  
  // Get pod-specific override for an item
  getOverride: (id, podId) => api.get(`/api/items/${id}/override`, { params: { podId } }),
  
  // Delete pod override (revert to global)
  deleteOverride: (id, podId) => api.delete(`/api/items/${id}/override`, { params: { podId } }),
};
