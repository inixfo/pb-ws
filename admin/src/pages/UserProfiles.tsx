import React, { useEffect, useState } from 'react';
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard, { Address } from "../components/UserProfile/UserAddressCard";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/api";
import { toast } from "react-hot-toast";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'admin' | 'vendor' | 'user';
  is_verified: boolean;
  // Direct profile fields that might be sent to the API
  bio?: string;
  date_of_birth?: string; // Format: YYYY-MM-DD
  profile_picture?: string;
  // Nested profile object (from backend)
  profile?: {
    id: number;
    profile_picture?: string;
    bio?: string;
    date_of_birth?: string; // Format: YYYY-MM-DD
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

export default function UserProfiles() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUserProfile();
      setUserProfile(data);
      setError(null);
    } catch (err) {
      setError('Failed to load user profile');
      console.error(err);
      toast.error('Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updatedData: Partial<UserProfile>) => {
    try {
      console.log('⭐ Updating profile with data:', updatedData);
      
      // Check if this is a profile picture update
      const isProfilePictureUpdate = updatedData instanceof FormData && 
        Array.from((updatedData as FormData).keys()).includes('profile_picture');
      
      if (isProfilePictureUpdate) {
        console.log('⭐ This is a profile picture update with FormData');
        
        // Log FormData contents for debugging
        const formData = updatedData as FormData;
        for (const pair of formData.entries()) {
          const valuePreview = pair[1] instanceof File 
            ? `File: ${(pair[1] as File).name} (${(pair[1] as File).type}, ${(pair[1] as File).size} bytes)` 
            : pair[1];
          console.log(`⭐ FormData contains: ${pair[0]}: ${valuePreview}`);
        }
        
        // Get the actual file for detailed logging
        const file = formData.get('profile_picture') as File;
        if (file instanceof File) {
          console.log('⭐ Profile picture file details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toISOString()
          });
        } else {
          console.error('⭐ profile_picture is not a File object:', file);
        }
      }
      
      // Make the API call with detailed logging
      console.log('⭐ Sending API request to update profile...');
      
      // Show a pending toast
      const pendingToastId = toast.loading('Updating profile...');
      
      try {
        const data = await userService.updateProfile(updatedData);
        console.log('⭐ Profile update response:', data);
        
        // Clear the pending toast and show success
        toast.dismiss(pendingToastId);
        toast.success('Profile updated successfully');
        
        // Update the local state with the response data
        setUserProfile(prevProfile => {
          if (!prevProfile) return data;
          
          // For profile fields, we need to update the nested structure
          const updatedProfile = { ...prevProfile };
          
          // Update user fields
          if (data.first_name) updatedProfile.first_name = data.first_name;
          if (data.last_name) updatedProfile.last_name = data.last_name;
          if (data.phone) updatedProfile.phone = data.phone;
          
          // Ensure profile object exists
          if (!updatedProfile.profile) {
            updatedProfile.profile = {
              id: data.profile?.id || 0,
              is_approved: data.profile?.is_approved || false
            };
          }
          
          // Update profile fields in the nested structure
          if (data.profile?.bio) updatedProfile.profile.bio = data.profile.bio;
          if (data.profile?.date_of_birth) updatedProfile.profile.date_of_birth = data.profile.date_of_birth;
          
          // Update profile picture if it exists in the response
          if (data.profile?.profile_picture) {
            console.log('⭐ New profile picture URL:', data.profile.profile_picture);
            // For pictures, add a timestamp to ensure cache refresh
            const timestamp = new Date().getTime();
            updatedProfile.profile.profile_picture = data.profile.profile_picture.includes('?') 
              ? `${data.profile.profile_picture.split('?')[0]}?t=${timestamp}`
              : `${data.profile.profile_picture}?t=${timestamp}`;
            
            console.log('⭐ Updated profile picture URL with cache busting:', updatedProfile.profile.profile_picture);
          }
          
          // If this is an address update, refresh the addresses array
          if (data.addresses) {
            console.log('⭐ Updating addresses in profile state');
            updatedProfile.addresses = data.addresses;
          }
          
          // Log the updated profile for debugging
          console.log('⭐ Updated profile with new data:', updatedProfile);
          
          return updatedProfile;
        });
        
        // For profile picture updates, force multiple refreshes to ensure UI updates
        if (isProfilePictureUpdate) {
          // Immediate refresh to update the state
          console.log('⭐ Immediate profile refresh');
          fetchUserProfile();
          
          // Secondary refresh after a short delay
          setTimeout(() => {
            console.log('⭐ Secondary profile refresh after delay');
            fetchUserProfile();
          }, 500);
          
          // Final refresh after a longer delay to ensure images are loaded
          setTimeout(() => {
            console.log('⭐ Final profile refresh');
            fetchUserProfile();
            
            // As a last resort, force a full page reload
            setTimeout(() => {
              console.log('⭐ Forcing full page reload');
              window.location.reload();
            }, 1000);
          }, 1500);
        }
        
        return true;
      } catch (apiError) {
        // Clear the pending toast and show error
        toast.dismiss(pendingToastId);
        
        console.error('⭐ API Error in updateUserProfile:', apiError);
        
        let errorMessage = 'Failed to update profile';
        if (apiError instanceof Error) {
          errorMessage = `Failed to update profile: ${apiError.message}`;
        }
        
        toast.error(errorMessage);
        return false;
      }
    } catch (err) {
      console.error('⭐ Error in updateUserProfile:', err);
      
      let errorMessage = 'Failed to update profile';
      if (err instanceof Error) {
        errorMessage = `Failed to update profile: ${err.message}`;
      }
      
      toast.error(errorMessage);
      return false;
    }
  };

  return (
    <>
      <PageMeta
        title="My Profile - Phone Bay Admin"
        description="Manage your profile information"
      />
      <PageBreadcrumb pageTitle="Profile" />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => fetchUserProfile()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <div className="flex justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Profile
            </h3>
            <button 
              onClick={() => {
                toast.loading("Refreshing profile...");
                fetchUserProfile().then(() => {
                  toast.success("Profile refreshed");
                });
              }}
              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
            >
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path>
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
                Refresh
              </span>
            </button>
          </div>
          <div className="space-y-6">
            <UserMetaCard 
              userProfile={userProfile} 
              updateUserProfile={updateUserProfile} 
            />
            <UserInfoCard 
              userProfile={userProfile}
              updateUserProfile={updateUserProfile}
            />
            <UserAddressCard 
              userProfile={userProfile}
              updateUserProfile={updateUserProfile}
            />
          </div>
        </div>
      )}
    </>
  );
}
