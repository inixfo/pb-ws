import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageMeta from '../../components/common/PageMeta';
import { userService } from '../../services/api';
import { toast, Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface VendorProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_verified: boolean;
  profile?: {
    id: number;
    profile_picture?: string;
    bio?: string;
    date_of_birth?: string;
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
  store_settings?: {
    id: number;
    store_name: string;
    store_description?: string;
    logo?: string;
    banner?: string;
    support_email?: string;
    support_phone?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    enable_emi: boolean;
    enable_cod: boolean;
    auto_approve_reviews: boolean;
    commission_rate: number;
  };
  bank_account?: {
    id: number;
    account_name: string;
    account_number: string;
    bank_name: string;
    branch_name: string;
    routing_number?: string;
    swift_code?: string;
  };
}

const VendorProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    store_name: '',
    store_description: '',
    support_email: '',
    support_phone: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        company_name: profile.vendor_profile?.company_name || '',
        business_email: profile.vendor_profile?.business_email || '',
        business_phone: profile.vendor_profile?.business_phone || '',
        business_address: profile.vendor_profile?.business_address || '',
        city: profile.vendor_profile?.city || '',
        state: profile.vendor_profile?.state || '',
        postal_code: profile.vendor_profile?.postal_code || '',
        country: profile.vendor_profile?.country || '',
        store_name: profile.store_settings?.store_name || '',
        store_description: profile.store_settings?.store_description || '',
        support_email: profile.store_settings?.support_email || '',
        support_phone: profile.store_settings?.support_phone || '',
        website: profile.store_settings?.website || '',
        facebook: profile.store_settings?.facebook || '',
        instagram: profile.store_settings?.instagram || '',
        twitter: profile.store_settings?.twitter || '',
      });
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUserProfile();
      console.log('DEBUGGING VENDOR STATUS ISSUE:');
      console.log('Full profile data:', data);
      console.log('Vendor profile:', data?.vendor_profile);
      console.log('Vendor status (raw):', data?.vendor_profile?.status);
      console.log('Status type:', typeof data?.vendor_profile?.status);
      console.log('Status lowercase:', data?.vendor_profile?.status?.toLowerCase?.());
      console.log('Status === "approved":', data?.vendor_profile?.status === 'approved');
      console.log('Status === "Approved":', data?.vendor_profile?.status === 'Approved');
      setProfile(data);
      setError(null);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formDataToSend = new FormData();
      
      // Add basic user fields
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('phone', formData.phone);
      
      // Add vendor profile fields if they exist
      if (profile?.vendor_profile) {
        formDataToSend.append('vendor_profile.company_name', formData.company_name);
        formDataToSend.append('vendor_profile.business_email', formData.business_email);
        formDataToSend.append('vendor_profile.business_phone', formData.business_phone);
        formDataToSend.append('vendor_profile.business_address', formData.business_address);
        formDataToSend.append('vendor_profile.city', formData.city);
        formDataToSend.append('vendor_profile.state', formData.state);
        formDataToSend.append('vendor_profile.postal_code', formData.postal_code);
        formDataToSend.append('vendor_profile.country', formData.country);
      }
      
      // Add store settings fields if they exist
      if (profile?.store_settings) {
        formDataToSend.append('store_settings.store_name', formData.store_name);
        formDataToSend.append('store_settings.store_description', formData.store_description);
        formDataToSend.append('store_settings.support_email', formData.support_email);
        formDataToSend.append('store_settings.support_phone', formData.support_phone);
        formDataToSend.append('store_settings.website', formData.website);
        formDataToSend.append('store_settings.facebook', formData.facebook);
        formDataToSend.append('store_settings.instagram', formData.instagram);
        formDataToSend.append('store_settings.twitter', formData.twitter);
      }
      
      // Add profile picture if selected
      if (selectedFile) {
        formDataToSend.append('profile_picture', selectedFile);
      }
      
      await userService.updateProfile(formDataToSend);
      await fetchProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchProfile} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // Fix vendor status if needed
  if (profile?.vendor_profile?.status === 'Approved') {
    console.log('Fixing vendor status from "Approved" to "approved" in render');
    profile.vendor_profile.status = 'approved';
  }

  return (
    <>
      <PageMeta
        title="My Profile - Phone Bay Vendor"
        description="Manage your vendor profile on Phone Bay"
      />
      
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          My Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your vendor profile and store settings
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div className="h-32 w-32 overflow-hidden rounded-full bg-gray-100">
                  <img 
                    src={previewUrl || profile?.profile?.profile_picture || '/images/user/owner.jpg'} 
                    alt={`${profile?.first_name} ${profile?.last_name}`}
                    className="h-full w-full object-cover" 
                  />
                </div>
                {isEditing && (
                  <button 
                    onClick={() => document.getElementById('profile-picture')?.click()}
                    className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
              </div>
              <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                {profile?.vendor_profile?.status === 'Approved' || profile?.vendor_profile?.status === 'approved' ? (
                  <span className="text-green-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                    Active
                  </span>
                ) : profile?.vendor_profile?.status === 'pending' || profile?.vendor_profile?.status === 'Pending' ? (
                  <span className="text-yellow-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
                    Pending Approval
                  </span>
                ) : (
                  <span className="text-red-600">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                    {profile?.vendor_profile?.status || 'Unknown Status'}
                  </span>
                )}
              </p>
              
              <div className="w-full mt-4">
                <div className="mb-3 flex justify-between px-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{profile?.email}</span>
                </div>
                <div className="mb-3 flex justify-between px-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Phone:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{profile?.phone}</span>
                </div>
                <div className="mb-3 flex justify-between px-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Company:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{profile?.vendor_profile?.company_name}</span>
                </div>
                {profile && profile.vendor_profile && typeof profile.vendor_profile.rating === 'number' && profile.vendor_profile.rating > 0 && (
                  <div className="mb-3 flex justify-between px-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Rating:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {profile.vendor_profile.rating.toFixed(1)}
                      <span className="text-yellow-500 ml-1">★</span>
                    </span>
                  </div>
                )}
                {profile?.vendor_profile?.is_featured && (
                  <div className="mb-3 flex justify-between px-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Featured:</span>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Yes</span>
                  </div>
                )}
              </div>
              
              {!isEditing && (
                <div className="space-y-2">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                  
                  {profile?.vendor_profile?.status === 'Approved' || profile?.vendor_profile?.status === 'approved' ? (
                    <Link 
                      to="/vendor/products"
                      className="block w-full text-center rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      Manage Products
                    </Link>
                  ) : null}
                  
                  {/* Debug button */}
                  <button
                    onClick={() => {
                      console.log('DEBUG VENDOR STATUS:');
                      console.log('Profile:', profile);
                      console.log('Vendor profile:', profile?.vendor_profile);
                      console.log('Status (raw):', profile?.vendor_profile?.status);
                      console.log('Status type:', typeof profile?.vendor_profile?.status);
                      console.log('Status === "approved":', profile?.vendor_profile?.status === 'approved');
                      console.log('Status === "Approved":', profile?.vendor_profile?.status === 'Approved');
                      
                      // Try to fetch profile again
                      fetchProfile();
                      
                      // Show status in alert for immediate feedback
                      alert(`Current vendor status: "${profile?.vendor_profile?.status}"\nType: ${typeof profile?.vendor_profile?.status}`);
                    }}
                    className="w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 mt-2"
                  >
                    Debug Status
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Profile Edit Form */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              {isEditing ? 'Edit Profile' : 'Profile Information'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              {/* Hidden file input */}
              <input
                type="file"
                id="profile-picture"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">{profile?.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">{profile?.last_name}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">{profile?.phone}</p>
                )}
              </div>
              
              <h4 className="text-md font-medium text-gray-800 dark:text-white mt-6 mb-3 border-t pt-4">
                Business Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">{profile?.vendor_profile?.company_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="business_email"
                      value={formData.business_email}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">{profile?.vendor_profile?.business_email}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="business_phone"
                      value={formData.business_phone}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">{profile?.vendor_profile?.business_phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="business_address"
                      value={formData.business_address}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-800 dark:text-white">{profile?.vendor_profile?.business_address}</p>
                  )}
                </div>
              </div>
              
              <h4 className="text-md font-medium text-gray-800 dark:text-white mt-6 mb-3 border-t pt-4">
                Store Settings
              </h4>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">{profile?.store_settings?.store_name}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Description
                </label>
                {isEditing ? (
                  <textarea
                    name="store_description"
                    value={formData.store_description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-800 dark:text-white">{profile?.store_settings?.store_description}</p>
                )}
              </div>
              
              {isEditing && (
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorProfilePage; 