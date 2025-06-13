import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { productService } from '../services/api';
import { Product } from '../types/products';
import { useParams, useLocation } from 'react-router-dom';

interface ProductContextType {
  product: Product | null;
  loading: boolean;
  error: string | null;
  fetchProduct: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProduct = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: ReactNode;
}

// Fallback product data for development
const fallbackProduct: Product = {
  id: 1,
  name: "iPhone 14 Pro 256GB",
  slug: "iphone-14-pro-256gb",
  description: "The latest iPhone with advanced features",
  price: 999,
  base_price: 999,
  sale_price: 899,
  rating: 4.8,
  reviews_count: 42,
  image: "/image-18.png",
  images: ["/image-18.png", "/image-19.png"],
  primary_image: "/image-18.png",
  category: { id: 1, name: 'Smartphones', slug: 'smartphones' },
  brand: { id: 1, name: 'Apple', slug: 'apple', logo: '', is_featured: true },
  created_at: "2023-01-01",
  updated_at: "2023-01-01",
  variations: [],
  has_variations: false,
  min_price: 999,
  max_price: 999,
  specifications: {
    colors: "Black, White",
    storage_capacity: "128GB, 256GB, 512GB",
    display: "Super Retina XDR",
    processor: "A16 Bionic",
    camera: "48MP main camera",
    battery: "Up to 23 hours video playback"
  }
};

// Function to check if we're in development environment
const isDevelopmentEnvironment = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

// Create a customized fallback product based on the requested ID/slug
const createCustomFallbackProduct = (id: string): Product => {
  // Try to extract meaningful information from the ID/slug
  const idNum = isNaN(parseInt(id)) ? fallbackProduct.id : parseInt(id);
  const slug = isNaN(parseInt(id)) ? id : `product-${id}`;
  
  // Extract brand and model from slug if possible
  let brandName = 'Unknown Brand';
  let productName = isNaN(parseInt(id)) ? id.replace(/-/g, ' ') : `Product ${id}`;
  
  // Try to extract brand name from slug
  if (slug.includes('samsung')) {
    brandName = 'Samsung';
    productName = productName.replace('samsung', '').trim();
  } else if (slug.includes('apple') || slug.includes('iphone') || slug.includes('macbook')) {
    brandName = 'Apple';
    productName = productName.replace('apple', '').trim();
  } else if (slug.includes('sony')) {
    brandName = 'Sony';
    productName = productName.replace('sony', '').trim();
  }
  
  // Capitalize first letter of each word
  productName = productName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // If productName is empty after replacements, use a generic name
  if (!productName.trim()) {
    productName = `${brandName} Product`;
  }
  
  return {
    ...fallbackProduct,
    id: idNum,
    slug: slug,
    name: productName,
    brand: { 
      ...fallbackProduct.brand, 
      name: brandName,
      slug: brandName.toLowerCase()
    }
  };
};

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState<boolean>(false);
  
  // Get product ID from URL parameters
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  
  const fetchProduct = async (id: string) => {
    if (!id) {
      setError("No product ID or slug provided");
      setLoading(false);
      return;
    }
    console.log('[ProductContext] Fetching product for ID/slug:', id);
    setLoading(true);
    setError(null);
    setCurrentProductId(id);
    setUsedFallback(false);
    try {
      const data = await productService.getById(id);
      console.log('[ProductContext] Product data fetched:', data);
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        throw new Error('Received empty product data');
      }
      
      // Verify that the product data is for the correct product
      if (data.id.toString() !== id && 
          data.slug !== id && 
          !id.includes(data.slug) && 
          !data.slug.includes(id)) {
        console.error(
          '[ProductContext] Product data mismatch! Requested:', id, 
          'Received product with ID:', data.id, 'and slug:', data.slug
        );
        throw new Error(
          `Product data mismatch. Requested: ${id}, but received product: ${data.name} (ID: ${data.id}, slug: ${data.slug})`
        );
      }
      
      // Make sure EMI plans are properly attached to this product
      if (data.emi_available && (!data.emi_plans || data.emi_plans.length === 0)) {
        console.warn('[ProductContext] Product has emi_available=true but no EMI plans');
      } else if (data.emi_available && data.emi_plans) {
        console.log('[ProductContext] Product has EMI plans:', data.emi_plans.length);
      }
      
      setProduct(data);
    } catch (err: any) {
      console.error('[ProductContext] Error fetching product:', err);
      setError(`Failed to fetch product details: ${err.message || 'Unknown error'}`);
      if (isDevelopmentEnvironment() && !usedFallback) {
        console.warn('[ProductContext] Using fallback product data for development');
        const customFallback = createCustomFallbackProduct(id);
        setProduct(customFallback);
        setUsedFallback(true);
        setError('Using fallback data - API request failed');
      } else {
        setProduct(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Extract product ID from URL
  const getProductIdFromUrl = (): string | null => {
    // Try to get ID from params first (this is the most reliable)
    if (productId) {
      console.log(`Found product ID in URL params: ${productId}`);
      return productId;
    }
    // Try to extract from pathname
    const pathParts = location.pathname.split('/').filter(Boolean);
    console.log('URL path parts:', pathParts);
    // Check for different URL patterns
    for (let i = 0; i < pathParts.length - 1; i++) {
      if ((pathParts[i] === 'product' || pathParts[i] === 'products') && pathParts[i + 1]) {
        if (pathParts[i + 1] === 'product' || pathParts[i + 1] === 'products') {
          // Defensive: don't fetch for /product or /products
          return null;
        }
        console.log(`Found product ID in URL path: ${pathParts[i + 1]}`);
        return pathParts[i + 1];
      }
    }
    // If no match in standard patterns, try the last part of the URL
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'product' && lastPart !== 'products') {
      console.log(`Using last URL part as product ID: ${lastPart}`);
      return lastPart;
    }
    // Defensive: don't fetch for /product or /products
    if (lastPart === 'product' || lastPart === 'products') {
      return null;
    }
    console.log('No product ID found in URL');
    return null;
  };

  // Fetch product on initial load and whenever the productId/slug changes
  useEffect(() => {
    const id = getProductIdFromUrl();
    console.log('[ProductContext] URL changed, extracted product ID/slug:', id, 'Current:', currentProductId);
    if (id) {
      // Always fetch when the ID/slug changes
      if (id !== currentProductId || usedFallback) {
        fetchProduct(id);
      }
    } else {
      setLoading(false);
      setError('No product ID found in URL');
    }
  }, [location.pathname, productId]);

  const value = {
    product,
    loading,
    error,
    fetchProduct,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}; 