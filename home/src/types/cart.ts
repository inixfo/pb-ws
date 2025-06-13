import { Product } from './products';
import { ProductEMIPlan } from './products';

export interface CartItemType {
  id: number;
  product: Product;
  quantity: number;
  emi_selected: boolean;
  emi_period: number;
  total_price: string;
  emi_plan?: ProductEMIPlan;
}

export interface CartType {
  id: number;
  user: number;
  items: CartItemType[];
  total_price: string;
  total_items: number;
  created_at: string;
  updated_at: string;
} 