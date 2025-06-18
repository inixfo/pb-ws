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
import productService, { FALLBACK_PRODUCTS } from "../../services/api/productService";
import categoryService from "../../services/api/categoryService";
import brandService from "../../services/api/brandService";
import searchService from "../../services/api/searchService";

// Rename the imported component to maintain compatibility with existing code
const Pagination = PaginationComponent;

// Define currency symbol locally to avoid import issues
const CURRENCY_SYMBOL = '৳';

export const ShopCatalog = (): JSX.Element => {
  // Get category slug from URL params
  const { slug } = useParams<{ slug?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('search');
  
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
    fetchCategoriesWithCount();
    fetchBrands();
  }, []);

  useEffect(() => {
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

  // Fetch products when filters change
  useEffect(() => {
    // Add a small delay to avoid multiple calls when multiple filters change at once
    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [currentPage, sort, selectedBrands, selectedColors, customFilterValues, minPrice, maxPrice, slug, searchQuery]);

  // Set page title and selected category based on slug
  useEffect(() => {
    if (slug) {
      // Find the category that matches the slug
      const category = categories.find(cat => cat.slug === slug);
      if (category) {
        setPageTitle(category.name);
        setSelectedCategories([category.name]);
        
        // Add category to filter tags if not already there
        if (!filterTags.includes(category.name)) {
          setFilterTags(prev => [...prev, category.name]);
        }
      } else {
        // Handle subcategory slugs
        const formattedSlug = slug.replace(/-/g, ' ');
        const capitalizedSlug = formattedSlug
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setPageTitle(capitalizedSlug);
        
        // Add to filter tags if not already there
        if (!filterTags.includes(capitalizedSlug)) {
          setFilterTags(prev => [...prev, capitalizedSlug]);
        }
      }
    } else if (searchQuery) {
      // If there's a search query but no category, set a search-specific title
      setPageTitle(`Search Results: ${searchQuery}`);
      
      // Add search query to filter tags if not already there
      const searchTag = `Search: ${searchQuery}`;
      if (!filterTags.includes(searchTag)) {
        setFilterTags(prev => [...prev, searchTag]);
      }
    }
  }, [slug, categories, searchQuery]);

  // Handlers
  const handleBrandToggle = (brand: string) => {
    // Toggle the brand selection
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    
    // Update filter tags
    if (!selectedBrands.includes(brand)) {
      setFilterTags(prev => [...prev, brand]);
    } else {
      setFilterTags(prev => prev.filter(tag => tag !== brand));
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
    setSelectedSSD([]);
    setSelectedColors([]);
    setCustomFilterValues({});
    setMinPrice(priceRange.min.toString());
    setMaxPrice(priceRange.max.toString());
    
    // Keep category filter if we're on a category page
    if (slug) {
      const categoryTag = filterTags.find(tag => 
        categories.some(cat => cat.name === tag)
      );
      setFilterTags(categoryTag ? [categoryTag] : []);
    } else {
      setFilterTags([]);
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setFilterTags((prev) => prev.filter((t) => t !== tag));
    
    // Check if it's a price filter tag
    if (tag.includes(CURRENCY_SYMBOL)) {
      setMinPrice(priceRange.min.toString());
      setMaxPrice(priceRange.max.toString());
      return;
    }
    
    // Check if it's a custom filter tag (format: "FilterName: Value")
    if (tag.includes(': ')) {
      const [filterName, value] = tag.split(': ');
      
      // Update customFilterValues
      setCustomFilterValues(prev => {
        const updatedFilters = { ...prev };
        if (updatedFilters[filterName]) {
          updatedFilters[filterName] = updatedFilters[filterName].filter(v => v !== value);
          if (updatedFilters[filterName].length === 0) {
            delete updatedFilters[filterName];
          }
        }
        return updatedFilters;
      });
      
      return;
    }
    
    // Handle other tag types
    if (selectedBrands.includes(tag)) {
      setSelectedBrands(prev => prev.filter(b => b !== tag));
    } else if (selectedSSD.includes(tag)) {
      setSelectedSSD(prev => prev.filter(s => s !== tag));
    } else if (selectedColors.includes(tag)) {
      setSelectedColors(prev => prev.filter(c => c !== tag));
    } else if (selectedCategories.includes(tag)) {
      setSelectedCategories(prev => prev.filter(c => c !== tag));
      navigate('/catalog');
    }
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
    try {
      setLoading(true);
      
      // Build query parameters
      const params: Record<string, any> = {
        page: currentPage,
        page_size: 12, // Ensure we're requesting a reasonable number of products
      };
      
      // If there's a search query, use advanced search endpoint
      if (searchQuery) {
        try {
          const advancedSearchParams = {
            q: searchQuery,
            page: currentPage,
            page_size: 12,
            category: slug || undefined
          };
          
          // Use advanced search
          const searchResults = await searchService.search(searchQuery, advancedSearchParams);
          
          if (searchResults) {
            console.log(`Advanced search results:`, searchResults);
            
            // Check for "did you mean" suggestion
            if (searchResults.did_you_mean && searchResults.results.length === 0) {
              setDidYouMean(searchResults.did_you_mean);
            } else {
              setDidYouMean(null);
            }
            
            // Store search ID if available for analytics tracking
            if (searchResults.search_id) {
              setSearchId(searchResults.search_id);
            }
            
            // Set products and pagination info
            setProducts(searchResults.results || []);
            setTotalProducts(searchResults.count || searchResults.results.length);
            setTotalPages(Math.ceil((searchResults.count || searchResults.results.length) / 12));
            
            return; // Exit early since we've handled the search results
          }
        } catch (err) {
          console.error('Advanced search failed, falling back to regular API:', err);
          // Continue with regular API if advanced search fails
        }
      }
      
      // Original code for non-search queries or fallback
      // Add search parameter if provided
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      // Add category filter - try both categoryId and slug for better compatibility
      if (slug) {
        // First try to find the matching category in our loaded categories
        const category = categories.find(cat => cat.slug === slug);
        if (category) {
          // If we have the category object, use its ID (more reliable)
          params.category = category.id;
          console.log(`Using category ID ${category.id} for ${slug}`);
        }
        
        // Always send the category_slug parameter to ensure it works even if ID-based filtering fails
        params.category_slug = slug;
        console.log(`Using category_slug ${slug}`);
      }
      
      // Add brand filter
      if (selectedBrands.length > 0) {
        const brandSlugs = brands
          .filter(brand => selectedBrands.includes(brand.name))
          .map(brand => brand.slug);
        
        if (brandSlugs.length > 0) {
          params.brand__slug__in = brandSlugs.join(',');
        }
      }
      
      // Add color filter
      if (selectedColors.length > 0) {
        // For color filtering, we need to use a custom filter for the specifications field
        const colorParams = selectedColors.join(',');
        params['specifications__color__in'] = colorParams;
      }
      
      // Add custom filters
      Object.entries(customFilterValues).forEach(([key, values]) => {
        if (values.length > 0) {
          // Use the specifications lookup for custom filters
          const paramKey = `specifications__${key.toLowerCase()}__in`;
          params[paramKey] = values.join(',');
        }
      });
      
      // Add price range filter - ensure values are numeric
      let minPriceValue = minPrice === '' ? 0 : parseFloat(minPrice);
      let maxPriceValue = maxPrice === '' ? 
                          (priceRange.max || 10000) : 
                          parseFloat(maxPrice);
      
      // Validate price values
      if (isNaN(minPriceValue)) minPriceValue = 0;
      if (isNaN(maxPriceValue)) maxPriceValue = priceRange.max || 10000;
      
      // Ensure max >= min
      if (maxPriceValue < minPriceValue) {
        // Swap values if max < min
        [minPriceValue, maxPriceValue] = [maxPriceValue, minPriceValue];
      }
      
      // Add min_price parameter if it's not 0 (the default)
      if (minPriceValue > 0) {
        params.min_price = minPriceValue;
      }
      
      // Always add max_price parameter
      params.max_price = maxPriceValue;
      
      console.log('Fetching products with params:', params);
      
      // Add sort parameter
      if (sort === 'price_low') {
        params.ordering = 'base_price';
      } else if (sort === 'price_high') {
        params.ordering = '-base_price';
      } else if (sort === 'new') {
        params.ordering = '-created_at';
      } else if (sort === 'popular') {
        params.ordering = '-review_count';
      }
      
      // Attempt to fetch real products
      const data = await productService.getAll(params);
      
      if (data && data.results && data.results.length > 0) {
        console.log(`Successfully fetched ${data.results.length} products from API`);
        setProducts(data.results);
        setTotalProducts(data.count || data.results.length);
        setTotalPages(Math.ceil((data.count || data.results.length) / 12));
      } else {
        console.error('No products found in API response');
        // Only if API returns no products, we use fallback
        setProducts(FALLBACK_PRODUCTS);
        setTotalProducts(FALLBACK_PRODUCTS.length);
        setTotalPages(Math.ceil(FALLBACK_PRODUCTS.length / 12));
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products');
      
      // Only use fallback products if API call fails completely
      setProducts(FALLBACK_PRODUCTS);
      setTotalProducts(FALLBACK_PRODUCTS.length);
      setTotalPages(Math.ceil(FALLBACK_PRODUCTS.length / 12));
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
      const data = await brandService.getAll();
      if (data && data.results) {
        setBrands(data.results.map((brand: Brand) => ({
          ...brand,
          count: brand.id // Temporary count placeholder
        })));
      }
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  // Fetch filter options based on category
  const fetchFilterOptions = async () => {
    try {
      let categoryId: number | undefined;
      
      if (slug) {
        // Find the category that matches the slug
        const category = categories.find(cat => cat.slug === slug);
        if (category) {
          categoryId = category.id;
        }
      }
      
      // Pass both categoryId and slug to handle all possible backend implementations
      const filterOptions = await productService.getFilterOptions(categoryId, slug);
      
      console.log('Received filter options:', filterOptions);
      
      // Update filter states
      if (filterOptions) {
        // Set available colors
        if (filterOptions.colors && filterOptions.colors.length > 0) {
          const colorOptions = filterOptions.colors.map((color: string) => {
            let colorCode = "#000000"; // Default black
            
            // Map common color names to hex codes
            switch(color.toLowerCase()) {
              case 'black': colorCode = "#000000"; break;
              case 'white': colorCode = "#ffffff"; break;
              case 'red': colorCode = "#ff0000"; break;
              case 'green': colorCode = "#00ff00"; break;
              case 'blue': colorCode = "#0000ff"; break;
              case 'yellow': colorCode = "#ffff00"; break;
              case 'purple': colorCode = "#800080"; break;
              case 'orange': colorCode = "#ffa500"; break;
              case 'pink': colorCode = "#ffc0cb"; break;
              case 'gray': case 'grey': colorCode = "#808080"; break;
              case 'silver': colorCode = "#c0c0c0"; break;
              case 'gold': colorCode = "#ffd700"; break;
              default: colorCode = "#000000"; break;
            }
            
            return { name: color, color: colorCode };
          });
          
          setAvailableColors(colorOptions);
        } else {
          setAvailableColors([]);
        }
        
        // Set price range
        if (filterOptions.price_range) {
          console.log('Setting price range from backend:', filterOptions.price_range);
          setPriceRange(filterOptions.price_range);
          
          // Only update min/max price inputs if user hasn't set them already
          if (!filterTags.some(tag => tag.includes(CURRENCY_SYMBOL))) {
            setMinPrice(filterOptions.price_range.min.toString());
            setMaxPrice(filterOptions.price_range.max.toString());
          }
        } else {
          // Set default price range if not provided by backend
          console.log('Using default price range');
          setPriceRange({ min: 0, max: 10000 });
        }
        
        // Set brands
        if (filterOptions.brands && filterOptions.brands.length > 0) {
          setBrands(filterOptions.brands);
        }
        
        // Set custom filters
        if (filterOptions.custom_filters) {
          const fields = Object.entries(filterOptions.custom_filters).map(([name, options]) => ({
            name,
            options: options as string[]
          }));
          setCustomFields(fields);
        }
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
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
                  {(showAllBrands ? brands : brands.slice(0, 5)).map((brand) => (
                    <label key={brand.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox checked={selectedBrands.includes(brand.name)} onChange={() => handleBrandToggle(brand.name)} />
                      <span>{brand.name}</span>
                      <span className="ml-auto text-xs text-gray-400">{brand.count || 0}</span>
                    </label>
                  ))}
                  {brands.length > 5 && (
                    <button className="text-xs text-primary font-medium mt-1" onClick={() => setShowAllBrands(v => !v)}>
                      {showAllBrands ? "Show less" : "Show all"}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Dynamic Custom Filters */}
            {customFields.map((field, index) => (
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
              <div className="p-6 text-center">
                <p className="text-gray-500">No products found matching your criteria.</p>
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