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
        // Store the tokens in localStorage with expiration time
        localStorage.setItem('auth_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        
        // Store the expiration time (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        localStorage.setItem('token_expires_at', expiresAt.toISOString());
        
        // Also store user email for convenience
        localStorage.setItem('user_email', email);
        
        // Setup automatic token refresh
        this.setupTokenRefresh();
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
    const token = localStorage.getItem('auth_token');
    const expiresAtStr = localStorage.getItem('token_expires_at');
    
    if (!token) return false;
    
    // If we have an expiration time, check if the token is still valid
    if (expiresAtStr) {
      const expiresAt = new Date(expiresAtStr);
      const now = new Date();
      
      // If token is expired, clear it and return false
      if (now > expiresAt) {
        console.log('Token expired, clearing...');
        this.logout();
        return false;
      }
    }
    
    return true;
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
        
        // Update expiration time (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        localStorage.setItem('token_expires_at', expiresAt.toISOString());
        
        console.log('Token refreshed successfully');
      }

      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.logout();
      throw error;
    }
  }
  
  setupTokenRefresh() {
    // Check if token needs refresh
    const checkTokenExpiry = () => {
      const expiresAtStr = localStorage.getItem('token_expires_at');
      const token = localStorage.getItem('auth_token');
      
      if (!token || !expiresAtStr) return;
      
      const expiresAt = new Date(expiresAtStr);
      const now = new Date();
      
      // If token expires in less than 1 day, refresh it
      const oneDayInMs = 24 * 60 * 60 * 1000;
      if (expiresAt.getTime() - now.getTime() < oneDayInMs) {
        console.log('Token expiring soon, refreshing...');
        this.refreshToken().catch(err => {
          console.error('Failed to refresh token:', err);
        });
      }
    };
    
    // Check token expiry now
    checkTokenExpiry();
    
    // Set up interval to check token expiry every hour
    setInterval(checkTokenExpiry, 60 * 60 * 1000);
  }
}

export default new AuthService(); 