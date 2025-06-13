/**
 * Service for handling promo code operations
 */

import axios from 'axios';
import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

const PROMO_CODE_STORAGE_KEY = 'promo_code';

interface PromoCodeValidationResponse {
  valid: boolean;
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
}

interface PromoCodeApplyResponse {
  success: boolean;
  message: string;
  discount_amount: number;
  cart_total_before_discount: number;
  cart_total_after_discount: number;
}

interface PromoCodeRemoveResponse {
  success: boolean;
  message: string;
}

const promoCodeService = {
  /**
   * Validate a promo code without applying it
   * @param {string} code - The promo code to validate
   * @param {number} cartTotal - The current cart total
   * @returns {Promise<PromoCodeValidationResponse>} A promise that resolves to the validation result
   */
  validatePromoCode: async (code: string, cartTotal: number): Promise<PromoCodeValidationResponse> => {
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`${API_URL}/promotions/promo-codes/validate/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, cart_total: cartTotal }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to validate promo code');
      }
      
      const validationResult = await response.json();
      
      // For guest users, store the promo code in localStorage
      if (!localStorage.getItem('auth_token')) {
        localStorage.setItem(PROMO_CODE_STORAGE_KEY, JSON.stringify({
          code: validationResult.code,
          discount_amount: validationResult.discount_amount
        }));
      }
      
      return validationResult;
    } catch (error) {
      console.error('Error validating promo code:', error);
      throw error;
    }
  },
  
  /**
   * Apply a promo code to the user's cart
   * @param {string} code - The promo code to apply
   * @returns {Promise<PromoCodeApplyResponse>} A promise that resolves to the application result
   */
  applyPromoCode: async (code: string): Promise<PromoCodeApplyResponse> => {
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`${API_URL}/promotions/promo-codes/apply/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply promo code');
      }
      
      const result = await response.json();
      
      // For guest users, store the promo code in localStorage
      if (!localStorage.getItem('auth_token')) {
        localStorage.setItem(PROMO_CODE_STORAGE_KEY, JSON.stringify({
          code: code,
          discount_amount: result.discount_amount
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error applying promo code:', error);
      throw error;
    }
  },
  
  /**
   * Remove the applied promo code from the user's cart
   * @returns {Promise<PromoCodeRemoveResponse>} A promise that resolves to the removal result
   */
  removePromoCode: async (): Promise<PromoCodeRemoveResponse> => {
    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`${API_URL}/promotions/promo-codes/remove/`, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove promo code');
      }
      
      // For guest users, remove the promo code from localStorage
      localStorage.removeItem(PROMO_CODE_STORAGE_KEY);
      
      return await response.json();
    } catch (error) {
      console.error('Error removing promo code:', error);
      throw error;
    }
  },
};

export default promoCodeService; 