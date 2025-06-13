import { Category, Brand, Product } from '../types/products';
import { categoryService, brandService } from '../services/api';

export interface CategoryWithCount extends Category {
  count: number;
}

export interface BrandWithCount extends Brand {
  count: number;
}

export interface ColorOption {
  name: string;
  color: string;
  count: number;
}

/**
 * Extract unique colors from products and count occurrences
 */
export const extractColorsFromProducts = (products: Product[]): ColorOption[] => {
  const colorMap = new Map<string, { color: string, count: number }>();
  
  // Default colors with standard hex values
  const defaultColors = [
    { name: 'Black', color: '#000000' },
    { name: 'White', color: '#FFFFFF' },
    { name: 'Red', color: '#FF0000' },
    { name: 'Green', color: '#00FF00' },
    { name: 'Blue', color: '#0000FF' },
    { name: 'Yellow', color: '#FFFF00' },
    { name: 'Purple', color: '#800080' },
    { name: 'Orange', color: '#FFA500' },
    { name: 'Pink', color: '#FFC0CB' },
    { name: 'Gray', color: '#808080' },
  ];
  
  // Initialize default colors with count 0
  defaultColors.forEach(color => {
    colorMap.set(color.name.toLowerCase(), { color: color.color, count: 0 });
  });
  
  // Count products by color
  products.forEach(product => {
    if (product.specifications && product.specifications.color) {
      const colorName = product.specifications.color.toLowerCase();
      if (colorMap.has(colorName)) {
        const colorData = colorMap.get(colorName)!;
        colorMap.set(colorName, { ...colorData, count: colorData.count + 1 });
      } else {
        // For unknown colors, use a default color based on name
        colorMap.set(colorName, { color: '#CCCCCC', count: 1 });
      }
    }
  });
  
  // Convert map to array and sort by count (descending)
  return Array.from(colorMap.entries())
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      color: data.color,
      count: data.count
    }))
    .filter(color => color.count > 0)
    .sort((a, b) => b.count - a.count);
};

/**
 * Count products by category
 */
export const countProductsByCategory = (
  products: Product[], 
  categories: Category[]
): CategoryWithCount[] => {
  const categoryCounts = new Map<number, number>();
  
  // Initialize all categories with count 0
  categories.forEach(category => {
    categoryCounts.set(category.id, 0);
  });
  
  // Count products by category
  products.forEach(product => {
    const categoryId = typeof product.category === 'object' 
      ? product.category.id 
      : typeof product.category === 'number' 
        ? product.category 
        : null;
    
    if (categoryId !== null && categoryCounts.has(categoryId)) {
      categoryCounts.set(categoryId, categoryCounts.get(categoryId)! + 1);
    }
  });
  
  // Convert to array with counts and sort by count (descending)
  return categories
    .map(category => ({
      ...category,
      count: categoryCounts.get(category.id) || 0
    }))
    .filter(category => category.count > 0)
    .sort((a, b) => b.count - a.count);
};

/**
 * Count products by brand
 */
export const countProductsByBrand = (
  products: Product[],
  brands: Brand[]
): BrandWithCount[] => {
  const brandCounts = new Map<number, number>();
  
  // Initialize all brands with count 0
  brands.forEach(brand => {
    brandCounts.set(brand.id, 0);
  });
  
  // Count products by brand
  products.forEach(product => {
    const brandId = typeof product.brand === 'object' 
      ? product.brand.id 
      : typeof product.brand === 'number' 
        ? product.brand 
        : null;
    
    if (brandId !== null && brandCounts.has(brandId)) {
      brandCounts.set(brandId, brandCounts.get(brandId)! + 1);
    }
  });
  
  // Convert to array with counts and sort by count (descending)
  return brands
    .map(brand => ({
      ...brand,
      count: brandCounts.get(brand.id) || 0
    }))
    .filter(brand => brand.count > 0)
    .sort((a, b) => b.count - a.count);
};

/**
 * Find min and max prices from products
 */
export const findPriceRange = (products: Product[]): { min: number, max: number } => {
  if (products.length === 0) {
    return { min: 0, max: 5000 };
  }
  
  const prices = products.map(product => product.sale_price || product.price);
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices))
  };
};

/**
 * Fetch all filter data (categories, brands) from API
 */
export const fetchFilterData = async () => {
  try {
    const [categoriesData, brandsData] = await Promise.all([
      categoryService.getAll(),
      brandService.getAll()
    ]);
    
    const categories = Array.isArray(categoriesData) 
      ? categoriesData 
      : categoriesData.results || [];
      
    const brands = Array.isArray(brandsData) 
      ? brandsData 
      : brandsData.results || [];
    
    return { categories, brands };
  } catch (error) {
    console.error('Error fetching filter data:', error);
    return { categories: [], brands: [] };
  }
}; 