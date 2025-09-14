import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SearchIcon, FilterIcon, GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { searchService, productService } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { HeaderByAnima } from '../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima';
import { CtaFooterByAnima } from '../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima';

interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  base_price: number;
  images: Array<{ image: string; alt_text?: string }>;
  category: { id: number; name: string; slug: string };
  brand?: { id: number; name: string; slug: string };
  rating?: number;
  reviews_count?: number;
  is_available: boolean;
  specifications?: Record<string, any>;
}

interface SearchData {
  results: Product[];
  count: number;
  did_you_mean?: string;
  suggestions?: string[];
  search_id?: number | null;
  fallback_used?: boolean;
  error?: string;
}

const CURRENCY_SYMBOL = '৳';

export const SearchResults = (): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';

  console.log('[SearchResults] 🔍 URL location:', location.pathname, location.search);
  console.log('[SearchResults] 🔍 queryParams:', queryParams.toString());
  console.log('[SearchResults] 🔍 initialQuery:', initialQuery);

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Perform search with fallback to regular product API
  const performSearch = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[SearchResults] Performing search for: "${query}", page: ${page}`);
      
      // TEMPORARY: Skip advanced search, go directly to working API
      console.log('[SearchResults] 🚀 BYPASSING advanced search, calling working API directly');
      let data;
      let usedFallback = true; // Always show fallback notice
      
      // Directly call the working products API
      try {
        console.log('[SearchResults] 🔄 Calling working products API directly...');
        console.log('[SearchResults] 📋 Direct API params:', {
          search: query,
          page,
          page_size: pageSize,
          ordering: sortBy === 'price_low' ? 'base_price' : 
                   sortBy === 'price_high' ? '-base_price' :
                   sortBy === 'newest' ? '-created_at' : 
                   undefined
        });
        
        const directData = await productService.getAll({
          search: query,
          page,
          page_size: pageSize,
          ordering: sortBy === 'price_low' ? 'base_price' : 
                   sortBy === 'price_high' ? '-base_price' :
                   sortBy === 'newest' ? '-created_at' : 
                   undefined
        });
        
        console.log('[SearchResults] 📦 Direct API data received:', directData);
        console.log('[SearchResults] 📊 Direct API count:', directData?.count);
        console.log('[SearchResults] 📊 Direct API results length:', directData?.results?.length);
        
        // Transform to expected format
        data = {
          results: directData?.results || [],
          count: directData?.count || 0,
          did_you_mean: null,
          suggestions: [],
          search_id: null,
          fallback_used: true
        };
        
        console.log('[SearchResults] ✅ Direct API transformation complete:', {
          count: data.count,
          resultsLength: data.results.length,
          firstResult: data.results[0]?.name
        });
        
      } catch (directError: any) {
        console.error('[SearchResults] ❌ Direct API call failed');
        console.error('[SearchResults] 📋 Direct API error details:', {
          message: directError?.message,
          status: directError?.status || 'unknown',
          name: directError?.name || 'Unknown Error',
          fullError: directError
        });
        
        // Set empty results for now - this shouldn't happen if API is working
        console.log('[SearchResults] 🔧 Setting empty results due to direct API failure');
        data = {
          results: [],
          count: 0,
          did_you_mean: null,
          suggestions: [],
          search_id: null,
          fallback_used: true,
          error: 'Search service temporarily unavailable'
        };
      }
      
      // Add indicator if fallback was used
      if (usedFallback && data) {
        console.log('[SearchResults] 🔄 Using fallback results - Advanced search unavailable');
      }

      console.log('[SearchResults] 🎯 About to set search results:', data);
      console.log('[SearchResults] 🎯 Data has results?', data && data.results && data.results.length > 0);
      console.log('[SearchResults] 🎯 Results length:', data?.results?.length);
      setSearchResults(data);

      // Update URL with search query
      const newUrl = `/search?q=${encodeURIComponent(query)}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.replaceState(null, '', newUrl);
      }

    } catch (err) {
      console.error('[SearchResults] All search methods failed:', err);
      setError('Failed to perform search. Please try again.');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Effect to search when query changes
  useEffect(() => {
    console.log('[SearchResults] 🔄 useEffect triggered with debouncedQuery:', debouncedQuery);
    console.log('[SearchResults] 🔄 searchQuery state:', searchQuery);
    console.log('[SearchResults] 🔄 sortBy state:', sortBy);
    
    if (debouncedQuery) {
      console.log('[SearchResults] ✅ debouncedQuery exists, calling performSearch');
      setCurrentPage(1);
      performSearch(debouncedQuery, 1);
    } else {
      console.log('[SearchResults] ❌ No debouncedQuery, setting null results');
      setSearchResults(null);
    }
  }, [debouncedQuery, sortBy]);

  // Listen for search query updates from SearchBar when on the same page
  useEffect(() => {
    const handleSearchUpdate = (event: CustomEvent) => {
      const newQuery = event.detail?.query;
      if (newQuery && newQuery !== searchQuery) {
        setSearchQuery(newQuery);
        setCurrentPage(1);
      }
    };

    window.addEventListener('searchQueryUpdate', handleSearchUpdate as EventListener);
    return () => {
      window.removeEventListener('searchQueryUpdate', handleSearchUpdate as EventListener);
    };
  }, [searchQuery]);

  // Handle URL changes (back/forward navigation or direct URL entry)
  useEffect(() => {
    const handlePopState = () => {
      const queryParams = new URLSearchParams(window.location.search);
      const urlQuery = queryParams.get('q') || '';
      if (urlQuery !== searchQuery) {
        setSearchQuery(urlQuery);
        setCurrentPage(1);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [searchQuery]);

  // Effect to handle page changes
  useEffect(() => {
    if (debouncedQuery && currentPage > 1) {
      performSearch(debouncedQuery, currentPage);
    }
  }, [currentPage]);

  // Handle "did you mean" suggestion
  const handleDidYouMeanClick = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  // Handle product click for analytics
  const handleProductClick = (product: Product) => {
    if (searchResults?.search_id) {
      searchService.recordSearchClick(searchResults.search_id, product.id);
    }
    navigate(`/product/${product.slug || product.id}`);
  };

  // Calculate pagination
  const totalPages = searchResults ? Math.ceil(searchResults.count / pageSize) : 0;
  const startResult = ((currentPage - 1) * pageSize) + 1;
  const endResult = Math.min(currentPage * pageSize, searchResults?.count || 0);

  return (
    <div className="flex flex-col w-full bg-white-100 min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      <main className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => performSearch(searchQuery, 1)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              )}
            </div>

            {/* Search Info */}
            {searchResults && (
              <div className="flex items-center justify-between">
                <div className="text-gray-600">
                  Showing {startResult}-{endResult} of {searchResults.count} results for 
                  <span className="font-semibold text-gray-900"> "{debouncedQuery}"</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
                    >
                      <GridIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => performSearch(searchQuery, currentPage)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Query State */}
        {!searchQuery && !loading && (
          <div className="text-center py-16">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Start your search</h2>
            <p className="text-gray-500">Enter a product name, brand, or category to get started</p>
          </div>
        )}

        {/* Fallback Notice */}
        {searchResults?.fallback_used && !searchResults?.error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <span className="font-semibold">Note:</span> Using basic search (advanced search temporarily unavailable)
            </p>
          </div>
        )}

        {/* Error Notice */}
        {searchResults?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              <span className="font-semibold">Error:</span> {searchResults.error}. Please try again later.
            </p>
          </div>
        )}

        {/* Did You Mean */}
        {searchResults?.did_you_mean && searchResults.results.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              Did you mean{' '}
              <button
                onClick={() => handleDidYouMeanClick(searchResults.did_you_mean!)}
                className="font-semibold text-blue-600 hover:underline"
              >
                "{searchResults.did_you_mean}"
              </button>
              ?
            </p>
          </div>
        )}

        {/* No Results */}
        {searchResults && searchResults.results.length === 0 && !searchResults.did_you_mean && (
          <div className="text-center py-16">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">No products found</h2>
            <p className="text-gray-500 mb-4">
              We couldn't find any products matching "{debouncedQuery}"
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Check your spelling</p>
              <p>• Try different keywords</p>
              <p>• Use more general terms</p>
            </div>
          </div>
        )}


        {/* Results Grid/List */}
        {searchResults && searchResults.results.length > 0 && (
          <>
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {searchResults.results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`
                    bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all cursor-pointer
                    ${viewMode === 'list' ? 'flex items-center p-4 space-x-4' : 'p-4'}
                  `}
                >
                  {/* Product Image */}
                  <div className={viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square mb-3'}>
                    <img
                      src={product.images?.[0]?.image || '/placeholder-image.jpg'}
                      alt={product.images?.[0]?.alt_text || product.name}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>

                  {/* Product Info */}
                  <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                    {/* Category & Brand */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span>{product.category?.name}</span>
                      {product.brand && (
                        <>
                          <span>•</span>
                          <span>{product.brand.name}</span>
                        </>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className={`font-semibold text-gray-900 mb-2 ${
                      viewMode === 'list' ? 'text-lg' : 'text-sm'
                    } line-clamp-2`}>
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        {CURRENCY_SYMBOL}{product.price.toLocaleString()}
                      </span>
                      {product.base_price !== product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {CURRENCY_SYMBOL}{product.base_price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    {product.rating && (
                      <div className="flex items-center gap-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= Math.floor(product.rating!)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({product.reviews_count || 0})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border border-gray-300 rounded-lg ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </main>
      <CtaFooterByAnima />
    </div>
  );
};

export default SearchResults;