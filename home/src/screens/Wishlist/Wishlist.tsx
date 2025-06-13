import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wishlistService, WishlistItem } from '../../services/wishlist';
import { Product } from '../../types/product';
import './Wishlist.css';

const Wishlist: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const items = await wishlistService.getWishlist();
      setWishlistItems(items);
      setError(null);
    } catch (err) {
      setError('Failed to fetch wishlist items');
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems(items => items.filter(item => item.product.id !== productId));
    } catch (err) {
      setError('Failed to remove item from wishlist');
      console.error('Error removing from wishlist:', err);
    }
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.slug}`);
  };

  if (loading) {
    return <div className="wishlist-loading">Loading...</div>;
  }

  if (error) {
    return <div className="wishlist-error">{error}</div>;
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-empty">
        <h2>Your Wishlist is Empty</h2>
        <p>Add items to your wishlist to keep track of products you love.</p>
        <button onClick={() => navigate('/products')} className="browse-products-btn">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <h1>My Wishlist</h1>
      <div className="wishlist-grid">
        {wishlistItems.map((item) => (
          <div key={item.id} className="wishlist-item">
            <div className="product-image" onClick={() => handleProductClick(item.product)}>
              <img src={item.product.image} alt={item.product.name} />
            </div>
            <div className="product-info">
              <h3 onClick={() => handleProductClick(item.product)}>{item.product.name}</h3>
              <p className="price">
                ${item.product.sale_price ? item.product.sale_price : item.product.price}
                {item.product.sale_price && (
                  <span className="original-price">৳${item.product.price}</span>
                )}
              </p>
              <button
                className="remove-btn"
                onClick={() => handleRemoveFromWishlist(item.product.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist; 