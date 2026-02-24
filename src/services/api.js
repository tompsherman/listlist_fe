/**
 * API Service - Axios instance with interceptors
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token getter - set by UserContext
let getAccessToken = null;

export function setTokenGetter(getter) {
  getAccessToken = getter;
}

// Request interceptor - inject auth token
api.interceptors.request.use(
  async (config) => {
    if (getAccessToken) {
      try {
        const token = await getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get access token:', error.message);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle standardized response shape
api.interceptors.response.use(
  (response) => {
    const { success, data, meta, error } = response.data;
    
    if (success === false) {
      return Promise.reject({
        code: error?.code || 'UNKNOWN_ERROR',
        message: error?.message || 'An error occurred',
        status: response.status,
      });
    }
    
    const result = data;
    if (meta) {
      result._meta = meta;
    }
    return result;
  },
  (error) => {
    if (error.response) {
      const { data, status } = error.response;
      return Promise.reject({
        code: data?.error?.code || 'SERVER_ERROR',
        message: data?.error?.message || error.message,
        status,
      });
    }
    
    if (error.request) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server',
        status: 0,
      });
    }
    
    return Promise.reject({
      code: 'REQUEST_ERROR',
      message: error.message,
      status: 0,
    });
  }
);

export default api;
