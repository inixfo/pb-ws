import React, { useRef, useEffect } from "react";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/Checkbox";
import { Input } from "../../components/ui/input";
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  ChevronUpIcon, 
  DollarSignIcon, 
  XIcon, 
  FilterIcon 
} from "lucide-react";
import PaginationComponent from "../../components/ui/pagination";
import { Select } from "../../components/ui/Select";
import { Separator } from "../../components/ui/separator";
import { useNavigate } from "react-router-dom";
import { productService, categoryService, brandService } from "../../services/api";
import { Product, Category, Brand } from "../../types/products";
import { getProductImageUrl } from "../../utils/imageUtils";
import { 
  fetchFilterData, 
  countProductsByCategory, 
  countProductsByBrand, 
  extractColorsFromProducts,
  findPriceRange,
  CategoryWithCount,
  BrandWithCount,
  ColorOption
} from "../../utils/filterUtils";

// Rename the imported component to maintain compatibility with existing code
const Pagination = PaginationComponent;

export const SpecialOffers = (): JSX.Element => {
  // Pagination and sort
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(5);
  const sortOptions = [
    { value: "popular", label: "Most popular" },
    { value: "new", label: "Newest" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
  ];
  const [sort, setSort] = React.useState(sortOptions[0].value);

  // Mobile responsiveness
  const [mobileFiltersVisible, setMobileFiltersVisible] = React.useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Filters state
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [showAllBrands, setShowAllBrands] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState("0");
  const [maxPrice, setMaxPrice] = React.useState("5000");
  const [filterTags, setFilterTags] = React.useState<string[]>([]);

  // Dynamic filter data
  const [categories, setCategories] = React.useState<CategoryWithCount[]>([]);
  const [brands, setBrands] = React.useState<BrandWithCount[]>([]);
  const [colors, setColors] = React.useState<ColorOption[]>([]);
  const [priceRange, setPriceRange] = React.useState({ min: 0, max: 5000 });
  const [allCategories, setAllCategories] = React.useState<Category[]>([]);
  const [allBrands, setAllBrands] = React.useState<Brand[]>([]);

  // Add state for products
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const navigate = useNavigate();

  // Fetch filter data (categories, brands)
  React.useEffect(() => {
    const loadFilterData = async () => {
      try {
        const { categories, brands } = await fetchFilterData();
        setAllCategories(categories);
        setAllBrands(brands);
      } catch (err) {
        console.error('Error loading filter data:', err);
      }
    };
    
    loadFilterData();
  }, []);

  // Fetch special offers products
  React.useEffect(() => {
    const fetchSpecialOffers = async () => {
      try {
        setLoading(true);
        const data = await productService.getSpecialOffers();
        const products = Array.isArray(data) ? data : data.results || [];
        setProducts(products);
        console.log('Fetched special offers:', products);
        
        // Update filter data based on the products
        if (products.length > 0) {
          // Set total pages based on product count (assuming 9 per page)
          setTotalPages(Math.ceil(products.length / 9));
          
          // Extract and count categories
          if (allCategories.length > 0) {
            const categoriesWithCounts = countProductsByCategory(products, allCategories);
            setCategories(categoriesWithCounts);
          }
          
          // Extract and count brands
          if (allBrands.length > 0) {
            const brandsWithCounts = countProductsByBrand(products, allBrands);
            setBrands(brandsWithCounts);
          }
          
          // Extract colors
          const colorOptions = extractColorsFromProducts(products);
          setColors(colorOptions);
          
          // Find price range
          const { min, max } = findPriceRange(products);
          setPriceRange({ min, max });
          setMinPrice(min.toString());
          setMaxPrice(max.toString());
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching special offers:', err);
        setError('Failed to load special offers');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialOffers();
  }, [allCategories, allBrands]);

  // Handlers
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    
    // Update filter tags
    if (!filterTags.includes(brand)) {
      setFilterTags(prev => [...prev, brand]);
    } else {
      setFilterTags(prev => prev.filter(tag => tag !== brand));
    }
  };
  
  const handleCategoryClick = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    
    // Update filter tags
    if (!filterTags.includes(cat)) {
      setFilterTags(prev => [...prev, cat]);
    } else {
      setFilterTags(prev => prev.filter(tag => tag !== cat));
    }
  };
  
  const handleColorClick = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
    
    // Update filter tags
    if (!filterTags.includes(color)) {
      setFilterTags(prev => [...prev, color]);
    } else {
      setFilterTags(prev => prev.filter(tag => tag !== color));
    }
  };
  
  const handlePriceChange = (type: "min" | "max", value: string) => {
    if (type === "min") setMinPrice(value);
    else setMaxPrice(value);
  };
  
  const handlePriceFilter = () => {
    // Add price range to filter tags
    const priceTag = `৳${minPrice} - ৳${maxPrice}`;
    // Remove any existing price tags
    const filteredTags = filterTags.filter(tag => !tag.includes('৳'));
    setFilterTags([...filteredTags, priceTag]);
  };
  
  const handleClearAll = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedColors([]);
    setMinPrice(priceRange.min.toString());
    setMaxPrice(priceRange.max.toString());
    setFilterTags([]);
  };
  
  const handleRemoveTag = (tag: string) => {
    setFilterTags((prev) => prev.filter((t) => t !== tag));
    
    // Also remove from respective filters
    if (tag.includes('৳')) {
      setMinPrice(priceRange.min.toString());
      setMaxPrice(priceRange.max.toString());
    } else if (brands.some(b => b.name === tag)) {
      setSelectedBrands(prev => prev.filter(b => b !== tag));
    } else if (categories.some(c => c.name === tag)) {
      setSelectedCategories(prev => prev.filter(c => c !== tag));
    } else if (colors.some(c => c.name === tag)) {
      setSelectedColors(prev => prev.filter(c => c !== tag));
    }
  };
  
  const handleProductClick = (id: number, slug?: string) => {
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${id}`);
    }
  };

  // Filter products based on selected filters
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      // Filter by categories
      if (selectedCategories.length > 0) {
        const categoryName = typeof product.category === 'object' 
          ? product.category.name 
          : '';
        if (!selectedCategories.includes(categoryName)) {
          return false;
        }
      }

      // Filter by brands
      if (selectedBrands.length > 0) {
        const brandName = typeof product.brand === 'object' 
          ? product.brand.name 
          : '';
        if (!selectedBrands.includes(brandName)) {
          return false;
        }
      }

      // Filter by price range
      const price = product.sale_price || product.price;
      if (
        (minPrice && price < parseFloat(minPrice)) ||
        (maxPrice && price > parseFloat(maxPrice))
      ) {
        return false;
      }

      // Filter by colors
      if (selectedColors.length > 0 && product.specifications && product.specifications.color) {
        const productColor = product.specifications.color;
        if (!selectedColors.includes(productColor)) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategories, selectedBrands, selectedColors, minPrice, maxPrice]);

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

  return (
    <div className="flex flex-col w-full bg-white-100 min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      <main className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 md:mt-10 mb-10 sm:mb-16 md:mb-20">
        {/* Breadcrumb and Title */}
        <div className="pt-4 sm:pt-6 md:pt-8 pb-2 px-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="text-gray-700">Home</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Special Offers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900">
            Special Offers
          </h1>
        </div>

        {/* Main Content with Filters and Products */}
        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Filters - Desktop */}
          <div className="hidden md:block w-[272px] flex-shrink-0">
            <div className="space-y-6">
              {/* Filter Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="link"
                  className="text-gray-500 text-sm py-0 px-0 h-auto"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
              </div>
              
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
                        {category.count}
                      </span>
                    </div>
                  ))}
                  {categories.length === 0 && !loading && (
                    <div className="text-gray-500 text-sm">No categories available</div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Brands */}
              <div>
                <h3 className="text-base font-medium mb-3">Brands</h3>
                <div className="space-y-3">
                  {brands.slice(0, showAllBrands ? brands.length : 5).map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => handleBrandToggle(brand.name)}
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
                      <span className="text-xs text-gray-500">
                        {brand.count}
                      </span>
                    </div>
                  ))}
                  
                  {brands.length === 0 && !loading && (
                    <div className="text-gray-500 text-sm">No brands available</div>
                  )}
                  
                  {brands.length > 5 && (
                    <Button
                      variant="link"
                      className="text-blue-700 py-0 px-0 h-auto"
                      onClick={() => setShowAllBrands(!showAllBrands)}
                    >
                      {showAllBrands ? "Show less" : "Show all"}
                    </Button>
                  )}
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
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handlePriceFilter}
                >
                  Apply
                </Button>
              </div>
              
              <Separator />
              
              {/* Colors */}
              <div>
                <h3 className="text-base font-medium mb-3">Colors</h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <div
                      key={color.name}
                      className={`w-8 h-8 rounded-full cursor-pointer ${
                        selectedColors.includes(color.name)
                          ? "ring-2 ring-offset-2 ring-blue-700"
                          : ""
                      }`}
                      style={{
                        background: color.color,
                        border: color.color === "transparent" ? "1px solid #d1d5db" : "none",
                      }}
                      onClick={() => handleColorClick(color.name)}
                      title={`${color.name} (${color.count})`}
                    ></div>
                  ))}
                  
                  {colors.length === 0 && !loading && (
                    <div className="text-gray-500 text-sm">No color options available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filters Button */}
          <div className="md:hidden">
            <Button
              ref={filterButtonRef}
              className="flex items-center gap-2 w-full"
              onClick={toggleMobileFilters}
            >
              <FilterIcon className="w-4 h-4" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Mobile Filters Dropdown */}
          {mobileFiltersVisible && (
            <div
              ref={filtersRef}
              className="fixed inset-0 z-50 bg-white overflow-auto md:hidden p-4"
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
              
              {/* Mobile filter content - simplified for brevity */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  className="w-[48%]"
                  onClick={handleClearAll}
                >
                  Clear all
                </Button>
                <Button
                  className="w-[48%]"
                  onClick={toggleMobileFilters}
                >
                  Apply filters
                </Button>
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="flex-1">
            {/* Active Filter Tags & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex flex-wrap gap-2">
                {filterTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="py-1.5 px-3 rounded-full bg-gray-100 border-gray-200 gap-1.5"
                  >
                    <span>{tag}</span>
                    <XIcon
                      className="h-3.5 w-3.5 cursor-pointer text-gray-500 hover:text-gray-700"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <Select
                  options={sortOptions.map(option => ({ value: option.value, label: option.label }))}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="min-w-[200px]"
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">{error}</div>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No special offers found</h3>
                <p className="text-gray-500 mb-4">Check back later for exciting special offers</p>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="relative overflow-hidden">
                      <img
                        className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        onClick={() => handleProductClick(product.id, product.slug)}
                      />
                      {product.discount_percentage && product.discount_percentage > 0 && (
                        <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0">
                          -{product.discount_percentage}%
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div 
                        className="text-sm text-gray-500 mb-1 cursor-pointer hover:text-blue-700"
                        onClick={() => handleCategoryClick(typeof product.category === 'object' ? product.category.name : String(product.category))}
                      >
                        {typeof product.category === 'object' ? product.category.name : product.category}
                      </div>
                      <h3 
                        className="text-base font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-700"
                        onClick={() => handleProductClick(product.id, product.slug)}
                      >
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center mr-2">
                          {renderStars(product.average_rating || 0)}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({product.total_reviews || 0})
                        </span>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="flex items-center justify-between">
                          <div>
                            {product.sale_price ? (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-lg font-medium text-gray-900">
                                  ৳{Number(product.sale_price).toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 line-through">
                                  ৳{Number(product.price).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-lg font-medium text-gray-900">
                                ৳{Number(product.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-full w-8 h-8 p-0 flex items-center justify-center hover:bg-blue-600 hover:text-white"
                            onClick={() => handleProductClick(product.id, product.slug)}
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State - No Filtered Products */}
            {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products match your filters</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filter criteria</p>
                <Button onClick={handleClearAll}>Clear Filters</Button>
              </div>
            )}

            {/* Pagination - Show only for filtered products */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.max(1, Math.ceil(filteredProducts.length / 9))}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <CtaFooterByAnima />
    </div>
  );
}; 