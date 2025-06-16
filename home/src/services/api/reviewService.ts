import axios, { AxiosRequestConfig } from 'axios';

// If we don't have an apiClient module, we'll create a simple version inline
const apiClient = axios.create({
  baseURL: 'http://3.25.95.103/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // If token exists, add it to the headers
    if (token) {
      // Make sure token has Bearer prefix
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers = config.headers || {};
      config.headers.Authorization = formattedToken;
    }
    
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

const reviewService = {
  getReviews: async (productId: string, page = 1, pageSize = 10, ordering = '-created_at') => {
    try {
      const response = await apiClient.get(`/api/reviews/reviews/`, {
        params: {
          product: productId,
          page,
          page_size: pageSize,
          ordering
        }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      
      // Return an empty result structure
      return {
        count: 0,
        next: null,
        previous: null,
        results: []
      };
    }
  },

  getReviewSummary: async (productId: string) => {
    try {
      const response = await apiClient.get(`/api/reviews/reviews/summary/`, {
        params: { product: productId }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching review summary:", error);
      
      // Return a fallback summary object if the API fails
      return {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: {
          '5': 0,
          '4': 0,
          '3': 0,
          '2': 0,
          '1': 0
        },
        verified_purchases: 0
      };
    }
  },

  createReview: async (reviewData: any, images?: File[]) => {
    try {
      // If there are images, use FormData to send multipart/form-data
      if (images && images.length > 0) {
        const formData = new FormData();
        
        // Add review data to FormData
        Object.keys(reviewData).forEach(key => {
          formData.append(key, reviewData[key]);
        });
        
        // Add images to FormData (up to 3)
        for (let i = 0; i < Math.min(images.length, 3); i++) {
          formData.append(`image${i+1}`, images[i]);
        }
        
        // Send FormData with appropriate headers
        const response = await apiClient.post(`/api/reviews/reviews/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data;
      } else {
        // No images, use regular JSON request
        const response = await apiClient.post(`/api/reviews/reviews/`, reviewData);
        return response.data;
      }
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  },

  updateReview: async (reviewId: string, reviewData: any, images?: File[]) => {
    try {
      // If there are images, use FormData to send multipart/form-data
      if (images && images.length > 0) {
        const formData = new FormData();
        
        // Add review data to FormData
        Object.keys(reviewData).forEach(key => {
          formData.append(key, reviewData[key]);
        });
        
        // Add images to FormData (up to 3)
        for (let i = 0; i < Math.min(images.length, 3); i++) {
          formData.append(`image${i+1}`, images[i]);
        }
        
        // Send FormData with appropriate headers
        const response = await apiClient.put(`/api/reviews/reviews/${reviewId}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data;
      } else {
        // No images, use regular JSON request
        const response = await apiClient.put(`/api/reviews/reviews/${reviewId}/`, reviewData);
        return response.data;
      }
    } catch (error) {
      console.error("Error updating review:", error);
      throw error;
    }
  },

  deleteReview: async (reviewId: string) => {
    try {
      const response = await apiClient.delete(`/api/reviews/reviews/${reviewId}/`);
      return response.data;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw error;
    }
  },

  getMyReviews: async () => {
    try {
      const response = await apiClient.get('/api/reviews/reviews/my_reviews/');
      return response.data.results || [];
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      return [];
    }
  },

  canReviewProduct: async (productId: string) => {
    try {
      const response = await apiClient.get(`/api/reviews/can-review/`, {
        params: { product: productId }
      });
      return response.data;
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      // Return a fallback object
      return {
        can_review: false,
        reason: "Unable to check eligibility. Please try again later."
      };
    }
  },

  voteReview: async (reviewId: string, vote: 'helpful' | 'unhelpful') => {
    try {
      const response = await apiClient.post(`/api/reviews/reviews/${reviewId}/vote/`, { vote });
      return response.data;
    } catch (error) {
      console.error(`Error voting on review:`, error);
      throw error;
    }
  },

  replyToReview: async (reviewId: string, comment: string) => {
    try {
      const response = await apiClient.post(`/api/reviews/reviews/${reviewId}/reply/`, { comment });
      return response.data;
    } catch (error) {
      console.error("Error replying to review:", error);
      throw error;
    }
  }
};

export { reviewService }; 