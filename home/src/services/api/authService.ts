import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

interface UserData {
  full_name: string;
  email: string;
  password: string;
  phone: string;
}

class AuthService {
  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/users/login/`, {
        email,
        password,
      });
      if (response.data.access) {
        localStorage.setItem('auth_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(user: any) {
    try {
      const data = { ...user };

      // Map full_name -> first_name + last_name for backend compatibility
      if (data.full_name) {
        const parts = (data.full_name as string).trim().split(' ');
        data.first_name = parts[0] || '';
        data.last_name = parts.length > 1 ? parts.slice(1).join(' ') : '';
        
        // Delete full_name to prevent it being sent to the API
        delete data.full_name;
      }

      console.log('Sending registration data:', data);
      
      // Try the debug endpoint first to diagnose issues
      try {
        const debugResponse = await axios.post(`${API_URL}/users/debug-register/`, data);
        console.log('Debug registration response:', debugResponse.data);
      } catch (debugError: any) {
        console.error('Debug registration error:', debugError.response?.data || debugError.message);
      }
      
      const response = await axios.post(`${API_URL}/users/register/`, data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Log more detailed error info
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      }
      
      throw error;
    }
  }

  // New method for testing registration
  async debugRegister(user: any) {
    try {
      const data = { ...user };

      // Same as register but only using debug endpoint
      if (data.full_name) {
        const parts = (data.full_name as string).trim().split(' ');
        data.first_name = parts[0] || '';
        data.last_name = parts.length > 1 ? parts.slice(1).join(' ') : '';
        delete data.full_name;
      }

      console.log('Sending debug registration data:', data);
      const response = await axios.post(`${API_URL}/users/debug-register/`, data);
      return response.data;
    } catch (error: any) {
      console.error('Debug registration error:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      
      throw error;
    }
  }

  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Call backend logout API to blacklist the token
      if (refreshToken) {
        await axios.post(
          `${API_URL}/users/logout/`, 
          { refresh_token: refreshToken },
          { headers: getAuthHeaders() }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  getCurrentUser() {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    // Simple check if token exists
    return { authenticated: true };
  }

  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_URL}/users/token/refresh/`, {
        refresh: refreshToken,
      });

      if (response.data.access) {
        localStorage.setItem('auth_token', response.data.access);
      }

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.logout();
      throw error;
    }
  }
}

export default new AuthService(); 