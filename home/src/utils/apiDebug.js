/**
 * API Debug Utility
 * 
 * This utility helps diagnose API issues by making direct fetch requests
 * to the backend API and logging the results.
 */

import { API_URL } from '../config';

/**
 * Test the products API endpoint
 */
export const testProductsApi = async (): Promise<void> => {
  console.group('API Debug: Testing Products API');
  
  try {
    // Test the main products endpoint
    console.log('Testing main products endpoint...');
    const mainResponse = await fetch(`${API_URL}/api/products/`);
    const mainData = await mainResponse.json();
    console.log('Main products endpoint response:', mainData);
    
    // Test the products list endpoint
    console.log('Testing products list endpoint...');
    const productsResponse = await fetch(`${API_URL}/api/products/products/`);
    const productsData = await productsResponse.json();
    console.log('Products list endpoint response:', productsData);
    
    // Test categories endpoint
    console.log('Testing categories endpoint...');
    const categoriesResponse = await fetch(`${API_URL}/api/products/categories/`);
    const categoriesData = await categoriesResponse.json();
    console.log('Categories endpoint response:', categoriesData);
    
    // Test brands endpoint
    console.log('Testing brands endpoint...');
    const brandsResponse = await fetch(`${API_URL}/api/products/brands/`);
    const brandsData = await brandsResponse.json();
    console.log('Brands endpoint response:', brandsData);
    
    console.log('All API tests completed successfully');
  } catch (error) {
    console.error('API test failed:', error);
  }
  
  console.groupEnd();
};

/**
 * Run all API tests
 */
export const runApiTests = (): void => {
  console.log('Running API tests...');
  testProductsApi();
};

// Export a function to run the tests from the browser console
(window as any).runApiTests = runApiTests; 