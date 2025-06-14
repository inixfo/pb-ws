import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PageMeta from '../../components/common/PageMeta';
import { productService, categoryService, brandService, emiService, productFieldService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Product {
  id: number;
  name: string;
  category: string;
  category_id: number;
  brand: string;
  brand_id: number;
  description: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  is_available: boolean;
  is_active: boolean;
  
  // EMI options
  emi_available: boolean;
  emi_type?: 'normal' | 'cardless';
  emi_plans?: number[];
  
  // Product specifications
  specifications?: Record<string, any>;
  
  // Image info
  primary_image?: string;
  images?: Array<{id: number, image: string, is_primary: boolean}>;
  
  // Product variations
  variations?: Array<{
    id: number;
    name: string;
    price: number;
    stock_quantity: number;
    sku: string;
    is_default: boolean;
    is_active: boolean;
  }>;
}

interface ProductVariation {
  id?: number;
  name: string;
  price: number;
  stock_quantity: number;
  sku?: string;
  is_default: boolean;
  is_active: boolean;
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
  
  // Product variations
  has_variations: boolean;
  variations: ProductVariation[];
  
  // Promotional flags
  is_trending: boolean;
  is_special_offer: boolean;
  is_best_seller: boolean;
  is_todays_deal: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface EMIPlan {
  id: number;
  name: string;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
  emi_type: 'normal' | 'cardless';
  duration_months: number;
}

// Specification field types
type SpecFieldType = 'text' | 'number' | 'boolean' | 'select' | 'multi_select';

interface SpecificationField {
  id: number;
  name: string;
  field_type: SpecFieldType;
  group: string;
  options?: string[];
  is_required: boolean;
  is_filter: boolean;
  display_order: number;
}

// Specifications grouped by category
interface CategorySpecifications {
  [group: string]: SpecificationField[];
}

const ProductForm: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if we're in vendor context based on the URL path
  const isVendorContext = window.location.pathname.includes('/vendor/');
  
  // Check vendor approval status
  useEffect(() => {
    console.log('ProductForm - Checking vendor status:', user?.vendor_profile?.status);
    
    if (isVendorContext && 
        user?.vendor_profile?.status !== 'approved' && 
        user?.vendor_profile?.status !== 'Approved') {
      toast.error('Your vendor account must be approved before you can add or edit products');
      navigate('/vendor/profile');
    }
  }, [isVendorContext, user, navigate]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [emiPlans, setEmiPlans] = useState<EMIPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image handling states
  const [previewImages, setPreviewImages] = useState<{id?: number, url: string, isPrimary: boolean}[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Specification fields by category
  const [categoryFields, setCategoryFields] = useState<SpecificationField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

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
    additional_images: [],
    has_variations: false,
    variations: [],
    is_trending: false,
    is_special_offer: false,
    is_best_seller: false,
    is_todays_deal: false
  });

  // Filtered EMI plans based on selected type
  const filteredEmiPlans = emiPlans.filter(plan => plan.emi_type === formData.emi_type);

  // Fetch specification fields for a category
  const fetchSpecificationFields = async (categoryId: number) => {
    try {
      setLoadingFields(true);
      const fields = await productFieldService.getByCategory(categoryId);
      setCategoryFields(fields);
      setLoadingFields(false);
    } catch (error) {
      console.error('Error fetching specification fields:', error);
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories, brands, and EMI plans in parallel
        const [categoriesData, brandsData, emiPlansData] = await Promise.all([
          categoryService.getAll(),
          brandService.getAll(),
          emiService.getPlans()
        ]);
        
        // Ensure we're working with arrays
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
        
        const emiPlansArray = Array.isArray(emiPlansData) 
          ? emiPlansData 
          : emiPlansData.results && Array.isArray(emiPlansData.results) 
            ? emiPlansData.results 
            : [];
        
        setCategories(categoriesArray);
        setBrands(brandsArray);
        setEmiPlans(emiPlansArray);
        
        // Update default form values
        if (categoriesArray.length > 0) {
          setFormData(prev => ({ ...prev, category_id: categoriesArray[0].id }));
        }
        
        if (brandsArray.length > 0) {
          setFormData(prev => ({ ...prev, brand_id: brandsArray[0].id }));
        }
        
        // If editing, fetch the product data
        if (isEditMode && id) {
          console.log(`Fetching product with ID: ${id}`);
          const product = await productService.getById(id);
          console.log('Product data received:', product);
          
          // Format the data for the form
          setFormData({
            name: product.name,
            category_id: product.category_id || product.category?.id,
            brand_id: product.brand_id || product.brand?.id,
            description: product.description,
            price: product.price,
            sale_price: product.sale_price || 0,
            stock_quantity: product.stock_quantity,
            is_available: product.is_available,
            is_active: product.is_active !== false, // Default to true if undefined
            emi_available: product.emi_available || false,
            emi_type: product.emi_type || 'normal',
            emi_plans: product.emi_plans || [],
            specifications: product.specifications || {},
            primary_image: null,
            additional_images: [],
            has_variations: product.variations && product.variations.length > 0,
            variations: product.variations || [],
            is_trending: product.is_trending || false,
            is_special_offer: product.is_special_offer || false,
            is_best_seller: product.is_best_seller || false,
            is_todays_deal: product.is_todays_deal || false
          });
          
          // Load existing images
          if (product.images && product.images.length > 0) {
            const images = product.images.map((img: {id: number, image: string, is_primary: boolean}) => ({
              id: img.id,
              url: img.image,
              isPrimary: img.is_primary
            }));
            setPreviewImages(images);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  // Add a useEffect to fetch specification fields when category changes
  useEffect(() => {
    if (formData.category_id > 0) {
      fetchSpecificationFields(formData.category_id);
    }
  }, [formData.category_id]);

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

  const handleEmiPlanSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const planId = parseInt(value);
    
    if (checked) {
      // Add plan to selected plans
      setFormData({
        ...formData,
        emi_plans: [...formData.emi_plans, planId]
      });
    } else {
      // Remove plan from selected plans
      setFormData({
        ...formData,
        emi_plans: formData.emi_plans.filter(id => id !== planId)
      });
    }
  };

  // Handle specification field changes
  const handleSpecificationChange = (fieldId: string, value: string | number | boolean | string[]) => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [fieldId]: value
      }
    });
  };

  // Handle image uploads
  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setFormData({
      ...formData,
      primary_image: file
    });
    
    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    
    // Update previews - make this the primary and any existing primary as non-primary
    setPreviewImages(prev => {
      const newPreviews = prev.map(p => ({...p, isPrimary: false}));
      return [{url: imageUrl, isPrimary: true}, ...newPreviews];
    });
  };
  
  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Add selected files to the additional images array
    const newFiles = Array.from(files);
    setFormData(prev => ({
      ...prev,
      additional_images: [...(prev.additional_images || []), ...newFiles]
    }));
    
    // Create preview URLs for all new files
    const newPreviewImages = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      isPrimary: false
    }));
    
    setPreviewImages(prev => [...prev, ...newPreviewImages]);
  };
  
  const setImageAsPrimary = (index: number) => {
    setPreviewImages(prev => 
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    );
    
    // If this is from additional images, need to swap with primary image in formData
    if (index > 0 && formData.additional_images && formData.additional_images.length > 0) {
      const newPrimaryIndex = index - 1; // Adjust for the existing primary image at index 0
      if (newPrimaryIndex >= 0 && newPrimaryIndex < formData.additional_images.length) {
        const newPrimary = formData.additional_images[newPrimaryIndex];
        const oldPrimary = formData.primary_image;
        
        // Create new additional images array without the new primary
        const newAdditional = [...formData.additional_images];
        newAdditional.splice(newPrimaryIndex, 1);
        
        // Add old primary to additional if it exists
        if (oldPrimary) {
          newAdditional.push(oldPrimary);
        }
        
        setFormData(prev => ({
          ...prev,
          primary_image: newPrimary,
          additional_images: newAdditional
        }));
      }
    }
  };
  
  const removeImage = (index: number) => {
    // Remove from preview
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    
    // Remove from form data
    if (index === 0 && formData.primary_image) {
      // Removing primary image
      setFormData(prev => ({
        ...prev,
        primary_image: null
      }));
      
      // If we have additional images, promote the first one to primary
      if (formData.additional_images && formData.additional_images.length > 0) {
        const [newPrimary, ...remainingImages] = formData.additional_images;
        setFormData(prev => ({
          ...prev,
          primary_image: newPrimary,
          additional_images: remainingImages
        }));
        
        // Update preview to mark first additional as primary
        setPreviewImages(prev => {
          if (prev.length <= 1) return prev;
          return [
            {...prev[1], isPrimary: true},
            ...prev.slice(2)
          ];
        });
      }
    } else if (index > 0 && formData.additional_images) {
      // Removing an additional image
      const adjustedIndex = index - 1; // Adjust for primary image at index 0
      setFormData(prev => ({
        ...prev,
        additional_images: prev.additional_images?.filter((_, i) => i !== adjustedIndex)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setIsUploading(true);
      setUploadProgress(0);
      
      // Validate form
      if (!formData.name || !formData.category_id || !formData.brand_id) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        setIsUploading(false);
        return;
      }
      
      // Validate variations if enabled
      if (formData.has_variations) {
        if (formData.variations.length === 0) {
          toast.error('Please add at least one variation');
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
        
        // Check if all variations have names and prices
        const invalidVariation = formData.variations.find(v => !v.name || v.price <= 0);
        if (invalidVariation) {
          toast.error('All variations must have a name and price');
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
        
        // Check if there's a default variation
        const hasDefault = formData.variations.some(v => v.is_default);
        if (!hasDefault) {
          toast.error('Please set one variation as default');
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
      }
      
      // Prepare form data for submission
      const productData = new FormData();
      
      // Basic product info
      productData.append('name', formData.name);
      productData.append('category', formData.category_id.toString());
      productData.append('brand', formData.brand_id.toString());
      productData.append('description', formData.description);
      
      // Price (mapped to base_price in the backend)
      productData.append('price', formData.price.toString());
      
      if (formData.sale_price && formData.sale_price > 0) {
        productData.append('sale_price', formData.sale_price.toString());
      }
      
      // If no variations, include stock quantity
      if (!formData.has_variations) {
        productData.append('stock_quantity', formData.stock_quantity.toString());
      }
      
      // Availability flags
      productData.append('is_available', formData.is_available.toString());
      productData.append('is_active', formData.is_active.toString());
      
      // Vendor information (if in edit mode, the backend will use current user)
      if (user && user.id) {
        productData.append('vendor', user.id.toString());
      }
      
      // EMI options
      productData.append('emi_available', formData.emi_available.toString());
      if (formData.emi_available && formData.emi_plans.length > 0) {
        formData.emi_plans.forEach(planId => {
          productData.append('emi_plans', planId.toString());
        });
      }
      
      // Specifications
      productData.append('specifications', JSON.stringify(formData.specifications));
      
      // Promotional flags
      productData.append('is_trending', formData.is_trending.toString());
      productData.append('is_special_offer', formData.is_special_offer.toString());
      productData.append('is_best_seller', formData.is_best_seller.toString());
      productData.append('is_todays_deal', formData.is_todays_deal.toString());
      
      // Handle variations
      if (formData.has_variations) {
        // Send has_variations as a flag
        productData.append('has_variations', 'true');
        
        // Process variations to match expected backend format
        const variationsData = formData.variations.map(variation => ({
          name: variation.name,
          price: variation.price,
          stock_quantity: variation.stock_quantity,
          sku: variation.sku || undefined,
          is_default: variation.is_default,
          is_active: variation.is_active
        }));
        
        // Send variations as JSON string
        productData.append('variations', JSON.stringify(variationsData));
      } else {
        productData.append('has_variations', 'false');
      }
      
      // Images
      if (formData.primary_image) {
        productData.append('primary_image', formData.primary_image);
      }
      
      if (formData.additional_images && formData.additional_images.length > 0) {
        formData.additional_images.forEach(image => {
          productData.append('additional_images', image);
        });
      }
      
      // Log the form data being sent
      console.log('Submitting product data:');
      for (const [key, value] of productData.entries()) {
        if (key === 'variations') {
          console.log(`${key}: ${value}`);
        } else if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      // Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // Submit the form
      let response;
      if (isEditMode && id) {
        response = await productService.update(id, productData);
      } else {
        response = await productService.create(productData);
      }
      
      console.log('Product creation/update response:', response);
      
      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
      
      // Navigate back to product list after a short delay
      setTimeout(() => {
        setIsUploading(false);
        if (isVendorContext) {
          navigate('/vendor/products');
        } else {
          navigate('/admin/products');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} product. Please try again.`);
      setIsUploading(false);
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    // Use window.location for navigation
    window.location.href = isVendorContext ? '/vendor/products' : '/admin/products';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Fix vendor status if needed
  if (user?.vendor_profile?.status === 'Approved') {
    console.log('Fixing vendor status from "Approved" to "approved" in ProductForm render');
    user.vendor_profile.status = 'approved';
  }

  // Get fields grouped by their group
  const getGroupedFields = (): CategorySpecifications => {
    // Group fields by their group property
    return categoryFields.reduce((groups, field) => {
      const group = field.group || 'general';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(field);
      return groups;
    }, {} as CategorySpecifications);
  };

  // Get groups sorted by display order and then name
  const getOrderedGroups = (): string[] => {
    const groups = Object.keys(getGroupedFields());
    
    // Define group order for consistent display
    const groupOrder = [
      'general', 
      'specifications', 
      'dimensions', 
      'display', 
      'hardware', 
      'camera', 
      'features', 
      'connectivity', 
      'sensors', 
      'box', 
      'compartments', 
      'convenience', 
      'other'
    ];
    
    // Sort groups by their order in the groupOrder array
    return groups.sort((a, b) => {
      const indexA = groupOrder.indexOf(a);
      const indexB = groupOrder.indexOf(b);
      
      // If both groups are in the order list, sort by their position
      if (indexA >= 0 && indexB >= 0) {
        return indexA - indexB;
      }
      
      // If only one is in the list, prioritize it
      if (indexA >= 0) return -1;
      if (indexB >= 0) return 1;
      
      // If neither is in the list, sort alphabetically
      return a.localeCompare(b);
    });
  };

  // Render the Product Specifications Section
  const renderSpecificationFields = () => {
    const groupedFields = getGroupedFields();
    const orderedGroups = getOrderedGroups();
    
    if (loadingFields) {
      return (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (categoryFields.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No specification fields are defined for this category.
          </p>
          {isEditMode ? null : (
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
              You can add custom fields from the <a href="/admin/custom-fields" className="text-blue-500 hover:underline">Custom Fields</a> page.
            </p>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {orderedGroups.map(group => (
          <div key={group} className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-3 capitalize">
              {group}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupedFields[group].map(field => (
                <div key={field.id} className="mb-4">
                  <label 
                    htmlFor={`spec_${field.id}`} 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {field.name} {field.is_required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.field_type === 'text' && (
                    <input
                      type="text"
                      id={`spec_${field.id}`}
                      value={formData.specifications[field.name] || ''}
                      onChange={(e) => handleSpecificationChange(field.name, e.target.value)}
                      required={field.is_required}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                  
                  {field.field_type === 'number' && (
                    <input
                      type="number"
                      id={`spec_${field.id}`}
                      value={formData.specifications[field.name] || ''}
                      onChange={(e) => handleSpecificationChange(field.name, parseFloat(e.target.value) || 0)}
                      required={field.is_required}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                  
                  {field.field_type === 'boolean' && (
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`spec_${field.id}_true`}
                          name={`spec_${field.id}`}
                          value="true"
                          checked={formData.specifications[field.name] === true}
                          onChange={(e) => handleSpecificationChange(field.name, true)}
                          required={field.is_required}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor={`spec_${field.id}_true`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`spec_${field.id}_false`}
                          name={`spec_${field.id}`}
                          value="false"
                          checked={formData.specifications[field.name] === false}
                          onChange={(e) => handleSpecificationChange(field.name, false)}
                          required={field.is_required}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor={`spec_${field.id}_false`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          No
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {field.field_type === 'select' && field.options && (
                    <select
                      id={`spec_${field.id}`}
                      value={formData.specifications[field.name] || ''}
                      onChange={(e) => handleSpecificationChange(field.name, e.target.value)}
                      required={field.is_required}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select {field.name}</option>
                      {field.options.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {field.field_type === 'multi_select' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`spec_${field.id}_${index}`}
                            checked={Array.isArray(formData.specifications[field.name]) && 
                                    formData.specifications[field.name].includes(option)}
                            onChange={(e) => {
                              const currentValues = Array.isArray(formData.specifications[field.name]) 
                                ? [...formData.specifications[field.name]] 
                                : [];
                              
                              if (e.target.checked) {
                                // Add value if not already in the array
                                if (!currentValues.includes(option)) {
                                  handleSpecificationChange(field.name, [...currentValues, option]);
                                }
                              } else {
                                // Remove value from array
                                handleSpecificationChange(
                                  field.name, 
                                  currentValues.filter(val => val !== option)
                                );
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`spec_${field.id}_${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Handle variation input changes
  const handleVariationChange = (index: number, field: keyof ProductVariation, value: any) => {
    setFormData(prevData => {
      const updatedVariations = [...prevData.variations];
      updatedVariations[index] = {
        ...updatedVariations[index],
        [field]: value
      };
      
      // If this variation is being set as default, unset others
      if (field === 'is_default' && value === true) {
        updatedVariations.forEach((variation, i) => {
          if (i !== index) {
            updatedVariations[i] = {
              ...updatedVariations[i],
              is_default: false
            };
          }
        });
      }
      
      return {
        ...prevData,
        variations: updatedVariations
      };
    });
  };

  // Add a new variation
  const addVariation = () => {
    const newVariation: ProductVariation = {
      name: '',
      price: formData.price,
      stock_quantity: 0,
      is_default: formData.variations.length === 0, // First variation is default
      is_active: true
    };
    
    setFormData(prevData => ({
      ...prevData,
      variations: [...prevData.variations, newVariation]
    }));
  };

  // Remove a variation
  const removeVariation = (index: number) => {
    setFormData(prevData => {
      const updatedVariations = prevData.variations.filter((_, i) => i !== index);
      
      // If we removed the default variation, set the first one as default
      if (prevData.variations[index].is_default && updatedVariations.length > 0) {
        updatedVariations[0].is_default = true;
      }
      
      return {
        ...prevData,
        variations: updatedVariations
      };
    });
  };

  // Toggle variations feature
  const toggleVariations = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hasVariations = e.target.checked;
    
    setFormData(prevData => ({
      ...prevData,
      has_variations: hasVariations,
      variations: hasVariations ? 
        // If enabling variations and none exist, create one default variation
        (prevData.variations.length === 0 ? [{
          name: '',
          price: prevData.price,
          stock_quantity: prevData.stock_quantity,
          is_default: true,
          is_active: true
        }] : prevData.variations) : 
        // If disabling variations, clear them
        []
    }));
  };

  return (
    <>
      <PageMeta
        title={`${isEditMode ? 'Edit' : 'Add New'} Product - Phone Bay Admin`}
        description={`${isEditMode ? 'Edit existing' : 'Add new'} product to Phone Bay e-commerce platform`}
      />
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isEditMode ? 'Update the product details' : 'Create a new product in the system'}
          </p>
        </div>
        <div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    id="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand *
                  </label>
                  <select
                    name="brand_id"
                    id="brand_id"
                    required
                    value={formData.brand_id}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            </div>
            
            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          {/* Pricing & Inventory Section */}
          <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Pricing & Inventory</h2>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="has_variations"
                  name="has_variations"
                  type="checkbox"
                  checked={formData.has_variations}
                  onChange={toggleVariations}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="has_variations" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  This product has multiple variations (e.g., different sizes, colors, configurations)
                </label>
              </div>
            </div>
            
            {!formData.has_variations && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Regular Price ($) *
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Quantity *
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}
            
            {/* Product Variations Section */}
            {formData.has_variations && (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white/90">Product Variations</h3>
                  <button
                    type="button"
                    onClick={addVariation}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Add Variation
                  </button>
                </div>
                
                {formData.variations.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                    <p className="text-gray-500 dark:text-gray-400">
                      No variations added yet. Click "Add Variation" to create your first product variation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.variations.map((variation, index) => (
                      <div 
                        key={index} 
                        className="border border-gray-200 rounded-md p-4 dark:border-gray-700 relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeVariation(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Remove variation"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label htmlFor={`variation_name_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Variation Name *
                            </label>
                            <input
                              type="text"
                              id={`variation_name_${index}`}
                              required
                              placeholder="e.g., '8GB+128GB', 'Red', 'Large'"
                              value={variation.name}
                              onChange={(e) => handleVariationChange(index, 'name', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor={`variation_price_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Price *
                            </label>
                            <input
                              type="number"
                              id={`variation_price_${index}`}
                              required
                              min="0"
                              step="0.01"
                              value={variation.price}
                              onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value) || 0)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor={`variation_stock_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Stock Quantity *
                            </label>
                            <input
                              type="number"
                              id={`variation_stock_${index}`}
                              required
                              min="0"
                              step="1"
                              value={variation.stock_quantity}
                              onChange={(e) => handleVariationChange(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label htmlFor={`variation_sku_${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              SKU
                            </label>
                            <input
                              type="text"
                              id={`variation_sku_${index}`}
                              placeholder="Leave blank to auto-generate"
                              value={variation.sku || ''}
                              onChange={(e) => handleVariationChange(index, 'sku', e.target.value)}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3 flex space-x-6">
                          <div className="flex items-center">
                            <input
                              id={`variation_default_${index}`}
                              type="checkbox"
                              checked={variation.is_default}
                              onChange={(e) => handleVariationChange(index, 'is_default', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`variation_default_${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              Default Variation
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id={`variation_active_${index}`}
                              type="checkbox"
                              checked={variation.is_active}
                              onChange={(e) => handleVariationChange(index, 'is_active', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`variation_active_${index}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              Active
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 bg-blue-50 p-4 rounded-md dark:bg-blue-900/20">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        When variations are enabled, customers will be able to select from these options on the product page. 
                        Make sure to set one variation as the default.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex space-x-6">
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
              <div className="flex items-center">
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
            
            {/* Promotional Fields Section */}
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-3">Promotional Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    id="is_trending"
                    name="is_trending"
                    type="checkbox"
                    checked={formData.is_trending}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_trending" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Trending Product
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="is_special_offer"
                    name="is_special_offer"
                    type="checkbox"
                    checked={formData.is_special_offer}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_special_offer" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Special Offer
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="is_best_seller"
                    name="is_best_seller"
                    type="checkbox"
                    checked={formData.is_best_seller}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_best_seller" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Best Seller
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="is_todays_deal"
                    name="is_todays_deal"
                    type="checkbox"
                    checked={formData.is_todays_deal}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_todays_deal" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Today's Deal
                  </label>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                These options determine where this product will appear in promotional sections of the store.
              </p>
            </div>
          </div>
          
          {/* EMI Options Section */}
          <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">EMI Options</h2>
            
            <div className="flex items-center mb-4">
              <input
                id="emi_available"
                name="emi_available"
                type="checkbox"
                checked={formData.emi_available}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emi_available" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                EMI Available for this product
              </label>
            </div>
            
            {formData.emi_available && (
              <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    EMI Type
                  </label>
                  <div className="flex space-x-6">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="emi_type_normal"
                        name="emi_type_filter"
                        value="normal"
                        checked={formData.emi_type === 'normal'}
                        onChange={() => setFormData(prev => ({ ...prev, emi_type: 'normal' }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="emi_type_normal" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Normal EMI
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="emi_type_cardless"
                        name="emi_type_filter"
                        value="cardless"
                        checked={formData.emi_type === 'cardless'}
                        onChange={() => setFormData(prev => ({ ...prev, emi_type: 'cardless' }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="emi_type_cardless" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Cardless EMI
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available EMI Plans
                  </label>
                  {filteredEmiPlans.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No {formData.emi_type} EMI plans available. Please create EMI plans first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredEmiPlans.map(plan => (
                        <div key={plan.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`emi_plan_${plan.id}`}
                            value={plan.id}
                            checked={formData.emi_plans.includes(plan.id)}
                            onChange={handleEmiPlanSelection}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`emi_plan_${plan.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            {plan.name} - {plan.duration_months} months ({plan.interest_rate}%)
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Product Specifications Section */}
          <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Product Specifications</h2>
            
            <div className="border border-gray-300 rounded-md p-6 dark:border-gray-600">
              {renderSpecificationFields()}
            </div>
          </div>
          
          {/* Image Upload Section */}
          <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Product Images</h2>
            
            <div className="border border-gray-300 rounded-md p-6 dark:border-gray-600">
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Upload a primary product image (required):
                </p>
                <div className="flex items-center">
                  <label 
                    htmlFor="primary_image" 
                    className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Select Primary Image
                  </label>
                  <input
                    type="file"
                    id="primary_image"
                    accept="image/*"
                    onChange={handlePrimaryImageChange}
                    className="hidden"
                  />
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {formData.primary_image ? formData.primary_image.name : 'No file selected'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Upload additional product images (optional):
                </p>
                <div className="flex items-center">
                  <label 
                    htmlFor="additional_images" 
                    className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Select Additional Images
                  </label>
                  <input
                    type="file"
                    id="additional_images"
                    accept="image/*"
                    onChange={handleAdditionalImagesChange}
                    multiple
                    className="hidden"
                  />
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {formData.additional_images && formData.additional_images.length > 0 
                      ? `${formData.additional_images.length} file(s) selected` 
                      : 'No files selected'}
                  </span>
                </div>
              </div>
              
              {/* Image Preview Section */}
              {previewImages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Image Previews:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {previewImages.map((image, index) => (
                      <div 
                        key={index} 
                        className={`relative group border rounded-md overflow-hidden ${
                          image.isPrimary ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <img 
                          src={image.url} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex space-x-2">
                            {!image.isPrimary && (
                              <button
                                type="button"
                                onClick={() => setImageAsPrimary(index)}
                                className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                title="Set as primary"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Remove image"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {image.isPrimary && (
                          <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isEditMode ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ProductForm; 