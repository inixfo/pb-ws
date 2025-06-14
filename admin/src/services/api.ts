import { toast } from 'react-hot-toast';

const API_URL = 'http://3.25.95.103/api';

// Helper function to get authentication token
const getToken = () => localStorage.getItem('auth_token');

// Generic fetch function with authentication and error handling
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, rawResponse: boolean = false) {
  const token = getToken();
  
  if (!token) {
    console.error('🔴 No authentication token found');
    toast.error('Authentication required');
    throw new Error('Authentication token missing');
  }
  
  // Check if the body is FormData
  const isFormData = options.body instanceof FormData;
  
  // Create headers with the right Content-Type
  const headers = new Headers();
  
  // Always add the Authorization header
  headers.append('Authorization', `Bearer ${token}`);
  
  // Only add Content-Type for JSON requests, not for FormData
  if (!isFormData) {
    headers.append('Content-Type', 'application/json');
    console.log('Adding Content-Type: application/json header for non-FormData request');
  } else {
    console.log('FormData detected - not setting Content-Type to let browser handle multipart boundary');
  }
  
  // Add any additional headers from options
  if (options.headers) {
    const optionHeaders = options.headers as Record<string, string>;
    Object.keys(optionHeaders).forEach(key => {
      headers.append(key, optionHeaders[key]);
    });
  }
  
  // Log detailed information about the request
  console.log(`🚀 API Request to ${endpoint}:`, {
    method: options.method || 'GET',
    isFormData: isFormData,
    bodyType: isFormData ? 'FormData' : typeof options.body,
    bodyPreview: isFormData 
      ? `FormData with ${Array.from((options.body as FormData).keys()).join(', ')}` 
      : options.body
  });
  
  // Process body for non-FormData requests
  let processedBody = options.body;
  if (!isFormData && typeof options.body === 'object' && options.body !== null) {
    console.log('Processing JSON body:', options.body);
    processedBody = JSON.stringify(options.body);
  }
  
  // For FormData, log all fields for debugging
  if (isFormData) {
    console.log('🔍 FormData contents:');
    const formData = options.body as FormData;
    for (const pair of formData.entries()) {
      const valuePreview = pair[1] instanceof File 
        ? `File: ${(pair[1] as File).name} (${(pair[1] as File).type}, ${(pair[1] as File).size} bytes)` 
        : pair[1];
      console.log(`- ${pair[0]}: ${valuePreview}`);
    }
    
    // Check for specific file-related fields
    if (formData.has('profile_picture')) {
      const file = formData.get('profile_picture') as File;
      console.log('🔍 Profile picture details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
    }
  }
  
  try {
    console.log(`📤 Sending ${options.method || 'GET'} request to ${API_URL}${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: headers,
      body: processedBody
    });
    
    console.log(`📥 Received response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers])
    });
    
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      let errorDetails = {};
      
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          // Check for field-specific errors
          const fieldErrors = Object.entries(errorData)
            .filter(([key, value]) => value !== undefined)
            .map(([key, value]) => {
              const errorValue = Array.isArray(value) ? value.join(', ') : value;
              return `${key}: ${errorValue}`;
            })
            .join('; ');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
          
          errorDetails = errorData;
        }
      } catch (e) {
        // Could not parse JSON error, use default message
        console.error('Error response could not be parsed as JSON');
        
        // Try to get text error
        try {
          const textError = await response.text();
          if (textError) {
            errorMessage = `${errorMessage}: ${textError}`;
          }
        } catch (textError) {
          // Ignore text parsing error
        }
      }
      
      console.error(`❌ Error response from ${endpoint}:`, errorMessage, errorDetails);
      
      // Show appropriate error message based on status code
      if (response.status === 500) {
        toast.error(`Server error (500): Please contact support if the issue persists.`);
      } else if (response.status === 403) {
        toast.error('Permission denied. You do not have access to this resource.');
      } else if (response.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error(errorMessage);
      }
      
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).status = response.status;
      (enhancedError as any).details = errorDetails;
      throw enhancedError;
    }
    
    // For 204 No Content
    if (response.status === 204) {
      console.log(`✅ Success response from ${endpoint}: No Content`);
      return null;
    }
    
    // Return raw response text if requested
    if (rawResponse) {
      const text = await response.text();
      console.log(`✅ Success response from ${endpoint} (raw text):`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      return text;
    }
    
    // Try to parse the response as JSON
    try {
      const data = await response.json();
      console.log(`✅ Success response from ${endpoint}:`, data);
      return data;
    } catch (e) {
      // If not JSON, return text or null
      try {
        const text = await response.text();
        console.log(`✅ Success response from ${endpoint} (text):`, text || 'Empty response');
        return text || null;
      } catch (e) {
        console.log(`✅ Success response from ${endpoint}: Empty response`);
        return null;
      }
    }
  } catch (error) {
    console.error(`❌ Request to ${endpoint} failed:`, error);
    
    if (error instanceof Error) {
      // Error already handled above
      if (!(error as any).status) {
        // Network error
        toast.error('Network error. Please check your connection.');
      }
    } else {
      toast.error('An unknown error occurred');
    }
    throw error;
  }
}

