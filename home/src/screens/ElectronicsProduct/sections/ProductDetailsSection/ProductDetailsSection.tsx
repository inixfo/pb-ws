import React from "react";
import { Loader2Icon, AlertCircleIcon } from "lucide-react";
import { useProduct } from "../../../../contexts/ProductContext";

export const ProductDetailsSection = (): JSX.Element => {
  const { product, loading, error } = useProduct();
  
  // Helper function to format specification values
  const formatSpecValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    } else if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    } else if (value === null || value === undefined) {
      return 'N/A';
    } else {
      return String(value);
    }
  };
  
  // Get key specifications for summary based on product category
  const getProductSummary = React.useMemo(() => {
    if (!product?.specifications || !product?.category) return [];
    
    const specs = product.specifications;
    const categoryName = product.category.name.toLowerCase();
    
    // Define key specs for different categories
    if (categoryName.includes('phone') || categoryName.includes('mobile')) {
      return [
        { label: 'OS', value: specs.os_type || specs.os || 'N/A' },
        { label: 'Processor', value: specs.processor || 'N/A' },
        { label: 'RAM', value: specs.ram || 'N/A' },
        { label: 'Storage', value: specs.storage || specs.storage_capacity || 'N/A' },
        { label: 'Display', value: specs.display_size || specs.display || 'N/A' },
        { label: 'Battery', value: specs.battery || 'N/A' }
      ];
    } 
    else if (categoryName.includes('laptop') || categoryName.includes('computer')) {
      return [
        { label: 'Processor', value: specs.processor || 'N/A' },
        { label: 'RAM', value: specs.ram || 'N/A' },
        { label: 'Storage', value: specs.storage || specs.storage_capacity || 'N/A' },
        { label: 'Display', value: specs.display_size || specs.display || 'N/A' },
        { label: 'Graphics', value: specs.graphics || 'N/A' },
        { label: 'OS', value: specs.os || 'N/A' }
      ];
    }
    else if (categoryName.includes('camera')) {
      return [
        { label: 'Resolution', value: specs.resolution || 'N/A' },
        { label: 'Sensor', value: specs.sensor || 'N/A' },
        { label: 'Lens', value: specs.lens || 'N/A' },
        { label: 'Video', value: specs.video || 'N/A' },
        { label: 'Battery', value: specs.battery || 'N/A' }
      ];
    }
    else if (categoryName.includes('tv') || categoryName.includes('television')) {
      return [
        { label: 'Display Size', value: specs.display_size || 'N/A' },
        { label: 'Resolution', value: specs.resolution || 'N/A' },
        { label: 'Smart TV', value: specs.smart_tv || 'N/A' },
        { label: 'Connectivity', value: specs.connectivity || 'N/A' }
      ];
    }
    else if (categoryName.includes('headphone') || categoryName.includes('earphone')) {
      return [
        { label: 'Type', value: specs.type || 'N/A' },
        { label: 'Wireless', value: specs.wireless || 'N/A' },
        { label: 'Noise Cancellation', value: specs.noise_cancellation || 'N/A' },
        { label: 'Battery Life', value: specs.battery_life || 'N/A' }
      ];
    }
    // Default for other categories - get first 4-6 specs
    else {
      const summarySpecs = [];
      let count = 0;
      
      for (const [key, value] of Object.entries(specs)) {
        if (count >= 6) break;
        if (key !== 'colors' && key !== 'emi_available') {
          summarySpecs.push({
            label: key.replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
            value: formatSpecValue(value)
          });
          count++;
        }
      }
      
      return summarySpecs;
    }
  }, [product]);
  
  // Group specifications by category
  const groupedSpecs = React.useMemo(() => {
    if (!product?.specifications) return {};
    
    const result: Record<string, Record<string, any>> = {
      'General': {},
      'Technical': {},
      'Physical': {},
      'Other': {}
    };
    
    // Map specification keys to groups
    const specGroups: Record<string, string> = {
      // General specs
      'colors': 'General',
      'storage_capacity': 'General',
      'warranty': 'General',
      'emi_available': 'General',
      
      // Technical specs
      'processor': 'Technical',
      'ram': 'Technical',
      'display': 'Technical',
      'camera': 'Technical',
      'battery': 'Technical',
      'os': 'Technical',
      
      // Physical specs
      'dimensions': 'Physical',
      'weight': 'Physical',
      'material': 'Physical'
    };
    
    // Sort specifications into groups
    Object.entries(product.specifications).forEach(([key, value]) => {
      const group = specGroups[key] || 'Other';
      result[group][key] = value;
    });
    
    // Remove empty groups
    Object.keys(result).forEach(group => {
      if (Object.keys(result[group]).length === 0) {
        delete result[group];
      }
    });
    
    return result;
  }, [product]);
  
  // Format specification key for display
  const formatSpecKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="w-8 h-8 text-primarymain animate-spin" />
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircleIcon className="w-8 h-8 text-dangermain mb-2" />
        <p className="text-gray-600">Failed to load product details</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      {/* Product Summary */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Product Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getProductSummary.map((spec, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">{spec.label}</div>
              <div className="font-medium text-gray-900">{spec.value}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Product Description */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Description</h3>
        <div className="text-gray-700 whitespace-pre-line">
          {product.description}
        </div>
      </div>
      
      {/* Product Specifications */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Specifications</h3>
        
        {Object.keys(groupedSpecs).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedSpecs).map(([group, specs]) => (
              <div key={group} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h4 className="font-semibold text-gray-900">{group}</h4>
                </div>
                <div className="divide-y">
                  {Object.entries(specs).map(([key, value]) => {
                    // Special handling for colors array
                    if (key === 'colors' && Array.isArray(value)) {
                      return (
                        <div key={key} className="flex px-4 py-3">
                          <div className="w-1/3 font-medium text-gray-700">{formatSpecKey(key)}</div>
                          <div className="w-2/3 text-gray-600 flex flex-wrap gap-2">
                            {value.map((color: any, index: number) => (
                              <div key={index} className="flex items-center gap-1">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: color.hex_code || '#ccc' }}
                                />
                                <span>{color.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={key} className="flex px-4 py-3">
                        <div className="w-1/3 font-medium text-gray-700">{formatSpecKey(key)}</div>
                        <div className="w-2/3 text-gray-600">{formatSpecValue(value)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No detailed specifications available for this product.</p>
        )}
        
        {/* Brand and Category Information */}
        <div className="mt-6 border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h4 className="font-semibold text-gray-900">Product Information</h4>
          </div>
          <div className="divide-y">
            <div className="flex px-4 py-3">
              <div className="w-1/3 font-medium text-gray-700">Brand</div>
              <div className="w-2/3 text-gray-600">{product.brand.name}</div>
            </div>
            <div className="flex px-4 py-3">
              <div className="w-1/3 font-medium text-gray-700">Category</div>
              <div className="w-2/3 text-gray-600">{product.category.name}</div>
            </div>
            <div className="flex px-4 py-3">
              <div className="w-1/3 font-medium text-gray-700">SKU</div>
              <div className="w-2/3 text-gray-600">{product.default_sku || `PB-${product.id.toString().padStart(6, '0')}`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 