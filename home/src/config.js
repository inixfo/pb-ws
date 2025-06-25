// Configuration variables for the application

// API base URL - use absolute URL for more reliable connection
export const API_URL = 'https://phonebay.xyz/api';  // Production API URL with /api path
// export const API_URL = '';  // Relative URL (works with proxy in development)

// Application name
export const APP_NAME = 'Phone Bay';

// Images URL base path
export const IMAGES_URL = '/images';

// Default currency symbol
export const CURRENCY_SYMBOL = '$';

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

const config = {
  BASE_URL: 'https://phonebay.xyz',
  API_URL: 'https://phonebay.xyz/api',
  STRIPE_PUBLIC_KEY: 'pk_test_51OJlMsITKMzQFQGt7yYxM0NxUJlmUXFCuAJQA4yjNnBzMRmGgvfQFdtpCrZWjjJPkMEVF6jcGFVdkfSLyYbMZGsj00QUBvn9Dn',
  RAZORPAY_KEY_ID: 'rzp_test_8VVN5vUzTCBg8p',
  GOOGLE_CLIENT_ID: '988564065705-pat9e6cesim147njv6ddof095gmk7hhn.apps.googleusercontent.com',  // Set this during build or deployment
  FACEBOOK_APP_ID: '1234567890',
  RECAPTCHA_SITE_KEY: '6LdZwpIpAAAAAFWa0xkR3ASn5QbKQWgHEZGa-Iqe',
  MAPBOX_TOKEN: 'pk.eyJ1IjoiYWRpdHlhLWt1bWFyLWRhcyIsImEiOiJjbHZkdnFkZXkwMDNiMmtvNWF2YnlwZWVlIn0.7Zn9L-LX_0L-rAKwPVnZBA',
  GOOGLE_MAPS_API_KEY: 'AIzaSyBnSQ9D2W1SiLG1wOm4zcjfQZgiLZ7Uk7Y',
  SUPPORT_EMAIL: 'support@phonebaypro.com',
  SUPPORT_PHONE: '+61 1234567890',
  COMPANY_NAME: 'Phone Bay',
  COMPANY_ADDRESS: '123 Tech Street, Sydney, Australia',
  CURRENCY: 'AUD',
  TAX_RATE: 0.1, // 10% GST
  SHIPPING_THRESHOLD_FREE: 100, // Free shipping for orders over $100
  SHIPPING_FLAT_RATE: 10, // $10 flat rate shipping
  PAGINATION_LIMIT: 12, // Number of products per page
  ENABLE_ANALYTICS: true,
  ENABLE_NEWSLETTER_POPUP: true,
  NEWSLETTER_POPUP_DELAY: 5000, // 5 seconds
  ENABLE_COOKIE_CONSENT: true,
  ENABLE_WISHLIST: true,
  ENABLE_COMPARE: true,
  ENABLE_QUICK_VIEW: true,
  ENABLE_REVIEWS: true,
  ENABLE_RATINGS: true,
  ENABLE_RECENTLY_VIEWED: true,
  RECENTLY_VIEWED_LIMIT: 10,
  ENABLE_RELATED_PRODUCTS: true,
  RELATED_PRODUCTS_LIMIT: 8,
  ENABLE_UPSELL_PRODUCTS: true,
  UPSELL_PRODUCTS_LIMIT: 4,
  ENABLE_CROSS_SELL_PRODUCTS: true,
  CROSS_SELL_PRODUCTS_LIMIT: 4,
  ENABLE_PRODUCT_ZOOM: true,
  ENABLE_PRODUCT_GALLERY: true,
  ENABLE_PRODUCT_THUMBNAILS: true,
  ENABLE_PRODUCT_STICKY_INFO: true,
  ENABLE_PRODUCT_STICKY_ADD_TO_CART: true,
  ENABLE_PRODUCT_TABS: true,
  ENABLE_PRODUCT_COUNTDOWN: true,
  ENABLE_PRODUCT_COUNTDOWN_STYLE: 'simple', // 'simple' or 'detailed'
  ENABLE_PRODUCT_SOCIAL_SHARING: true,
  ENABLE_PRODUCT_BRAND: true,
  ENABLE_PRODUCT_SKU: true,
  ENABLE_PRODUCT_CATEGORIES: true,
  ENABLE_PRODUCT_TAGS: true,
  ENABLE_PRODUCT_ATTRIBUTES: true,
  ENABLE_PRODUCT_VARIATIONS: true,
  ENABLE_PRODUCT_STOCK_STATUS: true,
  ENABLE_PRODUCT_SHORT_DESCRIPTION: true,
  ENABLE_PRODUCT_TABS_DESCRIPTION: true,
  ENABLE_PRODUCT_TABS_ADDITIONAL_INFORMATION: true,
  ENABLE_PRODUCT_TABS_REVIEWS: true,
  ENABLE_PRODUCT_TABS_SHIPPING: true,
  ENABLE_PRODUCT_TABS_SIZE_GUIDE: true,
  ENABLE_PRODUCT_TABS_CUSTOM: false,
  ENABLE_PRODUCT_TABS_CUSTOM_TITLE: 'Custom Tab',
  ENABLE_PRODUCT_TABS_CUSTOM_CONTENT: '<p>Custom tab content goes here.</p>',
};

export default config; 