// API functions by resource - Updated to match backend URL structure
export const userService = {
  // For admin operations
  getAll: () => fetchWithAuth('/admin/users/'),
  getById: (id: number) => fetchWithAuth(`/admin/users/${id}/`),
  update: (id: number, data: any) => fetchWithAuth(`/admin/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchWithAuth(`/admin/users/${id}/`, {
    method: 'DELETE',
  }),
  // For user registration/profile management
  register: (data: any) => fetchWithAuth('/users/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getUserProfile: () => fetchWithAuth('/users/me/'),
  updateProfile: (data: any) => {
    console.log('🔵 API service updateProfile called with:', 
      data instanceof FormData ? 'FormData object' : data);
    
    // If data is FormData, we need special handling
    const isFormData = data instanceof FormData;
    
    if (isFormData) {
      console.log('🔵 Uploading profile with FormData');
      
      // Check if there's a profile picture in the FormData
      const hasProfilePicture = data.has('profile_picture');
      console.log(`🔵 FormData ${hasProfilePicture ? 'includes' : 'does not include'} profile_picture`);
      
      if (hasProfilePicture) {
        // Get the file from FormData for logging
        const file = data.get('profile_picture') as File;
        console.log('🔵 Profile picture details:', {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: new Date(file.lastModified).toISOString()
        });
      }
      
      // Log all fields in FormData for debugging
      console.log('🔵 FormData fields:');
      for (const [key, value] of data.entries()) {
        const valuePreview = value instanceof File 
          ? `File: ${value.name} (${value.type}, ${value.size} bytes)` 
          : value;
        console.log(`- ${key}: ${valuePreview}`);
      }
    } else {
      console.log('🔵 Updating profile with JSON data:', data);
    }
    
    // Special handling for FormData requests with files
    const requestOptions: RequestInit = {
      method: 'PATCH',
      body: data
    };
    
    // Explicitly avoid Content-Type header for FormData with files
    if (isFormData) {
      console.log('🔵 Using FormData upload - letting browser set Content-Type and boundary');
      // Do not set Content-Type for FormData - browser will add with correct boundary
    }
    
    return fetchWithAuth('/users/profile/', requestOptions)
      .then(response => {
        console.log('🔵 Profile update successful, response:', response);
        return response;
      })
      .catch(error => {
        console.error('🔵 Profile update failed:', error);
        // Add more detailed error information
        if (isFormData && data.has('profile_picture')) {
          console.error('🔵 File upload likely failed. Check server file size limits and permissions');
        }
        throw error;
      });
  },
};

export const productService = {
  getAll: (params?: Record<string, string | number>) => {
    const query = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}` : '';
    return fetchWithAuth(`/products/products/${query}`);
  },
  getById: (id: number) => fetchWithAuth(`/products/products/${id}/`),
  getBySlug: (slug: string) => fetchWithAuth(`/products/products/${slug}/`),
  create: (data: FormData) => fetchWithAuth('/products/products/', {
    method: 'POST',
    body: data,
  }),
  update: (id: number, data: FormData) => fetchWithAuth(`/products/products/${id}/`, {
    method: 'PATCH',
    body: data,
  }),
  delete: (id: number) => fetchWithAuth(`/products/products/${id}/`, {
    method: 'DELETE',
  }),
  uploadImage: (productId: number | string, imageData: FormData) => fetchWithAuth(`/products/products/id-${productId}/images/`, {
    method: 'POST',
    body: imageData,
  }),
  getFieldsByCategory: (categoryId: number) => fetchWithAuth(`/products/categories/${categoryId}/fields/`),
  downloadTemplate: (categoryId: string, format: string = 'csv') => {
    return fetchWithAuth(`/products/bulk-upload/template/?category_id=${categoryId}&format=${format}`, {}, true);
  },
  bulkUpload: (data: FormData) => fetchWithAuth('/products/bulk-upload/process/', {
    method: 'POST',
    body: data,
  }),
  getProductFields: (categoryId: string | number) => fetchWithAuth(`/products/categories/${categoryId}/fields/`),
};

