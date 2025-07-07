import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Search Results page
 * 
 * This is a simple component that extracts the search query from the URL
 * and redirects to the ShopCatalog page with the search parameter
 */
export const SearchResults = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Extract search query from URL
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q');
    
    if (query) {
      // Redirect to catalog page with search query
      navigate(`/catalog?search=${encodeURIComponent(query)}`);
    } else {
      // No query found, redirect to catalog page
      navigate('/catalog');
    }
  }, [location.search, navigate]);
  
  // This component doesn't render anything as it immediately redirects
  return null;
}; 