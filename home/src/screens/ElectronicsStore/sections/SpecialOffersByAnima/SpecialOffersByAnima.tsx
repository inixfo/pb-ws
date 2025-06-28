import { ChevronRightIcon, StarIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { productService } from "../../../../services/api";
import { Product } from "../../../../types/products";
import { getProductImageUrl } from "../../../../utils/imageUtils";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { StarRating } from "../../../../components/ui/StarRating";

export const SpecialOffersByAnima = (): JSX.Element => {
  // State for special offers
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Fetch special offers on component mount
  useEffect(() => {
    const fetchSpecialOffers = async () => {
      try {
        setLoading(true);
        console.log("Fetching special offers (SpecialOffersByAnima)...");
        const data = await productService.getSpecialOffers(2);
        
        // Debug log the full response
        console.log('Raw special offers response:', data);
        
        // Check response structure - handle both array and paginated responses
        let products: Product[];
        
        if (Array.isArray(data)) {
          products = data;
          console.log(`Received array with ${products.length} special offer products`);
        } else if (data && data.results && Array.isArray(data.results)) {
          products = data.results;
          console.log(`Received paginated response with ${products.length} special offer products (total: ${data.count})`);
        } else {
          console.warn('Unexpected data structure from special offers API:', data);
          products = [];
        }
        
        if (products.length > 0) {
          // Log details of each product for debugging
          products.forEach((product, index) => {
            console.log(`Special offer #${index + 1}: ID=${product.id}, Name=${product.name}`);
          });
          
          // Sort products by ID in descending order (newest first)
          const sortedProducts = [...products].sort((a, b) => b.id - a.id);
          setProducts(sortedProducts);
        } else {
          // Use fallback data if API returns empty
          console.warn('No special offers returned from API, using fallback data');
          setProducts([]);
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
  }, []);

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <StarIcon
          key={index}
          className={`w-3 h-3 ${index < Math.round(rating) ? "fill-current text-yellow-500" : "text-gray-300"}`}
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

  // When there's no data, do not use fallback in production
  const displayProducts = products;

  // Fallback rendering for loading state
  if (loading) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <header className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading-desktop-h3 text-gray-900 text-[length:var(--heading-desktop-h3-font-size)] leading-[var(--heading-desktop-h3-line-height)] tracking-[var(--heading-desktop-h3-letter-spacing)]">
              Special offers
            </h2>
            <Button
              variant="ghost"
              className="flex items-center gap-1.5 py-2.5 px-0"
            >
              <span className="font-navigation-nav-link-small text-gray-800 text-[length:var(--navigation-nav-link-small-font-size)] tracking-[var(--navigation-nav-link-small-letter-spacing)] leading-[var(--navigation-nav-link-small-line-height)]">
                View all
              </span>
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
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
            <h2 className="font-heading-desktop-h3 text-gray-900">Special offers</h2>
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
            <h2 className="font-heading-desktop-h3 text-gray-900">Special offers</h2>
          </div>
          <Separator className="w-full" />
        </header>
        <div className="w-full flex justify-center py-8 text-gray-500">No special offers found.</div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 w-full">
      <header className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading-desktop-h3 text-gray-900 text-[length:var(--heading-desktop-h3-font-size)] leading-[var(--heading-desktop-h3-line-height)] tracking-[var(--heading-desktop-h3-letter-spacing)]">
            Special offers
          </h2>

          <Link to="/special-offers">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {displayProducts.map((product) => (
          <Card 
            key={product.id} 
            className="rounded-lg overflow-hidden h-full cursor-pointer"
            onClick={() => handleProductClick(product.id, product.slug)}
          >
            <div className="flex flex-col md:flex-row w-full h-full">
              <div className="md:w-1/2 bg-white-100 flex items-center justify-center py-4 px-4 sm:py-6 sm:px-8">
                <div className="relative aspect-square w-full max-w-[160px] sm:max-w-[200px] md:max-w-[240px] overflow-hidden">
                  <img
                    src={getProductImageUrl(product, 'medium')}
                    alt={product.name}
                    className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-105 sm:p-3"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="md:w-1/2 p-4 md:p-6 flex flex-col justify-between bg-white-100">
                <div className="flex flex-col gap-2 md:gap-3">
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={product.average_rating ?? product.rating ?? 0}
                      showCount
                      count={product.reviews_count}
                      size="sm"
                    />
                    {product.sale_price && product.sale_price < product.price && (
                      <span className="ml-auto bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        -{calculateDiscountPercentage(product.price, product.sale_price)}%
                      </span>
                    )}
                  </div>
                  <h3 className="text-base md:text-lg font-medium text-gray-900 leading-tight">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl font-semibold text-gray-900">
                      {formatPrice(product.sale_price || product.price)}
                    </span>
                    {product.sale_price && product.sale_price < product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 h-1 bg-gray-100 rounded-[100px]">
                          <div
                            className="h-1 bg-primarymain rounded-[100px]"
                            style={{ width: `${product.discount_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 w-full">
                        <span className="font-normal text-gray-500 text-xs sm:text-sm">
                          Discount:
                        </span>
                        <span className="font-navigation-nav-link-small text-gray-900 text-xs sm:text-[14px] leading-[20px]">
                          {product.discount_percentage || calculateDiscountPercentage(product.price, product.sale_price || product.price)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-6">
                  <Button 
                    className="w-full bg-primarymain hover:bg-primarymain/90 text-white-100"
                    onClick={(e) => handleAddToCart(e, product.id, product.slug)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
