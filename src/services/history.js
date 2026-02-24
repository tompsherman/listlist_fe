/**
 * History API Service
 */

import api from './api';

export const historyApi = {
  getRecent: (podId, limit = 50) => api.get('/api/history', { params: { podId, limit } }),
  getStats: (podId) => api.get('/api/history/stats', { params: { podId } }),
  getExpiring: (days = 7) => api.get('/api/lists/expiring', { params: { days } }),
};
