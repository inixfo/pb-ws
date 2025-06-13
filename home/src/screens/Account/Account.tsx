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
  XIcon,
  MapPinIcon as LocationIcon,
  TruckIcon,
  MenuIcon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../components/ui/avatar/Avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import PaginationComponent, {
  PaginationItem,
  PaginationLink,
} from "../../components/ui/pagination";
import { Select } from "../../components/ui/Select";
import { Separator } from "../../components/ui/separator";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { orderService } from "../../services/api";
import { OrderListItem } from "../../types/order";
import { format } from "date-fns";
import { UserProfile } from "../../components/account/UserProfile";
import { OrderTracking } from "../../components/order/OrderTracking";

// Rename the imported component to maintain compatibility with existing code
const Pagination = PaginationComponent;

// Sidebar menu items
const accountMenuItems = [
  {
    icon: <UserIcon size={16} />,
    label: "Orders",
    href: "/account",
    active: true,
    badge: "1",
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

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'processing':
    case 'pending':
      return 'infomain';
    case 'delivered':
    case 'completed':
      return 'successmain';
    case 'cancelled':
    case 'refunded':
      return 'dangermain';
    default:
      return 'infomain';
  }
};

// Helper function to format currency
const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '৳0.00';
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numAmount)) {
    return '৳0.00';
  }
  
  return `৳${numAmount.toFixed(2)}`;
};

