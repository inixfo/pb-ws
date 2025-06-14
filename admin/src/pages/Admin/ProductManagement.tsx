import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import { productService, categoryService, brandService } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';

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
  
  // EMI options
  emi_available: boolean;
  emi_type?: 'normal' | 'cardless';
  emi_plans?: number[];
  
  // Promotional fields
  is_trending?: boolean;
  is_special_offer?: boolean;
  is_best_seller?: boolean;
  is_todays_deal?: boolean;
  
  // Product specifications
  specifications?: Record<string, any>;
  
  // Image info
  primary_image?: string;
  images?: Array<{id: number, image: string, is_primary: boolean}>;
}

interface ProductFormData {
  name: string;
  category_id: number;
  brand_id: number;
  description: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  is_available: boolean;
  is_active: boolean;
  
  // EMI options
  emi_available: boolean;
  emi_type: 'normal' | 'cardless';
  emi_plans: number[];
  
  // Product specifications
  specifications: Record<string, any>;
  
  // Image handling
  primary_image?: File | null;
  additional_images?: File[];
}

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

// Add a new BulkUploadModal component
interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUploadSuccess 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [allCategoriesList, setAllCategoriesList] = useState<Category[]>([]);
  const [selectedCategoryForTemplateId, setSelectedCategoryForTemplateId] = useState<string>('');
  const [uploadCategoryId, setUploadCategoryId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset form state
      setSelectedFile(null);
      setErrorMessage('');
      setSelectedCategoryForTemplateId('');
      setUploadCategoryId('');
      setIsUploading(false);
      
      // Fetch categories
      const fetchCategoriesForModal = async () => {
        setIsLoadingCategories(true);
        try {
          const response = await categoryService.getAllCategories(); // response might be {count: ..., results: [...]}
          
          if (response && Array.isArray(response.results)) {
            setAllCategoriesList(response.results);
          } else if (Array.isArray(response)) { 
            // Fallback if the API unexpectedly returns a direct array
            setAllCategoriesList(response);
          } else {
            console.error("Fetched categories response is not in expected format (array or {results: array}):", response);
            toast.error('Failed to load categories: Unexpected format.');
            setAllCategoriesList([]); 
          }
        } catch (error) {
          console.error("Failed to fetch categories for modal:", error);
          toast.error('Failed to load categories.');
          setAllCategoriesList([]);
        }
        setIsLoadingCategories(false);
      };
      fetchCategoriesForModal();
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv'
      ];
      
      if (!validTypes.includes(file.type) && 
          !file.name.endsWith('.csv') && 
          !file.name.endsWith('.xlsx') && 
          !file.name.endsWith('.xls')) {
        setErrorMessage('Please select a valid CSV or Excel file');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleCategoryForTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategoryForTemplateId(e.target.value);
  };

  const handleUploadCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadCategoryId(e.target.value);
  };

  const handleDownloadTemplate = async () => {
    if (!selectedCategoryForTemplateId) {
      toast.error('Please select a category to download the template for.');
      return;
    }
    try {
      const loadingToast = toast.loading('Downloading template...');
      const response = await productService.downloadTemplate(selectedCategoryForTemplateId, 'csv');
      toast.dismiss(loadingToast);
      if (!response) {
        throw new Error('Empty response received');
      }
      
      // Create a blob from the response
      const blob = new Blob([response], { type: 'text/csv' });
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'product_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Failed to download template:', error);
      toast.error('Failed to download template. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }
    
    if (!uploadCategoryId) {
      setErrorMessage('Please select a category for the upload.');
      return;
    }
        
    setIsUploading(true);
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category_id', uploadCategoryId);
      
      const response = await productService.bulkUpload(formData);
      
      toast.success(response.message || 'Products uploaded successfully');
      
      // Close the modal and refresh product list
      onClose();
      onUploadSuccess();
    } catch (error: any) {
      console.error('Bulk upload failed:', error);
      setErrorMessage(error.message || 'Failed to upload products. Please check your file and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bulk Product Upload
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Download a template for a specific category, fill it, then select the same category and upload the file.
          Brand information should be included as a column in the sheet.
        </p>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryForTemplate" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Category for Template Download</label>
            <select 
              id="categoryForTemplate"
              value={selectedCategoryForTemplateId}
              onChange={handleCategoryForTemplateChange}
              disabled={isLoadingCategories}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">-- Select Category for Template --</option>
              {allCategoriesList.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={!selectedCategoryForTemplateId || isLoadingCategories}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Download Template (CSV)
          </button>

          <hr className="my-6 border-gray-200 dark:border-gray-600" />

          <div>
            <label htmlFor="uploadCategory" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Category for Upload</label>
            <select 
              id="uploadCategory"
              value={uploadCategoryId}
              onChange={handleUploadCategoryChange}
              disabled={isLoadingCategories}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">-- Select Upload Category --</option>
              {allCategoriesList.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="productFile" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Upload File</label>
            <input 
              type="file" 
              id="productFile"
              onChange={handleFileChange} 
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">CSV, XLS, or XLSX file.</p>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isUploading || !selectedFile || !uploadCategoryId}
              className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              {isUploading ? 'Uploading...' : 'Upload Products'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function to convert ProductFormData to FormData
const convertProductFormDataToFormData = (data: ProductFormData): FormData => {
  const formDataInstance = new FormData();

  // Append simple fields
  Object.keys(data).forEach(key => {
    const value = data[key as keyof ProductFormData];
    if (key === 'primary_image' || key === 'additional_images' || key === 'specifications' || key === 'emi_plans') {
      // Skip file, object, and array fields for now, handle them separately
      return;
    }
    if (value !== undefined && value !== null) {
      formDataInstance.append(key, String(value));
    }
  });

  // Append primary_image if it exists
  if (data.primary_image) {
    formDataInstance.append('primary_image', data.primary_image);
  }

  // Append additional_images if they exist
  if (data.additional_images && data.additional_images.length > 0) {
    data.additional_images.forEach((file, index) => {
      formDataInstance.append(`additional_images[${index}]`, file);
    });
  }
  
  // Append specifications as a JSON string
  if (data.specifications) {
    formDataInstance.append('specifications', JSON.stringify(data.specifications));
  }

  // Append emi_plans as a comma-separated string or individual fields if required by backend
  // Assuming backend expects a JSON string or similar for multiple IDs from a text input
  if (data.emi_plans && data.emi_plans.length > 0) {
    // If backend expects comma-separated string:
    // formDataInstance.append('emi_plans', data.emi_plans.join(','));
    // If backend expects array-like form fields:
    data.emi_plans.forEach(planId => formDataInstance.append('emi_plans', planId.toString()));
  }


  return formDataInstance;
};

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category_id: 0,
    brand_id: 0,
    description: '',
    price: 0,
    sale_price: 0,
    stock_quantity: 0,
    is_available: true,
    is_active: true,
    emi_available: false,
    emi_type: 'normal',
    emi_plans: [],
    specifications: {},
    primary_image: null,
    additional_images: []
  });

  // Add new state for bulk upload modal
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
      const formDataInstance = new FormData();
      formDataInstance.append('is_active', String(!isActive));
      // If other fields are mandatory for PATCH and not automatically set by backend,
      // you might need to fetch the product and append its current values.
      // For now, assuming only is_active is being changed.
      await productService.update(id, formDataInstance);
      setProducts(products.map(product => 
        product.id === id ? { ...product, is_active: !isActive } : product
      ));
      toast.success(`Product ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error('Failed to update product status');
      console.error(err);
    }
  };

  // Modal functions
  const openAddModal = () => {
    // Set initial form data with first category and brand if available
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : 0,
      brand_id: brands.length > 0 ? brands[0].id : 0,
      description: '',
      price: 0,
      sale_price: 0,
      stock_quantity: 0,
      is_available: true,
      is_active: true,
      emi_available: false,
      emi_type: 'normal',
      emi_plans: [],
      specifications: {},
      primary_image: null,
      additional_images: []
    });
    setIsEditing(false);
    setCurrentProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      category_id: product.category_id,
      brand_id: product.brand_id,
      description: product.description || '',
      price: typeof product.price === 'string' ? parseFloat(product.price) || 0 : product.price,
      sale_price: product.sale_price ? (typeof product.sale_price === 'string' ? parseFloat(product.sale_price) || 0 : product.sale_price) : 0,
      stock_quantity: product.stock_quantity,
      is_available: product.is_available,
      is_active: product.is_active,
      emi_available: product.emi_available || false,
      emi_type: product.emi_type || 'normal',
      emi_plans: product.emi_plans || [],
      specifications: product.specifications || {},
    });
    setIsEditing(true);
    setCurrentProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkbox fields
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } 
    // Handle number fields
    else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    }
    // Handle select fields for category and brand
    else if (name === 'category_id' || name === 'brand_id') {
      setFormData({
        ...formData,
        [name]: parseInt(value) || 0
      });
    }
    // Handle all other fields
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const dataForApi = convertProductFormDataToFormData(formData);

    try {
      if (isEditing && currentProduct) {
        // Update existing product
        await productService.update(currentProduct.id, dataForApi);
        
        // Find category and brand names for display
        const category = categories.find(c => c.id === formData.category_id)?.name || '';
        const brand = brands.find(b => b.id === formData.brand_id)?.name || '';
        
        // Update local state
        setProducts(products.map(product => 
          product.id === currentProduct.id ? { 
            ...product, 
            name: formData.name,
            description: formData.description,
            price: formData.price,
            sale_price: formData.sale_price,
            stock_quantity: formData.stock_quantity,
            is_available: formData.is_available,
            is_active: formData.is_active,
            emi_available: formData.emi_available,
            emi_type: formData.emi_type,
            emi_plans: formData.emi_plans,
            specifications: formData.specifications,
            category,
            brand,
            category_id: formData.category_id,
            brand_id: formData.brand_id
          } : product
        ));
        
        toast.success('Product updated successfully');
      } else {
        // Create new product
        const newProduct = await productService.create(dataForApi);
        
        // Find category and brand names for display
        const category = categories.find(c => c.id === formData.category_id)?.name || '';
        const brand = brands.find(b => b.id === formData.brand_id)?.name || '';
        
        // Add to local state with category and brand names
        setProducts([...products, {
          ...newProduct,
          category,
          brand
        }]);
        
        toast.success('Product created successfully');
      }
      
      // Close modal
      closeModal();
      
      // Refresh the products list
      fetchData();
    } catch (err) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} product`);
      console.error(err);
    }
  };

  // Apply filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? product.category_id.toString() === categoryFilter : true;
    const matchesBrand = brandFilter ? product.brand_id.toString() === brandFilter : true;
    const matchesStatus = statusFilter ? 
      (statusFilter === 'active' ? product.is_active : !product.is_active || product.stock_quantity === 0) : true;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  // Function to open bulk upload modal
  const openBulkUploadModal = () => {
    setShowBulkUploadModal(true);
  };
  
  // Function to close bulk upload modal
  const closeBulkUploadModal = () => {
    setShowBulkUploadModal(false);
  };

  return (
    <>
      <PageMeta
        title="Product Management - Phone Bay Admin"
        description="Manage products of Phone Bay e-commerce platform"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Product Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          View and manage all products in the system
        </p>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Products List
            </h3>
          </div>
          <div className="flex space-x-2">
            <Link 
              to="/admin/products/new"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add New Product
            </Link>
            <button 
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={openBulkUploadModal}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Bulk Upload
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
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id.toString()}>
                  {brand.name}
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
              onClick={() => window.location.reload()} 
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Brand</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
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
                        {typeof product.brand === 'object' && product.brand !== null 
                          ? (product.brand as any).name 
                          : product.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ৳{product.price ? 
                          (isNaN(Number(product.price)) ? '0.00' : Number(product.price).toFixed(2))
                          : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{product.stock_quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {product.stock_quantity <= 0 && (
                          <span className="ml-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            Out of Stock
                          </span>
                        )}
                        {product.is_trending && (
                          <span className="ml-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Trending
                          </span>
                        )}
                        {product.is_special_offer && (
                          <span className="ml-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Special Offer
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <Link 
                          to={`/admin/products/edit/${product.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </Link>
                        <button 
                          className={`mr-3 ${
                            product.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                          onClick={() => handleStatusToggle(product.id, product.is_active)}
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

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      <div className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Product Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Category
                            </label>
                            <select
                              name="category_id"
                              id="category_id"
                              required
                              value={formData.category_id}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              <option value="">Select Category</option>
                              {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Brand
                            </label>
                            <select
                              name="brand_id"
                              id="brand_id"
                              required
                              value={formData.brand_id}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              <option value="">Select Brand</option>
                              {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                  {brand.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Price ($)
                            </label>
                            <input
                              type="number"
                              name="price"
                              id="price"
                              required
                              min="0"
                              step="0.01"
                              value={formData.price}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Sale Price ($)
                            </label>
                            <input
                              type="number"
                              name="sale_price"
                              id="sale_price"
                              min="0"
                              step="0.01"
                              value={formData.sale_price}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Stock Quantity
                            </label>
                            <input
                              type="number"
                              name="stock_quantity"
                              id="stock_quantity"
                              required
                              min="0"
                              step="1"
                              value={formData.stock_quantity}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="flex flex-col justify-end mt-6">
                            <div className="flex items-center">
                              <input
                                id="is_active"
                                name="is_active"
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Active
                              </label>
                            </div>
                            <div className="flex items-center mt-2">
                              <input
                                id="is_available"
                                name="is_available"
                                type="checkbox"
                                checked={formData.is_available}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="is_available" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Available for Purchase
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {/* EMI Options Section */}
                        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">EMI Options</h4>
                          <div className="flex items-center mb-3">
                            <input
                              id="emi_available"
                              name="emi_available"
                              type="checkbox"
                              checked={formData.emi_available}
                              onChange={handleInputChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="emi_available" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              EMI Available
                            </label>
                          </div>
                          
                          {formData.emi_available && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="emi_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  EMI Type
                                </label>
                                <select
                                  name="emi_type"
                                  id="emi_type"
                                  value={formData.emi_type}
                                  onChange={handleInputChange}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="cardless">Cardless</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor="emi_plans" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  EMI Plans
                                </label>
                                <input
                                  type="text"
                                  name="emi_plans"
                                  id="emi_plans"
                                  value={formData.emi_plans?.join(', ')}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    emi_plans: e.target.value.split(',').map(Number)
                                  })}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Product Specifications Section */}
                        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Specifications</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Add product specifications based on the selected category.
                          </p>
                          <div className="border border-gray-300 rounded-md p-3 dark:border-gray-600">
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                              {isEditing ? 
                                'Specifications editing available in the full version' : 
                                'Specification fields will be populated based on the selected category'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Image Upload Section */}
                        <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Product Images</h4>
                          <div className="border border-gray-300 rounded-md p-3 dark:border-gray-600">
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                              Image upload functionality will be available in the next version.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal 
        isOpen={showBulkUploadModal}
        onClose={closeBulkUploadModal}
        onUploadSuccess={fetchData}
      />
    </>
  );
};

export default ProductManagement; 