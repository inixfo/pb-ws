import {
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FileTextIcon,
  HeartIcon,
  HelpCircleIcon,
  LogOutIcon,
  MapPinIcon,
  PlusIcon,
  StarIcon,
  UserIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../components/ui/avatar/Avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { UserProfile } from "../../components/account/UserProfile";
import { FiMenu, FiX, FiPlus, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import { addressService } from '../../services/api';

// Sidebar menu items
interface AccountMenuItem {
  icon: React.ReactElement;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
}

const accountMenuItems: AccountMenuItem[] = [
  {
    icon: <UserIcon size={16} />,
    label: "Orders",
    href: "/account",
    active: false,
  },
  { 
    icon: <CreditCardIcon size={16} />, 
    label: "Payment methods", 
    href: "/payment-methods",
    active: false
  },
  { 
    icon: <CreditCardIcon size={16} />, 
    label: "My EMI", 
    href: "/my-emi",
    active: false
  },
  { 
    icon: <StarIcon size={16} />, 
    label: "My reviews", 
    href: "/my-reviews",
    active: false 
  },
];

const manageAccountItems = [
  { icon: <UserIcon size={16} />, label: "Personal info", href: "/personal-info", active: false },
  { icon: <MapPinIcon size={16} />, label: "Addresses", href: "/addresses", active: true },
  { icon: <BellIcon size={16} />, label: "Notifications", href: "/notifications", active: false },
];

const customerServiceItems = [
  { icon: <HelpCircleIcon size={16} />, label: "Help center", href: "/help-center" },
  {
    icon: <FileTextIcon size={16} />,
    label: "Terms and conditions",
    href: "/terms",
  },
];

// Address type
interface Address {
  id: number;
  address_type: 'home' | 'work' | 'other';
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
}

// Initial address data
const initialAddresses: Address[] = [
  {
    id: 1,
    address_type: 'home',
    full_name: 'John Doe',
    phone: '+1 (555) 123-4567',
    address_line1: '123 Main St',
    address_line2: '',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    is_default: true
  },
  {
    id: 2,
    address_type: 'work',
    full_name: 'Jane Smith',
    phone: '+1 (555) 987-6543',
    address_line1: '456 Elm St',
    address_line2: '',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94103',
    is_default: false
  }
];

// Edit types
type EditingAddress = {
  isEditing: boolean;
  addressId: number | null;
  isNew: boolean;
};

export const Addresses = (): JSX.Element => {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [editing, setEditing] = useState<EditingAddress>({
    isEditing: false,
    addressId: null,
    isNew: false
  });
  const [formData, setFormData] = useState<Address | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await addressService.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch addresses');
      console.error('Error fetching addresses:', err);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = (addressId: number) => {
    const addressToEdit = addresses.find(addr => addr.id === addressId);
    if (addressToEdit) {
      setFormData(addressToEdit);
      setEditing({
        isEditing: true,
        addressId,
        isNew: false
      });
    }
  };

  const handleAddAddress = () => {
    const newAddress: Address = {
      id: 0,
      address_type: 'home',
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      is_default: false
    };
    setFormData(newAddress);
    setEditing({
      isEditing: true,
      addressId: newAddress.id,
      isNew: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (formData) {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      } as Address);
    }
  };

  const handleCancel = () => {
    setEditing({
      isEditing: false,
      addressId: null,
      isNew: false
    });
    setFormData(null);
  };

  const handleSave = async () => {
    if (formData) {
      if (editing.isNew) {
        await addressService.createAddress(formData);
      } else {
        await addressService.updateAddress(formData.id, formData);
      }
      await fetchAddresses();
      setEditing({
        isEditing: false,
        addressId: null,
        isNew: false
      });
      setFormData(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await addressService.deleteAddress(id);
        await fetchAddresses();
      } catch (err) {
        setError('Failed to delete address');
        console.error('Error deleting address:', err);
      }
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await addressService.setDefaultAddress(id);
      await fetchAddresses();
    } catch (err) {
      setError('Failed to set default address');
      console.error('Error setting default address:', err);
    }
  };

  const formatAddress = (address: Address) => {
    return (
      <>
        <p className="text-gray-900">{address.city} {address.postal_code}, {address.state}</p>
        <p className="text-gray-900">{address.address_line1}</p>
      </>
    );
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      
      {/* Main Content */}
      <main className="container mx-auto flex flex-col lg:flex-row gap-6 lg:gap-12 px-4 py-8 md:py-16">
        {/* Mobile User Profile with Hamburger */}
        <div className="flex items-center justify-between lg:hidden w-full mb-4">
          <UserProfile />
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-gray-100"
            onClick={toggleMobileMenu}
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={toggleMobileMenu}>
            <div className="absolute inset-0 bg-black/40"></div>
            <div 
              className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-6">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleMobileMenu}
                >
                  <XIcon className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Mobile Nav Items */}
              <div className="space-y-6">
                {/* User Profile (Mobile) */}
                <div className="mb-4">
                  <UserProfile />
                </div>
                
                <Separator />
                
                {/* Account Navigation (Mobile) */}
                <div>
                  <h6 className="font-semibold text-gray-900 mb-2">Account</h6>
                  <nav className="flex flex-col gap-1">
                    {accountMenuItems.map((item, index) => (
                      <Button
                        key={index}
                        variant={item.active ? "secondary" : "ghost"}
                        className={`justify-start gap-2 px-3 py-2.5 h-auto rounded-lg transition-colors ${
                          item.active 
                            ? "bg-gray-100" 
                            : "hover:bg-gray-50"
                        }`}
                        asChild
                        onClick={toggleMobileMenu}
                      >
                        <Link to={item.href}>
                          {React.cloneElement(item.icon, { className: "text-gray-700" })}
                          <span
                            className={`flex-1 text-left text-sm ${item.active ? "text-gray-900" : "text-gray-700"}`}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge className="bg-primarymain text-white-100 rounded-full px-2 py-0.5 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    ))}
                  </nav>
                </div>
                
                {/* Manage Account Section (Mobile) */}
                <div>
                  <h6 className="font-semibold text-gray-900 mb-2">
                    Manage account
                  </h6>
                  <div className="flex flex-col gap-1">
                    {manageAccountItems.map((item, index) => (
                      <Button
                        key={index}
                        variant={item.active ? "secondary" : "ghost"}
                        className={`justify-start gap-2 px-3 py-2.5 h-auto rounded-lg transition-colors ${
                          item.active 
                            ? "bg-gray-100" 
                            : "hover:bg-gray-50"
                        }`}
                        asChild
                        onClick={toggleMobileMenu}
                      >
                        <Link to={item.href}>
                          {React.cloneElement(item.icon, {
                            className: "text-gray-700",
                          })}
                          <span className={`flex-1 text-left text-sm ${item.active ? "text-gray-900" : "text-gray-700"}`}>
                            {item.label}
                          </span>
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Customer Service Section (Mobile) */}
                <div>
                  <h6 className="font-semibold text-gray-900 mb-2">
                    Customer service
                  </h6>
                  <div className="flex flex-col gap-1">
                    {customerServiceItems.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="justify-start gap-2 px-3 py-2.5 h-auto rounded-lg hover:bg-gray-50 transition-colors"
                        asChild
                        onClick={toggleMobileMenu}
                      >
                        <Link to={item.href}>
                          {React.cloneElement(item.icon, {
                            className: "text-gray-700",
                          })}
                          <span className="flex-1 text-left text-sm text-gray-700">
                            {item.label}
                          </span>
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Log Out Button (Mobile) */}
                <Button
                  variant="ghost"
                  className="justify-start gap-2 px-3 py-2.5 h-auto rounded-lg w-full hover:bg-gray-50 transition-colors"
                  asChild
                  onClick={toggleMobileMenu}
                >
                  <Link to="/">
                    <LogOutIcon size={16} className="text-gray-700" />
                    <span className="flex-1 text-left text-sm text-gray-700">
                      Log out
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar - Hide on mobile */}
        <aside className="hidden lg:flex lg:w-[282px] flex-col gap-6">
          {/* User Profile */}
          <UserProfile />

          {/* Account Navigation */}
          <nav className="flex flex-col gap-0.5">
            {accountMenuItems.map((item, index) => (
              <Button
                key={index}
                variant={item.active ? "secondary" : "ghost"}
                className={`justify-start gap-2 px-3 py-2.5 h-auto rounded-lg ${item.active ? "bg-gray-100" : ""}`}
                asChild
              >
                <Link to={item.href}>
                  {React.cloneElement(item.icon, { className: "text-gray-700" })}
                  <span
                    className={`flex-1 text-left text-sm ${item.active ? "text-gray-900" : "text-gray-700"}`}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge className="bg-primarymain text-white-100 rounded-full px-2 py-0.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Manage Account Section */}
          <div className="flex flex-col gap-2">
            <h6 className="px-4 font-semibold text-gray-900">
              Manage account
            </h6>
            <div className="flex flex-col gap-0.5">
              {manageAccountItems.map((item, index) => (
                <Button
                  key={index}
                  variant={item.active ? "secondary" : "ghost"}
                  className={`justify-start gap-2 px-3 py-2.5 h-auto rounded-lg ${item.active ? "bg-gray-100" : ""}`}
                  asChild
                >
                  <Link to={item.href}>
                    {React.cloneElement(item.icon, {
                      className: "text-gray-700",
                    })}
                    <span className={`flex-1 text-left text-sm ${item.active ? "text-gray-900" : "text-gray-700"}`}>
                      {item.label}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Customer Service Section */}
          <div className="flex flex-col gap-2">
            <h6 className="px-4 font-semibold text-gray-900">
              Customer service
            </h6>
            <div className="flex flex-col gap-0.5">
              {customerServiceItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="justify-start gap-2 px-3 py-2.5 h-auto rounded-lg"
                  asChild
                >
                  <Link to={item.href}>
                    {React.cloneElement(item.icon, {
                      className: "text-gray-700",
                    })}
                    <span className="flex-1 text-left text-sm text-gray-700">
                      {item.label}
                    </span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Log Out Button */}
          <Button
            variant="ghost"
            className="justify-start gap-2 px-3 py-2.5 h-auto rounded-lg"
            asChild
          >
            <Link to="/">
              <LogOutIcon size={16} className="text-gray-700" />
              <span className="flex-1 text-left text-sm text-gray-700">
                Log out
              </span>
            </Link>
          </Button>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 max-w-[966px] flex flex-col">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Addresses</h2>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading addresses...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchAddresses}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : editing.isEditing && formData ? (
            <div className="mb-8 p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {editing.isNew ? "Add new address" : "Edit address"}
              </h3>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="address_type">Address Type</Label>
                  <select
                    id="address_type"
                    name="address_type"
                    value={formData.address_type}
                    onChange={handleInputChange}
                    className="mt-2"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input 
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input 
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                </div>
                
                  <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                    <Input 
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                </div>
                
                {!formData.is_default && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="is_default"
                      checked={formData.is_default}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          is_default: e.target.checked
                        } as Address);
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_default" className="text-sm">Set as default address</Label>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="border-gray-200"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Shipping Address */}
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No addresses found</p>
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 flex items-center gap-2 w-fit mx-auto mt-4"
                    onClick={handleAddAddress}
                  >
                    <PlusIcon size={16} />
                    <span>Add your first address</span>
                  </Button>
                </div>
              ) : (
                <>
              {addresses.map(address => (
                <div key={address.id} className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                            {address.is_default ? "Shipping address" : "Alternative shipping address"}
                      </h3>
                          {address.is_default && (
                        <Badge className="bg-blue-100 text-blue-700 px-2 py-0.5">Primary</Badge>
                      )}
                    </div>
                    <Button 
                      variant="link"
                      className="text-gray-700 font-medium p-0 h-auto"
                      onClick={() => handleEditAddress(address.id)}
                    >
                      Edit
                    </Button>
                  </div>
                  
                  <div className="space-y-1 mb-8">
                    {formatAddress(address)}
                  </div>
                  
                  <Separator />
                </div>
              ))}

              {/* Add Address Button */}
              <Button 
                variant="ghost" 
                className="text-gray-700 flex items-center gap-2 w-fit mt-2"
                onClick={handleAddAddress}
              >
                <PlusIcon size={16} />
                <span>Add address</span>
              </Button>
                </>
              )}
            </>
          )}
        </div>
      </main>
      
      <CtaFooterByAnima />
    </div>
  );
}; 