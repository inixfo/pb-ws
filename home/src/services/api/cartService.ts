import { API_URL } from '../../config';
import { getAuthHeaders } from './authHeaders';
import { CartType as Cart } from '../../types/cart';

/**
 * Get the current user's cart
 * @returns {Promise<Cart>} A promise that resolves to the cart data
 */
export const getCart = async (): Promise<Cart> => {
  try {
    const response = await fetch(`${API_URL}/orders/cart/my_cart/`, {
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
};

/**
 * Add an item to the cart
 * @param {number} productId - The ID of the product to add
 * @param {number} quantity - The quantity to add
 * @param {number} [variationId] - The ID of the variation to add
 * @param {boolean} [emiSelected] - Whether EMI is selected
 * @param {number} [emiPlanId] - The EMI plan ID
 * @returns {Promise<Cart>} A promise that resolves to the updated cart
 */
export const addToCart = async (
  productId: number,
  quantity: number,
  variationId?: number,
  emiSelected?: boolean,
  emiPlanId?: number
): Promise<Cart> => {
  try {
    const response = await fetch(`${API_URL}/orders/cart/add_item/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
        variation_id: variationId,
        emi_selected: emiSelected || false,
        emi_plan_id: emiPlanId,
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
};

/**
 * Update a cart item
 * @param {number} itemId - The ID of the cart item to update
 * @param {number} quantity - The new quantity
 * @returns {Promise<Cart>} A promise that resolves to the updated cart
 */
export const updateCartItem = async (
  itemId: number,
  quantity: number
): Promise<Cart> => {
  try {
    const response = await fetch(`${API_URL}/orders/cart/update_item/`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        item_id: itemId,
        quantity,
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
};

/**
 * Remove an item from the cart
 * @param {number} itemId - The ID of the cart item to remove
 * @returns {Promise<Cart>} A promise that resolves when the item is removed
 */
export const removeFromCart = async (itemId: number): Promise<Cart> => {
  try {
    const response = await fetch(`${API_URL}/orders/cart/remove_item/`, {
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
};

/**
 * Clear the cart (remove all items)
 * @returns {Promise<void>} A promise that resolves when the cart is cleared
 */
export const clearCart = async (): Promise<void> => {
  try {
    const cart = await getCart();
    
    if (cart && cart.items && cart.items.length > 0) {
      // Remove each item one by one
      await Promise.all(
        cart.items.map(item => removeFromCart(item.id))
      );
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}; 