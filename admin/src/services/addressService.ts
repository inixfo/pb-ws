import { Address } from '../types/user';
import { API_URL } from '../config/api';
import axios, { AxiosError } from 'axios';

// Helper function to get authentication token
const getToken = () => localStorage.getItem('auth_token');

// Create axios instance with authentication
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds timeout
});

// Simple in-memory cache for addresses
let addressCache: Address[] = [];
let lastFetchTime = 0;
let syncInProgress = false;
let syncTimeout: number | null = null;

// Add a sync mechanism to ensure data consistency
const syncWithBackend = async (forceFull = false) => {
  if (syncInProgress && !forceFull) return;
  
  // Clear any existing sync timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  
  try {
    syncInProgress = true;
    console.log('Syncing addresses with backend');
    
    // Set a timeout to prevent sync getting stuck
    syncTimeout = setTimeout(() => {
      console.warn('Sync timeout reached, resetting sync state');
      syncInProgress = false;
      syncTimeout = null;
    }, 15000);
    
    // Clear the cache immediately if doing a full sync
    if (forceFull) {
      addressCache = [];
    }
    
    // Perform a full fetch from the backend
    await getAll(true);
    
    console.log('Sync complete, address cache updated');
  } catch (error) {
    console.error('Sync with backend failed:', error);
  } finally {
    // Clear the timeout since we're done
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }
    syncInProgress = false;
  }
};

// Reset all service state (useful for logout or when state gets corrupted)
const resetService = () => {
  addressCache = [];
  lastFetchTime = 0;
  syncInProgress = false;
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  console.log('Address service state reset');
};

// Add request interceptor to include auth token and debug information
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request details
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
    headers: config.headers,
    data: config.data
  });
  
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`API Response (${response.status}): ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data
    });
    
    // Update cache when getting addresses
    if (response.config.url?.includes('addresses') && response.config.method === 'get') {
      if (Array.isArray(response.data)) {
        addressCache = [...response.data];
        lastFetchTime = Date.now();
      } else if (response.data && typeof response.data === 'object') {
        // Try to handle pagination
        if (Array.isArray(response.data.results)) {
          addressCache = [...response.data.results];
          lastFetchTime = Date.now();
        }
      }
    }
    
    return response;
  },
  error => {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`API Error (${error.response.status}): ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        data: error.response.data
      });
    }
    return Promise.reject(error);
  }
);

// Error handler helper function
const handleError = (error: unknown, context: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    console.error(`${context}:`, {
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      message: axiosError.message
    });
  } else {
    console.error(`${context}:`, error);
  }
  throw error;
};

// Try alternative endpoints if the standard ones fail
const tryAlternativeEndpoints = async <T>(primaryCall: () => Promise<T>, alternativeCalls: (() => Promise<T>)[]) => {
  try {
    return await primaryCall();
  } catch (error) {
    console.warn('Primary endpoint failed, trying alternatives');
    
    // Try each alternative
    for (const alternativeCall of alternativeCalls) {
      try {
        return await alternativeCall();
      } catch (altError) {
        console.warn('Alternative endpoint failed');
      }
    }
    
    // If all alternatives fail, throw the original error
    throw error;
  }
};

// Get all addresses for the current user
export const getAll = async (forceRefresh = false): Promise<Address[]> => {
  try {
    // Return from cache if it's less than 2 seconds old and not forced refresh
    const now = Date.now();
    if (!forceRefresh && addressCache.length > 0 && (now - lastFetchTime) < 2000) {
      console.log('Returning addresses from cache:', addressCache);
      return addressCache;
    }
    
    // Try both potential API endpoints
    const addresses = await tryAlternativeEndpoints(
      // Primary endpoint: /users/addresses/
      async () => {
        const response = await api.get('/users/addresses/');
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.results)) {
          // Handle DRF pagination
          return response.data.results;
        }
        return [];
      },
      [
        // Alternative 1: /user/addresses/ (singular)
        async () => {
          const response = await api.get('/user/addresses/');
          if (Array.isArray(response.data)) {
            return response.data;
          } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.results)) {
            return response.data.results;
          }
          return [];
        },
        // Alternative 2: /user/profile/addresses/ (nested)
        async () => {
          const response = await api.get('/user/profile/addresses/');
          if (Array.isArray(response.data)) {
            return response.data;
          } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.results)) {
            return response.data.results;
          }
          return [];
        }
      ]
    );
    
    console.log('Fetched addresses successfully:', addresses);
    
    // Update cache
    addressCache = [...addresses];
    lastFetchTime = now;
    
    return addresses;
  } catch (error) {
    console.error('All address endpoints failed:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Response:', error.response?.data);
    } else {
      console.error(error);
    }
    return addressCache.length > 0 ? addressCache : []; // Return cache as fallback
  }
};

