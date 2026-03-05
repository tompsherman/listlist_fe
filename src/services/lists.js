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
  
  // Move checked items to pantry (legacy - prefer doneShopping)
  checkout: (listId) => api.post(`/api/lists/${listId}/checkout`),
  
  // Atomic done shopping - handles entire checkout flow
  // cart: { [listItemId]: { acquired: number, needed: number }, ... }
  doneShopping: (listId, cart) => api.post(`/api/lists/${listId}/done-shopping`, { cart }),
  
  // Use one unit of item (decrements usesRemaining, logs history)
  // Returns { isEmpty, item?, addedToGrocery? }
  useItem: (listId, itemId, data = {}) => api.post(`/api/lists/${listId}/items/${itemId}/use`, data),
  
  // Archive item with reason and optional grocery add
  // data: { reason: 'finished'|'expired'|'trashed', addToGrocery: boolean }
  archiveItem: (listId, itemId, data) => api.post(`/api/lists/${listId}/items/${itemId}/archive`, data),
  
  // Split container into smaller units
  // data: { targetSize: 'pint'|'quart'|..., count: number }
  splitItem: (listId, itemId, data) => api.post(`/api/lists/${listId}/items/${itemId}/split`, data),
  
  // Break down item into components (e.g., whole chicken → meat + bones)
  breakdownItem: (listId, itemId) => api.post(`/api/lists/${listId}/items/${itemId}/breakdown`),
};
