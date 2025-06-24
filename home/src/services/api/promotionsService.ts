import axios from 'axios';
import { API_URL } from '../../config';

// Default fallback banners
export const DEFAULT_HEADER_PROMO = {
  id: 1,
  title: "Welcome to Phone Bay",
  subtitle: "Discover the latest smartphones and accessories",
  button_text: "Shop Now",
  button_link: "/catalog",
  image: "/banner-header.jpg",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z"
};

export const DEFAULT_NEW_ARRIVALS_BANNER = {
  id: 2,
  title: "New Arrivals",
  subtitle: "Check out our latest products",
  button_text: "Shop Now",
  button_link: "/catalog?sort=new",
  image: "/banner-new-arrivals.jpg",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z", 
  updated_at: "2023-01-01T00:00:00Z"
};

export const DEFAULT_SALE_BANNER = {
  id: 3,
  title: "Special Offers",
  subtitle: "Limited time deals on selected products",
  button_text: "Shop Now",
  button_link: "/special-offers",
  image: "/banner-sale.jpg",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z", 
  updated_at: "2023-01-01T00:00:00Z"
};

export const DEFAULT_CATALOG_TOP_BANNER = {
  id: 4,
  title: "Browse Our Collection",
  subtitle: "Find the perfect device for you",
  button_text: "Explore",
  button_link: "/catalog",
  image: "/banner-catalog-top.jpg",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z", 
  updated_at: "2023-01-01T00:00:00Z"
};

export const DEFAULT_CATALOG_BOTTOM_BANNER = {
  id: 5,
  title: "Need Help?",
  subtitle: "Our experts are ready to assist you",
  button_text: "Contact Us",
  button_link: "/contact",
  image: "/banner-catalog-bottom.jpg",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z", 
  updated_at: "2023-01-01T00:00:00Z"
};

class PromotionsService {
  async getHeaderPromoBanners() {
    try {
      const response = await axios.get(`${API_URL}/promotions/header-promos/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching header promo banners:', error);
      // Return default banner instead of null
      return DEFAULT_HEADER_PROMO;
    }
  }

  async getHeroSlides() {
    try {
      const response = await axios.get(`${API_URL}/promotions/hero-slides/`);
      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching hero slides:', error);
      return [];
    }
  }

  async getNewArrivalsBanner() {
    try {
      const response = await axios.get(`${API_URL}/promotions/new-arrivals-banner/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching new arrivals banner:', error);
      // Return default banner instead of null
      return DEFAULT_NEW_ARRIVALS_BANNER;
    }
  }

  async getSaleBanner() {
    try {
      const response = await axios.get(`${API_URL}/promotions/sale-banner/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sale banner:', error);
      // Return default banner instead of null
      return DEFAULT_SALE_BANNER;
    }
  }

  async getCatalogTopBanner() {
    try {
      const response = await axios.get(`${API_URL}/promotions/catalog-top-banner/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching catalog top banner:', error);
      // Return default banner instead of null
      return DEFAULT_CATALOG_TOP_BANNER;
    }
  }

  async getCatalogBottomBanner() {
    try {
      const response = await axios.get(`${API_URL}/promotions/catalog-bottom-banner/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching catalog bottom banner:', error);
      // Return default banner instead of null
      return DEFAULT_CATALOG_BOTTOM_BANNER;
    }
  }
}

export default new PromotionsService(); 