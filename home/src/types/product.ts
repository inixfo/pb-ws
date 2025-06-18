export interface ProductImage {
  id: number;
  image: string;
  thumbnail_small?: string;
  thumbnail_medium?: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number;
  image?: string;
  category: number;
  created_at: string;
  updated_at: string;
  
  // Additional fields for responsive images
  images?: Array<string | ProductImage>;
  primary_image?: string | ProductImage;
  product_images?: ProductImage[];
  
  // Rating fields
  rating?: number;
  average_rating?: number;
} 