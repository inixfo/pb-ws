import React, { useState, useRef, useEffect } from 'react';
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast } from "react-hot-toast";
import { API_URL } from "../../config/api";

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
}

interface UserInfoCardProps {
  userProfile: UserProfile | null;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

const ProfileImage = ({ 
  src, 
  alt, 
  fallbackSrc = "/images/user/owner.jpg",
  className = "w-full h-full object-cover"
}: { 
  src: string; 
  alt: string; 
  fallbackSrc?: string;
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // Reset image source when src prop changes
  useEffect(() => {
    setImgSrc(src);
    setRetryCount(0);
  }, [src]);
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`Image load error for ${imgSrc}:`, e);
    
    // Try to fix common URL issues
    if (retryCount === 0 && imgSrc.includes('/media/')) {
      // Try prepending API base URL
      const newSrc = imgSrc.startsWith('http') ? imgSrc : `${API_URL.replace('/api', '')}${imgSrc}`;
      console.log(`Retrying with fixed URL: ${newSrc}`);
      setImgSrc(newSrc);
      setRetryCount(prev => prev + 1);
      return;
    }
    
    // Add cache busting parameter if not already present
    if (retryCount === 1) {
      const cacheBustSrc = imgSrc.includes('?') 
        ? `${imgSrc}&t=${Date.now()}` 
        : `${imgSrc}?t=${Date.now()}`;
      console.log(`Retrying with cache busting: ${cacheBustSrc}`);
      setImgSrc(cacheBustSrc);
      setRetryCount(prev => prev + 1);
      return;
    }
    
    // Try absolute URL from different base
    if (retryCount === 2) {
      const absoluteSrc = `http://3.25.95.103/admin${imgSrc.split('?')[0]}?t=${Date.now()}`;
      console.log(`Retrying with absolute URL: ${absoluteSrc}`);
      setImgSrc(absoluteSrc);
      setRetryCount(prev => prev + 1);
      return;
    }
    
    // If we've tried everything, use fallback
    if (retryCount >= maxRetries) {
      console.log(`Falling back to default image after ${retryCount} retries`);
      setImgSrc(fallbackSrc);
    }
  };
  
