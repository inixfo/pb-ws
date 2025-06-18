import axios from 'axios';
import { API_URL } from '../../config';
import { Product } from '../../types/products';

// Fallback data for when API fails
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "iPhone 14 Pro",
    slug: "iphone-14-pro",
    description: "Apple's flagship smartphone with the latest technology.",
    price: 999,
    base_price: 999,
    sale_price: null,
    rating: 4.8,
    reviews_count: 324,
    image: "/image.png",
    category: { id: 1, name: "Smartphones", slug: "smartphones" },
    brand: { id: 1, name: "Apple", slug: "apple", logo: "/apple.svg" },
    created_at: "2023-01-01",
    updated_at: "2023-01-01",
    variations: [],
    has_variations: false,
    min_price: 999,
    max_price: 999
  },
  {
    id: 2,
    name: "Samsung Galaxy S23",
    slug: "samsung-galaxy-s23",
    description: "Samsung's premium smartphone with advanced camera features.",
    price: 899,
    base_price: 899,
    sale_price: 799,
    rating: 4.6,
    reviews_count: 256,
    image: "/image-1.png",
    category: { id: 1, name: "Smartphones", slug: "smartphones" },
    brand: { id: 2, name: "Samsung", slug: "samsung", logo: "/samsung.svg" },
    created_at: "2023-01-02",
    updated_at: "2023-01-02",
    variations: [],
    has_variations: false,
    min_price: 799,
    max_price: 899
  },
  {
    id: 3,
    name: "iPad Pro M1",
    slug: "ipad-pro-m1",
    description: "Powerful tablet with M1 chip for professional use.",
    price: 1099,
    base_price: 1099,
    sale_price: null,
    rating: 4.9,
    reviews_count: 189,
    image: "/image-1.png",
    category: { id: 3, name: "Tablets", slug: "tablets" },
    brand: { id: 1, name: "Apple", slug: "apple", logo: "/apple.svg" },
    created_at: "2023-01-03",
    updated_at: "2023-01-03",
    variations: [],
    has_variations: false,
    min_price: 1099,
    max_price: 1099
  },
  {
    id: 4,
    name: "MacBook Pro 14\"",
    slug: "macbook-pro-14",
    description: "Professional laptop with Apple M2 Pro chip.",
    price: 1999,
    base_price: 1999,
    sale_price: 1799,
    rating: 4.9,
    reviews_count: 142,
    image: "/laptop-1.png",
    category: { id: 2, name: "Laptops", slug: "laptops" },
    brand: { id: 1, name: "Apple", slug: "apple", logo: "/apple.svg" },
    created_at: "2023-02-15",
    updated_at: "2023-02-15",
    variations: [],
    has_variations: false,
    min_price: 1799,
    max_price: 1999
  },
  {
    id: 5,
    name: "Google Pixel 7",
    slug: "google-pixel-7",
    description: "Google's flagship smartphone with best-in-class camera.",
    price: 699,
    base_price: 699,
    sale_price: null,
    rating: 4.7,
    reviews_count: 178,
    image: "/phone-1.png",
    category: { id: 1, name: "Smartphones", slug: "smartphones" },
    brand: { id: 3, name: "Google", slug: "google", logo: "/google.svg" },
    created_at: "2023-03-10",
    updated_at: "2023-03-10",
    variations: [],
    has_variations: false,
    min_price: 699,
    max_price: 699
  },
  {
    id: 6,
    name: "Dell XPS 15",
    slug: "dell-xps-15",
    description: "Premium Windows laptop with stunning display.",
    price: 1599,
    base_price: 1599,
    sale_price: 1499,
    rating: 4.6,
    reviews_count: 203,
    image: "/laptop-2.png",
    category: { id: 2, name: "Laptops", slug: "laptops" },
    brand: { id: 4, name: "Dell", slug: "dell", logo: "/dell.svg" },
    created_at: "2023-01-20",
    updated_at: "2023-01-20",
    variations: [],
    has_variations: false,
    min_price: 1499,
    max_price: 1599
  }
];

