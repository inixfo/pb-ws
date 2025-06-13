import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

class UserService {
  async getProfile() {
    try {
      const response = await axios.get(`${API_URL}/users/profile/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async updateProfile(userData: any) {
    try {
      const response = await axios.put(`${API_URL}/users/profile/`, userData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async changePassword(passwordData: { current_password: string; new_password: string }) {
    try {
      const response = await axios.post(`${API_URL}/users/change-password/`, passwordData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async getAddresses() {
    try {
      const response = await axios.get(`${API_URL}/users/addresses/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      return [];
    }
  }

  async addAddress(addressData: any) {
    try {
      const response = await axios.post(`${API_URL}/users/addresses/`, addressData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  async updateAddress(addressId: number, addressData: any) {
    try {
      const response = await axios.put(`${API_URL}/users/addresses/${addressId}/`, addressData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating address ${addressId}:`, error);
      throw error;
    }
  }

  async deleteAddress(addressId: number) {
    try {
      await axios.delete(`${API_URL}/users/addresses/${addressId}/`, {
        headers: getAuthHeaders()
      });
      return true;
    } catch (error) {
      console.error(`Error deleting address ${addressId}:`, error);
      throw error;
    }
  }
}

export default new UserService(); 