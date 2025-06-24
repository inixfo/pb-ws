import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

class PaymentService {
  async initiateSslcommerzPayment(orderId: number, paymentDetails: any = {}) {
    try {
      const { 
        amount, 
        transaction_type = 'REGULAR_FULL_AMOUNT', 
        selected_bank, 
        emi_type, 
        emi_period,
        emi_plan_id,
        is_emi_downpayment
      } = paymentDetails;
      
      const payload: any = {
        order_id: orderId,
        transaction_type: transaction_type
      };
      
      // Only add amount if it's defined
      if (amount !== undefined) {
        payload.amount = amount;
      }
      
      // Handle cardless EMI downpayment as a standard payment
      if (is_emi_downpayment) {
        // Include metadata for backend processing
        payload.is_emi_downpayment = true;
        
        if (emi_plan_id) {
          payload.emi_plan_id = emi_plan_id;
        }
      } 
      // Handle card EMI payment
      else if (emi_type === 'card_emi') {
        // Add EMI type
        payload.emi_type = emi_type;
        
        // Add EMI period if provided
        if (emi_period) {
          payload.emi_period = emi_period;
        }
        
        // Add EMI plan ID if provided
        if (emi_plan_id) {
          payload.emi_plan_id = emi_plan_id;
        }
        
        // Add selected bank for Card EMI if provided
        if (selected_bank) {
          payload.selected_bank = selected_bank;
        }
      }
      
      console.log('Initiating SSLCOMMERZ payment with payload:', payload);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await axios.post(`${API_URL}/payments/initiate-sslcommerz/`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('SSLCOMMERZ initiation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error initiating SSLCOMMERZ payment:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      
      throw error;
    }
  }
}

const paymentService = new PaymentService();
export default paymentService; 