// SKU Service
export const skuService = {
  getAll: () => fetchWithAuth('/products/skus/'),
  getByProduct: (productId: number) => fetchWithAuth(`/products/skus/?product=${productId}`),
  getById: (id: number) => fetchWithAuth(`/products/skus/${id}/`),
  create: (data: any) => fetchWithAuth('/products/skus/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchWithAuth(`/products/skus/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchWithAuth(`/products/skus/${id}/`, {
    method: 'DELETE',
  }),
  generateSku: () => fetchWithAuth('/products/skus/generate/', {
    method: 'POST',
  }),
};

// Product Fields Service
export const productFieldService = {
  getAll: () => fetchWithAuth('/products/fields/'),
  getByCategory: (categoryId: number) => fetchWithAuth(`/products/fields/?category=${categoryId}`),
  getById: (id: number) => fetchWithAuth(`/products/fields/${id}/`),
  create: (data: any) => {
    // Ensure options is serialized properly
    const processedData = { ...data };
    if (processedData.options && Array.isArray(processedData.options)) {
      // No need to do anything, as JSON.stringify will handle the array properly
    }
    
    return fetchWithAuth('/products/fields/', {
      method: 'POST',
      body: JSON.stringify(processedData),
    });
  },
  update: (id: number, data: any) => {
    // Ensure options is serialized properly
    const processedData = { ...data };
    if (processedData.options && Array.isArray(processedData.options)) {
      // No need to do anything, as JSON.stringify will handle the array properly
    }
    
    return fetchWithAuth(`/products/fields/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(processedData),
    });
  },
  delete: (id: number) => fetchWithAuth(`/products/fields/${id}/`, {
    method: 'DELETE',
  }),
};

export const categoryService = {
  getAll: () => fetchWithAuth('/products/categories/'),
  getById: (id: number) => fetchWithAuth(`/products/categories/${id}/`),
  create: (data: any) => {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return fetchWithAuth('/products/categories/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      // Don't set headers for FormData - will be set automatically by fetch
    });
  },
  update: (id: number, data: any) => {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return fetchWithAuth(`/products/categories/${id}/`, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      // Don't set headers for FormData - will be set automatically by fetch
    });
  },
  delete: (id: number) => fetchWithAuth(`/products/categories/${id}/`, {
    method: 'DELETE',
  }),
  getAllCategories: () => fetchWithAuth('/products/categories/'),
  getCategoryById: (id: number) => fetchWithAuth(`/products/categories/${id}/`),
  createCategory: (data: any) => fetchWithAuth('/products/categories/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCategory: (id: number, data: any) => fetchWithAuth(`/products/categories/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteCategory: (id: number) => fetchWithAuth(`/products/categories/${id}/`, {
    method: 'DELETE',
  }),
};

export const brandService = {
  getAll: () => fetchWithAuth('/products/brands/'),
  getById: (id: number) => fetchWithAuth(`/products/brands/${id}/`),
  create: (data: any) => {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return fetchWithAuth('/products/brands/', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      // Don't set headers for FormData - will be set automatically by fetch
    });
  },
  update: (id: number, data: any) => {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return fetchWithAuth(`/products/brands/${id}/`, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      // Don't set headers for FormData - will be set automatically by fetch
    });
  },
  delete: (id: number) => fetchWithAuth(`/products/brands/${id}/`, {
    method: 'DELETE',
  }),
};

