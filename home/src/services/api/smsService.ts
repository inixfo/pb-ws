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
      // Format the phone number - ensure it's formatted properly
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const response = await axios.post(
        `${API_URL}/sms/send-verification-code/`,
        { phone_number: formattedNumber }
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
      // Format the phone number - ensure it's formatted properly
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const payload: any = {
        phone_number: formattedNumber,
        code: code
      };

      if (userId) {
        payload.user_id = userId;
      }

      const headers = userId ? getAuthHeaders() : {};
      
      console.log('Sending verification request with payload:', payload);
      
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
      // Format the phone number - ensure it's formatted properly
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      const response = await axios.post(
        `${API_URL}/sms/resend-verification-code/`,
        { phone_number: formattedNumber }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error resending verification code:', error);
      throw error;
    }
  }
  
  /**
   * Format a phone number to ensure it's properly formatted for the API
   * @param phoneNumber The phone number to format
   * @returns The formatted phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Case 1: If the number starts with 880, it's already in international format
    if (cleaned.startsWith('880') && cleaned.length === 13) {
      return cleaned;
    }
    
    // Case 2: If the number starts with 01, add the country code
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      return `880${cleaned.substring(1)}`;
    }
    
    // Case 3: If the number starts with 1 and is 10 digits, add country code
    if (cleaned.startsWith('1') && cleaned.length === 10) {
      return `880${cleaned}`;
    }
    
    // Return as-is for other cases
    return cleaned;
  }
}

const smsService = new SMSService();
export default smsService; 