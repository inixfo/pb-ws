import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import { productService, categoryService, brandService } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface Product {
  id: number;
  name: string;
  category: string | { id: number; name: string; slug: string; };
  category_id: number;
  brand: string | { id: number; name: string; slug: string; };
  brand_id: number;
  description: string;
  price: number | string;
  sale_price?: number | string;
  stock_quantity: number;
  is_available: boolean;
  is_active: boolean;
  emi_available: boolean;
  featured: boolean;
  specifications?: Record<string, any>;
  primary_image?: string;
  images?: Array<{id: number, image: string, is_primary: boolean}>;
  status?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

const VendorProducts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    // Add console logging to debug vendor status
    console.log('VENDOR PRODUCTS - DEBUG:');
    console.log('User data:', user);
    console.log('Vendor profile:', user?.vendor_profile);
    console.log('Vendor status:', user?.vendor_profile?.status);
    console.log('Status === "approved":', user?.vendor_profile?.status === 'approved');
    console.log('Status === "Approved":', user?.vendor_profile?.status === 'Approved');
    
    // Redirect non-approved vendors to profile page
    if (user?.vendor_profile && 
        user.vendor_profile.status !== 'approved' && 
        user.vendor_profile.status !== 'Approved') {
      toast.error('Your vendor account must be approved before you can manage products');
      navigate('/vendor/profile');
      return;
    }
    
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch products, categories, and brands in parallel
      const [productsData, categoriesData, brandsData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        brandService.getAll()
      ]);
      
      // Ensure we're working with arrays
      const productsArray = Array.isArray(productsData) 
        ? productsData 
        : productsData.results && Array.isArray(productsData.results) 
          ? productsData.results 
          : [];
          
      const categoriesArray = Array.isArray(categoriesData) 
        ? categoriesData 
        : categoriesData.results && Array.isArray(categoriesData.results) 
          ? categoriesData.results 
          : [];
          
      const brandsArray = Array.isArray(brandsData) 
        ? brandsData 
        : brandsData.results && Array.isArray(brandsData.results) 
          ? brandsData.results 
          : [];
      
      setProducts(productsArray);
      setCategories(categoriesArray);
      setBrands(brandsArray);
      
      console.log('Products data:', productsArray);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.delete(id);
        setProducts(products.filter(product => product.id !== id));
        toast.success('Product deleted successfully');
      } catch (err) {
        toast.error('Failed to delete product');
        console.error(err);
      }
    }
  };

  const handleStatusToggle = async (id: number, isActive: boolean) => {
    try {
      await productService.update(id, { is_active: !isActive });
      setProducts(products.map(product => 
        product.id === id ? { ...product, is_active: !isActive } : product
      ));
      toast.success(`Product ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error('Failed to update product status');
      console.error(err);
    }
  };

  const handleFeaturedToggle = async (id: number, isFeatured: boolean) => {
    try {
      await productService.update(id, { featured: !isFeatured });
      setProducts(products.map(product => 
        product.id === id ? { ...product, featured: !isFeatured } : product
      ));
      toast.success(`Product ${!isFeatured ? 'featured' : 'unfeatured'} successfully`);
    } catch (err) {
      toast.error('Failed to update product featured status');
      console.error(err);
    }
  };

  // Apply filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? 
      (typeof product.category === 'object' && product.category !== null 
        ? product.category.id.toString() === categoryFilter 
        : product.category_id?.toString() === categoryFilter) 
      : true;
    
    const productStatus = !product.is_active || product.stock_quantity === 0 ? 'inactive' : 'active';
    const matchesStatus = statusFilter ? productStatus === statusFilter : true;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Fix vendor status if needed
  if (user?.vendor_profile?.status === 'Approved') {
    console.log('Fixing vendor status from "Approved" to "approved" in VendorProducts render');
    user.vendor_profile.status = 'approved';
  }

  // Render vendor approval status banner
  const renderApprovalStatus = () => {
    if (!user || !user.vendor_profile) return null;
    
    const status = user.vendor_profile.status;
    console.log('Rendering approval status banner with status:', status);
    
    if (status === 'Approved' || status === 'approved') {
      return (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
          <p className="text-green-700 dark:text-green-400">
            <span className="font-medium">✓ Your vendor account is Active.</span> You can add and manage products.
          </p>
        </div>
      );
    } else if (status === 'Pending' || status === 'pending') {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-400">
            <span className="font-medium">⚠️ Your vendor account is pending approval.</span> You cannot add products until your account is approved by an administrator.
          </p>
        </div>
      );
    } else if (status === 'Rejected' || status === 'rejected') {
      return (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400">
            <span className="font-medium">❌ Your vendor account was rejected.</span> Please contact the administrator for more information.
          </p>
        </div>
      );
    } else {
      // Add a fallback for unknown status
      return (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md dark:bg-gray-900/20 dark:border-gray-800">
          <p className="text-gray-700 dark:text-gray-400">
            <span className="font-medium">⚠️ Vendor status: {status || 'Unknown'}</span> Please contact the administrator for assistance.
          </p>
        </div>
      );
    }
  };

  return (
    <>
      <PageMeta
        title="Products - Vendor Dashboard"
        description="Manage your product inventory"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6 flex flex-col">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Products
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage your product inventory
            </p>
          </div>
          <div>
            <Link 
              to="/vendor/products/new"
              className={`px-4 py-2 ${
                user?.vendor_profile?.status === 'Approved' || user?.vendor_profile?.status === 'approved'
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } rounded-lg`}
              onClick={(e) => {
                if (user?.vendor_profile?.status !== 'Approved' && user?.vendor_profile?.status !== 'approved') {
                  e.preventDefault();
                  toast.error('Your vendor account must be approved before you can add products');
                }
              }}
            >
              Add New Product
            </Link>
          </div>
        </div>
        
        {renderApprovalStatus()}
        
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Products List
              </h3>
            </div>
            <div className="flex space-x-2">
              <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Import
              </button>
              <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                Export
              </button>
            </div>
          </div>
          
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex space-x-2">
              <select 
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select 
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive/Out of Stock</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => fetchData()} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Stock</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Featured</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No products found matching the criteria
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {typeof product.category === 'object' && product.category !== null 
                            ? (product.category as any).name 
                            : product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ৳{product.price ? 
                            (isNaN(Number(product.price)) ? '0.00' : Number(product.price).toFixed(2))
                            : '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.stock_quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.is_active && product.stock_quantity > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active && product.stock_quantity > 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.featured ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <Link 
                            to={`/vendor/products/edit/${product.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </Link>
                          <button 
                            className={`mr-3 ${
                              product.featured ? 'text-orange-600 hover:text-orange-900' : 'text-blue-600 hover:text-blue-900'
                            }`}
                            onClick={() => handleFeaturedToggle(product.id, !!product.featured)}
                          >
                            {product.featured ? 'Unfeature' : 'Feature'}
                          </button>
                          <button 
                            className={`mr-3 ${
                              product.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            onClick={() => handleStatusToggle(product.id, !!product.is_active)}
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="flex justify-between mt-4 py-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredProducts.length}</span> of <span className="font-medium">{filteredProducts.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Previous</button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorProducts; 