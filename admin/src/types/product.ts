export interface Product {
  id: number;
  name: string;
  slug: string;
  category: number | { id: number; name: string; slug: string; };
  brand: number | { id: number; name: string; slug: string; };
  description: string;
  price: number;
  sale_price?: number;
  default_sku?: string;
  stock_quantity: number;
  is_available: boolean;
  is_approved: boolean;
  vendor: number;
  specifications: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // EMI options
  emi_available: boolean;
  emi_type?: 'normal' | 'cardless';
  emi_plans?: number[];
  
  // Promotional fields
  is_trending?: boolean;
  is_special_offer?: boolean;
  is_best_seller?: boolean;
  is_todays_deal?: boolean;
  
  // Related data
  images?: ProductImage[];
  skus?: SKU[];
  reviews?: ProductReview[];
  average_rating?: number;
  total_reviews?: number;
}

export interface ProductFormData {
  name: string;
  category: number;
  brand: number;
  description: string;
  price: number;
  sale_price?: number;
  default_sku?: string;
  stock_quantity: number;
  is_available: boolean;
  
  // EMI options
  emi_available: boolean;
  emi_type: 'normal' | 'cardless';
  emi_plans: number[];
  
  // Promotional fields
  is_trending?: boolean;
  is_special_offer?: boolean;
  is_best_seller?: boolean;
  is_todays_deal?: boolean;
  
  // Product specifications
  specifications: Record<string, any>;
  
  // Related data
  images?: ProductImage[];
  skus?: SKU[];
}

export interface ProductImage {
  id?: number;
  image: string | File;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

export interface SKU {
  id?: number;
  code: string;
  product: number;
  attributes: Record<string, any>;
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SKUFormData {
  code?: string;
  product: number;
  attributes: Record<string, any>;
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
}

export interface ProductField {
  id: number;
  category: number;
  name: string;
  field_type: 'text' | 'number' | 'boolean' | 'select' | 'multi_select';
  group: string;
  options?: string[] | null;
  is_required: boolean;
  is_filter: boolean;
  display_order: number;
}

export interface ProductReview {
  id: number;
  product: number;
  user: number;
  rating: number;
  title?: string;
  comment: string;
  created_at: string;
  is_approved: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: number | null;
  description?: string;
  image?: string;
  is_active: boolean;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  is_active: boolean;
} 