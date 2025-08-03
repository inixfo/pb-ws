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
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from "../../../../context/CartContext";
import { useProduct } from "../../../../contexts/ProductContext";
import "./TrendingProductsSection.css";

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
  const location = useLocation();
  const { addToCart, fetchProduct } = useProduct();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState(4);

  // Update visible products based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleProducts(1);
      } else if (width < 1024) {
        setVisibleProducts(2);
      } else {
        setVisibleProducts(4);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToNext = () => {
    if (currentIndex + visibleProducts < products.length) {
      setCurrentIndex(currentIndex + 1);
      scrollToIndex(currentIndex + 1);
    }
  };

  const scrollToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      scrollToIndex(currentIndex - 1);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.offsetWidth / visibleProducts;
      scrollContainerRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const data = await productService.getTrending(8);
        const products = Array.isArray(data) ? data : data.results || [];
        // Sort products by ID in descending order (newest first)
        const sortedProducts = [...products].sort((a, b) => b.id - a.id);
        setProducts(sortedProducts);
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
    const targetId = slug && slug.trim() !== '' ? slug : productId.toString();
    const targetPath = `/products/${targetId}`;
    
    // Check if we're already on the same product page
    const currentPath = location.pathname;
    
    if (currentPath === targetPath) {
      // If we're already on the same product page, force a complete refresh
      // This ensures the ProductContext re-fetches the data
      window.location.reload();
    } else {
      // Navigate to the new product page with a state parameter to force re-fetch
      navigate(targetPath, { 
        state: { 
          forceRefresh: true,
          timestamp: Date.now() 
        },
        replace: true 
      });
      
      // Force a small delay then reload to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, productId: number, slug: string) => {
    e.stopPropagation();
    const targetId = slug && slug.trim() !== '' ? slug : productId.toString();
    const targetPath = `/products/${targetId}`;
    
    // Check if we're already on the same product page
    const currentPath = location.pathname;
    
    if (currentPath === targetPath) {
      // If we're already on the same product page, force a complete refresh
      window.location.reload();
    } else {
      // Navigate to the new product page with a state parameter to force re-fetch
      navigate(targetPath, { 
        state: { 
          forceRefresh: true,
          timestamp: Date.now() 
        },
        replace: true 
      });
      
      // Force a small delay then reload to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 100);
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

  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex + visibleProducts < products.length;

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
            onClick={scrollToPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white-100 border-[#e0e5eb] disabled:opacity-50"
            onClick={scrollToNext}
            disabled={!canScrollNext}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Separator className="w-full" />
      
      <div className="w-full relative">
        {/* Mobile navigation buttons */}
        <div className="flex sm:hidden justify-between w-full absolute top-1/2 transform -translate-y-1/2 z-10 px-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white shadow-md border-[#e0e5eb] disabled:opacity-50 h-8 w-8"
            onClick={scrollToPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white shadow-md border-[#e0e5eb] disabled:opacity-50 h-8 w-8"
            onClick={scrollToNext}
            disabled={!canScrollNext}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Slider container */}
        <div 
          ref={scrollContainerRef}
          className="trending-products-slider flex overflow-x-auto gap-4 pb-4 snap-x"
        >
          {products.map((product) => (
            <div 
              key={product.id}
              className="trending-product-card flex-shrink-0 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2 snap-start"
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
                        ৳{product.sale_price || product.price}
                      </span>
                      {product.sale_price && product.sale_price < product.price && (
                        <span className="text-gray-400 text-xs sm:text-sm line-through">
                          ৳{product.price}
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
          {Array.from({ length: Math.ceil(products.length / visibleProducts) }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i * visibleProducts);
                scrollToIndex(i * visibleProducts);
              }}
              className={`w-2 h-2 rounded-full ${
                i === Math.floor(currentIndex / visibleProducts) ? 'bg-primarymain' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}; 
