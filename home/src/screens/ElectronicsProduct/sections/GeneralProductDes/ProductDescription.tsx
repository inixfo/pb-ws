import React from 'react';
import { useProduct } from '../../../../contexts/ProductContext';

const ProductDescription: React.FC = () => {
  const { product, loading } = useProduct();
  
  if (loading) {
    return <div className="product-description-loading">Loading description...</div>;
  }
  
  if (!product?.description) {
    return null;
  }
  
  return (
    <div className="product-description">
      <h3 className="text-xl font-semibold mb-4">Product Description</h3>
      <div 
        className="text-gray-700"
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
    </div>
  );
};

export default ProductDescription;
