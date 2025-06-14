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
}

interface UserMetaCardProps {
  userProfile: UserProfile | null;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

// ProfileImage component for robust image handling
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

export default function UserMetaCard({ userProfile, updateUserProfile }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || "",
    last_name: userProfile?.last_name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    bio: userProfile?.profile?.bio || "",
    date_of_birth: userProfile?.profile?.date_of_birth || ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      // Always use FormData for profile updates - much more reliable
      const formDataToSend = new FormData();
      
      // Add basic profile fields
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
        console.log("Adding profile picture to FormData:", selectedFile.name);
        formDataToSend.append('profile_picture', selectedFile);
      }
      
      // Log what we're sending
      console.log("Submitting profile update with FormData");
      for (const pair of formDataToSend.entries()) {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }
      
      // Show a loading toast
      const loadingToast = toast.loading("Updating profile...");
      
      try {
        const success = await updateUserProfile(formDataToSend as any);
        
        // Dismiss the loading toast
        toast.dismiss(loadingToast);
        
        if (success) {
          toast.success("Profile updated successfully");
          closeModal();
          setSelectedFile(null);
          setPreviewUrl(null);
        }
      } catch (error) {
        // Dismiss the loading toast
        toast.dismiss(loadingToast);
        
        console.error("Error from API call:", error);
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error("Failed to process form data");
    } finally {
      setIsSubmitting(false);
    }
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
  
  // Initialize form data when modal opens
  const handleOpenModal = () => {
    setFormData({
      first_name: userProfile?.first_name || "",
      last_name: userProfile?.last_name || "",
      email: userProfile?.email || "",
      phone: userProfile?.phone || "",
      bio: userProfile?.profile?.bio || "",
      date_of_birth: userProfile?.profile?.date_of_birth || ""
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    openModal();
  };
  
  const fullName = userProfile 
    ? `${userProfile.first_name} ${userProfile.last_name}` 
    : "Loading...";
    
  // Update profile image URL on each render to bypass cache
  useEffect(() => {
    if (userProfile?.profile?.profile_picture) {
      console.log('Profile picture updated in component, refreshing display');
    }
  }, [userProfile?.profile?.profile_picture]);

  // Get the profile image URL with proper fallback and cache busting
  const timestamp = new Date().getTime(); // For cache busting
  const profileImageUrl = userProfile?.profile?.profile_picture 
    ? userProfile.profile.profile_picture.startsWith('http') 
      ? `${userProfile.profile.profile_picture}?t=${timestamp}` 
      : `http://3.25.95.103/admin${userProfile.profile.profile_picture}?t=${timestamp}`
    : "/images/user/owner.jpg";
  
  console.log('Profile image URL:', {
    original: userProfile?.profile?.profile_picture,
    used: profileImageUrl
  });
  
  const companyName = userProfile?.role === 'vendor' ? userProfile?.vendor_profile?.company_name : '';
  const userRole = userProfile?.role === 'admin' ? 'Administrator' : userProfile?.role === 'vendor' ? 'Vendor' : 'User';
  
  const location = userProfile?.vendor_profile 
    ? `${userProfile.vendor_profile.city}, ${userProfile.vendor_profile.state}, ${userProfile.vendor_profile.country}` 
    : '';
  
  const socialLinks = userProfile?.store_settings;
  
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div 
              className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 cursor-pointer"
              onClick={handleOpenModal}
              title="Click to edit profile"
            >
              <ProfileImage 
                src={profileImageUrl} 
                alt={fullName} 
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {fullName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userRole} {companyName && `(${companyName})`}
                </p>
                {userProfile?.profile?.bio && (
                  <>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userProfile.profile.bio}
                    </p>
                  </>
                )}
                {location && (
                  <>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {location}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {socialLinks?.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z"
                      fill=""
                    />
                  </svg>
                </a>
              )}

              {socialLinks?.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z"
                      fill=""
                    />
                  </svg>
                </a>
              )}

              {socialLinks?.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM9 17.93C5.05 17.44 2 14.08 2 10C2 9.38 2.08 8.79 2.21 8.21L7 13V14C7 15.1 7.9 16 9 16V17.93ZM15.9 15.39C15.64 14.58 14.9 14 14 14H13V11C13 10.45 12.55 10 12 10H6V8H8C8.55 8 9 7.55 9 7V5H11C12.1 5 13 4.1 13 3V2.59C15.93 3.78 18 6.65 18 10C18 12.08 17.2 13.97 15.9 15.39Z"
                      fill=""
                    />
                  </svg>
                </a>
              )}

