import { cartService, authService } from './api';
import { STORAGE_KEYS } from '../config';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    sale_price?: number;
    image: string;
  };
  quantity: number;
  variation?: {
    id: number;
    name: string;
    price: number;
    sale_price?: number;
    image?: string;
  };
  variation_id?: number;
  emi_selected: boolean;
  emi_period: number;
  shipping_method?: string;
  total_price: string;
}

interface Cart {
  items: CartItem[];
  total_items: number;
  total_price: string;
  shipping_info?: {
    free_shipping_threshold: number;
    remaining_for_free_shipping: number;
    default_shipping_cost: number;
    is_eligible_for_free_shipping: boolean;
  };
  promo_code?: {
    code: string;
    discount_amount: number;
  };
  discount_amount?: number;
  total_after_discount?: number;
}

interface LocalCartItem {
  productId: number;
  quantity: number;
  variationId?: number;
  productData: {
    id: number;
    name: string;
    price: number;
    sale_price?: number;
    image: string;
  };
  variationData?: {
    id: number;
    name: string;
    price: number;
    sale_price?: number;
    image?: string;
  };
  emiSelected: boolean;
  emiPeriod: number;
  emiPlan?: number;
  emiBank?: string;
  emiType?: 'card_emi' | 'cardless_emi';
  shippingMethod?: string;
  addedAt: string;
}

interface CartOptions {
  variationId?: number;
  emiSelected?: boolean;
  emiPeriod?: number;
  emiPlan?: number;
  emiBank?: string;
  emiType?: 'card_emi' | 'cardless_emi';
  shippingMethod?: string;
}

interface CartResponse {
  success: boolean;
  cart?: Cart;
  error?: any;
}

/**
 * CartManager - A unified service to manage shopping cart in both backend and localStorage
 * Automatically uses backend cart for authenticated users and localStorage for guests
 */
class CartManager {
  private lastBackendAddItemFailed: boolean = false;

