import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OrderCreateRequest, OrderResponse, ShippingMethod, OrderListItem } from '../types/order';
import { API_URL } from '../config';

// Helper function to get authentication token
const getToken = () => localStorage.getItem('auth_token');

// Helper function to check if a string is a number
const isNumeric = (value: string | number): boolean => {
  return !isNaN(Number(value));
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API instance that doesn't require authentication
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token when available
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      const formattedToken = token.startsWith('Bearer ') ? token.replace(/^Bearer\s+/i, '') : token;
      config.headers.Authorization = `Bearer ${formattedToken}`;
    }
    
    // Ensure baseURL is set correctly for all requests
    if (config.url && !config.url.startsWith('http')) {
      config.baseURL = API_URL;
    }
    
    console.log(`Making API request to: ${config.url}`, config);
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // If we get a 401, clear the token as it's likely invalid or expired
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// Error handler
const handleError = (error: any) => {
  console.error('API Error:', error);
  return Promise.reject(error);
};

// Check if user is authenticated before making API calls
const isAuthenticated = () => !!getToken();

// Product service
export const productService = {
  // Get all products
  getAll: async (params?: any) => {
    try {
      const response = await publicApi.get('/products/', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get product by ID or slug
  getById: async (id: number | string) => {
    try {
      console.log(`Fetching product details for ID/slug: ${id}`);
      
      // Try different URL formats in sequence
      const urlFormats = [
        // Format 1: Standard DRF detail view by ID or slug
        `/products/products/${id}/`,
        
        // Format 2: Try with direct slug lookup
        !isNumeric(id) ? `/products/products/?slug=${id}` : null,
      ].filter(Boolean); // Remove null entries
      
      // Try each URL format until one works
      let lastError = null;
      for (const url of urlFormats) {
        try {
          console.log(`Trying URL format: ${url}`);
          const response = await publicApi.get(url as string);
          
          // Check if we got a valid response
          if (!response.data) {
            console.log(`No data in response for URL: ${url}`);
            continue;
          }
          
          console.log('Product details response:', response.data);
          
          // If we're querying with a filter, we get a list, so return the first item
          if (url?.includes('?slug=')) {
            if (response.data.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
              console.log('Found product by slug filter:', response.data.results[0]);
              return response.data.results[0];
            } else if (Array.isArray(response.data) && response.data.length > 0) {
              console.log('Found product in array response:', response.data[0]);
              return response.data[0];
            } else {
              console.log(`No results found for slug: ${id}`);
              continue;
            }
          }
          
          // If we get a valid response with data, return it
          if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
            console.log('Successfully fetched product data:', response.data);
              return response.data;
          }
          
          // If we get here, the response didn't have the expected data
          console.log('Response did not contain expected product data:', response.data);
        } catch (error: any) {
          console.log(`URL ${url} failed with error: ${error.message}`);
          lastError = error;
        }
      }
      
      // If we get here, all formats failed
      console.error(`All URL formats failed for ID/slug: ${id}`);
      throw lastError || new Error(`Could not find product with ID/slug: ${id}`);
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return handleError(error);
    }
  },

  // Get featured products
  getFeatured: async () => {
    try {
      const response = await publicApi.get('/products/featured/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get trending products
  getTrending: async (limit?: number) => {
    try {
      console.log(`Fetching trending products with limit: ${limit}`);
      const response = await publicApi.get('/products/products/trending/', { 
        params: { limit } 
      });
      console.log('Trending products response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return handleError(error);
    }
  },

  // Get special offers
  getSpecialOffers: async (limit?: number) => {
    try {
      console.log(`Fetching special offers with limit: ${limit}`);
      const response = await publicApi.get('/products/products/special_offers/', { 
        params: { limit } 
      });
      console.log('Special offers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching special offers:', error);
      return handleError(error);
    }
  },

  // Search products
  search: async (query: string) => {
    try {
      const response = await publicApi.get('/products/search/', { 
        params: { query } 
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get today's deals
  getTodaysDeals: async (limit?: number) => {
    try {
      console.log(`Fetching today's deals with limit: ${limit}`);
      const response = await publicApi.get('/products/products/todays_deal/', { 
        params: { limit } 
      });
      console.log("Today's deals response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching today's deals:", error);
      return handleError(error);
    }
  },

  // Get best sellers
  getBestSellers: async (limit?: number) => {
    try {
      console.log(`Fetching best sellers with limit: ${limit}`);
      const response = await publicApi.get('/products/products/best_sellers/', { 
        params: { limit } 
      });
      console.log('Best sellers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      return handleError(error);
    }
  },

  // Get new arrivals
  getNewArrivals: async (limit?: number) => {
    try {
      console.log(`Fetching new arrivals with limit: ${limit}`);
      const response = await publicApi.get('/products/products/new_arrivals/', { 
        params: { limit } 
      });
      console.log('New arrivals response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      return handleError(error);
    }
  },
};

// Category service
export const categoryService = {
  // Get all categories
  getAll: async () => {
    try {
      console.log('Making API request to categories endpoint');
      const response = await publicApi.get('/products/categories/');
      console.log('Category API response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return handleError(error);
    }
  },
  
  // Get category by ID or slug
  getById: async (id: number | string) => {
    try {
      const response = await publicApi.get(`/products/categories/${id}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get category by slug
  getBySlug: async (slug: string) => {
    try {
      const response = await publicApi.get(`/products/categories/${slug}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Brand service
export const brandService = {
  // Get all brands
  getAll: async () => {
    try {
      const response = await publicApi.get('/products/brands/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get featured brands
  getFeatured: async () => {
    try {
      const response = await publicApi.get('/products/brands/featured/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },
};

// Cart service
export const cartService = {
  // Get user's cart
  getCart: async () => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get('/orders/cart/my_cart/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Add item to cart
  addItem: async (
    productId: number, 
    quantity: number = 1, 
    options: {
      variationId?: number;
      emiSelected?: boolean;
      emiPeriod?: number; // Duration in months
      emiPlan?: number;   // Plan ID
      shippingMethod?: string;
    } = {}
  ) => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      // For guest users, CartManager handles local storage directly.
      // This call path (cartService.addItem) should ideally only be for authenticated users.
      // However, if CartManager calls this for guests due to some logic flaw, reject it.
      return Promise.reject(new Error('User not authenticated - cartService.addItem should not be called for guests.'));
    }
    
    try {
      const payload: any = {
        product_id: productId,
        quantity,
        variation_id: options.variationId,
        shipping_method: options.shippingMethod,
        emi_selected: options.emiSelected || false,
      };

      if (options.emiSelected) {
        payload.emi_plan_id = options.emiPlan; // This is the Plan ID
        payload.emi_period = options.emiPeriod;   // This is the Duration in months
      } else {
        // Explicitly set to null or undefined if not selected, if backend prefers that over omission
        // Depending on backend DRF serializer settings (allow_null=True vs. required=False)
        // For now, omitting them if not selected by not adding to payload.
        // If backend requires them as null, uncomment below:
        // payload.emi_plan_id = null;
        // payload.emi_period = null;
      }

      const response = await api.post('/orders/cart/add_item/', payload);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Update cart item
  updateItem: async (
    itemId: number, 
    quantity: number, 
    options: {
      emiSelected?: boolean;
      emiPeriod?: number;
      emiPlan?: number;
      shippingMethod?: string;
    } = {}
  ) => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const data: any = { 
        item_id: itemId, 
        quantity,
        emi_selected: options.emiSelected,
        emi_period: options.emiPeriod,
        emi_plan: options.emiPlan,
        shipping_method: options.shippingMethod
      };
      
      const response = await api.post('/orders/cart/update_item/', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Remove item from cart
  removeItem: async (itemId: number) => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.post('/orders/cart/remove_item/', {
        item_id: itemId
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Clear cart
  clearCart: async () => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.post('/orders/cart/clear/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Auth service
export const authService = {
  // Register new user
  register: async (fullName: string, email: string, password: string) => {
    try {
      const response = await publicApi.post('/users/register/', {
        full_name: fullName,
        email,
        password,
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Login
  login: async (email: string, password: string) => {
    try {
      const response = await publicApi.post('/users/login/', { email, password });
      // Store the token in localStorage
      if (response.data.access) {
        localStorage.setItem('auth_token', response.data.access);
      }
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('auth_token');
  },

  // Check if user is authenticated
  isAuthenticated,
};

// Order service
export const orderService = {
  // Create a new order
  createOrder: async (orderData: OrderCreateRequest): Promise<OrderResponse> => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.post('/orders/', orderData);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get user's orders
  getOrders: async (): Promise<OrderListItem[]> => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get('/orders/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get order by ID
  getOrderById: async (orderId: string) => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get(`/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Cancel order
  cancelOrder: async (orderId: string) => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.post(`/orders/${orderId}/cancel/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get order tracking information
  getOrderTracking: async (orderId: string) => {
    // Check if user is authenticated before making the request
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get(`/orders/${orderId}/tracking/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get available shipping methods
  getShippingMethods: async (city: string): Promise<ShippingMethod[]> => {
    try {
      // In a real app, this would be a call to the backend to get shipping methods based on city
      // For now, we'll simulate a delay and return mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: "standard",
              name: "Standard shipping",
              description: "Delivery in 3-5 business days",
              price: "Free",
              delivery_time: "3-5 business days"
            },
            {
              id: "express",
              name: "Express shipping",
              description: "Delivery in 1-2 business days",
              price: "৳10.00",
              delivery_time: "1-2 business days"
            }
          ]);
        }, 500);
      });
    } catch (error) {
      return handleError(error);
    }
  }
};

// Wishlist service
export const wishlistService = {
  getWishlist: async () => {
    try {
      const response = await api.get('/wishlist/');
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      throw error;
    }
  },

  addToWishlist: async (productId: number) => {
    try {
      const response = await api.post('/wishlist/add_to_wishlist/', { product_id: productId });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  removeFromWishlist: async (productId: number) => {
    try {
      const response = await api.post('/wishlist/remove_from_wishlist/', { product_id: productId });
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },
};

// Reviews service
export const reviewService = {
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews/');
    return response.data;
  },

  markReviewHelpful: async (reviewId: number) => {
    const response = await api.post(`/reviews/${reviewId}/vote/`, { vote: 'helpful' });
    return response.data;
  },

  markReviewUnhelpful: async (reviewId: number) => {
    const response = await api.post(`/reviews/${reviewId}/vote/`, { vote: 'unhelpful' });
    return response.data;
  },

  deleteReview: async (reviewId: number) => {
    const response = await api.delete(`/reviews/${reviewId}/`);
    return response.data;
  }
};

// User service
export const userService = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Update user profile
  updateProfile: async (data: any) => {
    try {
      const response = await api.put('/users/profile/', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string) => {
    try {
      const response = await api.post('/users/password/change/', {
        old_password: oldPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Address service
export const addressService = {
  // Get all addresses
  getAddresses: async () => {
    try {
      const response = await api.get('/users/addresses/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Create new address
  createAddress: async (data: any) => {
    try {
      const response = await api.post('/users/addresses/', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Update address
  updateAddress: async (id: number, data: any) => {
    try {
      const response = await api.put(`/users/addresses/${id}/`, data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Delete address
  deleteAddress: async (id: number) => {
    try {
      const response = await api.delete(`/users/addresses/${id}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Set default address
  setDefaultAddress: async (id: number) => {
    try {
      const response = await api.put(`/users/addresses/${id}/`, { is_default: true });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Payment method service
export const paymentMethodService = {
  // Get all payment methods
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/users/payment-methods/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Create new payment method
  createPaymentMethod: async (data: any) => {
    try {
      const response = await api.post('/users/payment-methods/', data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Update payment method
  updatePaymentMethod: async (id: number, data: any) => {
    try {
      const response = await api.put(`/users/payment-methods/${id}/`, data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Delete payment method
  deletePaymentMethod: async (id: number) => {
    try {
      const response = await api.delete(`/users/payment-methods/${id}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Set default payment method
  setDefaultPaymentMethod: async (id: number) => {
    try {
      const response = await api.put(`/users/payment-methods/${id}/`, { is_default: true });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// EMI service
export const emiService = {
  // Get user's EMI records
  getEMIRecords: async () => {
    try {
      const response = await api.get('/emi/records/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get EMI record details
  getEMIRecordDetails: async (id: number) => {
    try {
      const response = await api.get(`/emi/records/${id}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get EMI installments
  getEMIInstallments: async (emiRecordId: number) => {
    try {
      const response = await api.get(`/emi/installments/?emi_record=${emiRecordId}`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Pay EMI installment
  payInstallment: async (installmentId: number, data: any) => {
    try {
      const response = await api.post(`/emi/installments/${installmentId}/pay/`, data);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Add the promotions service after other service definitions
export const promotionsService = {
  // Get active header promo banner
  getHeaderPromo: async () => {
    try {
      const response = await publicApi.get('/promotions/header-promos/active/');
      console.log('Header promo API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching header promo:', error);
      return null; // Return null for silent failure
    }
  },

  // Get hero slides
  getHeroSlides: async () => {
    try {
      const response = await publicApi.get('/promotions/hero-slides/');
      console.log('Hero slides API response:', response.data);
      
      // Check if the response has a results property (pagination)
      if (response.data && response.data.results) {
        return response.data.results;
      }
      
      // If it's already an array, return it directly
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // If we have no valid data, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      return []; // Return empty array for silent failure
    }
  },

  // Get new arrivals banner
  getNewArrivalsBanner: async () => {
    try {
      const response = await publicApi.get('/promotions/new-arrivals-banner/active/');
      console.log('New arrivals banner API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching new arrivals banner:', error);
      return null; // Return null for silent failure
    }
  },

  // Get sale banner
  getSaleBanner: async () => {
    try {
      const response = await publicApi.get('/promotions/sale-banner/active/');
      console.log('Sale banner API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching sale banner:', error);
      return null; // Return null for silent failure
    }
  },
  
  // Get catalog top banner
  getCatalogTopBanner: async () => {
    try {
      const response = await publicApi.get('/promotions/catalog-top-banner/active/');
      console.log('Catalog top banner API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching catalog top banner:', error);
      return null; // Return null for silent failure
    }
  },
  
  // Get catalog bottom banner
  getCatalogBottomBanner: async () => {
    try {
      const response = await publicApi.get('/promotions/catalog-bottom-banner/active/');
      console.log('Catalog bottom banner API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching catalog bottom banner:', error);
      return null; // Return null for silent failure
    }
  }
};

// Add the contact service after other service definitions
export const contactService = {
  // Get contact information
  getContactInfo: async () => {
    try {
      const response = await publicApi.get('/contact/info/active/');
      return response.data;
    } catch (error) {
      console.error('Error fetching contact info:', error);
      return null; // Return null for silent failure
    }
  },

  // Submit contact form
  submitContactForm: async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }) => {
    try {
      const response = await publicApi.post('/contact/submissions/', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting contact form:', error);
      throw error; // Rethrow to handle in the component
    }
  },
  
  // Subscribe to newsletter
  subscribeNewsletter: async (email: string) => {
    try {
      const response = await publicApi.post('/contact/newsletter/', { email });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      throw error; // Rethrow to handle in the component
    }
  },
};

// Notification service
export const notificationService = {
  // Get user notifications
  getNotifications: async () => {
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get('/notifications/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: number) => {
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.put(`/notifications/${notificationId}/`, {
        is_read: true
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Payment service
export const paymentService = {
  // Initiate SSLCOMMERZ payment
  initiateSslcommerzPayment: async (
    orderId: number,
    amount?: number,
    transactionType: 'REGULAR_FULL_AMOUNT' | 'EMI_FULL_AMOUNT' | 'DOWN_PAYMENT' | 'INSTALLMENT_PAYMENT' = 'REGULAR_FULL_AMOUNT',
    options?: {
      installmentId?: number;
    }
  ) => {
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const payload: any = {
        order_id: orderId,
        transaction_type: transactionType,
      };

      if (amount) {
        payload.amount = amount;
      }

      if (options?.installmentId && transactionType === 'INSTALLMENT_PAYMENT') {
        payload.installment_id = options.installmentId;
      }

      const response = await api.post('/payments/initiate-sslcommerz/', payload);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get payment history
  getPaymentHistory: async () => {
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get('/payments/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Get transactions
  getTransactions: async () => {
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get('/payments/transactions/');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Verify payment status
  verifyPayment: async (transactionId: string) => {
    if (!isAuthenticated()) {
      return Promise.reject(new Error('User not authenticated'));
    }
    
    try {
      const response = await api.get(`/payments/verify/${transactionId}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Search service
export const searchService = {
  // Advanced search with typo correction and exact match prioritization
  search: async (query: string, params?: any) => {
    try {
      console.log(`Performing advanced search for: ${query}`);
      const searchParams = {
        q: query,
        ...params
      };
      
      const response = await publicApi.get('/products/search/', { params: searchParams });
      console.log('Advanced search response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in advanced search:', error);
      return handleError(error);
    }
  },
  
  // Get autocomplete suggestions as user types
  getAutocompleteSuggestions: async (query: string, limit: number = 5) => {
    try {
      if (!query || query.length < 2) return { suggestions: [] };
      
      console.log(`Getting autocomplete suggestions for: ${query}`);
      const response = await publicApi.get('/products/autocomplete/', { 
        params: { 
          q: query,
          limit
        } 
      });
      
      console.log('Autocomplete suggestions:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting autocomplete suggestions:', error);
      // Return empty array on error instead of failing completely
      return { suggestions: [] };
    }
  },
  
  // Record when user clicks on a search result
  recordSearchClick: async (searchId: number, productId: number) => {
    try {
      console.log(`Recording search click - search: ${searchId}, product: ${productId}`);
      const response = await publicApi.post('/analytics/record-search-click/', {
        search_id: searchId,
        product_id: productId
      });
      return response.data;
    } catch (error) {
      console.error('Error recording search click:', error);
      // Silently fail - this is analytics data and shouldn't interrupt user flow
      return null;
    }
  }
};

// Export all services
export default {
  productService,
  categoryService,
  brandService,
  cartService,
  authService,
  orderService,
  userService,
  addressService,
  wishlistService,
  emiService,
  promotionsService,
  reviewService,
  paymentMethodService,
  contactService,
  notificationService,
  paymentService,
  searchService, // Add search service to exports
}; 