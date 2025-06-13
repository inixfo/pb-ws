import axios from 'axios';
import { API_URL } from '../../config';

class PromotionsService {
  async getHeaderPromoBanners() {
    try {
      const response = await axios.get(`${API_URL}/promotions/header-promos/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching header promo banners:', error);
      return null;
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
      return null;
    }
  }

  async getSaleBanner() {
    try {
      const response = await axios.get(`${API_URL}/promotions/sale-banner/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sale banner:', error);
      return null;
    }
  }

  async getCatalogTopBanner() {
    try {
      const response = await axios.get(`${API_URL}/promotions/catalog-top-banner/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching catalog top banner:', error);
      return null;
    }
  }

  async getCatalogBottomBanner() {
    try {
      const response = await axios.get(`${API_URL}/promotions/catalog-bottom-banner/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching catalog bottom banner:', error);
      return null;
    }
  }
}

export default new PromotionsService(); 