import { ChevronRightIcon, ShoppingCartIcon, StarIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { productService } from "../../../../services/api";
import { Product } from "../../../../types/products";
import { getProductImageUrl } from "../../../../utils/imageUtils";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";

export const TrendingProductsByAnima = (): JSX.Element => {
  // State for trending products
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Fetch trending products on component mount
  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getTrending(8);
        const products = Array.isArray(data) ? data : data.results || [];
        if (products.length > 0) {
          setProducts(products);
          // Log the first product to debug image structure
          if (products[0]) {
            console.log('First product data:', products[0]);
            console.log('Image URL using utility:', getProductImageUrl(products[0]));
          }
        } else {
          // Use fallback data if API returns empty
          console.warn('No trending products returned from API, using fallback data');
          setProducts([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching trending products:', err);
        setError('Failed to load trending products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <StarIcon
          key={index}
          className={`w-3 h-3 ${
            index < Math.round(rating) ? "fill-current text-yellow-500" : "text-gray-300"
          }`}
        />
      ));
  };

  // Function to format price
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '৳0.00' : `৳${numPrice.toFixed(2)}`;
  };

  // Function to calculate discount percentage
  const calculateDiscountPercentage = (price: number | string, salePrice: number | string): number => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const numSalePrice = typeof salePrice === 'string' ? parseFloat(salePrice) : salePrice;
    
    if (isNaN(numPrice) || isNaN(numSalePrice) || numPrice <= 0) return 0;
    return Math.round(((numPrice - numSalePrice) / numPrice) * 100);
  };

  // Function to handle product click
  const handleProductClick = (productId: number, slug: string) => {
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${productId}`);
    }
  };

  // Function to handle add to cart
  const handleAddToCart = (e: React.MouseEvent, productId: number, slug: string) => {
    e.stopPropagation(); // Prevent navigation when clicking the cart button
    // Navigate to product page instead of directly adding to cart
    if (slug && slug.trim() !== '') {
      navigate(`/products/${slug}`);
    } else {
      navigate(`/products/${productId}`);
    }
  };

  // Fallback rendering for loading state
  if (loading) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <header className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading-desktop-h3 text-gray-900">Trending Products</h2>
          </div>
          <Separator className="w-full" />
        </header>
        <div className="w-full flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-primarymain border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <header className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading-desktop-h3 text-gray-900">Trending Products</h2>
          </div>
          <Separator className="w-full" />
        </header>
        <div className="w-full flex justify-center py-8 text-red-500">{error}</div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <header className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading-desktop-h3 text-gray-900">Trending Products</h2>
          </div>
          <Separator className="w-full" />
        </header>
        <div className="w-full flex justify-center py-8 text-gray-500">No trending products found.</div>
      </section>
    );
  }

  // When there's no data, do not use fallback in production
  const displayProducts = products;

  return (
    <section className="flex flex-col gap-6 w-full">
      <header className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading-desktop-h3 text-gray-900 text-[length:var(--heading-desktop-h3-font-size)] leading-[var(--heading-desktop-h3-line-height)] tracking-[var(--heading-desktop-h3-letter-spacing)]">
            Trending products
          </h2>

          <Link to="/trending">
            <Button
              variant="ghost"
              className="flex items-center gap-1.5 py-2.5 px-0"
            >
              <span className="font-navigation-nav-link-small text-gray-800 text-[length:var(--navigation-nav-link-small-font-size)] tracking-[var(--navigation-nav-link-small-letter-spacing)] leading-[var(--navigation-nav-link-small-line-height)]">
                View all
              </span>
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <Separator className="w-full" />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {displayProducts.map((product) => (
          <Card 
            key={product.id} 
            className="rounded-lg overflow-hidden cursor-pointer"
            onClick={() => handleProductClick(product.id, product.slug)}
          >
            <div className="relative flex items-center justify-center p-3 sm:p-6 bg-white-100">
              {product.is_new && (
                <Badge
                  className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-infomain text-white-100 text-xs sm:text-sm"
                >
                  New
                </Badge>
              )}
              {product.sale_price && product.sale_price < product.price && (
                <Badge
                  className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-dangermain text-white-100 text-xs sm:text-sm"
                >
                  -{calculateDiscountPercentage(product.price, product.sale_price)}%
                </Badge>
              )}
              <img
                src={getProductImageUrl(product)}
                alt={product.name}
                className="w-full h-[100px] sm:w-[258px] sm:h-60 object-contain"
              />
            </div>
            <CardContent className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-4 bg-white-100">
              <div className="flex flex-col gap-1 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex gap-0.5 sm:gap-1">
                    {renderStars(product.average_rating ?? product.rating ?? 0)}
                  </div>
                  <span className="text-gray-400 text-[10px] sm:text-xs font-body-extra-small sm:text-[length:var(--body-extra-small-font-size)] tracking-[var(--body-extra-small-letter-spacing)] leading-[var(--body-extra-small-line-height)]">
                    ({product.reviews_count})
                  </span>
                </div>
                <h3 className="font-navigation-nav-link-small text-gray-900 text-xs sm:text-[length:var(--navigation-nav-link-small-font-size)] leading-tight sm:leading-[var(--navigation-nav-link-small-line-height)] tracking-[var(--navigation-nav-link-small-letter-spacing)] line-clamp-2">
                  {product.name}
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-heading-desktop-h5 text-gray-900 text-sm sm:text-[length:var(--heading-desktop-h5-font-size)] tracking-[var(--heading-desktop-h5-letter-spacing)] leading-[var(--heading-desktop-h5-line-height)]">
                    {formatPrice(product.sale_price || product.price)}
                  </span>
                  {product.sale_price && product.sale_price < product.price && (
                    <span className="font-normal text-gray-400 text-xs sm:text-sm line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 sm:w-10 sm:h-10 p-2 sm:p-3 bg-gray-100 rounded-lg"
                  onClick={(e) => handleAddToCart(e, product.id, product.slug)}
                  aria-label="Add to cart"
                >
                  <ShoppingCartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
