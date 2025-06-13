import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartType } from '../types/cart';
import { cartService, authService } from '../services/api';

// Extended cart type with calculated values
interface ExtendedCartType extends CartType {
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
}

interface CartContextType {
  cart: ExtendedCartType | null;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isAuthenticated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<ExtendedCartType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isAuthenticated = authService.isAuthenticated();
  
  // Minimum time between cart fetches in milliseconds (5 seconds)
  const MIN_FETCH_INTERVAL = 5000;

  // Calculate additional cart values
  const calculateCartValues = (cartData: CartType): ExtendedCartType => {
    // Calculate savings (discount)
    const savings = cartData.items.reduce((total, item) => {
      const regularPrice = item.product.price;
      const salePrice = item.product.sale_price || regularPrice;
      return total + ((regularPrice - salePrice) * item.quantity);
    }, 0);
    
    // Calculate tax (assuming 3% tax rate)
    const taxRate = 0.03;
    const subtotal = parseFloat(cartData.total_price);
    const tax = subtotal * taxRate;
    
    // Format currency values
    const formatCurrency = (value: number) => value.toFixed(2);
    
    return {
      ...cartData,
      subtotal: formatCurrency(subtotal),
      discount: formatCurrency(savings),
      tax: formatCurrency(tax),
      shipping: "0.00", // Default shipping cost
      total: formatCurrency(subtotal + tax) // Total with tax
    };
  };

  const fetchCart = async () => {
    // Don't attempt to fetch if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      setError(null);
      return;
    }
    
    // Check if we've fetched recently to prevent excessive API calls
    const now = Date.now();
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
      return;
    }
    
    setLastFetchTime(now);
    setLoading(true);
    setError(null);
    
    try {
      const cartData = await cartService.getCart();
      setCart(calculateCartValues(cartData));
    } catch (err: any) {
      // Only set error if authenticated but request failed for other reasons
      if (isAuthenticated) {
        setError(err.message || 'Failed to fetch cart');
        console.error('Error fetching cart:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number, quantity: number) => {
    if (!isAuthenticated) {
      setError('Please log in to add items to cart');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await cartService.addItem(productId, quantity);
      await fetchCart(); // Refresh cart after adding item
    } catch (err: any) {
      setError(err.message || 'Failed to add item to cart');
      console.error('Error adding to cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId: number, quantity: number) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      await cartService.updateItem(itemId, quantity);
      await fetchCart(); // Refresh cart after updating
    } catch (err: any) {
      setError(err.message || 'Failed to update cart item');
      console.error('Error updating cart item:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      await cartService.removeItem(itemId);
      await fetchCart(); // Refresh cart after removing item
    } catch (err: any) {
      setError(err.message || 'Failed to remove item from cart');
      console.error('Error removing from cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      await cartService.clearCart();
      await fetchCart(); // Refresh cart after clearing
    } catch (err: any) {
      setError(err.message || 'Failed to clear cart');
      console.error('Error clearing cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart on initial load if user is authenticated
  useEffect(() => {
    // Only try to fetch the cart if the user is authenticated
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Reset cart state when not authenticated
      setCart(null);
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated]);

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isAuthenticated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 