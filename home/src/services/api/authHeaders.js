/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with authorization token if available
 */
export const getAuthHeaders = () => {
  const headers = {
    'Accept': 'application/json',
  };
  
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}; 