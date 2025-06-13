import React, { useEffect, useState } from 'react';
import { productService } from '../../services/api';
import { Product } from '../../types/products';

export const ProductImageTest = (): JSX.Element => {
  const [productId, setProductId] = useState<string>('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFormat, setImageFormat] = useState<string>('original');

  const fetchProduct = async () => {
    if (!productId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const id = parseInt(productId);
      if (isNaN(id)) {
        setError('Please enter a valid product ID');
        setLoading(false);
        return;
      }
      
      const data = await productService.getById(id);
      console.log('Product data:', data);
      setProduct(data);
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Product Image Test</h1>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Enter Product ID"
          className="flex-1 p-2 border rounded"
        />
        <button 
          onClick={fetchProduct}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Loading...' : 'Load Product'}
        </button>
      </div>
      
      <div className="flex gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="imageFormat"
            value="original"
            checked={imageFormat === 'original'}
            onChange={() => setImageFormat('original')}
            className="mr-2"
          />
          Original Format
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="imageFormat"
            value="debug"
            checked={imageFormat === 'debug'}
            onChange={() => setImageFormat('debug')}
            className="mr-2"
          />
          Debug Format
        </label>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {product && (
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-bold mb-2">Product Info</h3>
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">ID:</td>
                    <td className="p-2">{product.id}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">Price:</td>
                    <td className="p-2">৳${product.price}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">Category:</td>
                    <td className="p-2">{typeof product.category === 'object' ? product.category.name : product.category}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-semibold">Status:</td>
                    <td className="p-2">
                      {product.is_trending && <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-1">Trending</span>}
                      {product.is_special_offer && <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded mr-1">Special Offer</span>}
                      {product.is_best_seller && <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded mr-1">Best Seller</span>}
                      {product.is_todays_deal && <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded mr-1">Today's Deal</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Image Data</h3>
              {imageFormat === 'original' ? (
                <>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-1">Primary Image:</h4>
                    {product.primary_image ? (
                      <div className="border p-2 rounded">
                        {typeof product.primary_image === 'string' ? (
                          <img src={product.primary_image} alt={product.name} className="max-w-full h-auto max-h-48" />
                        ) : (
                          <img src={product.primary_image.image} alt={product.name} className="max-w-full h-auto max-h-48" />
                        )}
                      </div>
                    ) : (
                      <p className="text-red-500">No primary image</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-1">All Images:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {product.product_images && product.product_images.length > 0 ? (
                        product.product_images.map((img, idx) => (
                          <div key={idx} className={`border rounded p-1 ${img.is_primary ? 'border-blue-500' : ''}`}>
                            <img src={img.image} alt={img.alt_text || `Image ${idx + 1}`} className="max-w-full h-auto" />
                            {img.is_primary && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">Primary</span>}
                          </div>
                        ))
                      ) : product.images && product.images.length > 0 ? (
                        product.images.map((img, idx) => (
                          <div key={idx} className="border rounded p-1">
                            <img src={img} alt={`Image ${idx + 1}`} className="max-w-full h-auto" />
                          </div>
                        ))
                      ) : (
                        <p className="text-red-500">No images found</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96 text-xs">
                  {JSON.stringify({
                    primary_image: product.primary_image,
                    product_images: product.product_images,
                    images: product.images,
                    image: product.image
                  }, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 