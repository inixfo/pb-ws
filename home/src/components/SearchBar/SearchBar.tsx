import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { searchService } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

type SearchSuggestion = {
  type: 'product' | 'category' | 'brand';
  name: string;
  slug: string;
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
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
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
        navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    
    if (suggestion.type === 'product') {
      navigate(`/product/${suggestion.slug}`);
    } else if (suggestion.type === 'category') {
      navigate(`/catalog/${suggestion.slug}`);
    } else if (suggestion.type === 'brand') {
      navigate(`/catalog?brand=${suggestion.slug}`);
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
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <ul className="divide-y divide-gray-100">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.type}-${suggestion.slug}-${index}`}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-800"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center">
                  {suggestion.type === 'product' && (
                    <SearchIcon className="w-4 h-4 mr-2 text-gray-400" />
                  )}
                  {suggestion.type === 'category' && (
                    <span className="w-4 h-4 mr-2 text-xs text-gray-500">📁</span>
                  )}
                  {suggestion.type === 'brand' && (
                    <span className="w-4 h-4 mr-2 text-xs text-gray-500">®</span>
                  )}
                  <span>
                    {suggestion.name}
                    <span className="text-gray-400 text-xs ml-2">
                      {suggestion.type === 'product' ? 'Product' : 
                       suggestion.type === 'category' ? 'Category' : 'Brand'}
                    </span>
                  </span>
                </div>
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