export const orderService = {
  getAll: () => fetchWithAuth('/orders/'),
  getById: (id: number) => fetchWithAuth(`/orders/${id}/`),
  update: (id: number, data: any) => fetchWithAuth(`/orders/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const emiService = {
  // EMI Plans
  getPlans: () => fetchWithAuth('/emi/plans/'),
  getPlanById: (id: number) => fetchWithAuth(`/emi/plans/${id}/`),
  createPlan: (data: any) => fetchWithAuth('/emi/plans/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePlan: (id: number, data: any) => fetchWithAuth(`/emi/plans/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deletePlan: (id: number) => fetchWithAuth(`/emi/plans/${id}/`, {
    method: 'DELETE',
  }),
  
  // EMI Applications
  getApplications: () => fetchWithAuth('/emi/applications/'),
  getApplicationById: (id: number) => fetchWithAuth(`/emi/applications/${id}/`),
  updateApplication: (id: number, data: any) => fetchWithAuth(`/emi/applications/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  approveApplication: (id: number) => fetchWithAuth(`/emi/applications/${id}/approve/`, {
    method: 'POST',
  }),
  rejectApplication: (id: number) => fetchWithAuth(`/emi/applications/${id}/reject/`, {
    method: 'POST',
  }),
};

export const vendorService = {
  getAll: () => fetchWithAuth('/admin/vendors/'),
  getById: (id: number) => fetchWithAuth(`/admin/vendors/${id}/`),
  approve: (id: number) => fetchWithAuth(`/admin/vendors/${id}/approve/`, {
    method: 'POST',
  }),
  reject: (id: number) => fetchWithAuth(`/admin/vendors/${id}/reject/`, {
    method: 'POST',
  }),
  suspend: (id: number) => fetchWithAuth(`/admin/vendors/${id}/suspend/`, {
    method: 'POST',
  }),
  feature: (id: number) => fetchWithAuth(`/admin/vendors/${id}/feature/`, {
    method: 'POST',
  }),
  unfeature: (id: number) => fetchWithAuth(`/admin/vendors/${id}/unfeature/`, {
    method: 'POST',
  }),
  getPending: () => fetchWithAuth('/admin/vendors/pending/'),
  create: (data: any) => fetchWithAuth('/admin/vendors/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchWithAuth(`/admin/vendors/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

export const reviewService = {
  getAll: () => fetchWithAuth('/reviews/'),
  getById: (id: number) => fetchWithAuth(`/reviews/${id}/`),
  approve: (id: number) => fetchWithAuth(`/reviews/${id}/approve/`, {
    method: 'POST',
  }),
  reject: (id: number) => fetchWithAuth(`/reviews/${id}/reject/`, {
    method: 'POST',
  }),
  delete: (id: number) => fetchWithAuth(`/reviews/${id}/`, {
    method: 'DELETE',
  }),
};

// Vendor-specific services
export const vendorProductService = {
  getAll: () => fetchWithAuth('/vendors/products/'),
  getById: (id: number) => fetchWithAuth(`/vendors/products/${id}/`),
  create: (data: any) => fetchWithAuth('/vendors/products/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchWithAuth(`/vendors/products/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchWithAuth(`/vendors/products/${id}/`, {
    method: 'DELETE',
  }),
};

export const vendorOrderService = {
  getAll: () => fetchWithAuth('/vendors/orders/'),
  getById: (id: number) => fetchWithAuth(`/vendors/orders/${id}/`),
  updateStatus: (id: number, status: string) => fetchWithAuth(`/vendors/orders/${id}/status/`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }),
};

export const vendorAnalyticsService = {
  getSummary: () => fetchWithAuth('/analytics/vendors/summary/'),
  getSalesByPeriod: (period: string) => fetchWithAuth(`/analytics/vendors/sales/${period}/`),
  getTopProducts: () => fetchWithAuth('/analytics/vendors/top-products/'),
};

export const addressService = {
  getAll: () => {
    console.log('🟢 Calling addressService.getAll()');
    return fetchWithAuth('/users/addresses/')
      .then(data => {
        console.log('🟢 Address data received:', data);
        return data;
      })
      .catch(error => {
        console.error('🔴 Error in addressService.getAll():', error);
        // Don't just throw the error, return empty array so UI can handle gracefully
        return [];
      });
  },
  
  getById: (id: number) => {
    console.log(`🟢 Getting address with id: ${id}`);
    return fetchWithAuth(`/users/addresses/${id}/`);
  },
  
  create: (data: any) => {
    console.log('🟢 Creating address with data:', data);
    try {
      // Ensure data format is correct - remove any undefined values
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      return fetchWithAuth('/users/addresses/', {
        method: 'POST',
        body: JSON.stringify(cleanData),
      }).then(response => {
        console.log('🟢 Address creation successful:', response);
        return response;
      });
    } catch (error) {
      console.error('🔴 Error preparing address creation data:', error);
      throw error;
    }
  },
  
  update: (id: number, data: any) => {
    console.log('🟢 Updating address with id:', id, 'data:', data);
    try {
      // Ensure data format is correct - remove any undefined values and id (it's in the URL)
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && key !== 'id') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      return fetchWithAuth(`/users/addresses/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(cleanData),
      }).then(response => {
        console.log('🟢 Address update successful:', response);
        return response;
      });
    } catch (error) {
      console.error('🔴 Error preparing address update data:', error);
      throw error;
    }
  },
  
  delete: (id: number) => {
    console.log('🟢 Deleting address with id:', id);
    return fetchWithAuth(`/users/addresses/${id}/`, {
      method: 'DELETE',
    }).then(response => {
      console.log('🟢 Address deletion successful');
      return response;
    });
  },
  
  setDefault: (id: number) => {
    console.log('🟢 Setting address as default, id:', id);
    
    // Try the specific endpoint first
    return fetchWithAuth(`/users/addresses/${id}/set_default/`, {
      method: 'POST',
      body: JSON.stringify({ is_default: true }),
    })
    .then(response => {
      console.log('🟢 Address set as default successfully (dedicated endpoint)');
      return response;
    })
    .catch(error => {
      console.error('🔴 Error setting address as default (dedicated endpoint):', error);
      console.log('🟠 Trying fallback endpoint...');
      
      // Try alternative endpoint format if first one fails
      return fetchWithAuth(`/users/addresses/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_default: true }),
      }).then(response => {
        console.log('🟢 Address set as default successfully (fallback endpoint)');
        return response;
      });
    });
  },
};

