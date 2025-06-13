import {
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FileTextIcon,
  HeartIcon,
  HelpCircleIcon,
  LogOutIcon,
  MapPinIcon,
  StarIcon,
  UserIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../components/ui/avatar/Avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Checkbox } from "../../components/ui/Checkbox";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { UserProfile } from "../../components/account/UserProfile";

// Simple Switch component
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, className = "" }) => {
  return (
    <div 
      className={`inline-flex h-6 w-11 cursor-pointer items-center rounded-full ${checked ? 'bg-blue-500' : 'bg-gray-300'} transition-colors ${className}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span 
        className={`block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} 
      />
    </div>
  );
};

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
  { icon: <MapPinIcon size={16} />, label: "Addresses", href: "/addresses", active: false },
  { icon: <BellIcon size={16} />, label: "Notifications", href: "/notifications", active: true },
];

const customerServiceItems = [
  { icon: <HelpCircleIcon size={16} />, label: "Help center", href: "/help-center" },
  {
    icon: <FileTextIcon size={16} />,
    label: "Terms and conditions",
    href: "/terms",
  },
];

// Notification preferences
interface NotificationType {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

// Communication channels
interface CommunicationChannel {
  id: string;
  label: string;
  checked: boolean;
}

export const Notifications = (): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Initial notification types with their descriptions
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([
    {
      id: "exclusive-offers",
      title: "Exclusive offers",
      description: "Receive alerts about exclusive discounts, promotions, and special offers tailored just for you.",
      enabled: false
    },
    {
      id: "order-updates",
      title: "Order updates",
      description: "Stay informed about the status of your orders, including confirmations, shipping updates, and delivery notifications.",
      enabled: true
    },
    {
      id: "product-recommendations",
      title: "Product recommendations",
      description: "Get personalized recommendations based on your browsing and purchase history to discover new products you'll love.",
      enabled: true
    },
    {
      id: "restock-notifications",
      title: "Restock notifications",
      description: "Be the first to know when out-of-stock items are back in inventory, ensuring you never miss out on your favorite products.",
      enabled: false
    },
    {
      id: "event-reminders",
      title: "Event reminders",
      description: "Receive reminders about upcoming sales events, flash sales, or product launches to make sure you're always in the loop.",
      enabled: false
    },
    {
      id: "account-security-alerts",
      title: "Account security alerts",
      description: "Receive notifications about any suspicious account activity or changes to your login credentials for enhanced security.",
      enabled: true
    },
    {
      id: "customer-support-updates",
      title: "Customer support updates",
      description: "Get updates on any inquiries or support tickets you've submitted, ensuring timely resolution of any issues.",
      enabled: false
    }
  ]);

  // Communication channels
  const [communicationChannels, setCommunicationChannels] = useState<CommunicationChannel[]>([
    { id: "sms", label: "SMS", checked: false },
    { id: "whatsapp", label: "Messages in WhatsApp", checked: false },
    { id: "email", label: "Email", checked: false },
    { id: "push", label: "App push notifications", checked: false }
  ]);

  // Master toggle for all notifications
  const [allNotificationsEnabled, setAllNotificationsEnabled] = useState(true);

  // Handle toggle change for a specific notification type
  const handleNotificationToggle = (id: string) => {
    setNotificationTypes(prevTypes =>
      prevTypes.map(type =>
        type.id === id ? { ...type, enabled: !type.enabled } : type
      )
    );
  };

  // Handle toggle change for all notifications
  const handleToggleAll = () => {
    const newState = !allNotificationsEnabled;
    setAllNotificationsEnabled(newState);
    
    // Update all notification types with the new state
    setNotificationTypes(prevTypes =>
      prevTypes.map(type => ({ ...type, enabled: newState }))
    );
  };

  // Handle checkbox change for communication channels
  const handleChannelChange = (id: string) => {
    setCommunicationChannels(prevChannels =>
      prevChannels.map(channel =>
        channel.id === id ? { ...channel, checked: !channel.checked } : channel
      )
    );
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
                <LogoutButton onLogoutStart={toggleMobileMenu} />
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
          <LogoutButton />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 max-w-[966px] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium">Unselect all</span>
              <Switch 
                checked={allNotificationsEnabled}
                onCheckedChange={handleToggleAll}
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-gray-900 font-medium mb-1">{type.title}</h3>
                  <p className="text-gray-700 text-sm">{type.description}</p>
                </div>
                <Switch
                  checked={type.enabled}
                  onCheckedChange={() => handleNotificationToggle(type.id)}
                  className="mt-1"
                />
              </div>
            ))}
          </div>

          <Separator className="my-8" />

          {/* Communication Channels */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Communication channels</h3>
            <div className="space-y-4">
              {communicationChannels.map((channel) => (
                <div key={channel.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={channel.id}
                    checked={channel.checked}
                    onChange={() => handleChannelChange(channel.id)}
                  />
                  <Label
                    htmlFor={channel.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <CtaFooterByAnima />
    </div>
  );
}; 