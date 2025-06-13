import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

class SMSService {
  /**
   * Send verification code to a phone number
   * @param phoneNumber The phone number to send verification code to
   * @returns Promise with the response data
   */
  async sendVerificationCode(phoneNumber: string) {
    try {
      const response = await axios.post(
        `${API_URL}/sms/send-verification-code/`,
        { phone_number: phoneNumber }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  }

  /**
   * Verify a phone number with a code
   * @param phoneNumber The phone number to verify
   * @param code The verification code
   * @param userId Optional user ID to associate with verified phone
   * @returns Promise with the response data
   */
  async verifyPhoneNumber(phoneNumber: string, code: string, userId?: number) {
    try {
      const payload: any = {
        phone_number: phoneNumber,
        code: code
      };

      if (userId) {
        payload.user_id = userId;
      }

      const headers = userId ? getAuthHeaders() : {};
      
      const response = await axios.post(
        `${API_URL}/sms/verify-phone/`,
        payload,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error verifying phone number:', error);
      throw error;
    }
  }

  /**
   * Resend verification code to a phone number
   * @param phoneNumber The phone number to resend verification code to
   * @returns Promise with the response data
   */
  async resendVerificationCode(phoneNumber: string) {
    try {
      const response = await axios.post(
        `${API_URL}/sms/resend-verification-code/`,
        { phone_number: phoneNumber }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error resending verification code:', error);
      throw error;
    }
  }
}

const smsService = new SMSService();
export default smsService; 