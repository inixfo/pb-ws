import { publicApi, handleError } from './apiUtils';

/**
 * Search service for advanced search functionality
 */
const searchService = {
  /**
   * Advanced search with typo correction and exact match prioritization
   * @param query Search query
   * @param params Additional parameters
   * @returns Search results with did-you-mean suggestions
   */
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
  
  /**
   * Get autocomplete suggestions as user types
   * @param query Search query
   * @param limit Maximum number of suggestions to return
   * @returns Search suggestions
   */
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
  
  /**
   * Record when user clicks on a search result
   * @param searchId Search query ID
   * @param productId Product ID that was clicked
   * @returns Success indicator
   */
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

export default searchService; 