class ProductService {
  async getAll(params: Record<string, any> = {}) {
    try {
      console.log('Fetching products with params:', params);
      
      // Convert min_price and max_price to base_price__gte and base_price__lte
      const adjustedParams: Record<string, any> = { ...params };
      
      // Handle price parameters
      if (adjustedParams.min_price !== undefined) {
        // Ensure numeric value and convert to number
        const minPriceValue = parseFloat(adjustedParams.min_price);
        if (!isNaN(minPriceValue)) {
          adjustedParams.base_price__gte = minPriceValue;
          console.log(`Setting base_price__gte to ${minPriceValue}`);
        }
        delete adjustedParams.min_price;
      }
      
      if (adjustedParams.max_price !== undefined) {
        // Ensure numeric value and convert to number
        const maxPriceValue = parseFloat(adjustedParams.max_price);
        if (!isNaN(maxPriceValue)) {
          adjustedParams.base_price__lte = maxPriceValue;
          console.log(`Setting base_price__lte to ${maxPriceValue}`);
        }
        delete adjustedParams.max_price;
      }
      
      console.log('Adjusted params:', adjustedParams);
      
      // First try the products/products/ endpoint directly
      try {
        console.log('Making API call to:', `${API_URL}/products/products/`);
        const response = await axios.get(`${API_URL}/products/products/`, { 
          params: adjustedParams,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        });
        
        console.log('Products API Response status:', response.status);
        console.log('Products API Response type:', typeof response.data);
        
        if (!response.data) {
          console.error('Empty response data from API');
          throw new Error('Empty response from API');
        }
        
        // Handle different API response formats
        if (response.data && response.data.results) {
          console.log(`Found ${response.data.results.length} products in results array`);
          return response.data;
        } else if (Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} products in array response`);
          return {
            results: response.data,
            count: response.data.length,
            next: null,
            previous: null
          };
        }
        
        // If we get here, we need to adapt whatever format we received
        console.log('Adapting unknown API response format:', Object.keys(response.data));
        
        if (response.data.products && Array.isArray(response.data.products)) {
          // Some APIs wrap results in a "products" key
          console.log(`Found ${response.data.products.length} products in 'products' key`);
          return {
            results: response.data.products,
            count: response.data.products.length,
            next: response.data.next || null,
            previous: response.data.previous || null
          };
        }
        
        // Last resort - try to make it work with whatever we got
        console.log('Using response data as-is and hoping for the best');
        return response.data;
      } catch (error) {
        // Log the error details
        console.error('Error fetching from products/products/ endpoint:', error);
        
        // Try an alternative endpoint before falling back to sample data
        try {
          // Try a simpler request to the base products endpoint
          console.log('Trying alternative products endpoint...');
          const altResponse = await axios.get(`${API_URL}/products/`, {
            timeout: 10000
          });
          
          if (altResponse.data && (altResponse.data.results || Array.isArray(altResponse.data))) {
            const results = altResponse.data.results || altResponse.data;
            console.log(`Found ${results.length} products from alternative endpoint`);
            return {
              results,
              count: results.length,
              next: null,
              previous: null
            };
          }
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError);
        }
        
        // Return fallback data when all API calls fail
        console.log('Using fallback product data as last resort');
        
        // Check if FALLBACK_PRODUCTS has data
        if (FALLBACK_PRODUCTS && FALLBACK_PRODUCTS.length > 0) {
          console.log(`Returning ${FALLBACK_PRODUCTS.length} fallback products`);
        } else {
          console.error('No fallback products available!');
        }
        
        return { 
          results: FALLBACK_PRODUCTS,
          count: FALLBACK_PRODUCTS.length
        };
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return fallback data when all API calls fail
      return { 
        results: FALLBACK_PRODUCTS,
        count: FALLBACK_PRODUCTS.length
      };
    }
  }

  async getById(id: number) {
    try {
      const response = await axios.get(`${API_URL}/products/products/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with id ${id}:`, error);
      return null;
    }
  }

  async getBySlug(slug: string) {
    try {
      const response = await axios.get(`${API_URL}/products/products/by-slug/${slug}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      return null;
    }
  }

  async getRelatedProducts(productId: number) {
    try {
      const response = await axios.get(`${API_URL}/products/products/${productId}/related/`);
      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching related products for product ${productId}:`, error);
      return [];
    }
  }

  async getBestSellers() {
    try {
      const response = await axios.get(`${API_URL}/products/products/best-sellers/`);
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      return [];
    }
  }

  async getRecentlyViewed() {
    try {
      const recentlyViewed = localStorage.getItem('recentlyViewed');
      if (!recentlyViewed) return [];
      
      const productIds = JSON.parse(recentlyViewed);
      if (!productIds.length) return [];
      
      const products = await Promise.all(
        productIds.map((id: number) => this.getById(id))
      );
      
      return products.filter(Boolean);
    } catch (error) {
      console.error('Error fetching recently viewed products:', error);
      return [];
    }
  }

  addToRecentlyViewed(product: Product) {
    try {
      if (!product || !product.id) return;
      
      const recentlyViewed = localStorage.getItem('recentlyViewed');
      let productIds = recentlyViewed ? JSON.parse(recentlyViewed) : [];
      
      // Remove if already exists
      productIds = productIds.filter((id: number) => id !== product.id);
      
      // Add to beginning of array
      productIds.unshift(product.id);
      
      // Limit to 10 products
      productIds = productIds.slice(0, 10);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(productIds));
    } catch (error) {
      console.error('Error adding product to recently viewed:', error);
    }
  }

  async getProductFields(categoryId: number) {
    try {
      const response = await axios.get(`${API_URL}/products/fields/`, {
        params: { category: categoryId },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Product fields response:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching product fields:', error);
      return [];
    }
  }

  async getFilterOptions(categoryId?: number, categorySlug?: string) {
    try {
      const params: any = {};
      if (categoryId) {
        params.category = categoryId;
      }
      if (categorySlug) {
        params.category_slug = categorySlug;
      }
      
      console.log('Fetching filter options with params:', params);
      
      let filterOptions = null;
      
      try {
        // Try the direct endpoint first
        const response = await axios.get(`${API_URL}/products/filter-options/`, {
          params,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Filter options response:', response.data);
        filterOptions = response.data || {};
      } catch (directError) {
        console.error('Error fetching from direct filter-options endpoint:', directError);
        
        // Try the fallback URL if the first one fails
        try {
          const fallbackResponse = await axios.get(`${API_URL}/products/products/filter-options/`, {
            params,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Filter options from fallback endpoint:', fallbackResponse.data);
          filterOptions = fallbackResponse.data || {};
        } catch (fallbackError) {
          console.error('Error fetching from fallback filter-options endpoint:', fallbackError);
          // Set default values if both endpoints fail
          filterOptions = {
            colors: [],
            brands: [],
            price_range: { min: 0, max: 10000 },
            custom_filters: {}
          };
        }
      }
      
      // Validate the price range data - if it doesn't exist or is invalid, fetch from products
      if (!filterOptions.price_range || 
          filterOptions.price_range.min === undefined || 
          filterOptions.price_range.max === undefined ||
          filterOptions.price_range.max <= filterOptions.price_range.min) {
        
        console.log('Price range is invalid, fetching from products');
        
        try {
          // Fetch products with just category filter to find the price range
          const productsParams = { ...params };
          if (params.category_slug) {
            productsParams.category_slug = params.category_slug;
          }
          
          // Request just a single product sorted by highest price
          productsParams.page_size = 1;
          productsParams.ordering = '-base_price';
          
          const highPriceResponse = await axios.get(`${API_URL}/products/products/`, {
            params: productsParams,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          // Also get the lowest price
          productsParams.ordering = 'base_price';
          const lowPriceResponse = await axios.get(`${API_URL}/products/products/`, {
            params: productsParams,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          let minPrice = 0;
          let maxPrice = 10000;
          
          if (lowPriceResponse.data?.results?.length > 0) {
            const lowestPricedProduct = lowPriceResponse.data.results[0];
            minPrice = Math.max(0, lowestPricedProduct.base_price || 0);
          }
          
          if (highPriceResponse.data?.results?.length > 0) {
            const highestPricedProduct = highPriceResponse.data.results[0];
            maxPrice = Math.max(
              highestPricedProduct.base_price || 0,
              minPrice + 1000 // Ensure at least 1000 range
            );
          }
          
          console.log(`Calculated price range from products: min=${minPrice}, max=${maxPrice}`);
          
          // Update the price range with 10% buffer on max
          filterOptions.price_range = { 
            min: Math.floor(minPrice), 
            max: Math.ceil(maxPrice * 1.1) 
          };
        } catch (priceError) {
          console.error('Error fetching price range from products:', priceError);
          // Set a default price range as fallback
          filterOptions.price_range = { min: 0, max: 10000 };
        }
      }
      
      return filterOptions;
    } catch (error) {
      console.error('Error in getFilterOptions:', error);
      return {
        colors: [],
        brands: [],
        price_range: { min: 0, max: 10000 },
        custom_filters: {}
      };
    }
  }

  async getCategoryWithProductCount(slug?: string) {
    try {
      const url = slug 
        ? `${API_URL}/products/categories/${slug}/`
        : `${API_URL}/products/categories/`;
        
      const response = await axios.get(url, {
        params: { with_product_count: true },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Categories with count response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching categories with count:', error);
      return { results: [] };
    }
  }
}

export default new ProductService(); 