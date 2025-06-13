import { CartItemType } from './cart';

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postcode: string;
}

export interface BillingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postcode: string;
  same_as_shipping: boolean;
}

export interface PaymentDetails {
  payment_method: string;
  card_number?: string;
  expiry_date?: string;
  cvv?: string;
  name_on_card?: string;
  // For EMI or Cardless EMI
  salary?: string;
  job_title?: string;
}

export interface OrderCreateRequest {
  shipping_address: ShippingAddress;
  billing_address: BillingAddress;
  payment_method: string;
  payment_details: PaymentDetails;
  shipping_method: string;
  shipping_rate_id: number;
}

export interface OrderResponse {
  id: number;
  order_id: string;
  user: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: ShippingAddress;
  billing_address: BillingAddress;
  total_amount: string;
  items: CartItemType[];
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: number | string;
  name: string;
  method_type?: string;
  description: string;
  is_active?: boolean;
  min_delivery_time?: number;
  max_delivery_time?: number;
  handling_time?: number;
  requires_signature?: boolean;
  includes_tracking?: boolean;
  international_shipping?: boolean;
  price?: string;
  delivery_time?: string;
  base_rate?: number;
  free_shipping_threshold?: number;
}

export interface ShippingRate {
  id: number;
  zone: number;
  zone_name: string;
  method: number;
  method_name: string;
  rate_type: 'flat' | 'weight' | 'price' | 'item' | 'dimension' | 'combined';
  is_active: boolean;
  base_rate: number;
  per_kg_rate: number;
  per_item_rate: number;
  free_shipping_threshold?: number;
  conditions: {
    price_rules?: Array<{
      min: number;
      max: number;
      rate: number;
    }>;
    weight_rules?: Array<{
      min: number;
      max: number;
      rate: number;
    }>;
    item_rules?: Array<{
      min: number;
      max: number;
      rate: number;
    }>;
  };
}

export interface CountryOption {
  value: string;
  label: string;
}

export interface CityOption {
  value: string;
  label: string;
}

export interface OrderListItem {
  id: number;
  order_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_phone: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  has_emi: boolean;
  created_at: string;
  updated_at: string;
  items: {
    id: number;
    product: {
      id: number;
      name: string;
      primary_image: string;
    };
    quantity: number;
    price: number;
    has_emi: boolean;
  }[];
} 