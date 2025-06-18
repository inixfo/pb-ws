import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { wishlistService } from '../../services/wishlist';
import { getProductImageUrl } from '../../utils/imageUtils';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onWishlistUpdate?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onWishlistUpdate }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  // Get appropriate image URLs for different screen sizes
  const smallImageUrl = getProductImageUrl(product, 'small');
  const mediumImageUrl = getProductImageUrl(product, 'medium');
  const fullImageUrl = getProductImageUrl(product, 'full');

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

  return (
    <div className="product-card" onClick={handleProductClick}>
      <div className={`product-image ${!imageLoaded ? 'loading' : ''}`}>
        {/* Placeholder shown while image is loading */}
        {!imageLoaded && (
          <div className="image-placeholder">
            <div className="spinner"></div>
          </div>
        )}
        
        {/* Responsive image with lazy loading */}
        <img 
          src={smallImageUrl} 
          data-src={fullImageUrl}
          srcSet={`${smallImageUrl} 300w, ${mediumImageUrl || smallImageUrl} 600w, ${fullImageUrl} 1200w`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt={product.name}
          loading="lazy"
          onLoad={handleImageLoad}
          className={imageLoaded ? 'loaded' : ''}
        />
        
        <button
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={handleWishlistClick}
          disabled={isLoading}
        >
          <i className={`fas fa-heart ${isWishlisted ? 'fas' : 'far'}`}></i>
        </button>
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">
          ${product.sale_price ? product.sale_price : product.price}
          {product.sale_price && (
            <span className="original-price">${product.price}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ProductCard; 