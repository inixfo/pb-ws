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