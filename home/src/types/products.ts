// Types for product-related data

export interface ProductImage {
  id: number;
  image: string;
  thumbnail_small?: string;
  thumbnail_medium?: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface ProductVariation {
  id: number;
  name: string;
  value: string;
  sku?: string;
  price_modifier?: number;
  stock?: number;
  images?: ProductImage[];
  is_default?: boolean;
}

export interface ProductReview {
  id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ProductSpecification {
  id: number;
  name: string;
  value: string;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface ProductEMIPlan {
  id: number;
  bank_name?: string;
  plan_name: string;
  name?: string;
  duration_months: number;
  interest_rate: number;
  monthly_installment?: number;
  total_payable_with_emi?: number;
  min_purchase_amount?: number;
  plan_type: 'card_emi' | 'cardless_emi';
  emi_type?: 'normal' | 'cardless';
  down_payment_percentage?: number;
  processing_fee?: number;
  requires_nid?: boolean;
  eligibility_criteria?: string;
  terms_and_conditions_url?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  base_price: number;  // Added base price field
  sale_price: number | null;
  discount_percentage?: number;
  stock_quantity?: number;  // Updated from stock to match backend
  is_available?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  is_trending?: boolean;
  is_special_offer?: boolean;
  is_best_seller?: boolean;
  is_todays_deal?: boolean;
  rating: number;
  reviews_count: number;
  average_rating?: number;
  total_reviews?: number;
  image?: string;
  images?: Array<string | ProductImage>;
  // Expanded image support
  primary_image?: string | ProductImage;
  product_images?: ProductImage[];
  category: Category;
  brand: Brand;
  vendor?: Vendor;
  created_at: string;
  updated_at: string;
  default_sku?: string;  // Added default_sku field
  
  // EMI fields
  emi_available?: boolean;
  emi_plans?: ProductEMIPlan[];
  
  // Dynamic specifications
  specifications?: { [key: string]: string };
  
  // Reviews
  reviews?: Array<{
    id: number;
    user?: {
      id: number;
      email: string;
    };
    rating: number;
    title?: string;
    comment: string;
    created_at: string;
    is_approved: boolean;
    author?: string;  // For backward compatibility with hardcoded data
    verified?: boolean;
    date?: string;    // For backward compatibility with hardcoded data
    content?: string; // For backward compatibility with hardcoded data
    color?: string;
    model?: string;
    pros?: string;
    cons?: string;
    likes?: number;
    dislikes?: number;
    hasReply?: boolean;
    reply?: {
      author: string;
      date: string;
      content: string;
    };
    hasImages?: boolean;
    images?: string[];
  }>;

  variations: Array<ProductVariation>;
  has_variations: boolean;
  min_price: number;
  max_price: number;
  tags?: ProductTag[];
  selected_variation_id?: number;
  warranty_info?: string;
  return_policy?: string;
  shipping_details?: string;
  is_cardless_emi_eligible?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: number;
  is_active?: boolean;
  count?: number; // Number of products in this category
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo: string;
  is_featured?: boolean;
  count?: number; // Number of products with this brand
}

export interface Vendor {
  id: number;
  company_name: string;
  slug: string;
  is_featured?: boolean;
  rating: number;
}

// Frontend display types
export interface ProductCardProps {
  product: Product;
  showDiscount?: boolean;
}

export interface FeaturedProduct {
  id: number;
  name: string;
  slogan?: string;
  image: string;
  price: number;
}

// Product list response from API
export interface ProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

// Brand list response from API
export interface BrandListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Brand[];
}

// Category list response from API
export interface CategoryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

// For paginated product listings
export interface PaginatedProducts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
} 