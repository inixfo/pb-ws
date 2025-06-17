import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

interface UserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
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
      // Make a copy of the user data to avoid modifying the original
      const data = {
        email: user.email,
        password: user.password,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      };

      // Validate required fields
      if (!data.email) {
        throw new Error('Email is required');
      }
      
      if (!data.password) {
        throw new Error('Password is required');
      }
      
      if (!data.phone) {
        throw new Error('Phone number is required');
      }

      // Handle phone number formatting
      if (data.phone) {
        const cleaned = data.phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('880')) {
          data.phone = cleaned;
        } else if (cleaned.startsWith('01') && cleaned.length === 11) {
          data.phone = `880${cleaned.substring(1)}`;
        } else if (cleaned.startsWith('1') && cleaned.length === 10) {
          data.phone = `880${cleaned}`;
        }
      }

      console.log('Sending registration data:', data);
      
      // First try the debug endpoint to diagnose any issues
      try {
        const debugResponse = await axios.post(`${API_URL}/users/debug-register/`, data);
        console.log('Debug registration success:', debugResponse.data);
      } catch (debugError: any) {
        console.error('Debug registration error:', debugError.response?.data || debugError.message);
      }
      
      // Make the actual registration API call
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
      // Use the same data preparation logic as the register method
      const data = {
        email: user.email,
        password: user.password,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      };

      // Validate required fields
      if (!data.email) {
        throw new Error('Email is required');
      }
      
      if (!data.password) {
        throw new Error('Password is required');
      }
      
      if (!data.phone) {
        throw new Error('Phone number is required');
      }

      // Handle phone number formatting
      if (data.phone) {
        const cleaned = data.phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('880')) {
          data.phone = cleaned;
        } else if (cleaned.startsWith('01') && cleaned.length === 11) {
          data.phone = `880${cleaned.substring(1)}`;
        } else if (cleaned.startsWith('1') && cleaned.length === 10) {
          data.phone = `880${cleaned}`;
        }
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