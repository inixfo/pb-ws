import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: 'http://3.25.95.103/', // Default to localhost for development
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
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
  (error: any): Promise<any> => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: any): Promise<any> => {
    const originalRequest = error.config;

    // If we got a 401 and we haven't tried refreshing yet, attempt it
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Use a plain axios call here to avoid infinite loop with this interceptor
        const { API_URL } = await import('../../config');
        const refreshResp = await axios.post(`${API_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResp.data.access;
        if (newAccessToken) {
          localStorage.setItem('auth_token', newAccessToken);
          // Update the authorization header and retry the original request
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        // Clear tokens and let the request fail – user must log in again
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient; 