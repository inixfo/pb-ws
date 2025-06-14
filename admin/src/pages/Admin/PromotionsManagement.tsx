import React, { useEffect, useState } from 'react';
import { productService, categoryService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  category: { id: number; name: string } | string;
  brand: { id: number; name: string } | string;
  is_trending: boolean;
  is_special_offer: boolean;
  is_best_seller: boolean;
  is_todays_deal: boolean;
  is_approved: boolean;
  is_available: boolean;
}

interface Category {
  id: number;
  name: string;
}

const PROMOTIONS = [
  { key: 'is_trending', label: 'Trending Products' },
  { key: 'is_special_offer', label: 'Special Offers' },
  { key: 'is_best_seller', label: 'Best Sellers' },
  { key: 'is_todays_deal', label: "Today's Deals" },
];

const PromotionsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(PROMOTIONS[0].key);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products for promotions management');
      
      // Use direct fetch for better control and debugging
      const response = await fetch('http://3.25.95.103/api/products/products/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Products data received:', data);
      
      let products = Array.isArray(data) ? data : data.results || [];
      
      // Log promotional field data for debugging
      for (const product of products) {
        console.log(`Product #${product.id} (${product.name}):`, {
          is_trending: product.is_trending,
          is_special_offer: product.is_special_offer,
          is_best_seller: product.is_best_seller,
          is_todays_deal: product.is_todays_deal
        });
      }
      
      // Ensure required promotion fields exist on each product
      products = products.map((p: any) => ({
        ...p,
        is_trending: !!p.is_trending,
        is_special_offer: !!p.is_special_offer,
        is_best_seller: !!p.is_best_seller,
        is_todays_deal: !!p.is_todays_deal,
        is_approved: p.is_approved === undefined ? true : !!p.is_approved,
        is_available: p.is_available === undefined ? true : !!p.is_available
      }));
      
      console.log('Processed products:', products);
      setProducts(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (product: Product, promoKey: string) => {
    try {
      console.log(`Toggling promotion "${promoKey}" for product #${product.id} (${product.name})`);
      console.log(`Current value: ${product[promoKey as keyof Product]}`);
      
      // Create update data object with boolean values properly set
      const updateValue = !product[promoKey as keyof Product];
      console.log(`Setting ${promoKey} to: ${updateValue}`);
      
      const updateData = { [promoKey]: updateValue };
      console.log('Update data:', updateData);
      
      // Make the API request with headers properly set
      const result = await fetch(`http://3.25.95.103/api/products/products/${product.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!result.ok) {
        const errorData = await result.json();
        console.error('API error response:', errorData);
        throw new Error(`API error: ${result.status} ${result.statusText}`);
      }
      
      const responseData = await result.json();
      console.log('Update result:', responseData);
      
      // Update local state
      setProducts(products.map(p =>
        p.id === product.id ? { ...p, [promoKey]: updateValue } : p
      ));
      
      toast.success(`${product.name} ${updateValue ? 'added to' : 'removed from'} ${promoKey.replace('is_', '').replace('_', ' ')}`);
    } catch (err) {
      console.error('Error updating promotion:', err);
      toast.error('Failed to update promotion. See console for details.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = categoryFilter ? (typeof p.category === 'object' ? p.category.id === +categoryFilter : false) : true;
    const matchesSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    // Don't filter by approval or availability unless properties exist
    const isApproved = p.is_approved === undefined ? true : p.is_approved;
    const isAvailable = p.is_available === undefined ? true : p.is_available;
    return matchesCategory && matchesSearch && isApproved && isAvailable;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Promotions Management</h1>
      <div className="flex gap-4 mb-6">
        {PROMOTIONS.map(promo => (
          <button
            key={promo.key}
            className={`px-4 py-2 rounded ${activeTab === promo.key ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(promo.key)}
          >
            {promo.label}
          </button>
        ))}
      </div>
      <div className="flex gap-4 mb-4 justify-between">
        <div className="flex gap-4">
          <select
            className="border rounded px-2 py-1"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            className="border rounded px-2 py-1"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          onClick={fetchProducts}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Products'}
        </button>
      </div>
      <table className="w-full border rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Brand</th>
            <th className="p-2 text-center">Assigned</th>
            <th className="p-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>
          ) : filteredProducts.length === 0 ? (
            <tr><td colSpan={5} className="text-center p-4">No products found.</td></tr>
          ) : (
            filteredProducts.map(product => (
              <tr key={product.id}>
                <td className="p-2">{product.name}</td>
                <td className="p-2">{typeof product.category === 'object' ? product.category.name : product.category}</td>
                <td className="p-2">{typeof product.brand === 'object' ? product.brand.name : product.brand}</td>
                <td className="p-2 text-center">
                  <input
                    type="checkbox"
                    checked={!!product[activeTab as keyof Product]}
                    onChange={() => handleToggle(product, activeTab)}
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => handleToggle(product, activeTab)}
                  >
                    {product[activeTab as keyof Product] ? 'Remove' : 'Assign'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PromotionsManagement; 