import React, { useState, useEffect } from 'react';
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast } from "react-hot-toast";
import addressService from "../../services/addressService";

// Define the Address interface based on the backend model
export interface Address {
  id?: number;
  address_type: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'admin' | 'vendor' | 'user';
  is_verified: boolean;
  profile?: {
    id: number;
    profile_picture?: string;
    bio?: string;
    date_of_birth?: string;
    company_name?: string;
    business_address?: string;
    business_registration_number?: string;
    is_approved: boolean;
  };
  vendor_profile?: {
    id: number;
    company_name: string;
    business_email: string;
    business_phone: string;
    tax_id?: string;
    business_address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    status: string;
    is_featured: boolean;
    rating: number;
    business_certificate?: string;
    id_proof?: string;
    created_at: string;
    updated_at: string;
  };
  addresses?: Address[];
}

interface UserAddressCardProps {
  userProfile: UserProfile | null;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

export default function UserAddressCard({ userProfile, updateUserProfile }: UserAddressCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Function to force a full component refresh
  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  // Safely get default address without any null reference risk
  const getDefaultAddress = (): Address | undefined => {
    // Safety check - ensure addresses is an array with content
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return undefined;
    }
    
    // Find default address or use first one
    try {
      // Filter out any invalid entries first
      const validAddresses = addresses.filter(addr => 
        addr && typeof addr === 'object' && 
        'address_line1' in addr && 
        'full_name' in addr
      );
      
      if (validAddresses.length === 0) return undefined;
      
      // Find one marked as default
      const defaultAddr = validAddresses.find(addr => 
        addr && typeof addr.is_default === 'boolean' && addr.is_default === true
      );
      
      // Return default or first valid address
      return defaultAddr || validAddresses[0];
    } catch (error) {
      console.error('Error determining default address:', error);
      return undefined;
    }
  };
  
  // Get default address safely
  const defaultAddress = getDefaultAddress();
  
  // Form state for the address
  const [formData, setFormData] = useState<Address>({
    address_type: 'home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false
  });
  
  // Fetch addresses when component mounts or userProfile changes
  useEffect(() => {
    if (userProfile?.role !== 'vendor') {
      fetchAddresses();
    }
  }, [userProfile]);
  
