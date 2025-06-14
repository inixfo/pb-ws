import React, { useState, useEffect, useRef } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { brandService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  product_count?: number;
  is_active: boolean;
}

const BrandManagement: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [newBrand, setNewBrand] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true
  });
  
  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState<number | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const data = await brandService.getAll();
      
      // Ensure we're working with an array
      const brandsArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
          
      setBrands(brandsArray);
      console.log('Brands data:', brandsArray);
      setError(null);
    } catch (err) {
      setError('Failed to load brands');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name' && !editMode) {
      // Auto-generate slug when name changes (only for new brands)
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setNewBrand(prev => ({
        ...prev,
        [name]: value,
        slug: slug
      }));
    } else {
      setNewBrand(prev => ({
        ...prev,
        [name]: name === 'is_active' ? value === 'active' : value
      }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setLogoPreview(event.target.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', newBrand.name);
      formData.append('slug', newBrand.slug);
      formData.append('description', newBrand.description);
      formData.append('is_active', newBrand.is_active ? 'true' : 'false');
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      if (editMode && currentBrandId) {
        await brandService.update(currentBrandId, formData);
        toast.success('Brand updated successfully');
      } else {
        await brandService.create(formData);
        toast.success('Brand created successfully');
      }
      
      // Reset form and fetch updated brands
      resetForm();
      fetchBrands();
    } catch (err) {
      toast.error(editMode ? 'Failed to update brand' : 'Failed to create brand');
      console.error(err);
    }
  };

  const resetForm = () => {
    setNewBrand({ name: '', slug: '', description: '', is_active: true });
    setLogoFile(null);
    setLogoPreview(null);
    setEditMode(false);
    setCurrentBrandId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (brand: Brand) => {
    setNewBrand({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      is_active: brand.is_active
    });
    
    if (brand.logo) {
      setLogoPreview(brand.logo);
    } else {
      setLogoPreview(null);
    }
    
    setEditMode(true);
    setCurrentBrandId(brand.id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      try {
        await brandService.delete(id);
        setBrands(brands.filter(brand => brand.id !== id));
        toast.success('Brand deleted successfully');
      } catch (err) {
        toast.error('Failed to delete brand');
        console.error(err);
      }
    }
  };

  // Filter brands based on search query
  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="Brand Management - Phone Bay Admin"
        description="Manage product brands of Phone Bay e-commerce platform"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Brand Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          View and manage product brands
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              {editMode ? 'Edit Brand' : 'Add New Brand'}
            </h3>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={newBrand.name}
                  onChange={handleFormChange}
                  placeholder="Enter brand name"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug* (URL-friendly name)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={newBrand.slug}
                  onChange={handleFormChange}
                  placeholder="url-friendly-name"
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Used in URLs, only lowercase letters, numbers, and hyphens
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newBrand.description}
                  onChange={handleFormChange}
                  placeholder="Enter brand description"
                  rows={4}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Logo
                </label>
                <div className="flex items-center justify-center w-full">
                  {logoPreview ? (
                    <div className="relative w-full h-32 border-2 border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600 flex items-center justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="max-h-28 max-w-full p-2" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">Click to upload</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or WEBP (MAX. 2MB)</p>
                      </div>
                      <input 
                        id="dropzone-file" 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleLogoChange}
                        accept="image/*"
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select 
                  name="is_active"
                  value={newBrand.is_active ? 'active' : 'inactive'}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="pt-2 flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editMode ? 'Update Brand' : 'Add Brand'}
                </button>
                
                {editMode && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Brands List
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brands..."
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
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
                  onClick={() => fetchBrands()} 
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Logo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Products</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {filteredBrands.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No brands found matching the criteria
                        </td>
                      </tr>
                    ) : (
                      filteredBrands.map((brand) => (
                        <tr key={brand.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{brand.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                {brand.logo ? (
                                  <img className="h-8 w-8 rounded-full object-contain" src={brand.logo} alt={brand.name} />
                                ) : (
                                  <span className="text-xs text-gray-500">{brand.name.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{brand.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{brand.product_count || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              brand.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {brand.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <button 
                              onClick={() => handleEdit(brand)} 
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(brand.id)} 
                              className="text-red-600 hover:text-red-900"
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
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredBrands.length}</span> of <span className="font-medium">{filteredBrands.length}</span> results
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Previous</button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrandManagement; 