/**
 * Pods API Service
 */

import api from './api';

export const podsApi = {
  get: (id) => api.get(`/api/pods/${id}`),
  invite: (id, email, role = 'unrestricted') => api.post(`/api/pods/${id}/invite`, { email, role }),
  join: () => api.post('/api/pods/join'),
  removeMember: (podId, userId) => api.delete(`/api/pods/${podId}/members/${userId}`),
};