  // Fetch addresses with retry mechanism
  const fetchAddresses = async (retryCount = 0, forceRefresh = true) => {
    try {
      setLoading(true);
      console.log('Fetching addresses, attempt:', retryCount + 1, 'force refresh:', forceRefresh);
      
      // Check if token exists
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No authentication token found');
        toast.error("Authentication required to load addresses");
        setAddresses([]);
        setLoading(false);
        return;
      }
      
      // Add timeout for fetch operation
      const fetchPromise = addressService.getAll(forceRefresh);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Fetch timeout after 10 seconds')), 10000);
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log('API response for addresses:', response);
      
      // Check for response validity
      if (!response || !Array.isArray(response)) {
        console.log('No valid addresses array returned from API');
        setAddresses([]);
        setLoading(false);
        return;
      }
      
      // Display debug info about the addresses
      console.log(`Received ${response.length} addresses:`, response.map(addr => ({
        id: addr.id,
        full_name: addr.full_name,
        is_default: addr.is_default
      })));

      // Clean and validate each address
      const cleanedAddresses = response.filter(addr => {
        if (!addr || typeof addr !== 'object') return false;
        
        if (!addr.id || !addr.full_name || !addr.address_line1) {
          console.warn('Found invalid address object, filtering out:', addr);
          return false;
        }
        
        return true;
      });
      
      console.log('Using cleaned addresses:', cleanedAddresses);
      setAddresses(cleanedAddresses);
      
      // Set the selected address ID after the state has been updated
      if (cleanedAddresses.length > 0) {
        // Find default address first
        const defaultAddr = cleanedAddresses.find(addr => addr.is_default === true);
        if (defaultAddr?.id) {
          console.log('Setting selected address to default:', defaultAddr.id);
          setSelectedAddressId(defaultAddr.id);
        } else {
          console.log('No default address found, using first address:', cleanedAddresses[0].id);
          setSelectedAddressId(cleanedAddresses[0].id);
        }
      } else {
        console.log('No addresses available, clearing selected address');
        setSelectedAddressId(null);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      
      if (error instanceof Error) {
        toast.error(`Failed to load addresses: ${error.message}`);
      } else {
        toast.error("Failed to load addresses");
      }
      
      // Retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`Retrying fetch addresses in ${delay}ms...`);
        setTimeout(() => fetchAddresses(retryCount + 1, forceRefresh), delay);
      } else {
        setAddresses([]);
        setSelectedAddressId(null);
      }
    } finally {
      // Always set loading to false regardless of retry count
      setLoading(false);
    }
  };
  
  // Add an effect to periodically sync with backend
  useEffect(() => {
    if (userProfile?.role !== 'vendor') {
      // Initial sync
      addressService.syncWithBackend(true);
      
      // Set up periodic sync every 10 seconds
      const syncInterval = setInterval(() => {
        addressService.syncWithBackend(false);
      }, 10000);
      
      // Set a timeout to ensure loading state is cleared
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.warn('Loading state stuck for too long, forcing reset');
          setLoading(false);
          refreshAddresses();
        }
      }, 15000);
      
      // Clean up interval on unmount
      return () => {
        clearInterval(syncInterval);
        clearTimeout(loadingTimeout);
      };
    }
  }, [userProfile]);
  
  // Add another effect to monitor and clear stuck loading states
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('Loading state persisted for 10s, forcing reset');
        setLoading(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  // Add a dedicated refresh function for the UI
  const refreshAddresses = () => {
    console.log('Refreshing addresses completely');
    // Force a complete component refresh
    forceRefresh();
    // Also sync with backend
    addressService.syncWithBackend(true);
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "is_default") {
      // Handle checkbox for is_default
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Save an address with multiple retries and forced refresh
  const handleSave = async (retryCount = 0) => {
    try {
      // Validate required fields
      const requiredFields = ['full_name', 'phone', 'address_line1', 'city', 'state', 'postal_code'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof Address]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return false;
      }
      
      setIsSubmitting(true);
      
      // Show a loading toast
      const loadingId = toast.loading(formData.id ? 'Updating address...' : 'Creating address...');
      
      try {
        // Create a clean data object
        const addressData = {
          ...formData,
          is_default: !!formData.is_default
        };
        
        console.log(`${retryCount > 0 ? 'Retry attempt ' + retryCount : 'Sending'} address data:`, addressData);
        
        let response;
        let responseData;
        
        if (formData.id) {
          // Update existing address
          response = await addressService.update(formData.id, addressData);
          responseData = response;
        } else {
          // Create new address
          response = await addressService.create(addressData);
          responseData = response;
        }
        
        console.log('Response from save operation:', responseData);
        
        // Verify the response contains the expected data
        if (responseData && typeof responseData === 'object') {
          // Verify key fields exist in the response
          const verifiedFields = ['id', 'full_name', 'address_line1', 'city'];
          const missingResponseFields = verifiedFields.filter(field => !(field in responseData));
          
          if (missingResponseFields.length > 0) {
            console.warn(`Response is missing expected fields: ${missingResponseFields.join(', ')}`);
            toast.error('Server response may be incomplete, refreshing data...');
          } else {
            console.log('✅ Server response validation passed');
          }
          
          // Directly add this item to our local cache for immediate display
          if (responseData.id) {
            // Force update local cache
            const existingIndex = addresses.findIndex(a => a.id === responseData.id);
            
            // Get a fresh copy of addresses
            let updatedAddresses = [...addresses];
            
            if (existingIndex >= 0) {
              // Update existing address
              updatedAddresses[existingIndex] = responseData;
            } else {
              // Add new address
              updatedAddresses.push(responseData);
            }
            
            // Update the component state directly
            console.log('Directly updating component state with new address data');
            setAddresses(updatedAddresses);
            
            // Select the new/updated address
            setSelectedAddressId(responseData.id);
          }
        }
        
        // Show success message
        toast.dismiss(loadingId);
        toast.success(formData.id ? 'Address updated successfully' : 'Address added successfully');
        
        // Close the modal first
        handleCloseModal();
        
        // Then force refresh the addresses multiple times to ensure we get the latest data
        // This addresses potential caching or race condition issues
        setTimeout(() => refreshAddresses(), 500);
        setTimeout(() => {
          refreshAddresses();
          // Add window reload as a last resort if UI still doesn't update
          if (retryCount === 0) {
            console.log('Force refreshing the entire page in 2 seconds if UI doesn\'t update');
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        }, 1500);
        
        return true;
      } catch (error) {
        // Show error message
        toast.dismiss(loadingId);
        
        if (retryCount < 2) {
          console.log(`Retrying save operation (attempt ${retryCount + 1})...`);
          return handleSave(retryCount + 1);
        }
        
        if (error instanceof Error) {
          toast.error(`Failed to save address: ${error.message}`);
        } else {
          toast.error('Failed to save address');
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('An error occurred');
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete an address with refresh
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    setIsSubmitting(true);
    
    // Show a loading toast
    const loadingId = toast.loading('Deleting address...');
    
    try {
      await addressService.delete(id);
      
      // Show success message
      toast.dismiss(loadingId);
      toast.success('Address deleted successfully');
      
      // Update the UI with multiple refreshes
      setTimeout(() => refreshAddresses(), 500);
      setTimeout(() => refreshAddresses(), 1500);
    } catch (error) {
      // Show error message
      toast.dismiss(loadingId);
      
      if (error instanceof Error) {
        toast.error(`Failed to delete address: ${error.message}`);
      } else {
        toast.error('Failed to delete address');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Set an address as default with refresh
  const handleSetDefault = async (id: number) => {
    setIsSubmitting(true);
    
    // Show a loading toast
    const loadingId = toast.loading('Setting as default...');
    
    try {
      await addressService.setDefault(id);
      
      // Show success message
      toast.dismiss(loadingId);
      toast.success('Address set as default');
      
      // Update the UI with multiple refreshes
      setTimeout(() => refreshAddresses(), 500);
      setTimeout(() => refreshAddresses(), 1500);
    } catch (error) {
      // Show error message
      toast.dismiss(loadingId);
      
      if (error instanceof Error) {
        toast.error(`Failed to set as default: ${error.message}`);
      } else {
        toast.error('Failed to set as default');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Open modal for adding a new address
  const handleAddAddress = () => {
    // Reset form data to defaults
    setFormData({
      address_type: 'home',
      full_name: userProfile?.first_name + ' ' + userProfile?.last_name || '',
      phone: userProfile?.phone || '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      is_default: addresses.length === 0 // Make default if it's the first address
    });
    
    console.log('Opening add address modal with clean form data');
    
    // Ensure we're opening the modal
    setTimeout(() => {
      openModal();
    }, 0);
  };
  
  // Override closeModal to ensure form is reset when closed
  const handleCloseModal = () => {
    console.log('Closing address modal');
    closeModal();
  };
  
  // Refresh addresses when modal closes (after an operation)
  useEffect(() => {
    if (!isOpen) {
      // Only refresh if we're closing the modal
      setTimeout(() => {
        console.log('Modal closed, refreshing addresses');
        refreshAddresses();
      }, 500);
    }
  }, [isOpen]);
  
  // Open modal for editing an existing address
  const handleEditAddress = (address: Address) => {
    try {
      // Validate the address object
      if (!address || typeof address !== 'object') {
        console.error('Invalid address object:', address);
        toast.error("Cannot edit invalid address");
        return;
      }
      
      // Create a safe copy with default values for any missing fields
      const safeAddress: Address = {
        id: address.id,
        address_type: address.address_type || 'home',
        full_name: address.full_name || '',
        phone: address.phone || '',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        is_default: typeof address.is_default === 'boolean' ? address.is_default : false
      };
      
      setFormData(safeAddress);
      openModal();
    } catch (error) {
      console.error('Error editing address:', error);
      toast.error("Failed to open address editor");
    }
  };
  
  const isVendor = userProfile?.role === 'vendor';
  
  return (
    <div key={refreshKey}>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              {isVendor ? "Business Location" : "Address"}
            </h4>

            {loading ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <button 
                  onClick={() => {
                    setLoading(false);
                    addressService.resetService();
                    forceRefresh();
                    toast.success("Loading state reset");
                    setTimeout(() => fetchAddresses(), 500);
                  }}
                  className="text-xs text-blue-500 hover:underline mt-2"
                >
                  Reset loading state
                </button>
              </div>
            ) : isVendor ? (
              // Vendor address fields
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Country
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.country || "Not provided"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  City/State
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.city && userProfile?.vendor_profile?.state
                      ? `${userProfile.vendor_profile.city}, ${userProfile.vendor_profile.state}`
                      : "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Business Address
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.business_address || "Not provided"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Postal Code
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.postal_code || "Not provided"}
                </p>
                </div>
              </div>
            ) : addresses && addresses.length > 0 ? (
              // Regular user addresses
              <div>
                {addresses && addresses.length > 1 && (
                  <div className="mb-4">
                    <label htmlFor="address-select" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Address:
                    </label>
                    <select
                      id="address-select"
                      className="block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={selectedAddressId || ''}
                      onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                    >
                      {addresses.filter(addr => addr && addr.id).map(addr => (
                        <option key={addr.id} value={addr.id}>
                          {addr && addr.address_type ? 
                            (addr.address_type.charAt(0).toUpperCase() + addr.address_type.slice(1)) : 'Address'}: {addr && addr.address_line1 ? addr.address_line1 : 'Unknown'}
                          {addr && addr.is_default === true ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {selectedAddressId && (
                  <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                    {/* Show the selected address details */}
                    {(() => {
                      // Find the address safely
                      const addr = addresses.find(a => a && a.id === selectedAddressId);
                      
                      // Safety check
                      if (!addr || typeof addr !== 'object') {
                        console.error('Selected address not found or invalid:', selectedAddressId);
                        return (
                          <div className="col-span-2">
                            <p className="text-sm text-red-500">
                              Selected address could not be found. Please try refreshing the page.
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Address Type
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {(addr.address_type || 'home').charAt(0).toUpperCase() + (addr.address_type || 'home').slice(1)}
                              {addr.is_default === true && " (Default)"}
                            </p>
                          </div>

                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Full Name
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {addr.full_name || "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Phone
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {addr.phone || "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Address
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {addr.address_line1 || "Not provided"}
                              {addr.address_line2 && `, ${addr.address_line2}`}
                            </p>
                          </div>

                          <div>
                            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              City/State
                            </p>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {addr.city || "Not provided"}, {addr.state || "Not provided"}
                            </p>
                          </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                              Postal Code
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {addr.postal_code || "Not provided"}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 col-span-2 mt-2">
                            <button
                              onClick={() => handleEditAddress(addr)}
                              className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                            >
                              Edit
                            </button>
                            {addr.is_default !== true && (
                              <button
                                onClick={() => addr.id && handleSetDefault(addr.id)}
                                className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => addr.id && handleDelete(addr.id)}
                              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No addresses found. Add an address to continue.</p>
            )}
          </div>

          <button
            onClick={isVendor ? openModal : handleAddAddress}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {isVendor ? "Edit Location" : "Add Address"}
          </button>
        </div>
      </div>
      
      <Modal isOpen={isOpen} onClose={handleCloseModal} className="max-w-[700px] m-4">
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {isVendor ? "Edit Business Location" : formData.id ? "Edit Address" : "Add New Address"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {isVendor 
                ? "Update your business location details."
                : "Enter your address details for shipping and billing."}
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="px-2 overflow-y-auto custom-scrollbar max-h-[450px]">
              {isVendor ? (
                // Vendor location form - read-only information message
                <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-900/30 dark:text-blue-400">
                  Business location information can be updated from the vendor settings page.
                </div>
              ) : (
                // Regular user address form
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Address Type</Label>
                    <select 
                      className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-500" 
                      name="address_type"
                      value={formData.address_type}
                      onChange={handleChange}
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label>Full Name</Label>
                    <Input 
                      type="text" 
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                </div>

                <div>
                    <Label>Phone</Label>
                    <Input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Address Line 1</Label>
                    <Input 
                      type="text" 
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Address Line 2 (Optional)</Label>
                    <Input 
                      type="text" 
                      name="address_line2"
                      value={formData.address_line2 || ''}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>City</Label>
                    <Input 
                      type="text" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label>State</Label>
                    <Input 
                      type="text" 
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                    />
                </div>

                <div>
                  <Label>Postal Code</Label>
                    <Input 
                      type="text" 
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                    />
                </div>

                  <div className="flex items-center col-span-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label 
                      htmlFor="is_default" 
                      className="block ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Set as default address
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                Cancel
              </Button>
              {!isVendor && (
                <Button 
                  size="sm" 
                  disabled={isSubmitting} 
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  {isSubmitting ? 'Saving...' : formData.id ? 'Update Address' : 'Save Address'}
              </Button>
              )}
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
