import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL } from '../config'; // Import from config.js to ensure consistency

// Type for axios error
interface AxiosError {
  config?: AxiosRequestConfig;
  response?: {
    status: number;
    data: any;
  };
}

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Ensure cookies are sent with every request
});

// Add request interceptor to include auth token when available
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      // Ensure token format is correct
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = formattedToken;
      console.log(`API request with auth token: ${config.url}`, formattedToken.substring(0, 15) + '...');
    } else {
      console.log('API request without auth token:', config.url);
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API response success: ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error(`API response error: ${error.config?.url}`, error.response?.status, error.response?.data);
    // If token is invalid or expired (401), clear it
    if (error.response?.status === 401) {
      console.log('Unauthorized response - clearing token');
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// Override the global axios instance to use our configured instance for all requests
// This is important to ensure all API calls use the same configuration
const originalAxios = axios.create;
axios.create = function(config?: AxiosRequestConfig) {
  const instance = originalAxios(config);
  // Apply the same interceptors to all axios instances
  instance.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled);
  instance.interceptors.response.use(
    api.interceptors.response.handlers[0].fulfilled,
    api.interceptors.response.handlers[0].rejected
  );
  return instance;
};

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await api.get('/users/me/');
        setUser(response.data);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Log login attempt for debugging
      console.log(`Attempting login for email: ${email}`);
      
      // Use direct axios call for login to avoid potential issues with interceptors
      const response = await axios.post(`http://3.25.95.103/api/users/login/`, 
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      const { access, user } = response.data;
      
      // Debug the token
      console.log('Login successful, received token:', access.substring(0, 10) + '...');
      
      // Save token to localStorage
      localStorage.setItem('auth_token', access);
      
      // Set user in state
      setUser(user);
      
      // Log that we're setting up the auth header for future requests
      console.log('Auth token stored for future requests');
      
      return response.data;
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.post('/users/logout/');
      localStorage.removeItem('auth_token');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/users/register/', { username, email, password });
      const { access, user } = response.data;
      localStorage.setItem('auth_token', access);
      setUser(user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('auth_token');
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 