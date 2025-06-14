// User types for the admin panel

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'vendor' | 'admin';
  is_active: boolean;
  last_login?: string;
  date_joined: string;
}

export interface UserProfile {
  id: number;
  user: number;
  phone?: string;
  profile_picture?: string;
  bio?: string;
  date_of_birth?: string;
  company_name?: string;
  business_address?: string;
  business_registration_number?: string;
  is_approved?: boolean;
}

export interface Address {
  id: number;
  user?: number;
  address_type: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
} 