export const Account = (): JSX.Element => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all-time");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching orders...');
        const response = await orderService.getOrders();
        console.log('Orders response:', response);
        
        // Handle different response formats
        let ordersList: OrderListItem[] = [];
        if (Array.isArray(response)) {
          ordersList = response;
        } else if (response && typeof response === 'object') {
          // If response is a paginated object with results
          const responseObj = response as any; // Type assertion to handle unknown structure
          if (Array.isArray(responseObj.results)) {
            ordersList = responseObj.results;
          } else {
            // If we have another object structure, try to find orders
            const possibleArrays = Object.values(responseObj).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              // Use the first array found
              ordersList = possibleArrays[0] as OrderListItem[];
            }
          }
        }
        
        console.log('Processed orders list:', ordersList);
        setOrders(ordersList);
        setError(null);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders");
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const openDrawer = (order: OrderListItem) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const openTracking = (orderId: string) => {
    setTrackingOrderId(orderId);
    setShowTracking(true);
  };

  const closeTracking = () => {
    setShowTracking(false);
    setTrackingOrderId(null);
  };

  // Filter orders based on status and time
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    if (statusFilter !== "all") {
      if (!order.status.toLowerCase().includes(statusFilter.toLowerCase())) {
        return false;
      }
    }

    if (timeFilter !== "all-time") {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      
      if (timeFilter === "this-month") {
        return orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      } else if (timeFilter === "last-month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return orderDate.getMonth() === lastMonth.getMonth() && 
               orderDate.getFullYear() === lastMonth.getFullYear();
      }
    }

    return true;
  }) : [];

  return (
    <div className="flex flex-col w-full bg-white-100 min-h-screen">
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

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-[282px] flex-col gap-6">
          {/* User Profile */}
          <UserProfile />

          {/* Account Navigation */}
          <nav className="flex flex-col gap-0.5">
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
                  className={`justify-start gap-2 px-3 py-2.5 h-auto rounded-lg transition-colors ${
                    item.active 
                      ? "bg-gray-100" 
                      : "hover:bg-gray-50"
                  }`}
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
                  className="justify-start gap-2 px-3 py-2.5 h-auto rounded-lg hover:bg-gray-50 transition-colors"
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
        <div className="flex-1 max-w-[966px] flex flex-col gap-10">
          {/* Header with Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Orders</h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <Select
                options={[
                  { value: "all", label: "Select status" },
                  { value: "in-progress", label: "In progress" },
                  { value: "delivered", label: "Delivered" },
                  { value: "canceled", label: "Canceled" }
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-[196px]"
              />

              <Select
                options={[
                  { value: "all-time", label: "For all time" },
                  { value: "this-month", label: "This month" },
                  { value: "last-month", label: "Last month" }
                ]}
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="w-full sm:w-[196px]"
              />
            </div>
          </div>

          {/* Orders Table */}
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 space-y-8">
              {/* Table Header - Hidden on Mobile */}
              <div className="hidden md:block space-y-5">
                <div className="flex gap-4">
                  <div className="w-[147px] text-sm text-gray-600">Order #</div>
                  <div className="w-[147px] text-sm text-gray-600">
                    Order date
                  </div>
                  <div className="w-[147px] text-sm text-gray-600">Status</div>
                  <div className="w-[147px] text-sm text-gray-600">Total</div>
                </div>
                <Separator />
              </div>

              {/* Order Rows */}
              <div className="space-y-5">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">{error}</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No orders found</div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="space-y-5">
                    <div 
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 md:h-16 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors p-2" 
                      onClick={() => openDrawer(order)}
                    >
                      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                        <div className="w-full md:w-[147px] text-sm md:text-base font-medium text-gray-900">
                          <span className="md:hidden font-normal text-gray-600 mr-2">Order #:</span>
                            {order.order_id}
                        </div>
                        <div className="w-full md:w-[147px] text-sm md:text-base font-medium text-gray-900">
                          <span className="md:hidden font-normal text-gray-600 mr-2">Date:</span>
                            {format(new Date(order.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="w-full md:w-[147px] flex items-center gap-1">
                          <div className="p-1">
                            <div
                              className={`w-2 h-2 rounded ${
                                  getStatusColor(order.status) === "infomain" 
                                  ? "bg-blue-500" 
                                    : getStatusColor(order.status) === "successmain" 
                                  ? "bg-green-500" 
                                    : getStatusColor(order.status) === "dangermain"
                                  ? "bg-red-500"
                                  : ""
                              }`}
                            />
                          </div>
                          <div className="text-sm md:text-base font-medium text-gray-900">
                            <span className="md:hidden font-normal text-gray-600 mr-2">Status:</span>
                            {order.status}
                          </div>
                        </div>
                        <div className="w-full md:w-[147px] text-sm md:text-base font-medium text-gray-900">
                          <span className="md:hidden font-normal text-gray-600 mr-2">Total:</span>
                            {formatCurrency(order.total)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 md:mt-0">
                        <div className="flex items-center gap-2 justify-end overflow-x-auto">
                            {order.items.slice(0, 3).map((item, imgIndex) => (
                            <img
                              key={imgIndex}
                              className="w-16 h-16 object-cover rounded-md"
                                alt={item.product.name}
                                src={item.product.primary_image}
                            />
                          ))}
                            {order.items.length > 3 && (
                            <div className="p-2.5">
                              <div className="w-7 text-center text-sm font-medium text-gray-900">
                                  +{order.items.length - 3}
                              </div>
                            </div>
                          )}
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      </div>
                    </div>
                    <Separator />
                  </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {!isLoading && !error && filteredOrders.length > 0 && (
              <Pagination className="flex items-start gap-1">
                <PaginationItem>
                  <PaginationLink
                    className="p-1.5 bg-gray-100 rounded-md"
                    isActive
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
              </Pagination>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Order Details Drawer */}
      {drawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40" 
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-xl transition-transform overflow-auto">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  Order # {selectedOrder.order_id}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-8 w-8"
                  onClick={closeDrawer}
                >
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Status */}
                <div className="p-6 border-b">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded ${
                        getStatusColor(selectedOrder.status) === "infomain" 
                          ? "bg-blue-500" 
                          : getStatusColor(selectedOrder.status) === "successmain" 
                          ? "bg-green-500" 
                          : getStatusColor(selectedOrder.status) === "dangermain"
                          ? "bg-red-500"
                          : ""
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-900">{selectedOrder.status}</span>
                  </div>
                </div>

                {/* Products */}
                <div className="p-6 border-b">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex gap-4 mb-6 last:mb-0">
                      <img 
                        src={item.product.primary_image} 
                        alt={item.product.name} 
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <div className="flex flex-col flex-1">
                        <h3 className="text-base font-medium text-gray-900">{item.product.name}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-900 font-semibold">{formatCurrency(item.price)}</span>
                          <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery */}
                <div className="p-6 border-b">
                  <h3 className="text-base font-semibold mb-4">Delivery</h3>
                  
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="w-32 text-sm text-gray-500">Shipping address:</div>
                      <div className="text-sm font-medium flex-1">
                        {selectedOrder.shipping_address}, {selectedOrder.shipping_city}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment */}
                <div className="p-6">
                  <h3 className="text-base font-semibold mb-4">Payment</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex">
                      <div className="w-32 text-sm text-gray-500">Payment method:</div>
                      <div className="text-sm font-medium flex-1">{selectedOrder.payment_method}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tax collected:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Shipping:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedOrder.shipping_cost)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Total:</span>
                      <span className="text-sm font-semibold">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-6 border-t">
                <Button 
                  className="w-full hover:bg-blue-600 transition-colors" 
                  variant="default"
                  onClick={() => openTracking(selectedOrder.order_id)}
                >
                  <TruckIcon className="w-4 h-4 mr-2" />
                  Track Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {showTracking && trackingOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <OrderTracking orderId={trackingOrderId} onClose={closeTracking} />
          </div>
        </div>
      )}
      
      <CtaFooterByAnima />
    </div>
  );
}; 