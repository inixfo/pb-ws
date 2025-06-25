/**
 * Utility functions for handling product images
 */

import { Product, ProductImage } from "../types/products";

// Define the backend URL constant
const BACKEND_URL = 'https://phonebay.xyz/';

/**
 * Ensure a URL is absolute by adding the backend URL if needed
 */
const ensureAbsoluteUrl = (url: string | null | undefined): string => {
  // Handle null or undefined URL
  if (!url) {
    console.warn('Received null or undefined URL in ensureAbsoluteUrl');
    return '/placeholder-product.png';
  }
  
  // If the URL is already absolute (starts with http:// or https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If the URL is a relative path starting with /media/
  if (url.startsWith('/media/')) {
    return `${BACKEND_URL}${url}`;
  }
  
  // If the URL is a relative path not starting with /
  if (!url.startsWith('/')) {
    return `${BACKEND_URL}/media/${url}`;
  }
  
  // Otherwise, just add the backend URL
  return `${BACKEND_URL}${url}`;
};

/**
 * Get the appropriate image URL based on viewport width
 * This helps with responsive images
 */
export const getResponsiveImageUrl = (image: ProductImage | string | null | undefined, size: 'small' | 'medium' | 'full' = 'full'): string => {
  if (!image) {
    return '/placeholder-product.png';
  }
  
  // If image is a string, it's a direct URL
  if (typeof image === 'string') {
    const baseUrl = ensureAbsoluteUrl(image);
    
    // Add size parameter for responsive loading
    if (size === 'small') {
      return `${baseUrl}?size=small&width=300&quality=80`;
    } else if (size === 'medium') {
      return `${baseUrl}?size=medium&width=600&quality=85`;
    }
    return baseUrl;
  }
  
  // If image is an object with thumbnails
  if (typeof image === 'object') {
    // First try to use the thumbnail fields if they exist
    if (size === 'small' && image.thumbnail_small) {
      return ensureAbsoluteUrl(image.thumbnail_small);
    }
    
    if (size === 'medium' && image.thumbnail_medium) {
      return ensureAbsoluteUrl(image.thumbnail_medium);
    }
    
    // If thumbnail fields don't exist, use query parameters
    const baseUrl = ensureAbsoluteUrl(image.image);
    if (size === 'small') {
      return `${baseUrl}?size=small&width=300&quality=80`;
    } else if (size === 'medium') {
      return `${baseUrl}?size=medium&width=600&quality=85`;
    }
    
    // Fall back to full image
    return baseUrl;
  }
  
  return '/placeholder-product.png';
};

/**
 * Get the primary image URL from a product
 * Handles different image formats returned from the API
 */
export const getProductImageUrl = (product: Product, size: 'small' | 'medium' | 'full' = 'full'): string => {
  // Safety check for null or undefined product
  if (!product) {
    console.error('getProductImageUrl called with null or undefined product');
    return '/placeholder-product.png';
  }
  
  try {
    // Case 1: If product has primary_image as an object with image property
    if (product.primary_image && typeof product.primary_image === 'object' && product.primary_image.image) {
      return getResponsiveImageUrl(product.primary_image, size);
    }
    
    // Case 2: If product has primary_image as a string
    if (product.primary_image && typeof product.primary_image === 'string') {
      return getResponsiveImageUrl(product.primary_image, size);
    }
    
    // Case 3: If product has product_images array with at least one image
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      // Try to find primary image first
      const primaryImage = product.product_images.find(img => img.is_primary);
      if (primaryImage) {
        return getResponsiveImageUrl(primaryImage, size);
      }
      // Otherwise use the first image
      return getResponsiveImageUrl(product.product_images[0], size);
    }
    
    // Case 4: If product has images array with at least one image object
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // Check if the first item is an object with image property
      const firstImage = product.images[0];
      if (typeof firstImage === 'object' && firstImage !== null) {
        return getResponsiveImageUrl(firstImage as ProductImage, size);
      }
      // Otherwise treat it as a string
      if (typeof firstImage === 'string') {
        return getResponsiveImageUrl(firstImage, size);
      }
    }
    
    // Case 5: If product has image property
    if (product.image) {
      return getResponsiveImageUrl(product.image, size);
    }
  } catch (error) {
    console.error(`Error processing image for product ${product.id} (${product.name}):`, error);
  }
  
  // Fallback to placeholder
  console.warn(`No valid image found for product ${product.id} (${product.name}), using placeholder`);
  return '/placeholder-product.png';
};

/**
 * Get all image URLs from a product
 */
export const getProductImageUrls = (product: Product, size: 'small' | 'medium' | 'full' = 'full'): string[] => {
  // Safety check for null or undefined product
  if (!product) {
    console.error('getProductImageUrls called with null or undefined product');
    return ['/placeholder-product.png'];
  }
  
  const images: string[] = [];
  
  try {
    // Add product_images if available
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      product.product_images.forEach(img => {
        if (img) {
          images.push(getResponsiveImageUrl(img, size));
        }
      });
    }
    
    // Add images array if available
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach(img => {
        if (typeof img === 'object' && img !== null) {
          const imageUrl = getResponsiveImageUrl(img as ProductImage, size);
          if (!images.includes(imageUrl)) {
            images.push(imageUrl);
          }
        } else if (typeof img === 'string') {
          const imageUrl = getResponsiveImageUrl(img, size);
          if (!images.includes(imageUrl)) {
            images.push(imageUrl);
          }
        }
      });
    }
    
    // Add primary_image if available and not already included
    if (product.primary_image) {
      let primaryImageUrl: string;
      if (typeof product.primary_image === 'object' && product.primary_image !== null) {
        primaryImageUrl = getResponsiveImageUrl(product.primary_image, size);
      } else if (typeof product.primary_image === 'string') {
        primaryImageUrl = getResponsiveImageUrl(product.primary_image, size);
      } else {
        primaryImageUrl = '';
      }
      
      if (primaryImageUrl && !images.includes(primaryImageUrl)) {
        images.push(primaryImageUrl);
      }
    }
    
    // Add image if available and not already included
    if (product.image) {
      const imageUrl = getResponsiveImageUrl(product.image, size);
      if (!images.includes(imageUrl)) {
        images.push(imageUrl);
      }
    }
  } catch (error) {
    console.error(`Error processing images for product ${product.id} (${product.name}):`, error);
  }
  
  // Return images or fallback
  return images.length > 0 ? images : ['/placeholder-product.png'];
}; 