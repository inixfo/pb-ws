import axios from 'axios';
import config from '../../config';

class BrandService {
  async getAll(params = {}) {
    try {
      console.log('Fetching brands with params:', params);
      const response = await axios.get(`${config.API_URL}/products/brands/`, { 
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Brands API Response:', response.data);
      
      if (response.data && response.data.results) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return {
          results: response.data,
          count: response.data.length
        };
      } else {
        console.error('Unexpected brands API response format:', response.data);
        return { results: [] };
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      return { results: [] };
    }
  }

  async getAllWithCategories() {
    try {
      console.log('Fetching all brands with categories');
      const response = await this.getAll({ with_categories: true });
      return response.results || [];
    } catch (error) {
      console.error('Error in getAllWithCategories:', error);
      return [];
    }
  }

  async getById(id: number) {
    try {
      const response = await axios.get(`${config.API_URL}/products/brands/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching brand with id ${id}:`, error);
      return null;
    }
  }
}

export default new BrandService(); 