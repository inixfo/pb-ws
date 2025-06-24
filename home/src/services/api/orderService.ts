import axios from 'axios';
import { API_URL } from '../../config';
import { OrderCreateRequest, OrderResponse, OrderListItem, ShippingMethod, OrderDetails, TrackingInfo } from '../../types/order';
import { getAuthHeaders } from './authHeaders';

class OrderService {
  async createOrder(orderData: OrderCreateRequest): Promise<OrderResponse> {
    try {
      const response = await axios.post(`${API_URL}/orders/`, orderData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrders(): Promise<OrderListItem[]> {
    try {
      const response = await axios.get(`${API_URL}/orders/`, {
        headers: getAuthHeaders()
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(orderId: string): Promise<OrderDetails> {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  async cancelOrder(orderId: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/orders/${orderId}/cancel/`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  }

  async getOrderTracking(orderId: string): Promise<TrackingInfo> {
    try {
      const response = await axios.get(`${API_URL}/orders/${orderId}/tracking/`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching tracking for order ${orderId}:`, error);
      throw error;
    }
  }

  async getShippingMethods(city: string): Promise<ShippingMethod[]> {
    try {
      const response = await axios.get(`${API_URL}/shipping/methods/?city=${encodeURIComponent(city)}`, {
        headers: getAuthHeaders()
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      throw error;
    }
  }

  async getShippingRates(city: string, postalCode?: string): Promise<any> {
    try {
      let url = `${API_URL}/shipping/rates/?city=${encodeURIComponent(city)}`;
      if (postalCode) {
        url += `&postal_code=${encodeURIComponent(postalCode)}`;
      }
      
      const response = await axios.get(url, {
        headers: getAuthHeaders()
      });
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      throw error;
    }
  }

  async getEMIDetails(orderId: string): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/emi/applications/order/${orderId}/`, {
        headers: getAuthHeaders()
      });
      return response;
    } catch (error) {
      console.error(`Error fetching EMI details for order ${orderId}:`, error);
      throw error;
    }
  }
}

export const orderService = new OrderService(); 