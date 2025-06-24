import {
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  FileTextIcon,
  HeartIcon,
  HelpCircleIcon,
  LogOutIcon,
  MapPinIcon,
  MoreVerticalIcon,
  ShoppingCartIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar/Avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/Checkbox";
import { Separator } from "../../components/ui/separator";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { Select } from "../../components/ui/Select";
import { Link, useNavigate } from "react-router-dom";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { wishlistService, WishlistItem } from "../../services/wishlist";
import { useAuth } from "../../contexts/AuthContext";
import { Product } from '../../types/product';
import './Wishlist.css';

interface MenuItem {
  icon: React.ReactElement;
  label: string;
  href: string;
  active: boolean;
  badge?: string;
}

// Sidebar menu items
const accountMenuItems: MenuItem[] = [
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

const manageAccountItems: MenuItem[] = [
  { icon: <UserIcon size={16} />, label: "Personal info", href: "/personal-info", active: false },
  { icon: <MapPinIcon size={16} />, label: "Addresses", href: "/addresses", active: false },
  { icon: <BellIcon size={16} />, label: "Notifications", href: "/notifications", active: false },
];

const customerServiceItems: MenuItem[] = [
  { icon: <HelpCircleIcon size={16} />, label: "Help center", href: "#", active: false },
  {
    icon: <FileTextIcon size={16} />,
    label: "Terms and conditions",
    href: "#",
    active: false,
  },
];

// Filter options
const sortOptions = [
  { value: "date-added", label: "By date added" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export const Wishlist = (): JSX.Element => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await wishlistService.getWishlist();
      setWishlistItems(Array.isArray(items) ? items : []);
    } catch (err) {
      setError('Failed to fetch wishlist items');
      console.error('Error fetching wishlist:', err);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(wishlistItems.map(item => item.product.id));
    }
    setAllSelected(!allSelected);
  };

  const toggleProductSelection = (id: number) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(productId => productId !== id));
      setAllSelected(false);
    } else {
      setSelectedProducts([...selectedProducts, id]);
      if (selectedProducts.length + 1 === wishlistItems.length) {
        setAllSelected(true);
      }
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems(prevItems => prevItems.filter(item => item.product.id !== productId));
      setSelectedProducts(prevSelected => prevSelected.filter(id => id !== productId));
    } catch (err) {
      setError('Failed to remove item from wishlist');
      console.error('Error removing from wishlist:', err);
    }
  };

  const handleRemoveSelected = async () => {
    try {
      await Promise.all(selectedProducts.map(productId => 
        wishlistService.removeFromWishlist(productId)
      ));
      setWishlistItems(prevItems => prevItems.filter(item => !selectedProducts.includes(item.product.id)));
      setSelectedProducts([]);
      setAllSelected(false);
    } catch (err) {
      setError('Failed to remove selected items');
      console.error('Error removing selected items:', err);
    }
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.slug}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full bg-white min-h-screen">
        <HeaderByAnima showHeroSection={false} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primarymain"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full bg-white min-h-screen">
        <HeaderByAnima showHeroSection={false} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-empty">
        <h2>Your Wishlist is Empty</h2>
        <p>Add items to your wishlist to keep track of products you love.</p>
        <button onClick={() => navigate('/products')} className="browse-products-btn">
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      
      {/* Main Content */}
      <main className="container mx-auto flex flex-col lg:flex-row gap-6 lg:gap-12 px-4 py-8 md:py-16">
        {/* Sidebar */}
        <aside className="w-full lg:w-[282px] flex flex-col gap-6">
          {/* User Profile */}
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 bg-blue-100 rounded-3xl">
              <AvatarFallback className="text-blue-500 font-semibold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 flex-1">
              <h6 className="font-semibold text-gray-900">
                {user?.username || 'User'}
              </h6>
            </div>
          </div>

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
        </aside>

        {/* Wishlist Content */}
        <div className="flex-1">
          {/* Header with Add Wishlist Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Wishlist</h2>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => navigate('/products')}
            >
              <PlusIcon size={16} />
              Add wishlist
            </Button>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium text-gray-700"
              >
                Select all
              </label>
            </div>

            <div className="flex items-center gap-4">
              <Select
                options={sortOptions}
                placeholder="Sort by"
                className="w-[200px]"
              />
              {selectedProducts.length > 0 && (
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={handleRemoveSelected}
                >
                  <TrashIcon size={16} />
                  Remove selected
                </Button>
              )}
            </div>
          </div>

          {/* Wishlist Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={() => handleRemoveFromWishlist(item.product.id)}
                  >
                    <TrashIcon size={16} className="text-gray-600" />
                  </Button>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.product.name}
                    </h3>
                    <Checkbox
                      id={`select-${item.id}`}
                      checked={selectedProducts.includes(item.product.id)}
                      onChange={() => toggleProductSelection(item.product.id)}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          size={16}
                          className={`${
                            i < Math.floor(item.product.rating)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({item.product.rating_count})
                    </span>
                  </div>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-bold text-gray-900">
                        ${item.product.sale_price ? item.product.sale_price : item.product.price}
                      </span>
                      {item.product.sale_price && (
                        <>
                          <span className="text-sm text-gray-500 line-through">
                            ${item.product.price}
                          </span>
                          <span className="text-sm text-green-600">
                            {Math.round((1 - item.product.sale_price / item.product.price) * 100)}% off
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/product/${item.product.slug}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {wishlistItems.length === 0 && (
            <div className="text-center py-12">
              <HeartIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-gray-600 mb-6">
                Add items to your wishlist to keep track of products you love
              </p>
              <Button onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            </div>
          )}
        </div>
      </main>

      <CtaFooterByAnima />
    </div>
  );
};

const PlusIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 5V19M5 12H19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
); 