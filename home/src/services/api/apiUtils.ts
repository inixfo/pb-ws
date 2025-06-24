import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../../config';

// API URL based on config
export const API_URL = config.API_URL;

// Log the API URL for debugging
console.log('API URL initialized as:', API_URL);

// Create instance for public API endpoints (no auth required)
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Create instance for authenticated API endpoints
export const authenticatedApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Utility functions
export const getToken = () => localStorage.getItem('auth_token');

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export const isNumeric = (value: string | number): boolean => {
  return !isNaN(parseFloat(value as string)) && isFinite(Number(value));
};

// Add request interceptor for logging
publicApi.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, 
      config.params ? `Params: ${JSON.stringify(config.params)}` : '');
    return config;
  },
  (error: any) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
publicApi.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`, 
      response.data ? `Data: ${typeof response.data === 'object' ? 'Object with keys: ' + Object.keys(response.data).join(', ') : 'Non-object data'}` : '');
    return response;
  },
  (error: any) => {
    if (error.response) {
      console.error(`[API Response Error] Status: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error('[API Response Error] No response received', error.request);
    } else {
      console.error('[API Response Error]', error.message);
    }
    return Promise.reject(error);
  }
);

// Add request interceptor for authenticated requests
authenticatedApi.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`[Auth API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, 
      config.params ? `Params: ${JSON.stringify(config.params)}` : '');
    
    return config;
  },
  (error: any) => {
    console.error('[Auth API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for authenticated requests
authenticatedApi.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    console.log(`[Auth API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error: any) => {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.error('[Auth API Response Error] Unauthorized - Token may be invalid or expired');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        // You might want to dispatch an action or use a context to handle logout
      }
      
      console.error(`[Auth API Response Error] Status: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.error('[Auth API Response Error] No response received', error.request);
    } else {
      console.error('[Auth API Response Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get current user info from token
export const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
};

// Helper function for direct API calls (fallback)
export const makeDirectApiCall = async (endpoint: string, params = {}): Promise<any> => {
  try {
    console.log(`[Direct API Call] GET ${endpoint}`, params);
    const response = await axios.get(`http://52.62.201.84/api${endpoint}`, { params });
    console.log(`[Direct API Call] Success from ${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`[Direct API Call] Error from ${endpoint}:`, error);
    throw error;
  }
};

// Error handler
export const handleError = (error: any) => {
  console.error('API Error:', error);
  return Promise.reject(error);
}; 