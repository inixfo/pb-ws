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
  // --- Add: Read category and brand from query params ---
  const categoryParam = queryParams.get('category');
  const brandParam = queryParams.get('brand');
  
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

  // Add a state to track if initial filter sync from URL is done
  const [initialFilterSyncDone, setInitialFilterSyncDone] = useState(false);

  // Initial data fetching: fetch categories and brands only
  useEffect(() => {
    fetchCategoriesWithCount();
    fetchBrands();
    // Do NOT fetch products here
  }, []);

  // Sync category/brand query params to filter state, then mark sync as done
  useEffect(() => {
    // Only run if category or brand param is present
    if (!categoryParam && !brandParam) {
      setInitialFilterSyncDone(true); // No sync needed
      return;
    }
    let didSet = false;
    // Set category filter if category param is present
    if (categoryParam && categories.length > 0) {
      const catObj = categories.find((c: any) => c.slug === categoryParam);
      if (catObj) {
        setSelectedCategories([catObj.name]);
        didSet = true;
      }
    }
    // Set brand filter if brand param is present
    if (brandParam && brands.length > 0) {
      const brandObj = brands.find((b: any) => b.slug === brandParam);
      if (brandObj) {
        setSelectedBrands([brandObj.name]);
        setSelectedBrandIds([brandObj.id]);
        didSet = true;
      }
    }
    // If we set filters, wait for them to propagate before marking sync done
    if (didSet) {
      // Wait for next tick to ensure state is set
      setTimeout(() => setInitialFilterSyncDone(true), 0);
    } else if (categories.length > 0 && brands.length > 0) {
      // If nothing to sync, mark as done
      setInitialFilterSyncDone(true);
    }
  }, [categoryParam, brandParam, categories, brands]);

  // Effect to fetch products when filters change (for normal filter UI interaction)
  useEffect(() => {
    // Only run if initial filter sync is done and we're not in the middle of URL parameter processing
    if (initialFilterSyncDone) {
      fetchProducts();
    }
  }, [initialFilterSyncDone, slug, currentPage, sort, selectedBrands, selectedColors, minPrice, maxPrice, searchQuery, JSON.stringify(customFilterValues)]);

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

  // Effect to fetch categories and filter options when slug changes
  useEffect(() => {
    fetchCategoriesWithCount();
    fetchBrands();
    fetchFilterOptions();
    
    // Reset pagination when slug changes
    setCurrentPage(1);
    
    // Set page title based on slug or search query
    if (slug) {
      // Convert slug to title case
      const title = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setPageTitle(title);
    } else if (searchQuery) {
      setPageTitle(`Search results for "${searchQuery}"`);
    } else {
      setPageTitle('All Products');
    }
  }, [slug, searchQuery]);
  
  // Effect to update filter tags when filters change
  useEffect(() => {
    const tags: string[] = [];
    
    // Add search tag if there's a search query
    if (searchQuery) {
      tags.push(`Search: ${searchQuery}`);
    }
    
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
  }, [selectedBrands, selectedColors, minPrice, maxPrice, customFilterValues, priceRange, searchQuery]);

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
    
    // Clear products and set loading state to ensure user sees loading indicator
    setProducts([]);
    setLoading(true);
    setError(null);
    setDidYouMean(null);
    setSearchId(null);

    try {
      setLoading(true);
      setError(null);
      
      // Build base parameters
      const baseParams: Record<string, any> = {
        page: currentPage,
        page_size: 9,
      };
      
      // Add sorting parameter
      if (sort === 'popular') {
        baseParams.ordering = '-average_rating';
      } else if (sort === 'new') {
        baseParams.ordering = '-created_at';
      } else if (sort === 'price_low') {
        baseParams.ordering = 'base_price';
      } else if (sort === 'price_high') {
        baseParams.ordering = '-base_price';
      }
      
      // Handle category filtering - prioritize URL parameter over selected categories
      if (categoryParam) {
        // Use the category from URL parameter
        baseParams.category_slug = categoryParam;
        console.log('[ShopCatalog fetchProducts] Using category from URL param:', categoryParam);
      } else if (slug) {
        // Use the slug as category filter
        baseParams.category_slug = slug;
        console.log('[ShopCatalog fetchProducts] Using category from slug:', slug);
      } else if (selectedCategories.length > 0) {
        // Use selected categories from filter UI
        baseParams.category__name__in = selectedCategories.join(',');
        console.log('[ShopCatalog fetchProducts] Using selected categories:', selectedCategories);
      }
      
      // Handle brand filtering - prioritize URL parameter over selected brands
      if (brandParam) {
        // Use the brand from URL parameter
        baseParams.brand__slug = brandParam;
        console.log('[ShopCatalog fetchProducts] Using brand from URL param:', brandParam);
      } else if (selectedBrandIds.length > 0) {
        // Store brand IDs and slugs for filtering
        baseParams.brandIds = selectedBrandIds;
        baseParams.brandSlugs = selectedBrands.map(brandName => {
          const brand = brands.find(b => b.name === brandName);
          return brand?.slug || brandName.toLowerCase().replace(/\s+/g, '-');
        });
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
        // Create a copy of params to modify
        const apiParams = { ...params };
        
        // Handle special brand parameters for service calls
        if (apiParams.brandSlugs && Array.isArray(apiParams.brandSlugs) && apiParams.brandSlugs.length > 0) {
          // Use the brand__slug__in filter for multiple brands
          apiParams.brand__slug__in = apiParams.brandSlugs.join(',');
          // Remove the brandSlugs parameter
          delete apiParams.brandSlugs;
          delete apiParams.brandIds;
        } else if (apiParams.brandIds && Array.isArray(apiParams.brandIds) && apiParams.brandIds.length === 1) {
          // Use the brand filter for single brand
          apiParams.brand = apiParams.brandIds[0];
          // Remove the brandIds parameter
          delete apiParams.brandIds;
          delete apiParams.brandSlugs;
        } else {
          // Remove unused brand parameters
          delete apiParams.brandIds;
          delete apiParams.brandSlugs;
        }
        
        // Make sure ordering parameter is preserved
        if (params.ordering) {
          apiParams.ordering = params.ordering;
        }
        
        // If we have a search query, use the search service
        if (searchQuery) {
          console.log('[ShopCatalog fetchProducts] Performing search with query:', searchQuery, 'and params:', apiParams);
          try {
            // Use the search service from our imports
            const searchResponse = await searchService.search(searchQuery, apiParams);
            
            // Check if we got search results with a search_id for analytics
            if (searchResponse.search_id) {
              setSearchId(searchResponse.search_id);
              console.log('[ShopCatalog fetchProducts] Setting search ID for analytics:', searchResponse.search_id);
            }
            
            // Check if we got "did you mean" suggestions
            if (searchResponse.did_you_mean && !searchResponse.results?.length) {
              setDidYouMean(searchResponse.did_you_mean);
              console.log('[ShopCatalog fetchProducts] Setting "did you mean" suggestion:', searchResponse.did_you_mean);
            }
            
            return searchResponse;
          } catch (searchError) {
            console.error('[ShopCatalog fetchProducts] Error in search service:', searchError);
            // Fall back to regular product service
            console.log('[ShopCatalog fetchProducts] Falling back to regular product API with search param');
            return await productService.getAll({
              ...apiParams,
              search: searchQuery
            });
          }
        } else if (slug || categoryParam) {
          // If we have a category slug or parameter, use category filtering
          const categoryParams = { ...apiParams };
          if (categoryParam) {
            categoryParams.category_slug = categoryParam;
          } else if (slug) {
            categoryParams.category_slug = slug;
          }
          console.log('[ShopCatalog fetchProducts] Fetching by category with params:', categoryParams);
          return await productService.getAll(categoryParams);
        } else {
          console.log('[ShopCatalog fetchProducts] Fetching all products with params:', apiParams);
          return await productService.getAll(apiParams);
        }
      };
      
      // Make direct API call first for better reliability
      try {
        console.log('[ShopCatalog fetchProducts] Making direct API call first');
        const axios = (await import('axios')).default;
        
        // If we have a search query, use the search service instead of direct API call
        if (searchQuery) {
          console.log('[ShopCatalog fetchProducts] Using search service for query:', searchQuery);
          try {
            const searchResponse = await searchService.search(searchQuery, {
              page: currentPage,
              page_size: 12,
              ordering: baseParams.ordering
            });
            
            // Check if we got search results with a search_id for analytics
            if (searchResponse.search_id) {
              setSearchId(searchResponse.search_id);
              console.log('[ShopCatalog fetchProducts] Setting search ID for analytics:', searchResponse.search_id);
            }
            
            // Check if we got "did you mean" suggestions
            if (searchResponse.did_you_mean && !searchResponse.results?.length) {
              setDidYouMean(searchResponse.did_you_mean);
              console.log('[ShopCatalog fetchProducts] Setting "did you mean" suggestion:', searchResponse.did_you_mean);
            }
            
            return searchResponse;
          } catch (searchError) {
            console.error('[ShopCatalog fetchProducts] Search service failed:', searchError);
            console.log('[ShopCatalog fetchProducts] Falling back to regular product API with search param');
            
            // Fall back to regular product service with search parameter
            try {
              return await productService.getAll({
                ...baseParams,
                search: searchQuery
              });
            } catch (fallbackError) {
              console.error('[ShopCatalog fetchProducts] Fallback search also failed:', fallbackError);
              throw fallbackError; // Re-throw to be caught by outer error handler
            }
          }
        }
        
        // Build the endpoint URL with proper parameters for non-search queries
        let endpoint = `https://phonebay.xyz/api/products/products/?page=${currentPage}`;
        
        // Add category slug if available - prioritize URL parameter
        if (categoryParam) {
          endpoint += `&category_slug=${encodeURIComponent(categoryParam)}`;
          console.log('[ShopCatalog fetchProducts] Adding category from URL param to direct API call:', categoryParam);
        } else if (slug) {
          endpoint += `&category_slug=${encodeURIComponent(slug)}`;
          console.log('[ShopCatalog fetchProducts] Adding category from slug to direct API call:', slug);
        }
        
        // Add sorting parameter
        if (baseParams.ordering) {
          endpoint += `&ordering=${encodeURIComponent(baseParams.ordering)}`;
          console.log(`[ShopCatalog fetchProducts] Adding sort parameter to direct API call: ordering=${baseParams.ordering}`);
        } else {
          console.warn('[ShopCatalog fetchProducts] No ordering parameter found in baseParams');
        }
        
        // Add brand filtering - prioritize URL parameter over selected brands
        if (brandParam) {
          // Use the brand from URL parameter
          endpoint += `&brand__slug=${encodeURIComponent(brandParam)}`;
          console.log('[ShopCatalog fetchProducts] Adding brand from URL param to direct API call:', brandParam);
        } else if (baseParams.brandSlugs && Array.isArray(baseParams.brandSlugs) && baseParams.brandSlugs.length > 0) {
          // Use the brand__slug__in filter for multiple brands
          endpoint += `&brand__slug__in=${encodeURIComponent(baseParams.brandSlugs.join(','))}`;
          console.log('[ShopCatalog fetchProducts] Adding multiple brands to direct API call:', baseParams.brandSlugs);
        } else if (baseParams.brandIds && Array.isArray(baseParams.brandIds) && baseParams.brandIds.length === 1) {
          // Use the brand filter for single brand
          endpoint += `&brand=${encodeURIComponent(String(baseParams.brandIds[0]))}`;
          console.log('[ShopCatalog fetchProducts] Adding single brand ID to direct API call:', baseParams.brandIds[0]);
        }
        
        // Add other filter parameters (but exclude the ones we already handled)
        Object.entries(baseParams).forEach(([key, value]) => {
          if (key !== 'page' && key !== 'ordering' && key !== 'brandIds' && key !== 'brandSlugs' && key !== 'brand__slug' && key !== 'category_slug') {
            // For all parameters, just use the key-value pair directly
            endpoint += `&${key}=${encodeURIComponent(String(value))}`;
          }
        });
        
        console.log(`[ShopCatalog fetchProducts] Direct API call to ${endpoint}`);
        const directResponse = await axios.get(endpoint, { 
          timeout: 10000, // 10 second timeout
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
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
      } catch (error) {
        const directError = error as any;
        console.error('[ShopCatalog fetchProducts] Direct API call failed:', directError);
        
        // Log more detailed error information
        if (directError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response data:', directError.response.data);
          console.error('Error response status:', directError.response.status);
          console.error('Error response headers:', directError.response.headers);
        } else if (directError.request) {
          // The request was made but no response was received
          console.error('Error request:', directError.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', directError.message);
        }
        
        // Fall back to using the service
        try {
          data = await fetchWithParams(baseParams);
        } catch (serviceErr) {
          const serviceError = serviceErr as any;
          console.error('[ShopCatalog fetchProducts] Service API call also failed:', serviceError);
          setError('Couldn\'t load products from the server. Showing sample products instead.');
          // Use fallback products with proper type casting
          const typedFallbackProducts = FALLBACK_PRODUCTS.map(product => ({
            ...product,
            price: product.base_price,
            sale_price: product.discount_price,
            rating: product.average_rating || 0,
            reviews_count: product.review_count || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            variations: [],
            emi_available: false,
            is_approved: true,
            stock_status: 'in_stock'
          })) as unknown as Product[];
          
          setProducts(typedFallbackProducts);
          setTotalProducts(typedFallbackProducts.length);
          setTotalPages(1);
          setLoading(false);
          return;
        }
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
        
        console.log(`[ShopCatalog fetchProducts] Got products with sort=${sort}:`, typedResults.map(p => ({id: p.id, price: p.price, name: p.name})));
        
        // Apply client-side sorting as a fallback to ensure correct order
        const sortedProducts = [...typedResults].sort((a, b) => {
          // Apply the correct sorting logic based on the selected sort option
          switch (sort) {
            case 'popular':
              // Popularity sort (fallback to rating if popularity_score not available)
              const aPopularity = a.popularity_score || a.rating || 0;
              const bPopularity = b.popularity_score || b.rating || 0;
              return bPopularity - aPopularity; // Descending
            case 'new':
              // Sort by creation date (newest first)
              const aDate = new Date(a.created_at || '').getTime();
              const bDate = new Date(b.created_at || '').getTime();
              return bDate - aDate; // Descending
            case 'price_low':
              // Sort by price (lowest first)
              const aPrice = Number(a.sale_price || a.price || 0);
              const bPrice = Number(b.sale_price || b.price || 0);
              return aPrice - bPrice; // Ascending
            case 'price_high':
              // Sort by price (highest first)
              const aHighPrice = Number(a.sale_price || a.price || 0);
              const bHighPrice = Number(b.sale_price || b.price || 0);
              return bHighPrice - aHighPrice; // Descending
            default:
              return 0;
          }
        });
        
        console.log(`[ShopCatalog fetchProducts] Client-side sorted products:`, 
          sortedProducts.map(p => ({id: p.id, price: p.price, name: p.name}))
        );
        
        // Clear products first to ensure UI updates properly
        setProducts([]);
        
        // Use setTimeout to ensure state update has a chance to clear before setting new data
        setTimeout(() => {
          // Use the client-side sorted products instead of the original typedResults
          setProducts(sortedProducts);
          setTotalPages(data.total_pages || data.num_pages || Math.ceil(data.count / 12) || 1);
          setTotalProducts(data.count || data.results.length || 0);
          
          if (usedFallback) {
            setError("Some filters were ignored to show you products.");
          }
          
          console.log('[ShopCatalog fetchProducts SUCCESS] Products loaded and sorted:', sortedProducts.length, 'Total pages:', data.total_pages || data.num_pages || Math.ceil(data.count / 12) || 1);
          
          // Display the first 5 products with their prices to verify sort order in the console
          console.log('[ShopCatalog fetchProducts SORT VERIFICATION]', sort, 'order:',
            sortedProducts.slice(0, 5).map(p => ({
              id: p.id,
              name: p.name,
              price: p.sale_price || p.price,
              created: p.created_at
            }))
          );
        }, 50);
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
    console.log('[ShopCatalog fetchBrands] Called');
    setLoading(true);
    
    try {
      // Different approach based on whether we're on a category page or main catalog
      let brandsData;
      
      if (slug) {
        // For category pages, fetch brands specific to this category
        console.log(`[ShopCatalog fetchBrands] Fetching brands for category: ${slug}`);
        const response = await productService.getBrandsByCategory(slug);
        brandsData = response;
      } else {
        // For main catalog page, fetch all brands with their counts
        console.log('[ShopCatalog fetchBrands] Fetching all brands with counts');
        // First try to get from filter options which includes counts
        try {
          const filterOptions = await productService.getFilterOptions();
          if (filterOptions && Array.isArray(filterOptions.brands) && filterOptions.brands.length > 0) {
            brandsData = filterOptions.brands;
          } else {
            const response = await brandService.getAllWithCategories();
            brandsData = response;
          }
        } catch (err) {
          console.error('[ShopCatalog fetchBrands] Error getting brands from filter options:', err);
          const response = await brandService.getAllWithCategories();
          brandsData = response;
        }
      }
      
      console.log('[ShopCatalog fetchBrands] Brands data:', brandsData);
      
      // Process brands data
      if (Array.isArray(brandsData)) {
        // Make sure each brand has a count property
        const processedBrands = brandsData.map(brand => ({
          ...brand,
          count: brand.count || brand.product_count || 0
        }));
        
        // Sort brands by count (descending) and then by name
        const sortedBrands = processedBrands.sort((a, b) => {
          // First sort by count (brands with products first)
          if ((b.count || 0) - (a.count || 0) !== 0) {
            return (b.count || 0) - (a.count || 0);
          }
          // Then alphabetically
          return a.name.localeCompare(b.name);
        });
        
        setBrands(sortedBrands);
        
        // Update selected brands state if needed
        if (selectedBrands.length > 0) {
          // Make sure the brand IDs match the brand names
          const updatedBrandIds = [];
          for (const brandName of selectedBrands) {
            const brand = sortedBrands.find(b => b.name === brandName);
            if (brand) {
              updatedBrandIds.push(brand.id);
            }
          }
          setSelectedBrandIds(updatedBrandIds);
        }
      } else {
        console.error('[ShopCatalog fetchBrands] Unexpected brands data format:', brandsData);
        setBrands([]);
      }
    } catch (error) {
      console.error('[ShopCatalog fetchBrands] Error fetching brands:', error);
      setBrands([]);
    } finally {
      setLoading(false);
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
        {/* Brand Showcase - Replacing the Banners */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {slug ? `${pageTitle} Brands` : 'Popular Brands'}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {brands
              .filter(brand => {
                // On category pages, show only brands that have products in that category
                // This is determined by the brand's categories array which comes from the API
                if (slug) {
                  // If brand has categories property and it contains the current category
                  return (
                    brand.count > 0 || // Check count from API
                    (brand.categories && // Or check categories array if available
                      Array.isArray(brand.categories) &&
                      brand.categories.some(cat => 
                        typeof cat === 'object' && cat.slug === slug ||
                        typeof cat === 'string' && cat === slug
                      ))
                  );
                }
                // On the main catalog page, show all brands
                return true;
              })
              .map((brand) => (
                <div
                  key={brand.id}
                  onClick={() => {
                    // If brand is already selected, remove it (toggle functionality)
                    if (selectedBrands.includes(brand.name)) {
                      setSelectedBrands([]);
                      setSelectedBrandIds([]);
                    } else {
                      // Otherwise, select only this brand
                      setSelectedBrands([brand.name]);
                      setSelectedBrandIds([brand.id]);
                    }
                    // Reset to first page when changing brand filter
                    setCurrentPage(1);
                  }}
                  className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    selectedBrands.includes(brand.name)
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                  }`}
                >
                  <div className="h-10 w-full flex items-center justify-center mb-1">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-8 w-auto object-contain"
                        onError={(e) => {
                          // Fallback for broken images
                          e.currentTarget.src = "/placeholder-brand.png";
                        }}
                      />
                    ) : (
                      <span className="text-xs text-gray-700 font-medium text-center">{brand.name}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-700 font-medium text-center truncate w-full px-1">{brand.name}</span>
                </div>
              ))}
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
            <select
              value={sort}
              onChange={(e) => {
                const newSortValue = e.target.value;
                console.log('Sort changed to:', newSortValue);
                
                // Force a complete reset of the sorting workflow
                setLoading(true);
                setProducts([]);
                
                // Use setTimeout to ensure state updates happen in the correct order
                setTimeout(() => {
                  // Change sort value
                  setSort(newSortValue);
                  // Reset to page 1 when sorting changes
                  setCurrentPage(1);
                  
                  // Let the useEffect trigger fetch based on these state changes
                }, 50);
              }}
              className="w-[140px] border-none shadow-none text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
        
        {/* Mobile Filters Drawer */}
        {mobileFiltersVisible && (
          <div
            ref={filtersRef}
            className="fixed inset-0 z-50 bg-white overflow-auto lg:hidden p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileFilters}
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile Filter Content */}
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-base font-medium mb-3">Categories</h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedCategories.includes(category.name)}
                          onChange={() => {}}
                          className="mr-2"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">
                          {category.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {category.count || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Brands */}
              <div>
                <h3 className="text-base font-medium mb-3">Brands</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => handleBrandToggle(brand.name, brand.id)}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedBrands.includes(brand.name)}
                          onChange={() => {}}
                          className="mr-2"
                        />
                        <span className="text-gray-700 group-hover:text-gray-900">
                          {brand.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{brand.count || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Price Range */}
              <div>
                <h3 className="text-base font-medium mb-3">Price Range</h3>
                <div className="flex gap-2 mb-2">
                  <div className="w-1/2 relative">
                    <DollarSignIcon className="w-4 h-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <Input
                      type="number"
                      placeholder={priceRange.min.toString()}
                      className="pl-8 py-3"
                      value={minPrice}
                      onChange={(e) => handlePriceChange("min", e.target.value)}
                      min={priceRange.min}
                      max={priceRange.max}
                    />
                  </div>
                  <div className="w-1/2 relative">
                    <DollarSignIcon className="w-4 h-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <Input
                      type="number"
                      placeholder={priceRange.max.toString()}
                      className="pl-8 py-3"
                      value={maxPrice}
                      onChange={(e) => handlePriceChange("max", e.target.value)}
                      min={priceRange.min}
                      max={priceRange.max}
                    />
                  </div>
                </div>
              </div>
              
              {/* Custom Filters */}
              {customFields.map((field, index) => (
                <div key={index}>
                  <Separator />
                  <h3 className="text-base font-medium my-3">{field.name}</h3>
                  <div className="space-y-2">
                    {field.options.map((option: string, optIndex: number) => (
                      <div
                        key={optIndex}
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => handleCustomFilterChange(field.name, option)}
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={(customFilterValues[field.name] || []).includes(option)}
                            onChange={() => {}}
                            className="mr-2"
                          />
                          <span className="text-gray-700 group-hover:text-gray-900">
                            {option}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Colors */}
              {availableColors.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-base font-medium mb-3">Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded-full cursor-pointer ${
                            selectedColors.includes(color.name)
                              ? "ring-2 ring-offset-2 ring-black"
                              : ""
                          }`}
                          style={{
                            background: color.color,
                            border: color.name.toLowerCase() === "white" ? "1px solid #d1d5db" : "none",
                          }}
                          onClick={() => handleColorClick(color.name)}
                          title={color.name}
                        ></div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  className="w-[48%]"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
                <Button
                  className="w-[48%] bg-primarymain text-white"
                  onClick={toggleMobileFilters}
                >
                  Apply filters
                </Button>
              </div>
            </div>
          </div>
        )}
        
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
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {brands
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((brand) => (
                      <label key={brand.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={selectedBrands.includes(brand.name)} onChange={() => handleBrandToggle(brand.name, brand.id)} />
                        <span>{brand.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{brand.count || 0}</span>
                      </label>
                    ))
                  }
                </div>
                {brands.length > 5 && (
                  <button 
                    className="text-sm text-primarymain mt-2 flex items-center justify-center w-full"
                    onClick={() => setShowAllBrands(!showAllBrands)}
                  >
                    {showAllBrands ? (
                      <>Show Less <ChevronUpIcon className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>Show All <ChevronDownIcon className="w-4 h-4 ml-1" /></>
                    )}
                  </button>
                )}
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
                  <div key={i} className="flex flex-col gap-4">
                    <div className="bg-gray-100 rounded-xl h-52 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                    <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                  </div>
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
                    <div className="relative aspect-square w-full overflow-hidden bg-gray-50 sm:aspect-[4/3] lg:aspect-square">
                      <img
                        src={product.primary_image || product.image || (product.images && product.images.length > 0 ? 
                          (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).image_url) 
                          : "/placeholder-product.png")}
                        alt={product.name}
                        className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-105 sm:p-3 lg:p-4"
                        loading="lazy"
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