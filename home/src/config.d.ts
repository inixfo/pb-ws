declare const STORAGE_KEYS: {
  CART: string;
  CART_EXTRAS: string;
  AUTH_TOKEN: string;
  USER: string;
  WISHLIST: string;
  RECENT_VIEWS: string;
  SEARCH_HISTORY: string;
  NOTIFICATIONS: string;
  SETTINGS: string;
};

declare const API_URL: string;
declare const BASE_URL: string;
declare const MEDIA_URL: string;
declare const STATIC_URL: string;
declare const DEBUG: boolean;
declare const VERSION: string;
declare const BUILD_DATE: string;
declare const ENVIRONMENT: 'development' | 'production' | 'test';

export const DEFAULT_PAGE_SIZE: number;
export const DEFAULT_PAGE: number;
export const PRODUCT_IMAGE_FALLBACK: string;
export const CART_CONFIG: {
  MAX_QUANTITY: number;
  MIN_QUANTITY: number;
};

// Type definitions for configuration variables

export const APP_NAME: string;
export const IMAGES_URL: string;
export const CURRENCY_SYMBOL: string;
export const DEFAULT_LANGUAGE: string;
export const DEFAULT_THEME: string;
export const MAX_CART_DROPDOWN_ITEMS: number;
export const PRODUCT_IMAGE_PLACEHOLDER: string;
export const CATEGORY_IMAGE_PLACEHOLDER: string;
export const USER_AVATAR_PLACEHOLDER: string;
export const BANNER_PLACEHOLDER: string;
export const PRODUCTS_PER_PAGE: number;
export const DEFAULT_PRODUCT_IMAGE: string;

export interface STORAGE_KEYS_TYPE {
  TOKEN: string;
  USER: string;
  CART: string;
  CART_EXTRAS: string;
  PROMO_CODE: string;
}

export const STORAGE_KEYS: STORAGE_KEYS_TYPE;

export interface CART_CONFIG_TYPE {
  MAX_QUANTITY: number;
  MIN_QUANTITY: number;
}

export const CART_CONFIG: CART_CONFIG_TYPE;

interface Config {
  BASE_URL: string;
  API_URL: string;
  MEDIA_URL: string;
  STRIPE_PUBLIC_KEY: string;
  RAZORPAY_KEY_ID: string;
  GOOGLE_CLIENT_ID: string;
  FACEBOOK_APP_ID: string;
  RECAPTCHA_SITE_KEY: string;
  MAPBOX_TOKEN: string;
  GOOGLE_MAPS_API_KEY: string;
  SUPPORT_EMAIL: string;
  SUPPORT_PHONE: string;
  COMPANY_NAME: string;
  COMPANY_ADDRESS: string;
  CURRENCY: string;
  TAX_RATE: number;
  SHIPPING_THRESHOLD_FREE: number;
  SHIPPING_FLAT_RATE: number;
  PAGINATION_LIMIT: number;
  ENABLE_ANALYTICS: boolean;
  ENABLE_NEWSLETTER_POPUP: boolean;
  NEWSLETTER_POPUP_DELAY: number;
  ENABLE_COOKIE_CONSENT: boolean;
  ENABLE_WISHLIST: boolean;
  ENABLE_COMPARE: boolean;
  ENABLE_QUICK_VIEW: boolean;
  ENABLE_REVIEWS: boolean;
  ENABLE_RATINGS: boolean;
  ENABLE_RECENTLY_VIEWED: boolean;
  RECENTLY_VIEWED_LIMIT: number;
  ENABLE_RELATED_PRODUCTS: boolean;
  RELATED_PRODUCTS_LIMIT: number;
  ENABLE_UPSELL_PRODUCTS: boolean;
  UPSELL_PRODUCTS_LIMIT: number;
  ENABLE_CROSS_SELL_PRODUCTS: boolean;
  CROSS_SELL_PRODUCTS_LIMIT: number;
  ENABLE_PRODUCT_ZOOM: boolean;
  ENABLE_PRODUCT_GALLERY: boolean;
  ENABLE_PRODUCT_THUMBNAILS: boolean;
  ENABLE_PRODUCT_STICKY_INFO: boolean;
  ENABLE_PRODUCT_STICKY_ADD_TO_CART: boolean;
  ENABLE_PRODUCT_TABS: boolean;
  ENABLE_PRODUCT_COUNTDOWN: boolean;
  ENABLE_PRODUCT_COUNTDOWN_STYLE: string;
  ENABLE_PRODUCT_SOCIAL_SHARING: boolean;
  ENABLE_PRODUCT_BRAND: boolean;
  ENABLE_PRODUCT_SKU: boolean;
  ENABLE_PRODUCT_CATEGORIES: boolean;
  ENABLE_PRODUCT_TAGS: boolean;
  ENABLE_PRODUCT_ATTRIBUTES: boolean;
  ENABLE_PRODUCT_VARIATIONS: boolean;
  ENABLE_PRODUCT_STOCK_STATUS: boolean;
  ENABLE_PRODUCT_SHORT_DESCRIPTION: boolean;
  ENABLE_PRODUCT_TABS_DESCRIPTION: boolean;
  ENABLE_PRODUCT_TABS_ADDITIONAL_INFORMATION: boolean;
  ENABLE_PRODUCT_TABS_REVIEWS: boolean;
  ENABLE_PRODUCT_TABS_SHIPPING: boolean;
  ENABLE_PRODUCT_TABS_SIZE_GUIDE: boolean;
  ENABLE_PRODUCT_TABS_CUSTOM: boolean;
  ENABLE_PRODUCT_TABS_CUSTOM_TITLE: string;
  ENABLE_PRODUCT_TABS_CUSTOM_CONTENT: string;
}

declare const config: Config;
export default config; 