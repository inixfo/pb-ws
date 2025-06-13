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
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../components/ui/avatar/Avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { UserProfile } from "../../components/account/UserProfile";
import { reviewService } from "../../services/api";
import { format } from "date-fns";

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
    active: true 
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

interface Review {
  id: number;
  product: {
    id: number;
    name: string;
    primary_image: string;
  };
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  helpful_votes: number;
  is_verified_purchase: boolean;
}

// Helper function to render stars
const RatingStars = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < rating) {
      stars.push(
        <img
          key={i}
          src="/star-fill.svg"
          alt="Filled star"
          className="w-4 h-4"
        />
      );
    } else {
      stars.push(
        <img
          key={i}
          src="/star.svg"
          alt="Empty star"
          className="w-4 h-4"
        />
      );
    }
  }
  return <div className="flex gap-1">{stars}</div>;
};

export const MyReviews = (): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const data = await reviewService.getMyReviews();
        setReviews(data);
        setError(null);
      } catch (err) {
        setError("Failed to load reviews");
        console.error("Error fetching reviews:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleHelpful = async (reviewId: number) => {
    try {
      await reviewService.markReviewHelpful(reviewId);
      // Refresh reviews to get updated helpful count
      const data = await reviewService.getMyReviews();
      setReviews(data);
    } catch (err) {
      console.error("Error marking review as helpful:", err);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await reviewService.deleteReview(reviewId);
        setReviews(reviews.filter(review => review.id !== reviewId));
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
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
          {/* Header */}
          <h2 className="text-3xl font-bold text-gray-900 mb-8">My reviews</h2>

          {/* Reviews List */}
          <div className="flex flex-col gap-6">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="border border-gray-200 rounded-lg p-6 flex flex-col gap-4"
              >
                {/* Product Info */}
                <div className="flex items-center gap-4">
                  <img 
                    src={review.product.primary_image}
                    alt={review.product.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium text-gray-900">{review.product.name}</h3>
                    <div className="flex items-center gap-2">
                      <RatingStars rating={review.rating} />
                      <span className="text-sm text-gray-500">{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Review Text */}
                <p className="text-gray-700">{review.comment}</p>
                
                {/* Review Actions */}
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-gray-700 text-sm border-gray-200 gap-1.5 hover:bg-gray-50"
                    onClick={() => handleHelpful(review.id)}
                  >
                    <span>Helpful</span>
                    <span className="text-gray-500">({review.helpful_votes})</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-gray-700 text-sm border-gray-200 hover:bg-gray-50"
                  >
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-gray-700 text-sm border-gray-200 hover:bg-gray-50"
                    onClick={() => handleDelete(review.id)}
                  >
                    Delete
                  </Button>
                  
                  {review.is_verified_purchase && (
                    <div className="flex items-center gap-1 text-green-600 text-xs ml-auto">
                      <img src="/check.svg" alt="Verified" className="w-4 h-4" />
                      <span>Verified purchase</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-1 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 flex items-center justify-center rounded-md border-gray-200"
                disabled
              >
                &lt;
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                className="w-8 h-8 p-0 flex items-center justify-center rounded-md bg-gray-100"
              >
                1
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 flex items-center justify-center rounded-md border-gray-200"
              >
                2
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 flex items-center justify-center rounded-md border-gray-200"
              >
                &gt;
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <CtaFooterByAnima />
    </div>
  );
}; 