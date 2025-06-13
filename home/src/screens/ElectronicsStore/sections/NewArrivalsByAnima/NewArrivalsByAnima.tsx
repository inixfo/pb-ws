import { ArrowRightIcon, StarIcon, ShoppingCartIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { productService, promotionsService } from "../../../../services/api";
import { Product, ProductListResponse } from "../../../../types/products";
import { Separator } from "../../../../components/ui/separator";
import { getProductImageUrl } from "../../../../utils/imageUtils";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../../context/CartContext";
import { StarRating } from "../../../../components/ui/StarRating";

// Interface for the banner data
interface NewArrivalsBanner {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  bg_image: string | null;
  price_text: string;
  button_link: string;
  is_active: boolean;
}

export const NewArrivalsByAnima = (): JSX.Element => {
  // State for new arrivals
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  // Featured product state
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  
  // Banner data state
  const [bannerData, setBannerData] = useState<NewArrivalsBanner | null>(null);
  const [bannerLoading, setBannerLoading] = useState<boolean>(true);

  // Fetch new arrivals on component mount
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        const data = await productService.getNewArrivals(10);
        const products = Array.isArray(data) ? data : data.results || [];
        if (products.length > 0) {
          setProducts(products);
          
          // Find a featured product (MacBook)
          const macBook = products.find(
            (product: Product) => 
              product.name.toLowerCase().includes('macbook') && 
              getProductImageUrl(product)
          );
          if (macBook) {
            setFeaturedProduct(macBook);
            console.log('Found featured MacBook:', macBook);
            console.log('MacBook image URL:', getProductImageUrl(macBook));
          }
        } else {
          // Use fallback data if API returns empty
          console.warn('No products returned from API, using fallback data');
          setProducts([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching new arrivals:', err);
        setError('Failed to load new arrivals');
        // Use fallback data on error
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchBannerData = async () => {
      try {
        setBannerLoading(true);
        const data = await promotionsService.getNewArrivalsBanner();
        if (data) {
          setBannerData(data);
          console.log('Fetched new arrivals banner:', data);
        }
      } catch (err) {
        console.error('Error fetching new arrivals banner:', err);
        setBannerData(null);
      } finally {
        setBannerLoading(false);
      }
    };

    fetchNewArrivals();
    fetchBannerData();
  }, []);

  // Function to render star ratings
  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <StarIcon
          key={index}
          className={`w-3 h-3 ${index < Math.round(rating) ? "fill-current text-primarymain" : "text-gray-300"}`}
        />
      ));
  };

  // Function to format price
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '৳0.00' : `৳${numPrice.toFixed(2)}`;
  };

  // Function to calculate discount percentage
  const calculateDiscount = (price: number | string, salePrice: number | string | null): string | null => {
    if (!salePrice) return null;
    
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const numSalePrice = typeof salePrice === 'string' ? parseFloat(salePrice) : salePrice;
    
    if (isNaN(numPrice) || isNaN(numSalePrice) || numSalePrice >= numPrice) return null;
    return `৳${numPrice.toFixed(2)}`;
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

  // Function to render product cards
  const renderProductCard = (product: Product) => (
    <Card 
      className="flex items-center gap-4 w-full bg-white-100 rounded-lg border-0 shadow-none cursor-pointer"
      onClick={() => handleProductClick(product.id, product.slug)}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-4 w-full">
          <div
            className="w-[80px] h-[80px] sm:w-[110px] sm:h-[110px] rounded"
            style={{
              backgroundImage: `url(${getProductImageUrl(product)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="flex flex-col items-start gap-1 sm:gap-2 flex-1">
            <div className="flex items-center gap-2 w-full">
              <StarRating
                rating={product.average_rating ?? product.rating ?? 0}
                showCount
                count={product.reviews_count}
                size="sm"
              />
            </div>
            <div className="w-full font-medium text-xs sm:text-sm text-gray-900 line-clamp-2">
              {product.name}
            </div>
            <div className="flex h-5 sm:h-7 items-center gap-2 w-full">
              <div className="font-semibold text-base sm:text-lg text-gray-900 whitespace-nowrap">
                {formatPrice(product.sale_price || product.price)}
              </div>
              {product.sale_price && product.sale_price < product.price && (
                <div className="flex-1 font-normal text-xs sm:text-sm text-gray-400 line-through">
                  {formatPrice(product.price)}
                </div>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 sm:w-8 sm:h-8 p-1 sm:p-2 bg-gray-100 rounded-lg ml-auto"
                onClick={(e) => handleAddToCart(e, product.id, product.slug)}
                aria-label="Add to cart"
              >
                <ShoppingCartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Fallback rendering for loading and error states
  if (loading) {
    return (
      <section className="flex flex-col gap-6 w-full">
        <header className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading-desktop-h3 text-gray-900">New Arrivals</h2>
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
            <h2 className="font-heading-desktop-h3 text-gray-900">New Arrivals</h2>
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
            <h2 className="font-heading-desktop-h3 text-gray-900">New Arrivals</h2>
          </div>
          <Separator className="w-full" />
        </header>
        <div className="w-full flex justify-center py-8 text-gray-500">No new arrivals found.</div>
      </section>
    );
  }

  // When there's no data, do not use fallback in production
  const displayProducts = products;

  // Split products into two columns
  const middleColumnProducts = displayProducts.slice(0, 4);
  const rightColumnProducts = displayProducts.slice(4, 8);

  return (
    <section className="flex flex-col w-full items-start gap-6 sm:gap-8">
      <h2 className="w-full font-semibold text-xl sm:text-2xl md:text-[28px] text-gray-900 leading-tight sm:leading-[36px]">
        New arrivals
      </h2>

      <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
        {/* Featured MacBook Card */}
        <Card 
          className="w-full lg:w-[380px] h-[300px] sm:h-[400px] md:h-[480px] bg-[#243042] rounded-2xl overflow-hidden border-0 cursor-pointer"
          onClick={() => featuredProduct && handleProductClick(featuredProduct.id, featuredProduct.slug)}
        >
          <CardContent className="p-0 h-full">
            <div className="relative h-full flex flex-col items-center justify-center bg-cover"
                 style={{ backgroundImage: bannerData && bannerData.bg_image ? `url(${bannerData.bg_image})` : 'url(/background.png)' }}>
              <div className="absolute w-[220px] sm:w-[280px] md:w-[320px] h-[230px] sm:h-[280px] md:h-[320px] top-[20px] sm:top-[30px] md:top-[30px] left-1/2 transform -translate-x-1/2">
                <div className="absolute top-[180px] sm:top-[220px] md:top-[240px] left-1/2 transform -translate-x-1/2 font-bold text-4xl sm:text-5xl md:text-6xl text-white-100 leading-tight sm:leading-tight md:leading-tight whitespace-nowrap text-center">
                  {bannerData ? bannerData.title : featuredProduct?.name.split(' ')[0] || "MacBook"}
                </div>
                <img
                  className="absolute w-[200px] sm:w-[240px] md:w-[280px] h-[210px] sm:h-[240px] md:h-[280px] top-0 left-1/2 transform -translate-x-1/2 object-contain"
                  alt={bannerData ? bannerData.title : featuredProduct?.name || "MacBook"}
                  src={bannerData ? bannerData.image : featuredProduct ? getProductImageUrl(featuredProduct) : "/image-1.png"}
                />
              </div>
              <div className="absolute top-[240px] sm:top-[320px] md:top-[360px] left-1/2 transform -translate-x-1/2 font-medium text-sm sm:text-base text-gray-300 whitespace-nowrap text-center">
                {bannerData ? bannerData.subtitle : "Be Pro Anywhere"}
              </div>
              <Button 
                className="absolute top-[270px] sm:top-[360px] md:top-[400px] left-1/2 transform -translate-x-1/2 bg-primarymain hover:bg-primarymain/90 text-white-100 rounded-md text-xs sm:text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  featuredProduct && handleAddToCart(e, featuredProduct.id, featuredProduct.slug);
                }}
              >
                <span>{bannerData ? bannerData.price_text : featuredProduct?.sale_price ? `From ৳${featuredProduct.sale_price}` : "From ৳1,199"}</span>
                <ArrowRightIcon className="ml-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Product Columns - Stack on mobile, side by side on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
        {/* Middle Column Products */}
          <div className="flex flex-col items-start gap-4">
          {middleColumnProducts.map((product) => (
            <div key={product.id} className="w-full">
              {renderProductCard(product)}
            </div>
          ))}
        </div>

        {/* Right Column Products */}
          <div className="flex flex-col items-start gap-4">
          {rightColumnProducts.map((product) => (
            <div key={product.id} className="w-full">
              {renderProductCard(product)}
            </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
};
