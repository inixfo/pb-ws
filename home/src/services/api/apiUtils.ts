import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// API URL based on environment
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Authenticated API instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API instance that doesn't require authentication
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Utility functions
export const getToken = () => localStorage.getItem('auth_token');

export const isAuthenticated = () => !!getToken();

export const isNumeric = (value: string | number): boolean => {
  return !isNaN(parseFloat(value as string)) && isFinite(Number(value));
};

// Add request interceptor to include auth token when available
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      const formattedToken = token.startsWith('Bearer ') ? token.replace(/^Bearer\s+/i, '') : token;
      config.headers.Authorization = `Bearer ${formattedToken}`;
    }
    
    // Ensure baseURL is set correctly for all requests
    if (config.url && !config.url.startsWith('http')) {
      config.baseURL = API_URL;
    }
    
    console.log(`Making API request to: ${config.url}`, config);
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // If we get a 401, clear the token as it's likely invalid or expired
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// Error handler
export const handleError = (error: any) => {
  console.error('API Error:', error);
  return Promise.reject(error);
}; 