/**
 * Dishes API Service
 */

import api from './api';

export const dishesApi = {
  getAll: (podId) => api.get('/api/dishes', { params: { podId } }),
  getById: (id) => api.get(`/api/dishes/${id}`),
  create: (data) => api.post('/api/dishes', data),
  update: (id, data) => api.patch(`/api/dishes/${id}`, data),
  cook: (id) => api.post(`/api/dishes/${id}/cook`),
  delete: (id) => api.delete(`/api/dishes/${id}`),
};
