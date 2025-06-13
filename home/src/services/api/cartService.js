import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';

const cartService = {
  /**
   * Get the current user's cart
   * @returns {Promise} A promise that resolves to the cart data
   */
  getCart: async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/cart/my_cart/`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },
  
  /**
   * Add an item to the cart
   * @param {number} productId - The ID of the product to add
   * @param {number} quantity - The quantity to add
   * @param {Object} options - Additional options
   * @param {number} options.variationId - The ID of the variation to add
   * @param {boolean} options.emiSelected - Whether EMI is selected
   * @param {number} options.emiPeriod - The EMI period in months
   * @param {number} options.emiPlan - The EMI plan ID
   * @param {string} options.shippingMethod - The shipping method
   * @returns {Promise} A promise that resolves to the added cart item
   */
  addItem: async (productId, quantity, options = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/cart/add_item/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity,
          variation_id: options.variationId,
          emi_selected: options.emiSelected || false,
          emi_period: options.emiPeriod || 0,
          emi_plan_id: options.emiPlan,
          shipping_method: options.shippingMethod
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add item to cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },
  
  /**
   * Update a cart item
   * @param {number} itemId - The ID of the cart item to update
   * @param {number} quantity - The new quantity
   * @param {Object} options - Additional options
   * @param {boolean} options.emiSelected - Whether EMI is selected
   * @param {number} options.emiPeriod - The EMI period in months
   * @param {number} options.emiPlan - The EMI plan ID
   * @param {string} options.shippingMethod - The shipping method
   * @returns {Promise} A promise that resolves to the updated cart item
   */
  updateItem: async (itemId, quantity, options = {}) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/cart/update_item/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: itemId,
          quantity,
          emi_selected: options.emiSelected || false,
          emi_period: options.emiPeriod || 0,
          emi_plan_id: options.emiPlan,
          shipping_method: options.shippingMethod
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update cart item');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },
  
  /**
   * Remove an item from the cart
   * @param {number} itemId - The ID of the cart item to remove
   * @returns {Promise} A promise that resolves when the item is removed
   */
  removeItem: async (itemId) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/cart/remove_item/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: itemId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove item from cart');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },
  
  /**
   * Clear the cart (remove all items)
   * @returns {Promise} A promise that resolves when the cart is cleared
   */
  clearCart: async () => {
    try {
      const cart = await cartService.getCart();
      
      if (cart && cart.items && cart.items.length > 0) {
        // Remove each item one by one
        await Promise.all(
          cart.items.map(item => cartService.removeItem(item.id))
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

export default cartService; 