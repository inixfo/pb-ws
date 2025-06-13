import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { wishlistService } from '../../services/wishlist';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onWishlistUpdate?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onWishlistUpdate }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="product-card" onClick={handleProductClick}>
      <div className="product-image">
        <img src={product.image} alt={product.name} />
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