export const adminPaymentService = {
  getVendorPayoutRequests: (status: string) => fetchWithAuth(`/admin/vendor-payouts/?status=${status || ''}`),
  approvePayoutRequest: (id: number, notes: string) => fetchWithAuth(`/admin/vendor-payouts/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  }),
  rejectPayoutRequest: (id: number, notes: string) => fetchWithAuth(`/admin/vendor-payouts/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  }),
  completePayoutRequest: (id: number, notes: string) => fetchWithAuth(`/admin/vendor-payouts/${id}/complete/`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  }),
};

export const analyticsService = {
  getVendorAnalytics: () => fetchWithAuth('/analytics/vendors/summary/'),
  // Add more analytics methods as needed
};

export const vendorPaymentService = {
  // Payout requests
  getPayoutRequests: () => fetchWithAuth('/vendors/payments/payouts/'),
  requestPayout: (amount: number) => fetchWithAuth('/vendors/payments/payouts/', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }),
  
  // Transactions
  getTransactions: (timeframe: string = '') => fetchWithAuth(`/vendors/payments/transactions/?timeframe=${timeframe}`),
  
  // Bank accounts
  getBankAccounts: () => fetchWithAuth('/vendors/payments/bank-accounts/'),
  addBankAccount: (data: any) => fetchWithAuth('/vendors/payments/bank-accounts/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateBankAccount: (id: number, data: any) => fetchWithAuth(`/vendors/payments/bank-accounts/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteBankAccount: (id: number) => fetchWithAuth(`/vendors/payments/bank-accounts/${id}/`, {
    method: 'DELETE',
  }),
  
  // PayPal accounts
  getPaypalAccounts: () => fetchWithAuth('/vendors/payments/paypal-accounts/'),
  addPaypalAccount: (data: any) => fetchWithAuth('/vendors/payments/paypal-accounts/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePaypalAccount: (id: number, data: any) => fetchWithAuth(`/vendors/payments/paypal-accounts/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deletePaypalAccount: (id: number) => fetchWithAuth(`/vendors/payments/paypal-accounts/${id}/`, {
    method: 'DELETE',
  }),
};