              {socialLinks?.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10.8567 1.66699C11.7946 1.66854 12.2698 1.67351 12.6805 1.68573L12.8422 1.69102C13.0291 1.69766 13.2134 1.70599 13.4357 1.71641C14.3224 1.75738 14.9273 1.89766 15.4586 2.10391C16.0078 2.31572 16.4717 2.60183 16.9349 3.06503C17.3974 3.52822 17.6836 3.99349 17.8961 4.54141C18.1016 5.07197 18.2419 5.67753 18.2836 6.56433C18.2935 6.78655 18.3015 6.97088 18.3081 7.15775L18.3133 7.31949C18.3255 7.73011 18.3311 8.20543 18.3328 9.1433L18.3335 9.76463C18.3336 9.84055 18.3336 9.91888 18.3336 9.99972L18.3335 10.2348L18.333 10.8562C18.3314 11.794 18.3265 12.2694 18.3142 12.68L18.3089 12.8417C18.3023 13.0286 18.294 13.213 18.2836 13.4351C18.2426 14.322 18.1016 14.9268 17.8961 15.458C17.6842 16.0074 17.3974 16.4713 16.9349 16.9345C16.4717 17.397 16.0057 17.6831 15.4586 17.8955C14.9273 18.1011 14.3224 18.2414 13.4357 18.2831C13.2134 18.293 13.0291 18.3011 12.8422 18.3076L12.6805 18.3128C12.2698 18.3251 11.7946 18.3306 10.8567 18.3324L10.2353 18.333C10.1594 18.333 10.0811 18.333 10.0002 18.333H9.76516L9.14375 18.3325C8.20591 18.331 7.7306 18.326 7.31997 18.3137L7.15824 18.3085C6.97136 18.3018 6.78703 18.2935 6.56481 18.2831C5.67801 18.2421 5.07384 18.1011 4.5419 17.8955C3.99328 17.6838 3.5287 17.397 3.06551 16.9345C2.60231 16.4713 2.3169 16.0053 2.1044 15.458C1.89815 14.9268 1.75856 14.322 1.7169 13.4351C1.707 13.213 1.69892 13.0286 1.69238 12.8417L1.68714 12.68C1.67495 12.2694 1.66939 11.794 1.66759 10.8562L1.66748 9.1433C1.66903 8.20543 1.67399 7.73011 1.68621 7.31949L1.69151 7.15775C1.69815 6.97088 1.70648 6.78655 1.7169 6.56433C1.75786 5.67683 1.89815 5.07266 2.1044 4.54141C2.3162 3.9928 2.60231 3.52822 3.06551 3.06503C3.5287 2.60183 3.99398 2.31641 4.5419 2.10391C5.07315 1.89766 5.67731 1.75808 6.56481 1.71641C6.78703 1.70652 6.97136 1.69844 7.15824 1.6919L7.31997 1.68666C7.7306 1.67446 8.20591 1.6689 9.14375 1.6671L10.8567 1.66699ZM10.0002 5.83308C7.69781 5.83308 5.83356 7.69935 5.83356 9.99972C5.83356 12.3021 7.69984 14.1664 10.0002 14.1664C12.3027 14.1664 14.1669 12.3001 14.1669 9.99972C14.1669 7.69732 12.3006 5.83308 10.0002 5.83308ZM10.0002 7.49974C11.381 7.49974 12.5002 8.61863 12.5002 9.99972C12.5002 11.3805 11.3813 12.4997 10.0002 12.4997C8.6195 12.4997 7.50023 11.3809 7.50023 9.99972C7.50023 8.61897 8.61908 7.49974 10.0002 7.49974ZM14.3752 4.58308C13.8008 4.58308 13.3336 5.04967 13.3336 5.62403C13.3336 6.19841 13.8002 6.66572 14.3752 6.66572C14.9496 6.66572 15.4169 6.19913 15.4169 5.62403C15.4169 5.04967 14.9488 4.58236 14.3752 4.58308Z"
                      fill=""
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mb-6">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90">
                  Basic Information
                </h5>
                
                {/* Profile Picture Upload - Positioned before the form fields */}
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                    <ProfileImage 
                      src={previewUrl || profileImageUrl} 
                      alt={formData.first_name || "User"} 
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
                      type="text" 
                      name="date_of_birth"
                      placeholder="YYYY-MM-DD"
                      value={formData.date_of_birth || ""}
                      onChange={handleChange}
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: YYYY-MM-DD</p>
                  </div>
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
    </>
  );
}
