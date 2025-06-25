import axios from 'axios';
import config from '../../config';

class CategoryService {
  async getAll(params = {}) {
    try {
      console.log('Fetching categories with params:', params);
      const response = await axios.get(`${config.API_URL}/products/categories/`, { 
        params,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Categories API Response:', response.data);
      
      if (response.data && response.data.results) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return {
          results: response.data,
          count: response.data.length
        };
      } else {
        console.error('Unexpected categories API response format:', response.data);
        return { results: [] };
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { results: [] };
    }
  }

  async getAllCategories() {
    try {
      console.log('Fetching all categories');
      const response = await this.getAll();
      return response.results || [];
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      return [];
    }
  }

  async getById(id: string | number) {
    try {
      const response = await axios.get(`${config.API_URL}/products/categories/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category with ID ${id}:`, error);
      return null;
    }
  }

  async getBySlug(slug: string) {
    try {
      const response = await axios.get(`${config.API_URL}/products/categories/${slug}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching category with slug ${slug}:`, error);
      return null;
    }
  }
}

export default new CategoryService(); 