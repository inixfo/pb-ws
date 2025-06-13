import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Category } from '../types/products';

// Fallback categories if API fails - but we really want to use real data
const fallbackCategories = [
  { id: 1, name: "Computers & Accessories", slug: "computers-accessories", description: "", image: "/computer.svg" },
  { id: 2, name: "Smartphones & Tablets", slug: "smartphones-tablets", description: "", image: "/smartphone-2.svg" },
  { id: 3, name: "TV, Video & Audio", slug: "tv-video-audio", description: "", image: "/monitor-2.svg" },
  { id: 4, name: "Speakers & Home Music", slug: "speakers-home-music", description: "", image: "/speaker-2.svg" },
  { id: 5, name: "Cameras, Photo & Video", slug: "cameras-photo-video", description: "", image: "/camera-2.svg" },
  { id: 6, name: "Printers & Ink", slug: "printers-ink", description: "", image: "/printer-2.svg" },
  { id: 7, name: "Charging Stations", slug: "charging-stations", description: "", image: "/battery-2.svg" },
  { id: 8, name: "Headphones", slug: "headphones", description: "", image: "/headphones-2.svg" },
  { id: 9, name: "Wearable Electronics", slug: "wearable-electronics", description: "", image: "/watch-2.svg" },
  { id: 10, name: "Powerbanks", slug: "powerbanks", description: "", image: "/powerbank.svg" },
  { id: 11, name: "HDD/SSD Data Storage", slug: "data-storage", description: "", image: "/hard-drive-2.svg" },
  { id: 12, name: "Video Games", slug: "video-games", description: "", image: "/game.svg" },
];

// Hardcoded categories from the API response to match the format returned by the backend
const backendCategories: Category[] = [
  {"id":5,"name":"AC","slug":"ac","parent":undefined,"description":"Air conditioners","image":undefined,"is_active":true},
  {"id":1,"name":"Bikes","slug":"bikes","parent":undefined,"description":"","image":undefined,"is_active":true},
  {"id":2,"name":"Laptops","slug":"laptops","parent":undefined,"description":"","image":undefined,"is_active":true},
  {"id":4,"name":"Mobiles","slug":"mobiles","parent":undefined,"description":"","image":undefined,"is_active":true},
  {"id":3,"name":"Monitors","slug":"monitors","parent":undefined,"description":"","image":undefined,"is_active":true},
  {"id":6,"name":"TV","slug":"tv","parent":undefined,"description":"","image":undefined,"is_active":true}
];

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token if available
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/products/categories/`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both paginated and non-paginated responses
      const categoriesData = data.results || data;
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Ensure categories are never empty
  if (categories.length === 0 && !loading) {
    console.warn('Categories are empty after loading, using fallback');
    return { 
      categories: fallbackCategories, 
      loading: false, 
      error: error || 'No categories available', 
      useFallback: true 
    };
  }

  return {
    categories,
    loading,
    error,
    useFallback,
    refetch: fetchCategories,
  };
}; 