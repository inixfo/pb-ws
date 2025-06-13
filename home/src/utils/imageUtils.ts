/**
 * Utility functions for handling product images
 */

import { Product, ProductImage } from "../types/products";

// Define the backend URL constant
const BACKEND_URL = 'http://localhost:8000';

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
 * Get the primary image URL from a product
 * Handles different image formats returned from the API
 */
export const getProductImageUrl = (product: Product): string => {
  // Safety check for null or undefined product
  if (!product) {
    console.error('getProductImageUrl called with null or undefined product');
    return '/placeholder-product.png';
  }
  
  // Debug log
  console.log('Product image data:', {
    product_id: product.id,
    name: product.name,
    primary_image: product.primary_image,
    images: product.images,
    product_images: product.product_images
  });

  try {
    // Case 1: If product has primary_image as an object with image property
    if (product.primary_image && typeof product.primary_image === 'object' && product.primary_image.image) {
      return ensureAbsoluteUrl(product.primary_image.image);
    }
    
    // Case 2: If product has primary_image as a string
    if (product.primary_image && typeof product.primary_image === 'string') {
      return ensureAbsoluteUrl(product.primary_image);
    }
    
    // Case 3: If product has product_images array with at least one image
    if (product.product_images && Array.isArray(product.product_images) && product.product_images.length > 0) {
      // Try to find primary image first
      const primaryImage = product.product_images.find(img => img.is_primary);
      if (primaryImage && primaryImage.image) {
        return ensureAbsoluteUrl(primaryImage.image);
      }
      // Otherwise use the first image
      if (product.product_images[0] && product.product_images[0].image) {
        return ensureAbsoluteUrl(product.product_images[0].image);
      }
    }
    
    // Case 4: If product has images array with at least one image object
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      // Check if the first item is an object with image property
      const firstImage = product.images[0];
      if (typeof firstImage === 'object' && firstImage !== null && (firstImage as ProductImage).image) {
        return ensureAbsoluteUrl((firstImage as ProductImage).image);
      }
      // Otherwise treat it as a string
      if (typeof firstImage === 'string') {
        return ensureAbsoluteUrl(firstImage);
      }
    }
    
    // Case 5: If product has image property
    if (product.image) {
      return ensureAbsoluteUrl(product.image);
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
export const getProductImageUrls = (product: Product): string[] => {
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
        if (img && img.image) {
          images.push(ensureAbsoluteUrl(img.image));
        }
      });
    }
    
    // Add images array if available
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach(img => {
        if (typeof img === 'object' && img !== null && (img as ProductImage).image) {
          const imageUrl = ensureAbsoluteUrl((img as ProductImage).image);
          if (!images.includes(imageUrl)) {
            images.push(imageUrl);
          }
        } else if (typeof img === 'string') {
          const imageUrl = ensureAbsoluteUrl(img);
          if (!images.includes(imageUrl)) {
            images.push(imageUrl);
          }
        }
      });
    }
    
    // Add primary_image if available and not already included
    if (product.primary_image) {
      let primaryImageUrl: string;
      if (typeof product.primary_image === 'object' && product.primary_image !== null && product.primary_image.image) {
        primaryImageUrl = ensureAbsoluteUrl(product.primary_image.image);
      } else if (typeof product.primary_image === 'string') {
        primaryImageUrl = ensureAbsoluteUrl(product.primary_image);
      } else {
        primaryImageUrl = '';
      }
      
      if (primaryImageUrl && !images.includes(primaryImageUrl)) {
        images.push(primaryImageUrl);
      }
    }
    
    // Add image if available and not already included
    if (product.image) {
      const imageUrl = ensureAbsoluteUrl(product.image);
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