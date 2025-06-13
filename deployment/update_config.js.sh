#!/bin/bash

# This script updates the frontend config.js file with production settings
# Usage: ./update_config.js.sh <api_url>

# Check if API URL is provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 <api_url>"
  echo "Example: $0 https://api.phonebay.com/api"
  exit 1
fi

API_URL=$1

# Create or update config.js
cat > ../home/src/config.js << EOF
// Configuration variables for the application

// API base URL - use absolute URL for production
export const API_URL = '${API_URL}';

// Application name
export const APP_NAME = 'Phone Bay';

// Images URL base path
export const IMAGES_URL = '/images';

// Default currency symbol
export const CURRENCY_SYMBOL = '৳';

// Default language
export const DEFAULT_LANGUAGE = 'en';

// Default theme
export const DEFAULT_THEME = 'light';

// Maximum number of cart items to display in the header cart dropdown
export const MAX_CART_DROPDOWN_ITEMS = 3;

// Product image placeholder
export const PRODUCT_IMAGE_PLACEHOLDER = '/placeholder-product.png';

// Category image placeholder
export const CATEGORY_IMAGE_PLACEHOLDER = '/placeholder-category.png';

// User avatar placeholder
export const USER_AVATAR_PLACEHOLDER = '/avatar-placeholder.png';

// Banner placeholder
export const BANNER_PLACEHOLDER = '/placeholder-banner.png';

// Number of products to show per page in catalog
export const PRODUCTS_PER_PAGE = 12;

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;

// Product image fallback
export const DEFAULT_PRODUCT_IMAGE = '/placeholder.png';

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'cart',
  CART_EXTRAS: 'cart_extras',
  PROMO_CODE: 'promo_code',
};

// Cart configuration
export const CART_CONFIG = {
  MAX_QUANTITY: 99,
  MIN_QUANTITY: 1,
};
EOF

echo "Frontend config.js updated successfully with API_URL: ${API_URL}" 