  /**
   * Get the current cart (from backend if authenticated, localStorage otherwise)
   */
  async getCart(): Promise<Cart> {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        const backendCart = await cartService.getCart();

        // If last add item failed and backend now reports an empty cart,
        // trust the local cart for this fetch, as backend might be temporarily inconsistent.
        if (this.lastBackendAddItemFailed && backendCart && backendCart.items && backendCart.items.length === 0) {
          const localCartCheck = this.getLocalCart();
          if (localCartCheck && localCartCheck.items && localCartCheck.items.length > 0) {
            console.warn("CartManager: Backend reported empty cart after a recent failed add item attempt. Using local cart as source of truth for this fetch.");
            this.lastBackendAddItemFailed = false; // Reset flag
            return localCartCheck;
          }
        }
        
        this.lastBackendAddItemFailed = false; // Reset flag on successful fetch or if condition above not met
        
        // Ensure backendCart is a valid structure before syncing
        if (backendCart && typeof backendCart.items !== 'undefined' && typeof backendCart.total_items !== 'undefined' && typeof backendCart.total_price !== 'undefined') {
            this.syncCartToLocalStorage(backendCart);
            return backendCart;
        } else {
            console.warn('CartManager: Backend cart data was malformed or null. Falling back to local cart.');
            return this.getLocalCart();
        }

      } catch (error) {
        console.error('CartManager: Error fetching backend cart, falling back to localCart:', error);
        this.lastBackendAddItemFailed = false; // Reset flag on fetch error
        return this.getLocalCart();
      }
    } else {
      this.lastBackendAddItemFailed = false; // Reset for guest user
      return this.getLocalCart();
    }
  }
  
  /**
   * Get cart from localStorage
   */
  getLocalCart(): Cart {
    try {
      const cartData = localStorage.getItem(STORAGE_KEYS.CART);
      if (!cartData) return { items: [], total_items: 0, total_price: '0.00' };
      
      const parsedCart: LocalCartItem[] = JSON.parse(cartData);
      
      // Calculate totals
      const total_items = parsedCart.reduce((sum: number, item: LocalCartItem) => sum + item.quantity, 0);
      let total_price = 0;
      
      // Format the cart to match backend format
      const items: CartItem[] = parsedCart.map((item: LocalCartItem) => {
        const price = item.variationData?.price || item.productData?.sale_price || item.productData?.price || 0;
        const total = price * item.quantity;
        total_price += total;
        
        return {
          id: item.productId,
          product: item.productData || {
            id: item.productId,
            name: 'Product',
            price: 0,
            image: ''
          },
          quantity: item.quantity,
          variation: item.variationData,
          variation_id: item.variationId,
          emi_selected: item.emiSelected || false,
          emi_period: item.emiPeriod || 0,
          shipping_method: item.shippingMethod,
          total_price: total.toFixed(2)
        };
      });
      
      // Get promo code from localStorage if available
      const promoCodeData = localStorage.getItem('promo_code');
      let promoCode = null;
      let discount_amount = 0;
      let total_after_discount = total_price;
      
      if (promoCodeData) {
        try {
          promoCode = JSON.parse(promoCodeData);
          discount_amount = promoCode.discount_amount || 0;
          total_after_discount = total_price - discount_amount;
          
          console.log('Found promo code in local storage:', promoCode);
        } catch (e) {
          console.error('Error parsing promo code data:', e);
        }
      }
      
      const cart: Cart = {
        items,
        total_items,
        total_price: total_price.toFixed(2)
      };
      
      // Add shipping info
      cart.shipping_info = {
        free_shipping_threshold: 5000, // Default value
        remaining_for_free_shipping: Math.max(0, 5000 - total_price),
        default_shipping_cost: 120, // Default value
        is_eligible_for_free_shipping: total_price >= 5000
      };
      
      // Add promo code info if available
      if (promoCode) {
        cart.promo_code = promoCode;
        cart.discount_amount = discount_amount;
        cart.total_after_discount = total_after_discount;
      }
      
      return cart;
    } catch (error) {
      console.error('Error parsing localStorage cart:', error);
      return { items: [], total_items: 0, total_price: '0.00' };
    }
  }
  
  /**
   * Add an item to the cart
   */
  async addItem(
    productId: number, 
    productData: any, 
    quantity: number = 1, 
    options: CartOptions = {}
  ): Promise<CartResponse> {
    console.log('CartManager.addItem - options:', options);
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        this.lastBackendAddItemFailed = false; // Reset flag before attempt
        // Add to backend cart
        const result = await cartService.addItem(
          productId,
          quantity,
          {
            variationId: options.variationId,
            emiSelected: options.emiSelected,
            emiPeriod: options.emiPeriod,
            emiPlan: options.emiPlan,
            shippingMethod: options.shippingMethod
          }
        );
        // Update localStorage for consistency
        // Ensure result is a valid cart structure before syncing
        if (result && typeof result.items !== 'undefined') {
             this.syncCartToLocalStorage(result);
        } else {
            console.warn("CartManager: addItem - Backend result was not a valid cart, skipping sync to localStorage.");
        }
        return { success: true, cart: result };
      } catch (error) {
        console.error('CartManager: Error adding to backend cart:', error);
        this.lastBackendAddItemFailed = true; // Set flag on failure
        // Fall back to localStorage
        return this.addToLocalCart(productId, productData, quantity, options);
      }
    } else {
      // Add to localStorage cart
      return this.addToLocalCart(productId, productData, quantity, options);
    }
  }
  
  /**
   * Add an item to localStorage cart
   */
  addToLocalCart(
    productId: number, 
    productData: any, 
    quantity: number = 1, 
    options: CartOptions = {}
  ): CartResponse {
    try {
      // Get existing cart
      const cartData = localStorage.getItem(STORAGE_KEYS.CART);
      const localCart: LocalCartItem[] = cartData ? JSON.parse(cartData) : [];
      
      // Check if product already exists
      const existingItemIndex = localCart.findIndex(item => 
        item.productId === productId && item.variationId === options.variationId
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity
        localCart[existingItemIndex].quantity += quantity;
        // Update EMI and shipping fields if changed
        localCart[existingItemIndex].emiSelected = options.emiSelected || false;
        localCart[existingItemIndex].emiPeriod = options.emiPeriod || 0;
        localCart[existingItemIndex].emiPlan = options.emiPlan;
        localCart[existingItemIndex].emiBank = options.emiBank;
        localCart[existingItemIndex].emiType = options.emiType;
        localCart[existingItemIndex].shippingMethod = options.shippingMethod;
      } else {
        // Find variation data if variationId is provided
        let variationData = undefined;
        if (options.variationId && productData.variations) {
          const variation = productData.variations.find((v: any) => v.id === options.variationId);
          if (variation) {
            variationData = {
              id: variation.id,
              name: variation.name,
              price: variation.price,
              sale_price: variation.sale_price,
              image: variation.image || productData.image
            };
          }
        }
        
        // Add new item
        localCart.push({
          productId,
          quantity,
          variationId: options.variationId,
          productData,
          variationData,
          emiSelected: options.emiSelected || false,
          emiPeriod: options.emiPeriod || 0,
          emiPlan: options.emiPlan,
          emiBank: options.emiBank,
          emiType: options.emiType,
          shippingMethod: options.shippingMethod,
          addedAt: new Date().toISOString()
        });
      }
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(localCart));
      
      // Convert local cart to Cart format
      const cart = this.getLocalCart();
      return { success: true, cart };
    } catch (error) {
      console.error('Error adding to localStorage cart:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Sync backend cart to localStorage
   */
  syncCartToLocalStorage(cart: Cart): void {
    try {
      if (!cart || !cart.items) return;
      
      const localCart: LocalCartItem[] = cart.items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        variationId: item.variation?.id,
        productData: item.product,
        variationData: item.variation,
        emiSelected: item.emi_selected,
        emiPeriod: item.emi_period,
        shippingMethod: item.shipping_method,
        addedAt: new Date().toISOString()
      }));
      
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(localCart));
      
      // Also sync promo code information if available
      if (cart.promo_code) {
        localStorage.setItem('promo_code', JSON.stringify(cart.promo_code));
        console.log('Synced promo code to localStorage:', cart.promo_code);
      }
    } catch (error) {
      console.error('Error syncing cart to localStorage:', error);
    }
  }
  
  /**
   * Update an item in the cart
   */
  async updateItem(
    itemId: number, 
    quantity: number, 
    options: CartOptions = {}
  ): Promise<CartResponse> {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        // Update backend cart
        const result = await cartService.updateItem(
          itemId,
          quantity,
          {
            emiSelected: options.emiSelected,
            emiPeriod: options.emiPeriod,
            emiPlan: options.emiPlan,
            shippingMethod: options.shippingMethod
          }
        );
        return { success: true, cart: result };
      } catch (error) {
        console.error('Error updating backend cart:', error);
        // Fall back to localStorage
        return this.updateLocalCartItem(itemId, quantity, options.variationId);
      }
    } else {
      // Update localStorage cart
      return this.updateLocalCartItem(itemId, quantity, options.variationId);
    }
  }
  
  /**
   * Update an item in the localStorage cart
   */
  updateLocalCartItem(
    productId: number, 
    quantity: number, 
    variationId?: number
  ): CartResponse {
    try {
      // Get existing cart
      const cartData = localStorage.getItem(STORAGE_KEYS.CART);
      if (!cartData) return { success: false, error: 'Cart not found' };
      
      const localCart: LocalCartItem[] = JSON.parse(cartData);
      
      // Find the item to update
      const itemIndex = localCart.findIndex(item => 
        item.productId === productId && item.variationId === variationId
      );
      
      if (itemIndex === -1) {
        return { success: false, error: 'Item not found in cart' };
      }
      
      // Update quantity
      localCart[itemIndex].quantity = quantity;
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(localCart));
      
      // Return updated cart
      const cart = this.getLocalCart();
      return { success: true, cart };
    } catch (error) {
      console.error('Error updating localStorage cart item:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Remove an item from the cart
   */
  async removeItem(itemId: number, variationId?: number) {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        // Remove from backend cart
        return await cartService.removeItem(itemId);
      } catch (error) {
        console.error('Error removing backend cart item:', error);
        // Fall back to localStorage
        return this.removeLocalCartItem(itemId, variationId);
      }
    } else {
      // Remove from localStorage cart
      return this.removeLocalCartItem(itemId, variationId);
    }
  }
  
  /**
   * Remove an item from localStorage cart
   */
  removeLocalCartItem(productId: number, variationId?: number) {
    try {
      // Get existing cart
      const cartData = localStorage.getItem(STORAGE_KEYS.CART);
      if (!cartData) return { success: false, error: 'Cart not found' };
      
      const cart: LocalCartItem[] = JSON.parse(cartData);
      
      // Filter out the item
      const newCart = cart.filter(item => 
        !(item.productId === productId && item.variationId === variationId)
      );
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(newCart));
      
      // Remove extra options
      localStorage.removeItem(`${STORAGE_KEYS.CART_EXTRAS}_${productId}`);
      
      return { success: true, cart: newCart };
    } catch (error) {
      console.error('Error removing localStorage cart item:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Clear the entire cart
   */
  async clearCart() {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      try {
        // Clear backend cart
        return await cartService.clearCart();
      } catch (error) {
        console.error('Error clearing backend cart:', error);
        // Fall back to localStorage
        return this.clearLocalCart();
      }
    } else {
      // Clear localStorage cart
      return this.clearLocalCart();
    }
  }
  
  /**
   * Clear localStorage cart
   */
  clearLocalCart() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CART);
      
      // Clear all cart extras
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.CART_EXTRAS)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      return { success: true };
    } catch (error) {
      console.error('Error clearing localStorage cart:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Get the number of items in the cart
   */
  async getItemCount(): Promise<number> {
    const cart = await this.getCart();
    return cart.total_items || 0;
  }
}

export default new CartManager(); 