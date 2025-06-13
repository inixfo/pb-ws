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
import { paymentMethodService } from '../../services/api';

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
    active: true
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
  { icon: <MapPinIcon size={16} />, label: "Addresses", href: "/addresses", active: false },
  { icon: <BellIcon size={16} />, label: "Notifications", href: "/notifications", active: false },
];

const customerServiceItems = [
  { icon: <HelpCircleIcon size={16} />, label: "Help center", href: "#" },
  {
    icon: <FileTextIcon size={16} />,
    label: "Terms and conditions",
    href: "#",
  },
];

// Payment method type
interface PaymentMethod {
  id: number;
  payment_type: 'card' | 'bank' | 'mobile';
  provider: string;
  account_number: string;
  is_default: boolean;
  is_verified: boolean;
}

// Edit types
type EditingPaymentMethod = {
  isEditing: boolean;
  paymentMethodId: number | null;
  isNew: boolean;
};

export const PaymentMethods = (): JSX.Element => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editing, setEditing] = useState<EditingPaymentMethod>({
    isEditing: false,
    paymentMethodId: null,
    isNew: false
  });
  const [formData, setFormData] = useState<PaymentMethod | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const data = await paymentMethodService.getPaymentMethods();
      setPaymentMethods(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payment methods');
      console.error('Error fetching payment methods:', err);
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPaymentMethod = (paymentMethodId: number) => {
    const paymentMethodToEdit = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (paymentMethodToEdit) {
      setFormData(paymentMethodToEdit);
      setEditing({
        isEditing: true,
        paymentMethodId,
        isNew: false
      });
    }
  };

  const handleAddPaymentMethod = () => {
    const newPaymentMethod: PaymentMethod = {
      id: 0,
      payment_type: 'card',
      provider: '',
      account_number: '',
      is_default: false,
      is_verified: false
    };
    setFormData(newPaymentMethod);
    setEditing({
      isEditing: true,
      paymentMethodId: newPaymentMethod.id,
      isNew: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (formData) {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      } as PaymentMethod);
    }
  };

  const handleCancel = () => {
    setEditing({
      isEditing: false,
      paymentMethodId: null,
      isNew: false
    });
    setFormData(null);
  };

  const handleSave = async () => {
    if (formData) {
      try {
        if (editing.isNew) {
          await paymentMethodService.createPaymentMethod(formData);
        } else {
          await paymentMethodService.updatePaymentMethod(formData.id, formData);
        }
        await fetchPaymentMethods();
        setEditing({
          isEditing: false,
          paymentMethodId: null,
          isNew: false
        });
        setFormData(null);
      } catch (err) {
        setError('Failed to save payment method');
        console.error('Error saving payment method:', err);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      try {
        await paymentMethodService.deletePaymentMethod(id);
        await fetchPaymentMethods();
      } catch (err) {
        setError('Failed to delete payment method');
        console.error('Error deleting payment method:', err);
      }
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await paymentMethodService.setDefaultPaymentMethod(id);
      await fetchPaymentMethods();
    } catch (err) {
      setError('Failed to set default payment method');
      console.error('Error setting default payment method:', err);
    }
  };

  const formatPaymentMethod = (paymentMethod: PaymentMethod) => {
    return (
      <>
        <p className="text-gray-900">{paymentMethod.provider}</p>
        <p className="text-gray-900">**** **** **** {paymentMethod.account_number}</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Payment Methods</h2>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading payment methods...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchPaymentMethods}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : editing.isEditing && formData ? (
            <div className="mb-8 p-6 border border-gray-200 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {editing.isNew ? "Add new payment method" : "Edit payment method"}
              </h3>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <select
                    id="payment_type"
                    name="payment_type"
                    value={formData.payment_type}
                    onChange={handleInputChange}
                    className="mt-2"
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank">Bank Account</option>
                    <option value="mobile">Mobile Banking</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Input 
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input 
                    id="account_number"
                    name="account_number"
                    value={formData.account_number}
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
                        } as PaymentMethod);
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_default" className="text-sm">Set as default payment method</Label>
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
              {/* Payment Methods */}
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No payment methods found</p>
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 flex items-center gap-2 w-fit mx-auto mt-4"
                    onClick={handleAddPaymentMethod}
                  >
                    <PlusIcon size={16} />
                    <span>Add your first payment method</span>
                  </Button>
                </div>
              ) : (
                <>
                  {paymentMethods.map(paymentMethod => (
                    <div key={paymentMethod.id} className="mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {paymentMethod.is_default ? "Default payment method" : "Alternative payment method"}
                          </h3>
                          {paymentMethod.is_default && (
                            <Badge className="bg-blue-100 text-blue-700 px-2 py-0.5">Primary</Badge>
                          )}
                        </div>
                        <Button 
                          variant="link"
                          className="text-gray-700 font-medium p-0 h-auto"
                          onClick={() => handleEditPaymentMethod(paymentMethod.id)}
                        >
                          Edit
                        </Button>
                      </div>
                      
                      <div className="space-y-1 mb-8">
                        {formatPaymentMethod(paymentMethod)}
                      </div>
                      
                      <Separator />
                    </div>
                  ))}

                  {/* Add Payment Method Button */}
                  <Button 
                    variant="ghost" 
                    className="text-gray-700 flex items-center gap-2 w-fit mt-2"
                    onClick={handleAddPaymentMethod}
                  >
                    <PlusIcon size={16} />
                    <span>Add payment method</span>
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