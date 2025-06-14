import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { categoryService, productFieldService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface ProductField {
  id: number;
  category: number;
  name: string;
  field_type: 'text' | 'number' | 'boolean' | 'select' | 'multi_select';
  group: string;
  options?: string[];
  is_required: boolean;
  is_filter: boolean;
  display_order: number;
}

interface ProductFieldFormData {
  category: number;
  name: string;
  field_type: 'text' | 'number' | 'boolean' | 'select' | 'multi_select';
  group: string;
  options?: string[];
  is_required: boolean;
  is_filter: boolean;
  display_order: number;
}

const CustomFields: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productFields, setProductFields] = useState<ProductField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingField, setEditingField] = useState<ProductField | null>(null);
  const [formData, setFormData] = useState<ProductFieldFormData>({
    category: 0,
    name: '',
    field_type: 'text',
    group: 'general',
    options: [],
    is_required: false,
    is_filter: false,
    display_order: 0
  });
  
  // Options input for select fields
  const [optionsInput, setOptionsInput] = useState('');
  
  // Field type options
  const fieldTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean (Yes/No)' },
    { value: 'select', label: 'Select (Dropdown)' },
    { value: 'multi_select', label: 'Multiple Select' }
  ];
  
  // Field group options
  const fieldGroupOptions = [
    { value: 'general', label: 'General' },
    { value: 'specifications', label: 'Specifications' },
    { value: 'dimensions', label: 'Dimensions' },
    { value: 'display', label: 'Display' },
    { value: 'features', label: 'Features' },
    { value: 'connectivity', label: 'Connectivity' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'camera', label: 'Camera' },
    { value: 'sensors', label: 'Sensors' },
    { value: 'box', label: 'Box Contents' },
    { value: 'compartments', label: 'Compartments' },
    { value: 'convenience', label: 'Convenience' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchProductFields(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryService.getAll();
      
      const categoriesArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
      
      setCategories(categoriesArray);
      
      // Set first category as selected if available
      if (categoriesArray.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesArray[0].id);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductFields = async (categoryId: number) => {
    try {
      setIsLoading(true);
      console.log(`Fetching product fields for category ID: ${categoryId}`);
      
      try {
        // First try the category-specific endpoint
        const data: any = await productFieldService.getByCategory(categoryId);
        
        console.log('Raw response from API:', data);
      
      const fieldsArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
      
        console.log(`Processed ${fieldsArray.length} fields for category ${categoryId}`);
        
        if (fieldsArray.length > 0) {
      setProductFields(fieldsArray);
      setError(null);
          return;
        }
        
        // If no fields found, try fetching all fields as fallback
        console.log('No fields found, trying to fetch all fields as fallback');
        const allFieldsData: any = await productFieldService.getAll();
        
        console.log('All fields response:', allFieldsData);
        
        const allFields = Array.isArray(allFieldsData) 
          ? allFieldsData 
          : allFieldsData.results && Array.isArray(allFieldsData.results) 
            ? allFieldsData.results 
            : [];
        
        // Filter fields for the selected category
        const filteredFields = allFields.filter((field: any) => {
          // Check different ways the category might be represented
          if (typeof field.category === 'number') {
            return field.category === categoryId;
          }
          if (field.category_id) {
            return field.category_id === categoryId;
          }
          if (field.category && typeof field.category === 'object' && field.category.id) {
            return field.category.id === categoryId;
          }
          return false;
        });
        
        console.log(`Found ${filteredFields.length} fields for category ${categoryId} from all fields`);
        setProductFields(filteredFields);
        setError(null);
      } catch (apiError) {
        console.error('API error:', apiError);
        setError('Failed to load product fields');
      }
    } catch (err) {
      console.error('Failed to load product fields:', err);
      setError('Failed to load product fields');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = parseInt(e.target.value);
    setSelectedCategory(categoryId);
    setFormData(prev => ({ ...prev, category: categoryId }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'field_type') {
      // Reset options when switching field type
      const fieldType = value as 'text' | 'number' | 'boolean' | 'select' | 'multi_select';
      setFormData(prev => ({
        ...prev,
        [name]: fieldType,
        options: fieldType === 'select' || fieldType === 'multi_select' ? [] : undefined
      }));
    } else if (name === 'display_order') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOptionsInput(e.target.value);
  };

  const processOptions = () => {
    if (!optionsInput) return [];
    
    // Split by line breaks or commas, trim whitespace, and filter out empty items
    return optionsInput
      .split(/[\n,]/)
      .map(option => option.trim())
      .filter(option => option.length > 0);
  };

  const handleAddField = () => {
    setShowForm(true);
    setEditingField(null);
    setFormData({
      category: selectedCategory || 0,
      name: '',
      field_type: 'text',
      group: 'general',
      options: [],
      is_required: false,
      is_filter: false,
      display_order: 0
    });
    setOptionsInput('');
  };

  const handleEditField = (field: ProductField) => {
    setShowForm(true);
    setEditingField(field);
    
    // Set options input text for select fields
    if ((field.field_type === 'select' || field.field_type === 'multi_select') && field.options) {
      setOptionsInput(Array.isArray(field.options) ? field.options.join('\n') : '');
    } else {
      setOptionsInput('');
    }
    
    setFormData({
      category: field.category,
      name: field.name,
      field_type: field.field_type,
      group: field.group,
      options: field.options || [],
      is_required: field.is_required,
      is_filter: field.is_filter,
      display_order: field.display_order
    });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Process options for select fields
      const submitData = {
        ...formData,
      };
      
      // For select or multi_select fields, ensure options is an array
      if (formData.field_type === 'select' || formData.field_type === 'multi_select') {
        submitData.options = processOptions();
      } else {
        // For other field types, options should be undefined or null, not an empty array
        submitData.options = undefined;
      }
      
      if (editingField) {
        // Update existing field
        await productFieldService.update(editingField.id, submitData);
        toast.success('Product field updated successfully');
      } else {
        // Create new field
        await productFieldService.create(submitData);
        toast.success('Product field created successfully');
      }
      
      // Refresh the list
      if (selectedCategory) {
        fetchProductFields(selectedCategory);
      }
      
      // Reset form
      setShowForm(false);
      setEditingField(null);
    } catch (err) {
      toast.error(editingField ? 'Failed to update product field' : 'Failed to create product field');
      console.error(err);
    }
  };

  const handleDeleteField = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this field? This may affect existing products.')) {
      try {
        await productFieldService.delete(id);
        setProductFields(productFields.filter(field => field.id !== id));
        toast.success('Product field deleted successfully');
      } catch (err) {
        toast.error('Failed to delete product field');
        console.error(err);
      }
    }
  };

  // Filter fields based on search query
  const filteredFields = productFields.filter(field => 
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fieldGroupOptions.find(g => g.value === field.group)?.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <PageMeta
        title="Custom Fields - Phone Bay Admin"
        description="Manage product custom fields and specifications"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Product Custom Fields
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Define custom specification fields for different product categories
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Category Selection */}
        <div className="w-full md:w-1/4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Categories
            </h3>
            
            {isLoading && !categories.length ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error && !categories.length ? (
              <div className="text-center py-4">
                <p className="text-red-500">{error}</p>
                <button 
                  onClick={fetchCategories} 
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={selectedCategory || ''}
                  onChange={handleCategoryChange}
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Fields List & Form */}
        <div className="w-full md:w-3/4">
          {selectedCategory ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  Custom Fields
                </h3>
                <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Search fields..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleAddField}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add Field
                  </button>
                </div>
              </div>
              
              {isLoading && selectedCategory ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-red-500">{error}</p>
                  <button 
                    onClick={() => fetchProductFields(selectedCategory)} 
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    Try Again
                  </button>
                </div>
              ) : showForm ? (
                <div className="border rounded-lg p-4 mb-4 dark:border-gray-700">
                  <h4 className="text-md font-medium text-gray-800 dark:text-white/90 mb-4">
                    {editingField ? 'Edit Field' : 'Add New Field'}
                  </h4>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Field Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Screen Size"
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Field Type *
                        </label>
                        <select
                          name="field_type"
                          value={formData.field_type}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          {fieldTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Field Group *
                        </label>
                        <select
                          name="group"
                          value={formData.group}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        >
                          {fieldGroupOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {(formData.field_type === 'select' || formData.field_type === 'multi_select') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Options (one per line) *
                        </label>
                        <textarea
                          name="options_input"
                          value={optionsInput}
                          onChange={handleOptionsChange}
                          required
                          placeholder="e.g.&#10;4 inches&#10;5 inches&#10;6 inches"
                          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          rows={4}
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          name="display_order"
                          value={formData.display_order}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_required"
                          name="is_required"
                          checked={formData.is_required}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_required" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Required Field
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_filter"
                          name="is_filter"
                          checked={formData.is_filter}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_filter" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Use as Filter
                        </label>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex space-x-2">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {editingField ? 'Update Field' : 'Create Field'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                filteredFields.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No fields match your search' : 'No custom fields defined for this category yet'}
                    </p>
                    <button
                      onClick={handleAddField}
                      className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Add Your First Field
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Group</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Required</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                        {filteredFields.map((field) => (
                          <tr key={field.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{field.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {fieldTypeOptions.find(t => t.value === field.field_type)?.label || field.field_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {fieldGroupOptions.find(g => g.value === field.group)?.label || field.group}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                field.is_required ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {field.is_required ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              <button 
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                onClick={() => handleEditField(field)}
                              >
                                Edit
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Please select a category to manage its custom fields
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomFields; 