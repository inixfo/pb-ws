import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Product } from '../../types/product';
import { wishlistService } from '../../services/wishlist';
import { getProductImageUrl } from '../../utils/imageUtils';
import { formatPrice } from '../../utils/formatters';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onWishlistUpdate?: () => void;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onWishlistUpdate, className = '' }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  const handleProductClick = () => {
    navigate(`/product/${product.slug}`);
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    try {
      setIsLoading(true);
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product.id);
      } else {
        await wishlistService.addToWishlist(product.id);
      }
      setIsWishlisted(!isWishlisted);
      onWishlistUpdate?.();
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Calculate discount percentage
  const discountPercentage = product.sale_price && product.price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0;

  // Get appropriate image URL based on screen size
  const imageUrl = getProductImageUrl(product, 'small');

  return (
    <div className={`group relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md ${className}`}>
      {/* Discount badge */}
      {discountPercentage > 0 && (
        <div className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
          {discountPercentage}% OFF
        </div>
      )}
      
      {/* Product link */}
      <Link to={`/product/${product.slug}`}>
        {/* Image container with fixed height */}
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-4"
            loading="lazy"
            onLoad={handleImageLoad}
          />
        </div>
        
        {/* Product info */}
        <div className="p-4">
          <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-900">
            {product.name}
          </h3>
          
          <div className="mt-2 flex items-center justify-between">
            <div>
              {/* Price display */}
              {product.sale_price ? (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-red-600">
                    ৳{formatPrice(product.sale_price)}
                  </span>
                  <span className="text-xs text-gray-500 line-through">
                    ৳{formatPrice(product.price)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  ৳{formatPrice(product.price)}
                </span>
              )}
            </div>
            
            {/* Rating stars */}
            <div className="flex items-center">
              <span className="mr-1 text-xs font-medium text-gray-700">
                {product.average_rating || product.rating || 0}
              </span>
              <svg
                className="h-4 w-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 15.585l-5.994 3.151 1.144-6.67-4.85-4.726 6.705-.976L10 0l2.995 6.364 6.705.976-4.85 4.726 1.144 6.67L10 15.585z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </Link>
      
      <button
        className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
        onClick={handleWishlistClick}
        disabled={isLoading}
      >
        <i className={`fas fa-heart ${isWishlisted ? 'fas' : 'far'}`}></i>
      </button>
    </div>
  );
};

export default ProductCard; 