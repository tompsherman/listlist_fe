import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const API_URL = "https://listlist-db.onrender.com/api";

/**
 * Hook that provides authenticated API methods
 * Automatically includes Auth0 token in requests when available
 */
export const useApi = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const getHeaders = useCallback(async () => {
    if (!isAuthenticated) return {};
    
    try {
      const token = await getAccessTokenSilently();
      return {
        Authorization: `Bearer ${token}`,
      };
    } catch (e) {
      console.error("Error getting token:", e);
      return {};
    }
  }, [getAccessTokenSilently, isAuthenticated]);

  const get = useCallback(async (endpoint) => {
    const headers = await getHeaders();
    const response = await axios.get(`${API_URL}${endpoint}`, { headers });
    return response.data;
  }, [getHeaders]);

  const post = useCallback(async (endpoint, data) => {
    const headers = await getHeaders();
    const response = await axios.post(`${API_URL}${endpoint}`, data, { headers });
    return response.data;
  }, [getHeaders]);

  const put = useCallback(async (endpoint, data) => {
    const headers = await getHeaders();
    const response = await axios.put(`${API_URL}${endpoint}`, data, { headers });
    return response.data;
  }, [getHeaders]);

  const patch = useCallback(async (endpoint, data) => {
    const headers = await getHeaders();
    const response = await axios.patch(`${API_URL}${endpoint}`, data, { headers });
    return response.data;
  }, [getHeaders]);

  const del = useCallback(async (endpoint) => {
    const headers = await getHeaders();
    const response = await axios.delete(`${API_URL}${endpoint}`, { headers });
    return response.data;
  }, [getHeaders]);

  return { get, post, put, patch, del, API_URL };
};

export default useApi;
