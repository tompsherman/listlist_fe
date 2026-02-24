/**
 * Lists API Service
 */

import api from './api';

export const listsApi = {
  // Get all lists (optionally filter by podId or type)
  getAll: (params = {}) => api.get('/api/lists', { params }),
  
  // Get single list with items
  getById: (id) => api.get(`/api/lists/${id}`),
  
  // Create list
  create: (data) => api.post('/api/lists', data),
  
  // Add item to list
  addItem: (listId, data) => api.post(`/api/lists/${listId}/items`, data),
  
  // Update list item
  updateItem: (listId, itemId, data) => api.patch(`/api/lists/${listId}/items/${itemId}`, data),
  
  // Remove item from list
  removeItem: (listId, itemId) => api.delete(`/api/lists/${listId}/items/${itemId}`),
  
  // Move checked items to pantry
  checkout: (listId) => api.post(`/api/lists/${listId}/checkout`),
};
