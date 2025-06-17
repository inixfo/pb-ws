import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
} from "lucide-react";
import React, { useEffect, useState, useRef } from 'react';
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { StarRating } from "../../../../components/ui/StarRating";
import { productService } from '../../../../services/api';
import { Product, ProductImage } from '../../../../types/products';
import { useNavigate } from 'react-router-dom';
import { useCart } from "../../../../context/CartContext";

// Helper function to get image URL from product
const getProductImageUrl = (product: Product): string => {
  if (typeof product.primary_image === 'string') {
    return product.primary_image;
  }
  if (product.primary_image && 'image' in product.primary_image) {
    return product.primary_image.image;
  }
  return product.image || '/placeholder.png';
};

export const TrendingProductsSection = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [maxPages, setMaxPages] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Define how many products to show per slide based on screen size
  const getItemsPerScreen = (): number => {
    // Using window.innerWidth directly since we need the current value
    if (typeof window === 'undefined') {
      return 4; // Default to desktop for SSR
    }
    
    // Browser environment
    if (window.innerWidth < 640) return 1; // mobile
    if (window.innerWidth < 1024) return 2; // tablet
    return 4; // desktop
  };

  const [itemsPerScreen, setItemsPerScreen] = useState(getItemsPerScreen());

  // Listen for window resize to update items per screen
  useEffect(() => {
    const handleResize = () => {
      setItemsPerScreen(getItemsPerScreen());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update max pages when products or items per screen changes
  useEffect(() => {
    const maxPages = Math.ceil(products.length / itemsPerScreen) - 1;
    setMaxPages(maxPages < 0 ? 0 : maxPages);
    // Reset to first page when items per screen changes
    setCurrentPage(0);
  }, [products.length, itemsPerScreen]);

  // Handle next and prev buttons
  const handleNext = () => {
    if (currentPage < maxPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle touch events for swiping on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSignificantSwipe = Math.abs(distance) > 50;
    
    if (isSignificantSwipe) {
      if (distance > 0 && currentPage < maxPages) {
        // Swipe left, go next
        handleNext();
      } else if (distance < 0 && currentPage > 0) {
        // Swipe right, go prev
        handlePrev();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const data = await productService.getTrending(8);
        const products = Array.isArray(data) ? data : data.results || [];
        setProducts(products);
        setError(null);
      } catch (err) {
        setError('Failed to load trending products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleProductClick = (productId: number, slug: string) => {
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${productId}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, productId: number, slug: string) => {
    e.stopPropagation();
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${productId}`);
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col w-full items-start gap-6">
        <div className="flex flex-col items-start gap-6 w-full">
          <h2 className="font-heading-desktop-h3 text-gray-900">Trending products</h2>
          <Separator className="w-full" />
        </div>
        <div className="w-full flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-primarymain border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col w-full items-start gap-6">
        <div className="flex flex-col items-start gap-6 w-full">
          <h2 className="font-heading-desktop-h3 text-gray-900">Trending products</h2>
          <Separator className="w-full" />
        </div>
        <div className="w-full flex justify-center py-8 text-red-500">{error}</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col w-full items-start gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <h2 className="font-heading-desktop-h3 font-medium text-gray-900 text-xl sm:text-2xl">
          Trending products
        </h2>
        
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white-100 border-[#e0e5eb] disabled:opacity-50"
            onClick={handlePrev}
            disabled={currentPage === 0}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white-100 border-[#e0e5eb] disabled:opacity-50"
            onClick={handleNext}
            disabled={currentPage === maxPages}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Separator className="w-full" />
      
      <div 
        className="relative w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          ref={sliderRef}
          className="flex transition-transform duration-300 ease-out"
          style={{ 
            transform: `translateX(-${currentPage * 100 / itemsPerScreen}%)`,
            width: `${products.length * 100 / itemsPerScreen}%`
          }}
        >
          {products.map((product) => (
            <div 
              key={product.id}
              className="px-2"
              style={{ width: `${100 / products.length * itemsPerScreen}%` }}
            >
              <Card
                className="h-full rounded-lg overflow-hidden bg-white-100 cursor-pointer border border-gray-100"
                onClick={() => handleProductClick(product.id, product.slug)}
              >
                <div className="flex flex-col items-center justify-center p-4 sm:p-6 relative">
                  <img
                    className="w-full h-32 sm:h-40 md:h-60 object-contain"
                    alt={product.name}
                    src={getProductImageUrl(product)}
                  />
                </div>
                <CardContent className="flex flex-col items-start gap-3 pt-0 pb-4 px-4 bg-white-100">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <StarRating
                      rating={product.average_rating || product.rating || 0}
                      showCount
                      count={product.total_reviews || product.reviews_count || 0}
                    />
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                      {product.name}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-base sm:text-lg">
                        ${product.sale_price || product.price}
                      </span>
                      {product.sale_price && product.sale_price < product.price && (
                        <span className="text-gray-400 text-xs sm:text-sm line-through">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg"
                      onClick={(e) => handleAddToCart(e, product.id, product.slug)}
                    >
                      <ShoppingCartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Mobile pagination dots */}
        <div className="flex sm:hidden justify-center mt-4 gap-2">
          {Array.from({ length: maxPages + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-2 h-2 rounded-full ${
                i === currentPage ? 'bg-primarymain' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}; 