// Create a new address
export const create = async (address: Partial<Address>): Promise<Address> => {
  try {
    const result = await tryAlternativeEndpoints(
      async () => {
        const response = await api.post('/users/addresses/', address);
        return response.data;
      },
      [
        async () => {
          const response = await api.post('/user/addresses/', address);
          return response.data;
        },
        async () => {
          const response = await api.post('/user/profile/addresses/', address);
          return response.data;
        }
      ]
    );
    
    // Immediately update the cache with the new address
    if (result && typeof result === 'object' && result.id) {
      console.log('Adding new address to cache:', result);
      addressCache = [...addressCache, result];
      lastFetchTime = Date.now();
    }
    
    // Trigger a full sync with the backend after a short delay
    setTimeout(() => syncWithBackend(true), 1000);
    
    return result;
  } catch (error) {
    return handleError(error, 'Error creating address');
  }
};

// Update an existing address
export const update = async (id: number, address: Partial<Address>): Promise<Address> => {
  try {
    const result = await tryAlternativeEndpoints(
      async () => {
        const response = await api.put(`/users/addresses/${id}/`, address);
        return response.data;
      },
      [
        async () => {
          const response = await api.put(`/user/addresses/${id}/`, address);
          return response.data;
        },
        async () => {
          const response = await api.put(`/user/profile/addresses/${id}/`, address);
          return response.data;
        }
      ]
    );
    
    // Immediately update the cache with the updated address
    if (result && typeof result === 'object' && result.id) {
      console.log('Updating address in cache:', result);
      const index = addressCache.findIndex(a => a.id === id);
      if (index !== -1) {
        addressCache[index] = result;
      } else {
        addressCache.push(result);
      }
      lastFetchTime = Date.now();
    }
    
    // Trigger a full sync with the backend after a short delay
    setTimeout(() => syncWithBackend(true), 1000);
    
    return result;
  } catch (error) {
    return handleError(error, `Error updating address ${id}`);
  }
};

// Delete an address
export const delete_ = async (id: number): Promise<void> => {
  try {
    await tryAlternativeEndpoints(
      async () => {
        await api.delete(`/users/addresses/${id}/`);
      },
      [
        async () => {
          await api.delete(`/user/addresses/${id}/`);
        },
        async () => {
          await api.delete(`/user/profile/addresses/${id}/`);
        }
      ]
    );
    
    // Immediately update the cache by removing the deleted address
    console.log('Removing address from cache:', id);
    addressCache = addressCache.filter(a => a.id !== id);
    lastFetchTime = Date.now();
    
    // Trigger a full sync with the backend after a short delay
    setTimeout(() => syncWithBackend(true), 1000);
  } catch (error) {
    handleError(error, `Error deleting address ${id}`);
  }
};

// Set an address as default
export const setDefault = async (id: number): Promise<Address> => {
  try {
    const result = await tryAlternativeEndpoints(
      async () => {
        const response = await api.post(`/users/addresses/${id}/set_default/`);
        return response.data;
      },
      [
        async () => {
          const response = await api.post(`/user/addresses/${id}/set_default/`);
          return response.data;
        },
        async () => {
          // Fallback to using update with is_default set to true
          const response = await api.put(`/users/addresses/${id}/`, { is_default: true });
          return response.data;
        },
        async () => {
          const response = await api.put(`/user/addresses/${id}/`, { is_default: true });
          return response.data;
        }
      ]
    );
    
    // Force refresh the address cache after setting default
    setTimeout(() => syncWithBackend(true), 1000);
    
    return result;
  } catch (error) {
    return handleError(error, `Error setting address ${id} as default`);
  }
};

const addressService = {
  getAll,
  create,
  update,
  delete: delete_,
  setDefault,
  syncWithBackend,
  resetService
};

export default addressService; 