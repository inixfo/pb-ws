export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number;
  image: string;
  category: number;
  created_at: string;
  updated_at: string;
} 