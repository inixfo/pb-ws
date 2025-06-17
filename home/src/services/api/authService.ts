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
      // Create a data object with exactly the fields the backend expects
      const data = {
        email: user.email,
        password: user.password,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || ''
      };

      // Handle phone number formatting consistently
      if (data.phone) {
        // Remove any non-digit characters
        const cleaned = data.phone.replace(/\D/g, '');
        
        // Case 1: If already has international code
        if (cleaned.startsWith('880')) {
          data.phone = cleaned;
        } 
        // Case 2: If starts with 01 (Bangladesh format)
        else if (cleaned.startsWith('01') && cleaned.length === 11) {
          data.phone = `880${cleaned.substring(1)}`;
        }
        // Case 3: If starts with just 1 (without leading 0)
        else if (cleaned.startsWith('1') && cleaned.length === 10) {
          data.phone = `880${cleaned}`;
        }
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
      // Use the same data preparation logic as the register method
      const data: UserData = {
        email: user.email,
        password: user.password,
        first_name: '',
        last_name: '',
        phone: user.phone || ''
      };

      if (user.full_name) {
        const nameParts = user.full_name.trim().split(' ');
        data.first_name = nameParts[0] || '';
        data.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      } else {
        data.first_name = user.first_name || '';
        data.last_name = user.last_name || '';
      }

      if (data.phone) {
        const cleaned = data.phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('01') && cleaned.length === 11) {
          data.phone = `880${cleaned.substring(1)}`;
        } else if (cleaned.startsWith('1') && cleaned.length === 10) {
          data.phone = `880${cleaned}`;
        } else if (cleaned.startsWith('880') && cleaned.length >= 12) {
          data.phone = cleaned;
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