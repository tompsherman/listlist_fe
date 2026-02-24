/**
 * Dishes API Service
 */

import api from './api';

export const dishesApi = {
  getAll: (podId) => api.get('/api/dishes', { params: { podId } }),
  create: (data) => api.post('/api/dishes', data),
  cook: (id) => api.post(`/api/dishes/${id}/cook`),
  delete: (id) => api.delete(`/api/dishes/${id}`),
};
