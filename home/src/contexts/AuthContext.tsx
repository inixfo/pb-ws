import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosRequestConfig } from 'axios';

const API_URL = 'http://52.62.201.84/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token when available
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified?: boolean;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<{needs_phone_verification: boolean}>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  verifyPhone: (phone: string) => Promise<{phone: string}>;
  verifyCode: (code: string, phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      const response = await api.post('/users/login/', { email, password });
      const { access, user } = response.data;
      localStorage.setItem('auth_token', access);
      setUser(user);
      navigate('/account');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/users/google-login/', { token });
      const { access, user, needs_phone_verification } = response.data;
      localStorage.setItem('auth_token', access);
      setUser(user);
      
      // If phone verification is not needed, redirect to account
      if (!needs_phone_verification) {
        navigate('/account');
      }
      
      return { needs_phone_verification };
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const verifyPhone = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/users/verify-phone/', { phone });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const verifyCode = async (code: string, phone: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/users/verify-code/', { code, phone });
      setUser(response.data.user);
      navigate('/account');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify code');
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
      navigate('/');
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
      navigate('/account');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      loginWithGoogle,
      logout, 
      register,
      verifyPhone,
      verifyCode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 