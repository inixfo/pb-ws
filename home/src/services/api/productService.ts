import { AxiosResponse } from 'axios';
import { publicApi } from './apiUtils';
import config from '../../config';
import { Product } from '../../types/products';

// Define PaginatedResponse type if it doesn't exist
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const API_URL = `${config.API_URL}/products`;

// Fallback data for when API fails
export const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "iPhone 14 Pro",
    slug: "iphone-14-pro",
    description: "Apple's latest flagship phone with advanced features.",
    base_price: 999.00,
    discount_price: 949.00,
    category: {
      id: 1,
      name: "Smartphones",
      slug: "smartphones"
    },
    brand: {
      id: 1,
      name: "Apple",
      slug: "apple"
    },
    images: [
      {
        id: 1,
        image: "/media/product_images/1/iphone14pro.jpg",
        alt_text: "iPhone 14 Pro"
      }
    ],
    average_rating: 4.8,
    review_count: 245,
    in_stock: true,
    is_featured: true
  },
  {
    id: 2,
    name: "Samsung Galaxy S23 Ultra",
    slug: "samsung-galaxy-s23-ultra",
    description: "Samsung's premium smartphone with S Pen and 200MP camera.",
    base_price: 1199.00,
    discount_price: 1099.00,
    category: {
      id: 1,
      name: "Smartphones",
      slug: "smartphones"
    },
    brand: {
      id: 2,
      name: "Samsung",
      slug: "samsung"
    },
    images: [
      {
        id: 2,
        image: "/media/product_images/2/s23ultra.jpg",
        alt_text: "Samsung Galaxy S23 Ultra"
      }
    ],
    average_rating: 4.7,
    review_count: 189,
    in_stock: true,
    is_featured: true
  }
];

