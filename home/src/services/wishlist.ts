import axios, { AxiosRequestConfig } from 'axios';
import { Product } from '../types/product';
import { API_URL } from '../config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token when available
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

export interface WishlistItem {
  id: number;
  product: Product;
  created_at: string;
}

export const wishlistService = {
  getWishlist: async (): Promise<WishlistItem[]> => {
    try {
      const response = await api.get('/wishlist/');
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  },

  addToWishlist: async (productId: number): Promise<WishlistItem> => {
    try {
      const response = await api.post('/wishlist/add_to_wishlist/', { product_id: productId });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  removeFromWishlist: async (productId: number): Promise<void> => {
    try {
      await api.post('/wishlist/remove_from_wishlist/', { product_id: productId });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },
}; 