  return (
    <img 
      src={imgSrc} 
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

export default function UserInfoCard({ userProfile, updateUserProfile }: UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form state depends on user role
  const [formData, setFormData] = useState({
    // Common fields
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    
    // Regular user/admin fields
    bio: userProfile?.profile?.bio || "",
    date_of_birth: userProfile?.profile?.date_of_birth || "",
    
    // Vendor specific fields
    company_name: userProfile?.vendor_profile?.company_name || "",
    business_email: userProfile?.vendor_profile?.business_email || "",
    business_phone: userProfile?.vendor_profile?.business_phone || ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      // Always use FormData for uploads
      const formDataToSend = new FormData();
      
      // Add basic user fields
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('phone', formData.phone);
      
      // Add profile-specific fields
      if (formData.bio) {
        formDataToSend.append('bio', formData.bio);
      }
      
      if (formData.date_of_birth) {
        formDataToSend.append('date_of_birth', formData.date_of_birth);
      }
      
      // Add the file if it exists
      if (selectedFile) {
        console.log('Adding profile picture to FormData:', selectedFile.name, selectedFile.type, selectedFile.size);
        formDataToSend.append('profile_picture', selectedFile);
        
        // Log the file object for debugging
        console.log('File object details:', {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          lastModified: new Date(selectedFile.lastModified).toISOString()
        });
      }
      
      // Log all FormData fields for debugging
      console.log('FormData contents:');
      for (const pair of formDataToSend.entries()) {
        const valuePreview = pair[1] instanceof File 
          ? `File: ${(pair[1] as File).name} (${(pair[1] as File).type}, ${(pair[1] as File).size} bytes)` 
          : pair[1];
        console.log(`- ${pair[0]}: ${valuePreview}`);
      }
      
      console.log('Sending profile update with FormData');
      
      // Show a loading toast
      const loadingToast = toast.loading('Updating profile...');
      
      try {
        const success = await updateUserProfile(formDataToSend as any);
        
        toast.dismiss(loadingToast);
        
        if (success) {
          toast.success('Profile updated successfully');
          closeModal();
          setSelectedFile(null);
          setPreviewUrl(null);
          
          // For profile picture updates, add a refresh after a delay
          if (selectedFile) {
            console.log('Profile picture updated, forcing refresh in 1s');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else {
          toast.error('Failed to update profile');
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error("Error from API call:", error);
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Initialize form data when modal opens
  const handleOpenModal = () => {
    setFormData({
      first_name: userProfile?.first_name || "",
      last_name: userProfile?.last_name || "",
      email: userProfile?.email || "",
      phone: userProfile?.phone || "",
      bio: userProfile?.profile?.bio || "",
      date_of_birth: userProfile?.profile?.date_of_birth || "",
      company_name: userProfile?.vendor_profile?.company_name || "",
      business_email: userProfile?.vendor_profile?.business_email || "",
      business_phone: userProfile?.vendor_profile?.business_phone || ""
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    openModal();
  };
  
  // Determine fields to display based on role
  const isVendor = userProfile?.role === 'vendor';
  
  // Get the profile image URL with proper fallback and cache busting
  const timestamp = new Date().getTime(); // For cache busting
  const profileImageUrl = userProfile?.profile?.profile_picture 
    ? userProfile.profile.profile_picture.startsWith('http') 
      ? `${userProfile.profile.profile_picture}?t=${timestamp}` 
      : `${API_URL}${userProfile.profile.profile_picture}?t=${timestamp}`
    : "/images/user/owner.jpg";
  
  console.log('UserInfoCard - Profile image URL:', {
    original: userProfile?.profile?.profile_picture,
    used: profileImageUrl,
    timestamp
  });
  
  // Update profile image URL on each render to bypass cache
  useEffect(() => {
    if (userProfile?.profile?.profile_picture) {
      console.log('UserInfoCard: Profile picture updated, refreshing display');
    }
  }, [userProfile?.profile?.profile_picture]);
  
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            {isVendor ? 'Business Information' : 'Personal Information'}
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userProfile?.first_name || "Not provided"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userProfile?.last_name || "Not provided"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userProfile?.email || "Not provided"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userProfile?.phone || "Not provided"}
              </p>
            </div>

            {isVendor ? (
              <>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Company Name
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.company_name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Business Email
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.business_email || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Business Phone
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.business_phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.vendor_profile?.status || "Not provided"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Bio
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.profile?.bio || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                    Date of Birth
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {userProfile?.profile?.date_of_birth ? new Date(userProfile.profile.date_of_birth).toLocaleDateString() : "Not provided"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit {isVendor ? 'Business' : 'Personal'} Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              {!isVendor && (
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 mr-4">
                    <ProfileImage 
                      src={previewUrl || profileImageUrl} 
                      alt={userProfile?.first_name || "User"} 
                    />
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    >
                      Change Photo
                    </button>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      JPG, PNG or GIF (max. 2MB)
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Basic Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input 
                      type="text" 
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input 
                      type="text" 
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input 
                      type="text" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      readOnly={true}
                      disabled={true}
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input 
                      type="text" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  {isVendor ? (
                    <>
                      <div className="col-span-2">
                        <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                          Business Information
                        </h5>
                      </div>
                      <div className="col-span-2 lg:col-span-1">
                        <Label>Company Name</Label>
                        <Input 
                          type="text" 
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-span-2 lg:col-span-1">
                        <Label>Business Email</Label>
                        <Input 
                          type="text" 
                          name="business_email"
                          value={formData.business_email}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-span-2 lg:col-span-1">
                        <Label>Business Phone</Label>
                        <Input 
                          type="text" 
                          name="business_phone"
                          value={formData.business_phone}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2">
                        <Label>Bio</Label>
                        <Input 
                          type="text" 
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-span-2 lg:col-span-1">
                        <Label>Date of Birth</Label>
                        <Input 
                          type="date" 
                          name="date_of_birth"
                          value={formData.date_of_birth || ''}
                          onChange={handleChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
