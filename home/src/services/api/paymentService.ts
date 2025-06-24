import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

class PaymentService {
  async initiateSslcommerzPayment(orderId: number, paymentDetails: any = {}) {
    try {
      const { amount, transactionType = 'REGULAR_FULL_AMOUNT', selected_bank, emi_type, emi_bank } = paymentDetails;
      
      const payload: any = {
        order_id: orderId,
        transaction_type: transactionType
      };
      
      // Only add amount if it's defined
      if (amount !== undefined) {
        payload.amount = amount;
      }
      
      // Add selected bank for Card EMI if provided
      if (transactionType === 'EMI_FULL_AMOUNT' && (selected_bank || emi_bank)) {
        payload.selected_bank = selected_bank || emi_bank;
      }
      
      // Add EMI type if provided
      if (emi_type) {
        payload.emi_type = emi_type;
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