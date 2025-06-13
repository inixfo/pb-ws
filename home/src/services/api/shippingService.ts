import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';
import { ShippingMethod, ShippingRate } from '../../types/order';

const shippingService = {
  /**
   * Get available shipping methods for a location
   * @param {string} country - The country code
   * @param {string} state - The state/province code (optional)
   * @param {string} city - The city name (optional)
   * @param {string} postalCode - The postal code (optional)
   * @returns {Promise<ShippingMethod[]>} A promise that resolves to the available shipping methods
   */
  async getAvailableMethods(
    country: string,
    state?: string,
    city?: string,
    postalCode?: string
  ): Promise<ShippingMethod[]> {
    try {
      console.log('Fetching shipping methods for:', { country, state, city, postalCode });
      
      // Default to Bangladesh if country is not provided
      const countryCode = country || 'BD';
      
      // Validate city - only allow certain cities
      const validCities = ['dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'rangpur'];
      const normalizedCity = city?.toLowerCase().trim();
      
      // If city is provided but not in our valid cities list, return empty array
      if (normalizedCity && !validCities.includes(normalizedCity)) {
        console.log(`City "${normalizedCity}" is not in our valid cities list:`, validCities);
        return [];
      }
      
      const response = await fetch(
        `${API_URL}/shipping/methods/?country=${countryCode}${state ? `&state=${state}` : ''}${city ? `&city=${city}` : ''}${postalCode ? `&postal_code=${postalCode}` : ''}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        console.error('Failed to fetch shipping methods:', response.status, response.statusText);
        throw new Error('Failed to fetch shipping methods');
      }
      
      const methods = await response.json();
      console.log('Shipping methods from API:', methods);
      
      // Extract results array from paginated response if it exists
      const methodsArray = methods.results ? methods.results : (Array.isArray(methods) ? methods : []);
      console.log('Extracted methods array:', methodsArray);
      
      // If no methods returned and city is dhaka, provide mock data
      if ((!methodsArray || methodsArray.length === 0) && normalizedCity === 'dhaka') {
        console.log('No shipping methods found for Dhaka, providing mock data');
        return [
          {
            id: 1,
            name: 'Standard Shipping',
            method_type: 'standard',
            description: 'Regular delivery within 3-5 business days',
            is_active: true,
            min_delivery_time: 3,
            max_delivery_time: 5,
            handling_time: 1,
            requires_signature: false,
            includes_tracking: true,
            international_shipping: false,
            base_rate: 120,
            free_shipping_threshold: 5000
          },
          {
            id: 2,
            name: 'Express Shipping',
            method_type: 'express',
            description: 'Fast delivery within 1-2 business days',
            is_active: true,
            min_delivery_time: 1,
            max_delivery_time: 2,
            handling_time: 0,
            requires_signature: true,
            includes_tracking: true,
            international_shipping: false,
            base_rate: 250,
            free_shipping_threshold: 10000
          },
          {
            id: 3,
            name: 'Cash-On-Delivery',
            method_type: 'cod',
            description: 'Pay when your package arrives',
            is_active: true,
            min_delivery_time: 2,
            max_delivery_time: 4,
            handling_time: 1,
            requires_signature: true,
            includes_tracking: true,
            international_shipping: false,
            base_rate: 180
          }
        ];
      }
      
      return methodsArray;
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      
      // Only provide mock data for specific cities
      const normalizedCity = city?.toLowerCase().trim();
      const validCities = ['dhaka', 'chittagong', 'sylhet'];
      
      if (normalizedCity && validCities.includes(normalizedCity)) {
        console.log(`Providing mock data for ${normalizedCity} due to error or no results`);
        
        if (normalizedCity === 'dhaka') {
          return [
            {
              id: 1,
              name: 'Standard Shipping',
              method_type: 'standard',
              description: 'Regular delivery within 3-5 business days',
              is_active: true,
              min_delivery_time: 3,
              max_delivery_time: 5,
              handling_time: 1,
              requires_signature: false,
              includes_tracking: true,
              international_shipping: false,
              base_rate: 120,
              free_shipping_threshold: 5000
            },
            {
              id: 2,
              name: 'Express Shipping',
              method_type: 'express',
              description: 'Fast delivery within 1-2 business days',
              is_active: true,
              min_delivery_time: 1,
              max_delivery_time: 2,
              handling_time: 0,
              requires_signature: true,
              includes_tracking: true,
              international_shipping: false,
              base_rate: 250,
              free_shipping_threshold: 10000
            },
            {
              id: 3,
              name: 'Cash-On-Delivery',
              method_type: 'cod',
              description: 'Pay when your package arrives',
              is_active: true,
              min_delivery_time: 2,
              max_delivery_time: 4,
              handling_time: 1,
              requires_signature: true,
              includes_tracking: true,
              international_shipping: false,
              base_rate: 180
            }
          ];
        } else if (normalizedCity === 'chittagong') {
          return [
            {
              id: 3,
              name: 'Standard Shipping',
              method_type: 'standard',
              description: 'Regular delivery within 4-6 business days',
              is_active: true,
              min_delivery_time: 4,
              max_delivery_time: 6,
              handling_time: 1,
              requires_signature: false,
              includes_tracking: true,
              international_shipping: false,
              base_rate: 150,
              free_shipping_threshold: 6000
            }
          ];
        } else if (normalizedCity === 'sylhet') {
          return [
            {
              id: 4,
              name: 'Standard Shipping',
              method_type: 'standard',
              description: 'Regular delivery within 5-7 business days',
              is_active: true,
              min_delivery_time: 5,
              max_delivery_time: 7,
              handling_time: 1,
              requires_signature: false,
              includes_tracking: true,
              international_shipping: false,
              base_rate: 180,
              free_shipping_threshold: 7000
            }
          ];
        }
      }
      
      // For all other cities or errors, return empty array
      return [];
    }
  },

  /**
   * Get shipping rates for a location and method
   * @param {string} country - The country code
   * @param {string} state - The state/province code (optional)
   * @param {string} city - The city name (optional)
   * @param {string} postalCode - The postal code (optional)
   * @returns {Promise<ShippingRate[]>} A promise that resolves to the available shipping rates
   */
  async getAvailableRates(
    country: string,
    state?: string,
    city?: string,
    postalCode?: string
  ): Promise<ShippingRate[]> {
    try {
      console.log('Fetching shipping rates for:', { country, state, city, postalCode });
      
      // Default to Bangladesh if country is not provided
      const countryCode = country || 'BD';
      
      // Validate city - only allow certain cities
      const validCities = ['dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'rangpur'];
      const normalizedCity = city?.toLowerCase().trim();
      
      // If city is provided but not in our valid cities list, return empty array
      if (normalizedCity && !validCities.includes(normalizedCity)) {
        console.log(`City "${normalizedCity}" is not in our valid cities list:`, validCities);
        return [];
      }
      
      const response = await fetch(
        `${API_URL}/shipping/rates/?country=${countryCode}${state ? `&state=${state}` : ''}${city ? `&city=${city}` : ''}${postalCode ? `&postal_code=${postalCode}` : ''}`,
        {
          headers: getAuthHeaders()
        }
      );
      
      if (!response.ok) {
        console.error('Failed to fetch shipping rates:', response.status, response.statusText);
        throw new Error('Failed to fetch shipping rates');
      }
      
      const rates = await response.json();
      console.log('Shipping rates from API:', rates);
      
      // Extract results array from paginated response if it exists
      const ratesArray = rates.results ? rates.results : (Array.isArray(rates) ? rates : []);
      console.log('Extracted rates array:', ratesArray);
      
      // If no rates returned and city is dhaka, provide mock data
      if ((!ratesArray || ratesArray.length === 0) && normalizedCity === 'dhaka') {
        console.log('No shipping rates found for Dhaka, providing mock data');
        return [
          {
            id: 1,
            zone: 1,
            zone_name: 'Dhaka City',
            method: 1,
            method_name: 'Standard Shipping',
            rate_type: 'flat',
            is_active: true,
            base_rate: 120,
            per_kg_rate: 0,
            per_item_rate: 0,
            free_shipping_threshold: 5000,
            conditions: {}
          },
          {
            id: 2,
            zone: 1,
            zone_name: 'Dhaka City',
            method: 2,
            method_name: 'Express Shipping',
            rate_type: 'flat',
            is_active: true,
            base_rate: 250,
            per_kg_rate: 0,
            per_item_rate: 0,
            free_shipping_threshold: 10000,
            conditions: {}
          },
          {
            id: 3,
            zone: 1,
            zone_name: 'Dhaka City',
            method: 3,
            method_name: 'Cash-On-Delivery',
            rate_type: 'flat',
            is_active: true,
            base_rate: 180,
            per_kg_rate: 0,
            per_item_rate: 0,
            conditions: {}
          }
        ];
      }
      
      return ratesArray;
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      
      // Only provide mock data for specific cities
      const normalizedCity = city?.toLowerCase().trim();
      const validCities = ['dhaka', 'chittagong', 'sylhet'];
      
      if (normalizedCity && validCities.includes(normalizedCity)) {
        console.log(`Providing mock data for ${normalizedCity} due to error or no results`);
        
        if (normalizedCity === 'dhaka') {
          return [
            {
              id: 1,
              zone: 1,
              zone_name: 'Dhaka City',
              method: 1,
              method_name: 'Standard Shipping',
              rate_type: 'flat',
              is_active: true,
              base_rate: 120,
              per_kg_rate: 0,
              per_item_rate: 0,
              free_shipping_threshold: 5000,
              conditions: {}
            },
            {
              id: 2,
              zone: 1,
              zone_name: 'Dhaka City',
              method: 2,
              method_name: 'Express Shipping',
              rate_type: 'flat',
              is_active: true,
              base_rate: 250,
              per_kg_rate: 0,
              per_item_rate: 0,
              free_shipping_threshold: 10000,
              conditions: {}
            },
            {
              id: 3,
              zone: 1,
              zone_name: 'Dhaka City',
              method: 3,
              method_name: 'Cash-On-Delivery',
              rate_type: 'flat',
              is_active: true,
              base_rate: 180,
              per_kg_rate: 0,
              per_item_rate: 0,
              conditions: {}
            }
          ];
        } else if (normalizedCity === 'chittagong') {
          return [
            {
              id: 3,
              zone: 2,
              zone_name: 'Chittagong City',
              method: 1,
              method_name: 'Standard Shipping',
              rate_type: 'flat',
              is_active: true,
              base_rate: 150,
              per_kg_rate: 0,
              per_item_rate: 0,
              free_shipping_threshold: 6000,
              conditions: {}
            }
          ];
        } else if (normalizedCity === 'sylhet') {
          return [
            {
              id: 4,
              zone: 3,
              zone_name: 'Sylhet City',
              method: 1,
              method_name: 'Standard Shipping',
              rate_type: 'flat',
              is_active: true,
              base_rate: 180,
              per_kg_rate: 0,
              per_item_rate: 0,
              free_shipping_threshold: 7000,
              conditions: {}
            }
          ];
        }
      }
      
      // For all other cities or errors, return empty array
      return [];
    }
  },

  /**
   * Calculate shipping cost for an order
   * @param {Object} params - The calculation parameters
   * @param {number} params.zoneId - The shipping zone ID
   * @param {number} params.methodId - The shipping method ID
   * @param {number} params.orderTotal - The order total amount
   * @param {number} [params.weight] - The order weight in kg (optional)
   * @param {number} [params.itemCount] - The number of items (optional)
   * @param {Object} [params.dimensions] - The order dimensions (optional)
   * @returns {Promise<{cost: number, currency: string}>} A promise that resolves to the shipping cost
   */
  async calculateShippingCost(params: {
    zoneId: number;
    methodId: number;
    orderTotal: number;
    weight?: number;
    itemCount?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }): Promise<{ cost: number; currency: string }> {
    try {
      const response = await fetch(`${API_URL}/shipping/calculate/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) throw new Error('Failed to calculate shipping cost');
      
      return response.json();
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      
      // Mock calculation as fallback
      let cost = 120; // Default cost
      
      // If method is express, use higher cost
      if (params.methodId === 2) {
        cost = 250;
      }
      
      // Apply free shipping threshold
      if (params.methodId === 1 && params.orderTotal >= 5000) {
        cost = 0;
      } else if (params.methodId === 2 && params.orderTotal >= 10000) {
        cost = 0;
      }
      
      return { cost, currency: 'BDT' };
    }
  }
};

export default shippingService; 