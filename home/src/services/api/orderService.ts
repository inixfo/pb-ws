import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

class OrderService {
  async getOrders(params = {}) {
    try {
      const response = await axios.get(`${API_URL}/orders/`, {
        headers: getAuthHeaders(),
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { results: [] };
    }
  }

  async getOrderById(orderId: string) {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      return null;
    }
  }

  async createOrder(orderData: any) {
    console.log('Creating order with data:', orderData);
    try {
      const url = `${API_URL}/orders/`;
      console.log('Order API URL:', url);
      
      const headers = getAuthHeaders();
      console.log('Request headers:', headers);
      
      const response = await axios.post(url, orderData, {
        headers: headers
      });
      
      console.log('Order creation success response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  }

  async cancelOrder(orderId: string) {
    try {
      const response = await axios.post(
        `${API_URL}/orders/${orderId}/cancel/`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  }

  async getOrderTracking(orderId: string) {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/tracking/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching tracking for order ${orderId}:`, error);
      return null;
    }
  }
}

export default new OrderService(); 