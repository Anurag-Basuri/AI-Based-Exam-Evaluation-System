import axios from 'axios';
import { getToken, removeToken } from '../utils/handleToken.js';

// ✅ CORRECTED: Point to your backend server running on port 8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Axios instance for authenticated requests
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Axios instance for public (unauthenticated) requests
const publicClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Attach token to requests if available
apiClient.interceptors.request.use(config => {
  const { accessToken } = getToken();
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 errors globally
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      removeToken();
      // ✅ Use window.location to force a full page reload to clear all state
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export { apiClient, publicClient };