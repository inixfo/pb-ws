import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { vendorService } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Vendor {
  id: number;
  company_name: string;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  business_email: string;
  business_phone: string;
  business_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  status: string;
  is_featured: boolean;
  created_at: string;
  products_count?: number;
}

interface VendorApproval {
  id: number;
  company_name: string;
  user: {
    id: number;
    full_name: string;
    email: string;
  };
  business_email: string;
  created_at: string;
  business_certificate: string | null;
  id_proof: string | null;
}

interface NewVendorFormData {
  company_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  full_name: string;
  email: string;
  password: string;
}

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pendingVendors, setPendingVendors] = useState<VendorApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New state variables for vendor details and edit
  const [showVendorDetailModal, setShowVendorDetailModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editVendorData, setEditVendorData] = useState<Partial<NewVendorFormData>>({});
  
  const [newVendorData, setNewVendorData] = useState<NewVendorFormData>({
    company_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    full_name: '',
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchVendors();
    fetchPendingVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching all vendors...');
      const data = await vendorService.getAll();
      console.log('Raw vendor response:', data);
      
      // Ensure we're working with an array
      const vendorsArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
          
      // Transform data if needed and add products count if not present
      const transformedVendors = vendorsArray.map((vendor: any) => ({
        ...vendor,
        products_count: vendor.products_count || 0
      }));
          
      setVendors(transformedVendors);
      console.log('Processed vendors data:', transformedVendors);
      setError(null);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingVendors = async () => {
    try {
      setIsPendingLoading(true);
      console.log('Fetching pending vendors...');
      const data = await vendorService.getPending();
      console.log('Raw pending vendors response:', data);
      
      // Ensure we're working with an array
      const pendingVendorsArray = Array.isArray(data) 
        ? data 
        : data.results && Array.isArray(data.results) 
          ? data.results 
          : [];
          
      setPendingVendors(pendingVendorsArray);
      console.log('Processed pending vendors data:', pendingVendorsArray);
      setPendingError(null);
    } catch (err) {
      console.error('Error fetching pending vendors:', err);
      setPendingError('Failed to load pending vendors');
    } finally {
      setIsPendingLoading(false);
    }
  };

  const handleApproveVendor = async (id: number) => {
    try {
      await vendorService.approve(id);
      
      // Remove from pending list
      setPendingVendors(pendingVendors.filter(vendor => vendor.id !== id));
      
      // Refresh vendors list
      fetchVendors();
      
      toast.success('Vendor approved successfully');
    } catch (err) {
      toast.error('Failed to approve vendor');
      console.error(err);
    }
  };

  const handleRejectVendor = async (id: number) => {
    try {
      await vendorService.reject(id);
      
      // Remove from pending list
      setPendingVendors(pendingVendors.filter(vendor => vendor.id !== id));
      
      // Refresh vendors list
      fetchVendors();
      
      toast.success('Vendor rejected successfully');
    } catch (err) {
      toast.error('Failed to reject vendor');
      console.error(err);
    }
  };

  const handleToggleVendorStatus = async (vendor: Vendor) => {
    try {
      if (vendor.status === 'approved') {
        await vendorService.suspend(vendor.id);
        
        // Update local state
        setVendors(vendors.map(v => 
          v.id === vendor.id ? { ...v, status: 'suspended' } : v
        ));
        
        toast.success('Vendor suspended successfully');
      } else {
        await vendorService.approve(vendor.id);
        
        // Update local state
        setVendors(vendors.map(v => 
          v.id === vendor.id ? { ...v, status: 'approved' } : v
        ));
        
        toast.success('Vendor activated successfully');
      }
    } catch (err) {
      toast.error('Failed to update vendor status');
      console.error(err);
    }
  };

  const handleToggleFeatureStatus = async (vendor: Vendor) => {
    try {
      if (vendor.is_featured) {
        await vendorService.unfeature(vendor.id);
        
        // Update local state
        setVendors(vendors.map(v => 
          v.id === vendor.id ? { ...v, is_featured: false } : v
        ));
        
        toast.success('Vendor unfeatured successfully');
      } else {
        await vendorService.feature(vendor.id);
        
        // Update local state
        setVendors(vendors.map(v => 
          v.id === vendor.id ? { ...v, is_featured: true } : v
        ));
        
        toast.success('Vendor featured successfully');
      }
    } catch (err) {
      toast.error('Failed to update featured status');
      console.error(err);
    }
  };

  // Add handler for View button
  const handleViewVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDetailModal(true);
  };

  // Add handler for Edit button
  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEditVendorData({
      company_name: vendor.company_name,
      business_email: vendor.business_email,
      business_phone: vendor.business_phone,
      // Initialize with available data - these may not be in the Vendor type 
      // but are necessary for the form
      business_address: vendor.business_address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      postal_code: vendor.postal_code || '',
      country: vendor.country || '',
      // User data not included here for security reasons
      full_name: '',
      email: '',
      password: ''
    });
    setShowEditVendorModal(true);
  };

  // Add handler for saving edited vendor
  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVendor) return;
    
    setIsSubmitting(true);
    
    try {
      // Only update vendor fields, not user fields
      const data = {
        company_name: editVendorData.company_name,
        business_email: editVendorData.business_email,
        business_phone: editVendorData.business_phone,
        business_address: editVendorData.business_address,
        city: editVendorData.city,
        state: editVendorData.state,
        postal_code: editVendorData.postal_code,
        country: editVendorData.country
      };
      
      await vendorService.update(selectedVendor.id, data);
      
      toast.success('Vendor updated successfully');
      setShowEditVendorModal(false);
      
      // Refresh vendors list
      fetchVendors();
    } catch (err) {
      console.error('Error updating vendor:', err);
      toast.error('Failed to update vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change for the new vendor form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVendorData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate the form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!newVendorData.company_name.trim()) {
      errors.company_name = "Company name is required";
    }
    
    if (!newVendorData.business_email.trim()) {
      errors.business_email = "Business email is required";
    } else if (!/\S+@\S+\.\S+/.test(newVendorData.business_email)) {
      errors.business_email = "Invalid email format";
    }
    
    if (!newVendorData.business_phone.trim()) {
      errors.business_phone = "Business phone is required";
    }
    
    if (!newVendorData.business_address.trim()) {
      errors.business_address = "Business address is required";
    }
    
    if (!newVendorData.city.trim()) {
      errors.city = "City is required";
    }
    
    if (!newVendorData.state.trim()) {
      errors.state = "State is required";
    }
    
    if (!newVendorData.postal_code.trim()) {
      errors.postal_code = "Postal code is required";
    }
    
    if (!newVendorData.country.trim()) {
      errors.country = "Country is required";
    }
    
    if (!newVendorData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }
    
    if (!newVendorData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newVendorData.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!newVendorData.password.trim()) {
      errors.password = "Password is required";
    } else if (newVendorData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the direct vendor creation API with auto-approved status
      const data = {
        // User data
        email: newVendorData.email,
        password: newVendorData.password,
        full_name: newVendorData.full_name,
        
        // Vendor data
        company_name: newVendorData.company_name,
        business_email: newVendorData.business_email,
        business_phone: newVendorData.business_phone,
        business_address: newVendorData.business_address,
        city: newVendorData.city,
        state: newVendorData.state,
        postal_code: newVendorData.postal_code,
        country: newVendorData.country
      };
      
      console.log('Sending vendor creation data:', data);
      
      // Use the create method which now handles both user and vendor profile creation
      await vendorService.create(data);
      
      toast.success('Vendor created successfully');
      setShowAddVendorModal(false);
      
      // Reset form
      setNewVendorData({
        company_name: '',
        business_email: '',
        business_phone: '',
        business_address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        full_name: '',
        email: '',
        password: ''
      });
      
      // Refresh vendors list
      fetchVendors();
      fetchPendingVendors();
    } catch (err) {
      console.error('Error creating vendor:', err);
      toast.error('Failed to create vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter vendors based on search query and status filter
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.business_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? vendor.status.toLowerCase() === statusFilter.toLowerCase() : true;
    
    return matchesSearch && matchesStatus;
  });

  // Sort vendors based on selected sort option
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'a-z') {
      return a.company_name.localeCompare(b.company_name);
    } else if (sortBy === 'z-a') {
      return b.company_name.localeCompare(a.company_name);
    } else if (sortBy === 'most-products') {
      return (b.products_count || 0) - (a.products_count || 0);
    }
    return 0;
  });

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <PageMeta
        title="Vendor Management - Phone Bay Admin"
        description="Manage vendors of Phone Bay e-commerce platform"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Vendor Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage vendors and their permissions
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Vendors List
              </h3>
            </div>
            <div>
              <button 
                onClick={() => setShowAddVendorModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add New Vendor
              </button>
            </div>
          </div>
          
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors..."
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="approved">Active</option>
                <option value="suspended">Inactive</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">Sort By</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="a-z">A-Z</option>
                <option value="z-a">Z-A</option>
                <option value="most-products">Most Products</option>
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
                onClick={() => fetchVendors()} 
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Store Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Owner</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Phone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Products</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Joined</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Featured</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {sortedVendors.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No vendors found matching the criteria
                      </td>
                    </tr>
                  ) : (
                    sortedVendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.company_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.user?.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.business_email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.business_phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.products_count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(vendor.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vendor.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {vendor.status === 'approved' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vendor.is_featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {vendor.is_featured ? 'Featured' : 'Not Featured'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button 
                            onClick={() => handleViewVendor(vendor)}
                            className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button 
                            onClick={() => handleEditVendor(vendor)}
                            className="text-gray-600 hover:text-gray-900 mr-3">Edit</button>
                          <button 
                            onClick={() => handleToggleVendorStatus(vendor)}
                            className={`mr-3 ${
                              vendor.status === 'approved' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {vendor.status === 'approved' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => handleToggleFeatureStatus(vendor)}
                            className={`${
                              vendor.is_featured ? 'text-gray-600 hover:text-gray-900' : 'text-blue-600 hover:text-blue-900'
                            }`}
                          >
                            {vendor.is_featured ? 'Unfeature' : 'Feature'}
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
              Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedVendors.length}</span> of <span className="font-medium">{sortedVendors.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Previous</button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
              <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md">Next</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Vendor Verification
          </h3>
          
          {isPendingLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : pendingError ? (
            <div className="text-center py-8">
              <p className="text-red-500">{pendingError}</p>
              <button 
                onClick={() => fetchPendingVendors()} 
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Store Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Owner</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Applied On</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Documents</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {pendingVendors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No pending vendor applications
                      </td>
                    </tr>
                  ) : (
                    pendingVendors.map((vendor) => (
                      <tr key={vendor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.company_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.user?.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vendor.business_email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(vendor.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vendor.business_certificate || vendor.id_proof ? (
                            <button className="text-blue-600 hover:text-blue-900">View Documents</button>
                          ) : (
                            <span className="text-gray-400">No documents</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button 
                            onClick={() => handleApproveVendor(vendor.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectVendor(vendor.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Add New Vendor
              </h3>
              <button
                onClick={() => setShowAddVendorModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddVendor}>
              <div className="px-6 py-4">
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                    Store Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Name*
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={newVendorData.company_name}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.company_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter company name"
                      />
                      {formErrors.company_name && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.company_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Email*
                      </label>
                      <input
                        type="email"
                        name="business_email"
                        value={newVendorData.business_email}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.business_email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter business email"
                      />
                      {formErrors.business_email && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.business_email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Phone*
                      </label>
                      <input
                        type="text"
                        name="business_phone"
                        value={newVendorData.business_phone}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.business_phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter business phone"
                      />
                      {formErrors.business_phone && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.business_phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Address*
                      </label>
                      <input
                        type="text"
                        name="business_address"
                        value={newVendorData.business_address}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.business_address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter business address"
                      />
                      {formErrors.business_address && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.business_address}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City*
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={newVendorData.city}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter city"
                      />
                      {formErrors.city && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State/Province*
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={newVendorData.state}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter state/province"
                      />
                      {formErrors.state && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code*
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        value={newVendorData.postal_code}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.postal_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter postal code"
                      />
                      {formErrors.postal_code && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.postal_code}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country*
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={newVendorData.country}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter country"
                      />
                      {formErrors.country && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.country}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                    Owner/Account Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name*
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={newVendorData.full_name}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.full_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter full name"
                      />
                      {formErrors.full_name && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.full_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email*
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newVendorData.email}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter email"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password*
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={newVendorData.password}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white`}
                        placeholder="Enter password"
                      />
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Detail Modal */}
      {showVendorDetailModal && selectedVendor && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Vendor Details: {selectedVendor.company_name}
              </h3>
              <button
                onClick={() => setShowVendorDetailModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.company_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedVendor.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      selectedVendor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      selectedVendor.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVendor.status.charAt(0).toUpperCase() + selectedVendor.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Featured</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedVendor.is_featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedVendor.is_featured ? 'Featured' : 'Not Featured'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Joined Date</p>
                    <p className="text-sm text-gray-800 dark:text-white">{formatDate(selectedVendor.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Products Count</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.products_count || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Email</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.business_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Phone</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.business_phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                  Location Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Address</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.business_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">City</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.city}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">State/Province</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.state}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.postal_code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.country}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                  Owner Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner ID</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner Email</p>
                    <p className="text-sm text-gray-800 dark:text-white">{selectedVendor.user.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setShowVendorDetailModal(false);
                  handleEditVendor(selectedVendor);
                }}
                className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setShowVendorDetailModal(false);
                  handleToggleVendorStatus(selectedVendor);
                }}
                className={`mr-2 px-4 py-2 rounded-lg ${
                  selectedVendor.status === 'approved' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {selectedVendor.status === 'approved' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => {
                  setShowVendorDetailModal(false);
                  handleToggleFeatureStatus(selectedVendor);
                }}
                className={`mr-2 px-4 py-2 rounded-lg ${
                  selectedVendor.is_featured 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedVendor.is_featured ? 'Unfeature' : 'Feature'}
              </button>
              <button
                onClick={() => {
                  setShowVendorDetailModal(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditVendorModal && selectedVendor && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Edit Vendor: {selectedVendor.company_name}
              </h3>
              <button
                onClick={() => setShowEditVendorModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateVendor}>
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                    Store Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Name*
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={editVendorData.company_name || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, company_name: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter company name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Email*
                      </label>
                      <input
                        type="email"
                        name="business_email"
                        value={editVendorData.business_email || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, business_email: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter business email"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Phone*
                      </label>
                      <input
                        type="text"
                        name="business_phone"
                        value={editVendorData.business_phone || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, business_phone: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter business phone"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                    Location Details
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Business Address*
                      </label>
                      <input
                        type="text"
                        name="business_address"
                        value={editVendorData.business_address || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, business_address: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter business address"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City*
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={editVendorData.city || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, city: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter city"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State/Province*
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={editVendorData.state || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, state: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter state/province"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code*
                      </label>
                      <input
                        type="text"
                        name="postal_code"
                        value={editVendorData.postal_code || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, postal_code: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter postal code"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country*
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={editVendorData.country || ''}
                        onChange={(e) => setEditVendorData({...editVendorData, country: e.target.value})}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:text-white"
                        placeholder="Enter country"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-semibold text-gray-700 dark:text-white/90 mb-3">
                    Status Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                          selectedVendor.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          selectedVendor.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          selectedVendor.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedVendor.status.charAt(0).toUpperCase() + selectedVendor.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          (Use the Activate/Deactivate button to change status)
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Featured Status
                      </label>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                          selectedVendor.is_featured ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedVendor.is_featured ? 'Featured' : 'Not Featured'}
                        </span>
                        <span className="text-sm text-gray-500">
                          (Use the Feature/Unfeature button to change status)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditVendorModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorManagement; 