class ProductService {
  async getAll(params: Record<string, any> = {}): Promise<PaginatedResponse<Product>> {
    console.log('[productService.getAll] Called with params:', params);
    console.log('[productService.getAll] Using endpoint:', API_URL);
    
    // Try multiple endpoints in sequence to ensure we get products
    const endpoints = [
      API_URL,
      `${API_URL}/products/`,
      `${API_URL}/products/products/`,
      `${API_URL}/products/products/`
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`[productService.getAll] Trying endpoint: ${endpoint}`);
        const response: AxiosResponse<PaginatedResponse<Product>> = await publicApi.get(endpoint, { params });
        
        console.log(`[productService.getAll] Success from ${endpoint}:`, {
          count: response.data.count,
          resultsLength: response.data.results?.length || 0
        });
        
        return response.data;
      } catch (error) {
        console.error(`[productService.getAll] Error from ${endpoint}:`, error);
        lastError = error;
      }
    }
    
    // If all endpoints failed, try a direct axios call as last resort
    try {
      console.log('[productService.getAll] All endpoints failed, trying direct axios call');
      const axios = (await import('axios')).default;
      
      const directUrl = 'http://52.62.201.84/api/products/products/';
      console.log(`[productService.getAll] Direct axios call to ${directUrl}`);
      
      const response = await axios.get(directUrl, { params });
      
      console.log('[productService.getAll] Direct axios call succeeded:', {
        count: response.data.count,
        resultsLength: response.data.results?.length || 0
      });
      
      return response.data;
    } catch (directError) {
      console.error('[productService.getAll] Direct axios call failed:', directError);
      throw lastError || directError;
    }
  }

  async getById(id: number): Promise<Product> {
    console.log(`[productService.getById] Called for product ID: ${id}`);
    try {
      const response = await publicApi.get(`${API_URL}/products/${id}/`);
      console.log(`[productService.getById] Success for product ID ${id}`);
      return response.data;
    } catch (error) {
      console.error(`[productService.getById] Error for product ID ${id}:`, error);
      throw error;
    }
  }

  async getRelated(id: number): Promise<Product[]> {
    console.log(`[productService.getRelated] Called for product ID: ${id}`);
    try {
      const response = await publicApi.get(`${API_URL}/products/${id}/related/`);
      console.log(`[productService.getRelated] Success for product ID ${id}:`, response.data.length);
      return response.data;
    } catch (error) {
      console.error(`[productService.getRelated] Error for product ID ${id}:`, error);
      throw error;
    }
  }

  async getFeatured(): Promise<Product[]> {
    console.log('[productService.getFeatured] Called');
    try {
      const response = await publicApi.get(`${API_URL}/products/featured/`);
      console.log('[productService.getFeatured] Success:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('[productService.getFeatured] Error:', error);
      throw error;
    }
  }

  async getBestSellers(): Promise<Product[]> {
    console.log('[productService.getBestSellers] Called');
    try {
      const response = await publicApi.get(`${API_URL}/products/best-sellers/`);
      console.log('[productService.getBestSellers] Success:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('[productService.getBestSellers] Error:', error);
      throw error;
    }
  }

  async getNewArrivals(): Promise<Product[]> {
    console.log('[productService.getNewArrivals] Called');
    try {
      const response = await publicApi.get(`${API_URL}/products/new-arrivals/`);
      console.log('[productService.getNewArrivals] Success:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('[productService.getNewArrivals] Error:', error);
      throw error;
    }
  }

  async getOnSale(): Promise<Product[]> {
    console.log('[productService.getOnSale] Called');
    try {
      const response = await publicApi.get(`${API_URL}/products/on-sale/`);
      console.log('[productService.getOnSale] Success:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('[productService.getOnSale] Error:', error);
      throw error;
    }
  }

  async getCategories(slug?: string) {
    console.log(`[productService.getCategories] Called with slug: ${slug || 'none'}`);
    try {
      const url = slug 
        ? `${API_URL}/categories/${slug}/`
        : `${API_URL}/categories/`;
        
      const response = await publicApi.get(url);
      console.log('[productService.getCategories] Success');
      return response.data;
    } catch (error) {
      console.error('[productService.getCategories] Error:', error);
      throw error;
    }
  }

  async getCategoriesWithCount() {
    console.log('[productService.getCategoriesWithCount] Called');
    try {
      const response = await publicApi.get(`${API_URL}/categories/with-count/`);
      console.log('[productService.getCategoriesWithCount] Success');
      return response.data;
    } catch (error) {
      console.error('[productService.getCategoriesWithCount] Error:', error);
      throw error;
    }
  }

  async getBrands() {
    console.log('[productService.getBrands] Called');
    try {
      const response = await publicApi.get(`${API_URL}/brands/`);
      console.log('[productService.getBrands] Success');
      return response.data;
    } catch (error) {
      console.error('[productService.getBrands] Error:', error);
      throw error;
    }
  }

  async getFilters(categorySlug?: string) {
    console.log(`[productService.getFilters] Called with category slug: ${categorySlug || 'none'}`);
    try {
      const params = categorySlug ? { category_slug: categorySlug } : {};
      const response = await publicApi.get(`${API_URL}/filters/`, { params });
      console.log('[productService.getFilters] Success');
      return response.data;
    } catch (error) {
      console.error('[productService.getFilters] Error:', error);
      throw error;
    }
  }

  async getPriceRange(categorySlug?: string) {
    console.log(`[productService.getPriceRange] Called with category slug: ${categorySlug || 'none'}`);
    try {
      const params = categorySlug ? { category_slug: categorySlug } : {};
      const response = await publicApi.get(`${API_URL}/price-range/`, { params });
      console.log('[productService.getPriceRange] Success');
      return response.data;
    } catch (error) {
      console.error('[productService.getPriceRange] Error:', error);
      throw error;
    }
  }

  // Add missing methods
  async getCategoryWithProductCount(slug?: string) {
    console.log(`[productService.getCategoryWithProductCount] Called with slug: ${slug || 'none'}`);
    try {
      const url = slug 
        ? `${API_URL}/categories/${slug}/`
        : `${API_URL}/categories/`;
        
      const params = { with_product_count: true };
      const response = await publicApi.get(url, { params });
      console.log('[productService.getCategoryWithProductCount] Success');
      return response.data;
    } catch (error) {
      console.error('[productService.getCategoryWithProductCount] Error:', error);
      throw error;
    }
  }

  async getFilterOptions(categoryId?: number, categorySlug?: string) {
    console.log(`[productService.getFilterOptions] Called with categoryId: ${categoryId || 'none'}, categorySlug: ${categorySlug || 'none'}`);
    try {
      const params: Record<string, any> = {};
      if (categoryId) {
        params.category = categoryId;
      }
      if (categorySlug) {
        params.category_slug = categorySlug;
      }
      
      const response = await publicApi.get(`${API_URL}/filter-options/`, { params });
      console.log('[productService.getFilterOptions] Success');
      return response.data;
    } catch (error) {
      console.error('[productService.getFilterOptions] Error:', error);
      
      // Try fallback with default values
      console.log('[productService.getFilterOptions] Returning default filter options');
      return {
        colors: [],
        brands: [],
        price_range: { min: 0, max: 10000 },
        custom_filters: {}
      };
    }
  }
}

export const productService = new ProductService(); 