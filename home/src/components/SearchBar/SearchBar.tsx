import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { searchService } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

type SearchSuggestion = {
  type: 'product' | 'category' | 'brand';
  name: string;
  slug?: string;
  id?: number;
  price?: number;
  image?: string;
  category?: string;
  brand?: string;
  url?: string;
};

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  isMobile?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search the products',
  className = '',
  onSearch,
  isMobile = false
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const debouncedSearchTerm = useDebounce(searchQuery, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch autocomplete suggestions when the debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm]);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const data = await searchService.getAutocompleteSuggestions(debouncedSearchTerm);
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.warn('Autocomplete service unavailable:', error);
      // For now, just show empty suggestions when autocomplete fails
      // Could implement a fallback here later
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        // Navigate to the search results page
        const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
        
        // If we're already on the search page, just update the URL
        if (location.pathname === '/search') {
          window.history.pushState(null, '', searchUrl);
          // Dispatch a custom event to notify the SearchResults component
          window.dispatchEvent(new CustomEvent('searchQueryUpdate', { 
            detail: { query: searchQuery.trim() } 
          }));
        } else {
          navigate(searchUrl);
        }
      }
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    
    if (suggestion.url) {
      navigate(suggestion.url);
    } else if (suggestion.type === 'product') {
      navigate(`/product/${suggestion.slug || suggestion.id}`);
    } else if (suggestion.type === 'category') {
      navigate(`/catalog/${suggestion.slug || suggestion.id}`);
    } else if (suggestion.type === 'brand') {
      navigate(`/catalog?brand=${suggestion.slug || suggestion.id}`);
    }
  };

  return (
    <div ref={searchContainerRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="flex items-center gap-2.5 px-4 py-3 rounded-[100px] border border-solid border-white w-full">
        <SearchIcon className="w-[18px] h-[18px] text-gray-500" />
        <input
          className="flex-1 border-none bg-transparent text-gray-500 font-body-regular placeholder:text-gray-500 focus:outline-none p-0"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        <button type="submit" className="sr-only">Search</button>
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 max-h-96 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.type}-${suggestion.id || suggestion.slug}-${index}`}
                className="hover:bg-gray-50 cursor-pointer text-gray-800 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.type === 'product' ? (
                  <div className="flex items-center p-3 space-x-3">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                      {suggestion.image ? (
                        <img
                          src={suggestion.image.startsWith('http') ? suggestion.image : 
                               suggestion.image.startsWith('/media/') ? `https://phonebay.xyz${suggestion.image}` : 
                               suggestion.image}
                          alt={suggestion.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.name}
                      </div>
                      {suggestion.brand && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.brand}
                        </div>
                      )}
                    </div>
                    
                    {/* Price */}
                    {suggestion.price && (
                      <div className="flex-shrink-0">
                        <div className="text-sm font-semibold text-red-600">
                          ৳{suggestion.price.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-2">
                    <div className="flex items-center">
                      {suggestion.type === 'category' && (
                        <span className="w-4 h-4 mr-2 text-xs text-gray-500">📁</span>
                      )}
                      {suggestion.type === 'brand' && (
                        <span className="w-4 h-4 mr-2 text-xs text-gray-500">®</span>
                      )}
                      <span>
                        {suggestion.name}
                        <span className="text-gray-400 text-xs ml-2">
                          {suggestion.type === 'category' ? 'Category' : 'Brand'}
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-4 top-3">
          <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 