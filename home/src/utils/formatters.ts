/**
 * Utility functions for formatting values
 */

/**
 * Format a price value with thousands separators
 */
export const formatPrice = (price: number | string): string => {
  if (price === null || price === undefined) {
    return '0';
  }
  
  // Convert to number if it's a string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Format with thousands separator
  return numPrice.toLocaleString('en-IN');
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a number as a percentage
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
}; 