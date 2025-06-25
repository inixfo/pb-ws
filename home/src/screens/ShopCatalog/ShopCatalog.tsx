import React, { useRef, useEffect, useState } from "react";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/Checkbox";
import { Input } from "../../components/ui/input";
import { ChevronRightIcon, ChevronDownIcon, ChevronLeftIcon, ChevronUpIcon, DollarSignIcon, XIcon, FilterIcon } from "lucide-react";
import PaginationComponent from "../../components/ui/pagination";
import { Select } from "../../components/ui/Select";
import { Separator } from "../../components/ui/separator";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Product, Category, Brand } from "../../types/products";
import { productService, FALLBACK_PRODUCTS } from "../../services/api/productService";
import categoryService from "../../services/api/categoryService";
import brandService from "../../services/api/brandService";
import searchService from "../../services/api/searchService";

// Rename the imported component to maintain compatibility with existing code
const Pagination = PaginationComponent;

// Define currency symbol locally to avoid import issues
const CURRENCY_SYMBOL = '৳';

export const ShopCatalog = (): JSX.Element => {
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search');
  
  console.log('[ShopCatalog] COMPONENT MOUNTED. Slug from useParams:', slug, 'Search query:', searchQuery, 'Full pathname:', location.pathname);

  // Pagination and sort
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(5);
  const [totalProducts, setTotalProducts] = useState(0);
  const sortOptions = [
    { value: "popular", label: "Most popular" },
    { value: "new", label: "Newest" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
  ];
  const [sort, setSort] = useState(sortOptions[0].value);

  // Mobile responsiveness
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Filters state
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectedSSD, setSelectedSSD] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [minPrice, setMinPrice] = useState("340");
  const [maxPrice, setMaxPrice] = useState("1250");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [cart, setCart] = useState<number[]>([]);
  const [pageTitle, setPageTitle] = useState("Shop catalog");

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [ssdSizes, setSsdSizes] = useState<{ name: string; count: number }[]>([
    { name: "2 TB", count: 13 },
    { name: "1 TB", count: 28 },
    { name: "512 GB", count: 47 },
    { name: "256 GB", count: 56 },
    { name: "128 GB", count: 69 },
    { name: "64 GB or less", count: 141 },
  ]);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Color options
  const colors = [
    { name: "Green", color: "#8bc4ab" },
    { name: "Coral red", color: "#ee7976" },
    { name: "Light pink", color: "#df8fbf" },
    { name: "Sky blue", color: "#9acbf1" },
    { name: "Black", color: "#364254" },
    { name: "White", color: "transparent" },
  ];

  const navigate = useNavigate();

  // Add state for dynamic filters
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [availableColors, setAvailableColors] = useState<{ name: string; color: string }[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, string[]>>({});

  // Add state for search results and suggestions
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<number | null>(null);

  // Initial data fetching
  useEffect(() => {
    console.log('[ShopCatalog] Initial mount effect running. Verifying parameters:');
    console.log('- URL slug parameter:', slug);
    console.log('- Location pathname:', location.pathname);
    console.log('- Search query:', searchQuery);
    
    // Check if we're using the correct route pattern
    if (location.pathname.startsWith('/catalog/') && slug) {
      console.log('[ShopCatalog] Detected correct /catalog/:slug route pattern');
    } else if (location.pathname.startsWith('/category/') && slug) {
      console.log('[ShopCatalog] Detected /category/:slug route pattern');
    } else if (location.pathname === '/catalog' && !slug) {
      console.log('[ShopCatalog] Detected base /catalog route (no slug)');
    } else {
      console.warn('[ShopCatalog] Unknown route pattern:', location.pathname);
    }
    
    // Always fetch categories and brands first
    fetchCategoriesWithCount();
    fetchBrands();
    
    // Fetch products immediately without waiting for filters
    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('[ShopCatalog useEffect fetchFilterOptions trigger] Slug:', slug, 'Categories count:', categories.length);
    if (categories.length > 0 || slug) {
      fetchFilterOptions();
    }
  }, [categories, slug]);

  // Set price range when it updates from API
  useEffect(() => {
    if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
      // Only update if the user hasn't manually changed the values
      if (!filterTags.some(tag => tag.includes(CURRENCY_SYMBOL))) {
        setMinPrice(priceRange.min.toString());
        setMaxPrice(priceRange.max.toString());
      }
    }
  }, [priceRange, filterTags]);

  // Effect to fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [
    slug, 
    currentPage, 
    sort, 
    selectedBrands, 
    selectedColors, 
    minPrice, 
    maxPrice, 
    searchQuery, 
    JSON.stringify(customFilterValues)
  ]);
  
  // Effect to fetch categories and filter options when slug changes
  useEffect(() => {
    fetchCategoriesWithCount();
    fetchBrands();
    fetchFilterOptions();
    
    // Reset pagination when slug changes
    setCurrentPage(1);
    
    // Set page title based on slug
    if (slug) {
      // Convert slug to title case
      const title = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setPageTitle(title);
    } else {
      setPageTitle('All Products');
    }
  }, [slug]);
  
  // Effect to update filter tags when filters change
  useEffect(() => {
    const tags: string[] = [];
    
    // Add brand tags
    selectedBrands.forEach(brand => {
      tags.push(`Brand: ${brand}`);
    });
    
    // Add color tags
    selectedColors.forEach(color => {
      tags.push(`Color: ${color}`);
    });
    
    // Add price tag if different from default
    if (
      (minPrice && minPrice !== '0' && minPrice !== priceRange.min.toString()) || 
      (maxPrice && maxPrice !== priceRange.max.toString())
    ) {
      tags.push(`Price: ${CURRENCY_SYMBOL}${minPrice} - ${CURRENCY_SYMBOL}${maxPrice}`);
    }
    
    // Add custom filter tags
    Object.entries(customFilterValues).forEach(([key, values]) => {
      if (values.length > 0) {
        values.forEach(value => {
          tags.push(`${key}: ${value}`);
        });
      }
    });
    
    setFilterTags(tags);
  }, [selectedBrands, selectedColors, minPrice, maxPrice, customFilterValues, priceRange]);

  // Handlers
  const handleBrandToggle = (brand: string, brandId: number) => {
    // Update selected brand names for UI display
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
      setSelectedBrandIds(selectedBrandIds.filter(id => id !== brandId));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
      setSelectedBrandIds([...selectedBrandIds, brandId]);
    }
    
    // Reset to first page when changing filters
    setCurrentPage(1);
  };
  
  const handleSSDToggle = (size: string) => {
    setSelectedSSD((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    
    // Update filter tags
    if (!selectedSSD.includes(size)) {
      setFilterTags(prev => [...prev, size]);
    } else {
      setFilterTags(prev => prev.filter(tag => tag !== size));
    }
  };
  
  const handleCategoryClick = (cat: string) => {
    // First check if the category has products
    const category = categories.find(c => c.name === cat);
    if (!category || category.count === 0) {
      // Don't navigate to empty categories
      console.log(`Category ${cat} has no products, not navigating`);
      return;
    }
    
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    
    // Only navigate if we have a valid slug
    if (category && category.slug) {
      console.log(`Navigating to category ${category.name} with slug ${category.slug}`);
      navigate(`/catalog/${category.slug}`);
      
      // Reset other filters when changing category
      setSelectedBrands([]);
      setSelectedColors([]);
      setCustomFilterValues({});
      setMinPrice(priceRange.min.toString());
      setMaxPrice(priceRange.max.toString());
      setCurrentPage(1);
    } else {
      console.error(`No slug found for category ${cat}`);
    }
  };
  
  const handleColorClick = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    
    // Update filter tags
    if (!selectedColors.includes(color)) {
      setFilterTags(prev => [...prev, color]);
    } else {
      setFilterTags(prev => prev.filter(tag => tag !== color));
    }
    
    // Reset to first page when changing filters
    setCurrentPage(1);
  };
  
  const handlePriceChange = (type: "min" | "max", value: string) => {
    // Only update if value is numeric or empty
    if (value === '' || /^\d+$/.test(value)) {
      // Update the state
      if (type === "min") {
        setMinPrice(value);
      } else {
        setMaxPrice(value);
      }
      
      // Get the numeric values for the price tag
      const newMinPrice = type === "min" ? (value === '' ? '0' : value) : (minPrice === '' ? '0' : minPrice);
      const newMaxPrice = type === "max" ? (value === '' ? (priceRange.max?.toString() || '10000') : value) : (maxPrice === '' ? (priceRange.max?.toString() || '10000') : maxPrice);
      
      // Update price filter tag
      const priceTag = `${CURRENCY_SYMBOL}${newMinPrice} - ${CURRENCY_SYMBOL}${newMaxPrice}`;
      setFilterTags(prev => {
        const withoutPrice = prev.filter(tag => !tag.includes(CURRENCY_SYMBOL));
        return [...withoutPrice, priceTag];
      });
      
      // Reset to first page when changing filters
      setCurrentPage(1);
    }
  };
  
  const handleClearAll = () => {
    setSelectedBrands([]);
    setSelectedBrandIds([]);
    setSelectedColors([]);
    setMinPrice(priceRange.min.toString());
    setMaxPrice(priceRange.max.toString());
    setCustomFilterValues({});
    setFilterTags([]);
    setCurrentPage(1);
  };
  
  const handleRemoveTag = (tag: string) => {
    // Check if it's a brand tag
    if (tag.startsWith('Brand: ')) {
      const brandName = tag.replace('Brand: ', '');
      const brandToRemove = brands.find(b => b.name === brandName);
      
      if (brandToRemove) {
        setSelectedBrands(selectedBrands.filter(b => b !== brandName));
        setSelectedBrandIds(selectedBrandIds.filter(id => id !== brandToRemove.id));
      }
    }
    // Check if it's a color tag
    else if (tag.startsWith('Color: ')) {
      const colorName = tag.replace('Color: ', '');
      setSelectedColors(selectedColors.filter(c => c !== colorName));
    }
    // Check if it's a price tag
    else if (tag.startsWith('Price: ')) {
      // Reset price filters to defaults
      setMinPrice(priceRange.min.toString());
      setMaxPrice(priceRange.max.toString());
    }
    // Check if it's a custom filter tag
    else {
      // Format is "Key: Value"
      const colonIndex = tag.indexOf(': ');
      if (colonIndex > 0) {
        const key = tag.substring(0, colonIndex);
        const value = tag.substring(colonIndex + 2);
        
        // Update the custom filter values
        setCustomFilterValues(prev => {
          const newValues = { ...prev };
          
          if (newValues[key]) {
            newValues[key] = newValues[key].filter(v => v !== value);
            
            // Remove the key if there are no values left
            if (newValues[key].length === 0) {
              delete newValues[key];
            }
          }
          
          return newValues;
        });
      }
    }
    
    // Reset to first page when removing filters
    setCurrentPage(1);
  };
  
  const handleAddToCart = (id: number, slug?: string) => {
    // Navigate to product page instead of directly adding to cart
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${id}`);
    }
  };

  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setMobileFiltersVisible(prev => !prev);
  };

  // Close filters on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setMobileFiltersVisible(false);
      }
    }
    if (mobileFiltersVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileFiltersVisible]);

  // Render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<img key={`full-${i}`} className="w-3 h-3" alt="Star fill" src="/star-fill.svg" />);
    }
    if (hasHalfStar) {
      stars.push(<img key="half" className="w-3 h-3" alt="Star half" src="/star-half.svg" />);
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<img key={`empty-${i}`} className="w-3 h-3" alt="Star" src="/star.svg" />);
    }
    return stars;
  };

  // Add handler for custom filter changes
  const handleCustomFilterChange = (filterName: string, value: string) => {
    setCustomFilterValues(prev => {
      const currentValues = prev[filterName] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
        
      // If empty, remove the filter entirely
      const updatedFilters = { ...prev };
      if (newValues.length === 0) {
        delete updatedFilters[filterName];
      } else {
        updatedFilters[filterName] = newValues;
      }
      
      return updatedFilters;
    });
    
    // Create a more descriptive filter tag that includes both the filter name and value
    const filterTag = `${filterName}: ${value}`;
    
    // Update filter tags
    if (!customFilterValues[filterName]?.includes(value)) {
      setFilterTags(prev => [...prev, filterTag]);
    } else {
      setFilterTags(prev => prev.filter(tag => tag !== filterTag));
    }
    
    // Reset to first page when changing filters
    setCurrentPage(1);
  };

  // Fetch products based on filters
  const fetchProducts = async () => {
    console.log('[ShopCatalog fetchProducts START] Current slug:', slug, 'Page:', currentPage, 'Sort:', sort, 'Brands:', selectedBrands, 'Brand IDs:', selectedBrandIds, 'Colors:', selectedColors, 'Custom:', customFilterValues, 'Price:', minPrice, maxPrice, 'Search:', searchQuery);
    setLoading(true);
    setError(null);
    setDidYouMean(null);
    setSearchId(null);

    try {
      // Only include filters that are actually selected
      const baseParams: Record<string, any> = {
        page: currentPage,
      };
      
      // Add sorting parameter based on selected sort option
      switch (sort) {
        case 'popular':
          baseParams.ordering = '-popularity_score';
          break;
        case 'new':
          baseParams.ordering = '-created_at';
          break;
        case 'price_low':
          baseParams.ordering = 'price';
          break;
        case 'price_high':
          baseParams.ordering = '-price';
          break;
        default:
          // Default sorting
          baseParams.ordering = '-popularity_score';
      }
      
      // Only add brand filter if brands are selected - use brand parameter with comma-separated IDs
      if (selectedBrandIds.length > 0) {
        baseParams.brand = selectedBrandIds.join(',');
      }
      
      // Only add price filters if they're different from the default range
      if (minPrice && minPrice !== '0' && minPrice !== priceRange.min.toString()) {
        baseParams.price__gte = minPrice;
      }
      
      if (maxPrice && maxPrice !== priceRange.max.toString()) {
        baseParams.price__lte = maxPrice;
      }
      
      // Only add custom filters if they're selected
      if (Object.keys(customFilterValues).length > 0) {
        Object.entries(customFilterValues).forEach(([key, value]) => {
          if (value.length > 0) {
            baseParams[`specifications__${key.toLowerCase()}__in`] = value.join(',');
          }
        });
      }
      
      // Only add color filter if colors are selected
      if (selectedColors.length > 0) {
        baseParams['specifications__color__in'] = selectedColors.join(',');
      }

      console.log('[ShopCatalog fetchProducts] Final params:', baseParams);
      
      let data;
      let usedFallback = false;
      
      const fetchWithParams = async (params: Record<string, any>) => {
        if (searchQuery) {
          console.log('[ShopCatalog fetchProducts] Performing search with query:', searchQuery, 'and params:', params);
          return await searchService.search(searchQuery, params);
        } else if (slug) {
          const categoryParams = { ...params, category_slug: slug };
          console.log('[ShopCatalog fetchProducts] Fetching by category slug:', slug, 'and params:', categoryParams);
          return await productService.getAll(categoryParams);
        } else {
          console.log('[ShopCatalog fetchProducts] Fetching all products with params:', params);
          return await productService.getAll(params);
        }
      };
      
      // Make direct API call first for better reliability
      try {
        console.log('[ShopCatalog fetchProducts] Making direct API call first');
        const axios = (await import('axios')).default;
        
        // Build the endpoint URL with proper parameters
        let endpoint = slug 
          ? `https://phonebay.xyz/api/products/products/?category_slug=${slug}&page=${currentPage}`
          : `https://phonebay.xyz/api/products/products/?page=${currentPage}`;
        
        // Add sorting parameter
        if (baseParams.ordering) {
          endpoint += `&ordering=${baseParams.ordering}`;
        }
        
        // Add other filter parameters
        Object.entries(baseParams).forEach(([key, value]) => {
          if (key !== 'page' && key !== 'ordering') {
            // For all parameters, just use the key-value pair directly
            endpoint += `&${key}=${encodeURIComponent(String(value))}`;
          }
        });
        
        console.log(`[ShopCatalog fetchProducts] Direct API call to ${endpoint}`);
        const directResponse = await axios.get(endpoint);
        
        if (directResponse.data && 
            ((directResponse.data.results && Array.isArray(directResponse.data.results) && directResponse.data.results.length > 0) || 
             (Array.isArray(directResponse.data) && directResponse.data.length > 0))) {
          
          console.log(`[ShopCatalog fetchProducts] Direct API call succeeded with ${directResponse.data.results ? directResponse.data.results.length : directResponse.data.length} products`);
          
          // Array format for the direct API call result
          if (Array.isArray(directResponse.data)) {
            const formattedProducts: Product[] = directResponse.data.map((product: any) => ({
              ...product,
              // Ensure required Product properties exist
              price: product.price || product.base_price || 0,
              sale_price: product.sale_price || null,
              rating: product.rating || product.avg_review_rating || 0,
              reviews_count: product.reviews_count || product.review_count || 0,
              created_at: product.created_at || new Date().toISOString(),
              updated_at: product.updated_at || new Date().toISOString(),
              category: product.category || { id: 0, name: 'Unknown', slug: 'unknown' },
              brand: product.brand || { id: 0, name: 'Unknown', slug: 'unknown' },
              variations: product.variations || []
            }));
            
            data = {
              results: formattedProducts,
              count: directResponse.data.length,
              next: null,
              previous: null,
              total_pages: 1
            };
          } else {
            data = directResponse.data;
          }
        } else {
          console.warn('[ShopCatalog fetchProducts] Direct API call returned no results, falling back to service');
          // Fall back to using the service
          data = await fetchWithParams(baseParams);
        }
      } catch (directError) {
        console.error('[ShopCatalog fetchProducts] Direct API call failed:', directError);
        // Fall back to using the service
        data = await fetchWithParams(baseParams);
      }
      
      // Handle search-specific properties
      if (searchQuery && data) {
        if (data.did_you_mean) {
          setDidYouMean(data.did_you_mean);
        }
        if (data.search_id) {
          setSearchId(data.search_id);
        }
      }
      
      // Check if we got valid results
      if (data && data.results && data.results.length > 0) {
        // Ensure we have the correct type
        const typedResults: Product[] = data.results.map((product: any) => ({
          ...product,
          // Ensure required Product properties exist
          price: product.price || product.base_price || 0,
          sale_price: product.sale_price || null,
          rating: product.rating || product.avg_review_rating || 0,
          reviews_count: product.reviews_count || product.review_count || 0,
          created_at: product.created_at || new Date().toISOString(),
          updated_at: product.updated_at || new Date().toISOString(),
          category: product.category || { id: 0, name: 'Unknown', slug: 'unknown' },
          brand: product.brand || { id: 0, name: 'Unknown', slug: 'unknown' },
          variations: product.variations || []
        }));
        
        setProducts(typedResults);
        setTotalPages(data.total_pages || data.num_pages || Math.ceil(data.count / 12) || 1);
        setTotalProducts(data.count || data.results.length || 0);
        
        if (usedFallback) {
          setError("Some filters were ignored to show you products.");
        }
        
        console.log('[ShopCatalog fetchProducts SUCCESS] Products loaded:', data.results.length, 'Total pages:', data.total_pages || data.num_pages || Math.ceil(data.count / 12) || 1);
      } else {
        console.warn('[ShopCatalog fetchProducts WARN] No results in data or empty array', data);
        
        // Only use fallback products when not searching for a specific category
        if (!slug) {
          setProducts(FALLBACK_PRODUCTS);
          setTotalPages(1);
          setTotalProducts(FALLBACK_PRODUCTS.length);
          setError("Couldn't load products from the server. Showing sample products instead.");
        } else {
          // For category pages, show empty results instead of fallback products
          setProducts([]);
          setTotalPages(0);
          setTotalProducts(0);
          setError(null); // Clear error message since we'll show the "No Products Available" UI
        }
      }
    } catch (err: any) {
      console.error('[ShopCatalog fetchProducts ERROR]', err.response?.data || err.message || err);
      setError(err.message || "Failed to fetch products.");
      setProducts(FALLBACK_PRODUCTS);
      setTotalPages(1);
      setTotalProducts(FALLBACK_PRODUCTS.length);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories with product counts
  const fetchCategoriesWithCount = async () => {
    try {
      console.log("Fetching categories with product count");
      const data = await productService.getCategoryWithProductCount();
      
      if (data && data.results) {
        console.log("Received categories with counts:", data.results);
        
        // Filter out categories with zero products
        const categoriesWithProducts = data.results.filter((cat: Category) => 
          cat.count !== undefined && cat.count > 0
        );
        
        if (categoriesWithProducts.length === 0 && data.results.length > 0) {
          // If filtering removed all categories but we had some originally, 
          // keep the original list to not show an empty UI
          console.log("All categories have zero products, keeping original list");
          setCategories(data.results);
        } else {
          console.log("Setting categories with products:", categoriesWithProducts);
          setCategories(categoriesWithProducts);
        }
      } else {
        console.log("No categories received from API");
      }
    } catch (err) {
      console.error('Failed to load categories with count:', err);
    }
  };

  // Fetch brands
  const fetchBrands = async () => {
    try {
      // First try to get brands from filter options, which will include counts
      let brandsWithCounts: Brand[] = [];
      
      // If we have a category slug, try to get category-specific brands
      if (slug) {
        try {
          const filterOptions = await productService.getFilterOptions(undefined, slug);
          if (filterOptions && Array.isArray(filterOptions.brands)) {
            // Only include brands with products
            brandsWithCounts = (filterOptions.brands as Brand[]).filter(brand => brand.count && brand.count > 0);
            console.log('Got category-specific brands with counts:', brandsWithCounts);
          }
        } catch (err) {
          console.error('Failed to get category-specific brands:', err);
        }
      }
      
      // If we couldn't get brands with counts from filter options, fall back to regular brand list
      if (brandsWithCounts.length === 0) {
        try {
          // Get filter options to get brands with product counts
          const filterOptions = await productService.getFilterOptions();
          if (filterOptions && Array.isArray(filterOptions.brands)) {
            // Only include brands with products
            brandsWithCounts = (filterOptions.brands as Brand[]).filter(brand => brand.count && brand.count > 0);
            console.log('Got brands with counts from filter options:', brandsWithCounts);
          }
        } catch (err) {
          console.error('Failed to get brands with counts from filter options:', err);
          
          // Last resort: get all brands and assume they all have products
          try {
            const data = await brandService.getAll();
            if (data && data.results) {
              brandsWithCounts = data.results.map((brand: Brand) => ({
                ...brand,
                count: 1 // Assume at least one product
              }));
            }
          } catch (brandErr) {
            console.error('Failed to load brands:', brandErr);
          }
        }
      }
      
      // Sort brands by count (descending)
      brandsWithCounts.sort((a: Brand, b: Brand) => (b.count || 0) - (a.count || 0));
      
      // Only set brands if we have some
      if (brandsWithCounts.length > 0) {
        setBrands(brandsWithCounts);
      }
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  // Fetch filter options based on category
  const fetchFilterOptions = async () => {
    console.log('[ShopCatalog fetchFilterOptions START] For slug:', slug);
    try {
      const categorySlugForApi = slug || (selectedCategories.length > 0 ? categories.find(c => c.name === selectedCategories[0])?.slug : undefined);
      console.log('[ShopCatalog fetchFilterOptions] Determined categorySlug for API:', categorySlugForApi);

      // Fetch filter options from the API
      const data = categorySlugForApi
        ? await productService.getFilterOptions(undefined, categorySlugForApi)
        : await productService.getFilterOptions();

      console.log('[ShopCatalog fetchFilterOptions] Raw filter data:', data);
      
      if (data) {
        // Set custom filters
        if (Array.isArray(data.custom_filters)) {
          setCustomFields(data.custom_filters);
        } else if (Array.isArray(data.specifications_options)) {
          setCustomFields(data.specifications_options);
        } else {
          setCustomFields([]);
        }
        
        // Set available colors with proper structure
        if (Array.isArray(data.colors)) {
          const formattedColors = data.colors.map((color: any) => {
            // If color already has the correct structure, use it
            if (color && typeof color === 'object' && color.name && color.color) {
              return color;
            }
            
            // Otherwise, create a proper color object
            const colorName = typeof color === 'string' ? color : color?.name || '';
            const colorHex = color?.color || getColorHex(colorName);
            
            return {
              name: colorName,
              color: colorHex
            };
          });
          
          setAvailableColors(formattedColors);
        } else {
          // Fallback to default colors
          setAvailableColors(colors);
        }
        
        // Set price range
        if (data.price_range) {
          setPriceRange(data.price_range);
          
          // Only update min/max price inputs if the user hasn't manually set them
          if (!filterTags.some(tag => tag.includes(CURRENCY_SYMBOL))) {
            setMinPrice(data.price_range.min.toString());
            setMaxPrice(data.price_range.max.toString());
          }
        } else {
          setPriceRange({ min: 0, max: 10000 });
        }
        
        console.log('[ShopCatalog fetchFilterOptions SUCCESS] Filters set for slug:', categorySlugForApi);
      } else {
        console.warn('[ShopCatalog fetchFilterOptions WARN] No data returned from getFilterOptions for slug:', categorySlugForApi);
        setCustomFields([]);
        setAvailableColors(colors); 
        setPriceRange({ min: 0, max: 10000 }); 
      }
    } catch (err: any) {
      console.error('[ShopCatalog fetchFilterOptions ERROR] For slug:', slug, err.response?.data || err.message || err);
      setCustomFields([]);
      setAvailableColors(colors); 
      setPriceRange({ min: 0, max: 10000 }); 
    }
  };
  
  // Helper function to get a color hex code from a color name
  const getColorHex = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      'green': '#8bc4ab',
      'coral red': '#ee7976',
      'light pink': '#df8fbf',
      'sky blue': '#9acbf1',
      'black': '#364254',
      'white': '#ffffff',
      'red': '#e53935',
      'blue': '#1976d2',
      'yellow': '#fdd835',
      'purple': '#9c27b0',
      'orange': '#ff9800',
      'gray': '#9e9e9e'
    };
    
    const normalizedColorName = colorName.toLowerCase();
    return colorMap[normalizedColorName] || '#cccccc'; // Default gray if color not found
  };

  // Add function to handle clicking on product from search results for analytics
  const handleProductClick = (product: Product) => {
    // Record search click for analytics if we have a search ID
    if (searchId !== null) {
      searchService.recordSearchClick(searchId, product.id);
    }
    
    // Navigate to product page
    navigate(`/product/${product.slug || product.id}`);
  };
  
  // Add handler for "Did you mean" suggestion
  const handleDidYouMeanClick = () => {
    if (didYouMean) {
      // Update the URL with the suggested search term
      navigate(`/catalog?search=${encodeURIComponent(didYouMean)}`);
    }
  };

  return (
    <div className="flex flex-col w-full bg-white-100 min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      <main className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 md:mt-10 mb-10 sm:mb-16 md:mb-20">
        {/* Breadcrumb and Title */}
        <div className="pt-4 sm:pt-6 md:pt-8 pb-2 px-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="text-gray-700">Home</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
            {slug ? (
              <>
                <span className="text-gray-700">Categories</span>
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{pageTitle}</span>
              </>
            ) : (
              <span className="text-gray-400">Catalog with sidebar filters</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-9">{pageTitle}</h1>
        </div>
        {/* Banners */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="relative flex-1 min-w-0 h-48 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-r from-[#ACCBEE] to-[#E7F0FD] flex items-center">
            <img src="/image.png" alt="iPhone" className="absolute left-0 top-0 h-full w-[55%] object-cover" />
            <div className="absolute left-[56%] top-1/2 -translate-y-1/2 flex flex-col gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">iPhone 14</h2>
              <p className="text-xs sm:text-sm text-gray-700">Apple iPhone 14 128GB Blue</p>
              <Button className="mt-2 bg-primarymain text-white-100 w-fit px-4 sm:px-6 py-2 rounded-lg flex items-center gap-1 text-sm">
                From ৳899 <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          <div className="relative flex-1 min-w-0 h-48 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-r from-[#FDCBF1] to-[#FFECFA] flex items-center">
            <img src="/image-1.png" alt="iPad" className="absolute left-0 bottom-0 w-full h-[60%] object-contain" />
            <div className="absolute left-1/2 top-8 -translate-x-1/2 flex flex-col items-center w-[70%]">
              <img src="/apple.svg" alt="Apple" className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
              <p className="text-xs sm:text-sm text-gray-700 mb-1">Deal of the week</p>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">iPad Pro M1</h2>
            </div>
          </div>
        </div>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-6 px-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto mb-3 sm:mb-0">
            <span className="text-sm text-gray-900">Found <span className="font-semibold">{totalProducts}</span> items</span>
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              {filterTags.map((tag, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md flex items-center text-xs">
                  <button onClick={() => handleRemoveTag(tag)} className="mr-1"><XIcon className="w-3 h-3" /></button>
                  {tag}
                </Badge>
              ))}
            </div>
            {filterTags.length > 0 && (
              <button className="hidden sm:block text-xs text-gray-700 underline ml-2" onClick={handleClearAll}>Clear all</button>
            )}
            
            {/* Mobile filter button */}
            <Button 
              ref={filterButtonRef}
              variant="outline" 
              size="sm" 
              className="ml-auto sm:hidden flex items-center gap-1"
              onClick={toggleMobileFilters}
            >
              <FilterIcon className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-sm text-gray-900">Sort by:</span>
            <Select
              options={sortOptions}
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-[140px] border-none shadow-none text-sm"
            />
          </div>
        </div>
        
        {/* Mobile filter tags row */}
        <div className="flex sm:hidden flex-wrap items-center gap-2 mb-4">
          {filterTags.map((tag, index) => (
            <Badge key={index} variant="outline" className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md flex items-center text-xs">
              <button onClick={() => handleRemoveTag(tag)} className="mr-1"><XIcon className="w-3 h-3" /></button>
              {tag}
            </Badge>
          ))}
          {filterTags.length > 0 && (
            <button className="text-xs text-gray-700 underline" onClick={handleClearAll}>Clear all</button>
          )}
        </div>
        
        {/* Add "Did you mean" section */}
        {didYouMean && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
            <p>
              No results found for "<span className="font-medium">{searchQuery}</span>".
              Did you mean: <button 
                className="text-blue-600 hover:underline font-medium"
                onClick={handleDidYouMeanClick}
              >
                {didYouMean}
              </button>?
            </p>
          </div>
        )}
        
        {/* Main grid */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar for desktop */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0 flex flex-col gap-6">
            {/* Categories */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Categories</h3>
              <div className="flex flex-col gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`flex items-center justify-between w-full px-2 py-1 rounded transition text-sm ${selectedCategories.includes(category.name) ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-700"}`}
                    onClick={() => handleCategoryClick(category.name)}
                    type="button"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs text-gray-400">{category.count || 0}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Price */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-2">Price</h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{CURRENCY_SYMBOL}</span>
                  <Input value={minPrice} onChange={e => handlePriceChange("min", e.target.value)} className="w-16 h-8 text-xs border-gray-200 rounded" />
                  <span className="text-xs text-gray-500">-</span>
                  <Input value={maxPrice} onChange={e => handlePriceChange("max", e.target.value)} className="w-16 h-8 text-xs border-gray-200 rounded" />
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full relative mt-2 mb-1">
                  <div 
                    className="absolute h-2 bg-primarymain rounded-full" 
                    style={{
                      left: `${Math.max(0, Math.min(100, ((parseInt(minPrice) || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min) * 100))}%`,
                      right: `${Math.max(0, Math.min(100, 100 - ((parseInt(maxPrice) || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Brand */}
            {brands.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Brand</h3>
                <div className="flex flex-col gap-2">
                  {brands.map((brand) => (
                    <label key={brand.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox checked={selectedBrands.includes(brand.name)} onChange={() => handleBrandToggle(brand.name, brand.id)} />
                      <span>{brand.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{brand.count || 0}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Dynamic Custom Filters */}
            {Array.isArray(customFields) && customFields.map((field, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{field.name}</h3>
                <div className="flex flex-col gap-2">
                  {field.options.map((option: string, optIndex: number) => (
                    <label key={optIndex} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox 
                        checked={(customFilterValues[field.name] || []).includes(option)} 
                        onChange={() => handleCustomFilterChange(field.name, option)} 
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Colors - only show if colors are available */}
            {availableColors.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">Colors</h3>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color, index) => (
                    <button
                      key={index}
                      className={`w-6 h-6 rounded-full border ${color.name.toLowerCase() === "white" ? "border-gray-300" : "border-transparent"} ${selectedColors.includes(color.name) ? "ring-2 ring-offset-2 ring-black" : ""}`}
                      style={{ backgroundColor: color.color }}
                      onClick={() => handleColorClick(color.name)}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
          
          {/* Product grid */}
          <div className="flex-1">
            {loading ? (
              // Loading state
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="p-6 text-center">
                <p className="text-red-500">{error}</p>
                <Button onClick={fetchProducts} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : products.length === 0 ? (
              // Empty state
              <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
                <img 
                  src="/empty-box.svg" 
                  alt="No products found" 
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  onError={(e) => {
                    e.currentTarget.src = "/empty-box.svg";
                    e.currentTarget.onerror = null;
                  }}
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {slug ? `No Products Available in ${pageTitle}` : 'No Products Found'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {slug 
                    ? `There are currently no products available in this category. Please check back later or browse other categories.`
                    : `No products match your selected filters. Try adjusting your filter options or search terms.`
                  }
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button 
                    variant="outline"
                    onClick={handleClearAll}
                    className="border-gray-300"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => navigate('/catalog')}
                    className="bg-primarymain text-white"
                  >
                    Browse All Products
                  </Button>
                </div>
              </div>
            ) : (
              // Products grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden border-none rounded-xl">
                    <div className="relative">
                      <img
                        src={product.primary_image || product.image || (product.images && product.images.length > 0 ? 
                          (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).image_url) 
                          : "/placeholder-product.png")}
                        alt={product.name}
                        className="w-full h-[200px] object-cover"
                      />
                      {product.sale_price && (
                        <Badge className="absolute top-4 left-4 bg-primarymain text-white-100 py-1 px-2 text-xs">
                          Sale
                        </Badge>
                      )}
                      <button
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white-100 flex items-center justify-center"
                        aria-label="Add to wishlist"
                      >
                        <img src="/icon-3.svg" alt="Heart icon" className="w-5 h-5" />
                      </button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 mb-1">
                        {renderStars(product.rating || product.average_rating || 0)}
                        <span className="text-xs text-gray-500 ml-1">
                          ({product.reviews_count || product.total_reviews || 0})
                        </span>
                      </div>
                      <h3 className="text-sm text-gray-900 font-medium line-clamp-2 mb-1">{product.name}</h3>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-base font-semibold text-gray-900">
                          {CURRENCY_SYMBOL}{product.sale_price || product.price}
                        </span>
                        {product.sale_price && (
                          <span className="text-sm text-gray-500 line-through">
                            {CURRENCY_SYMBOL}{product.price}
                          </span>
                        )}
                      </div>
                      <Button
                        className="w-full bg-primarymain text-white-100"
                        onClick={() => handleAddToCart(product.id, product.slug)}
                      >
                        Buy Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            <div className="mt-8 flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        </div>
      </main>
      <CtaFooterByAnima />
    </div>
  );
};