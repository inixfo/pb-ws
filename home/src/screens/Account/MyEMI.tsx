import {
  BellIcon,
  CreditCardIcon,
  FileTextIcon,
  HeartIcon,
  HelpCircleIcon,
  LogOutIcon,
  MapPinIcon,
  StarIcon,
  UserIcon,
  ChevronRightIcon,
  XIcon,
  CalendarIcon,
  DollarSignIcon,
  MenuIcon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../components/ui/avatar/Avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Select } from "../../components/ui/Select";
import PaginationComponent, { PaginationItem, PaginationLink } from "../../components/ui/pagination";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { LogoutButton } from "../../components/auth/LogoutButton";
import { UserProfile } from "../../components/account/UserProfile";
import { emiService } from "../../services/api/emiService";

// Rename the imported component to maintain compatibility with existing code
const Pagination = PaginationComponent;

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
    active: true
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

// EMI application interface
interface EMIApplication {
  id: number;
  order: {
    id: number;
    total_amount: number;
    created_at: string;
    primary_image?: string;
  };
  emi_plan: {
    name: string;
    interest_rate: number;
    duration_months: number;
    down_payment_percentage: number;
  };
  product_price: number;
  down_payment_amount: number;
  monthly_installment: number;
  status: 'pending' | 'approved' | 'rejected';
  job_title: string;
  monthly_salary: number;
  applied_date: string;
  reviewed_date?: string;
  admin_notes?: string;
  rejection_reason?: string;
}

// EMI record interface
interface EMIProduct {
  id: number;
  order: {
    id: number;
    total_amount: number;
    created_at: string;
    primary_image?: string;
  };
  emi_plan: {
    name: string;
    interest_rate: number;
    processing_fee_percentage: number;
    processing_fee_fixed: number;
  };
  tenure_months: number;
  principal_amount: number;
  monthly_installment: number;
  total_payable: number;
  status: string;
  down_payment_paid: boolean;
  installments_paid: number;
  amount_paid: number;
  remaining_amount: number;
  start_date: string;
  expected_end_date: string;
  completed_date: string | null;
  installments: Array<{
    id: number;
    installment_number: number;
    amount: number;
    due_date: string;
    status: string;
    paid_amount: number;
    paid_date: string | null;
  }>;
}

export const MyEMI = (): JSX.Element => {
  const [selectedEMI, setSelectedEMI] = useState<EMIProduct | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<EMIApplication | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'records'>('applications');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [emiProducts, setEmiProducts] = useState<EMIProduct[]>([]);
  const [emiApplications, setEmiApplications] = useState<EMIApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchEMIData();
  }, []);

  const fetchEMIData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching EMI data...');
      
      // Fetch both applications and records separately to handle errors individually
      let applicationsData = [];
      let recordsData = [];
      
      try {
        console.log('Fetching EMI applications...');
        applicationsData = await emiService.getEMIApplications();
        console.log('EMI applications response:', applicationsData);
      } catch (appError: any) {
        console.error('Error fetching EMI applications:', appError);
        // Don't fail the whole process if applications fail
        if (appError.response?.status === 401) {
          console.error('Authentication failed for EMI applications');
        }
      }
      
      try {
        console.log('Fetching EMI records...');
        recordsData = await emiService.getEMIRecords();
        console.log('EMI records response:', recordsData);
      } catch (recordError: any) {
        console.error('Error fetching EMI records:', recordError);
        // Don't fail the whole process if records fail
        if (recordError.response?.status === 401) {
          console.error('Authentication failed for EMI records');
        }
      }
      
      // Handle applications
      let applicationsList: EMIApplication[] = [];
      if (Array.isArray(applicationsData)) {
        applicationsList = applicationsData;
      } else if (applicationsData && typeof applicationsData === 'object') {
        const dataObj = applicationsData as any;
        if (Array.isArray(dataObj.results)) {
          applicationsList = dataObj.results;
        }
      }
      
      // Handle records
      let recordsList: EMIProduct[] = [];
      if (Array.isArray(recordsData)) {
        recordsList = recordsData;
      } else if (recordsData && typeof recordsData === 'object') {
        const dataObj = recordsData as any;
        if (Array.isArray(dataObj.results)) {
          recordsList = dataObj.results;
        }
      }
      
      console.log('Processed applications:', applicationsList);
      console.log('Processed records:', recordsList);
      
      setEmiApplications(applicationsList);
      setEmiProducts(recordsList);
      
      // If both failed, show an error
      if (!applicationsData && !recordsData) {
        setError("Unable to load EMI data. Please check your login status and try again.");
      }
    } catch (err) {
      console.error("Error fetching EMI data:", err);
      setError("Failed to fetch EMI data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDrawerForRecord = async (emi: EMIProduct) => {
    try {
      console.log('Opening drawer for EMI:', emi);
      const details = await emiService.getEMIRecordDetails(emi.id);
      console.log('EMI details response:', details);
      setSelectedEMI(details);
      setSelectedApplication(null);
      setDrawerOpen(true);
    } catch (err) {
      console.error("Error fetching EMI details:", err);
      // Still open drawer with existing data if API call fails
      setSelectedEMI(emi);
      setSelectedApplication(null);
      setDrawerOpen(true);
    }
  };

  const openDrawerForApplication = (app: EMIApplication) => {
    setSelectedApplication(app);
    setSelectedEMI(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Function to calculate remaining amount
  const calculateRemainingAmount = (emi: EMIProduct) => {
    return (emi.remaining_amount || 0).toFixed(2);
  };

  // Function to calculate paid amount
  const calculatePaidAmount = (emi: EMIProduct) => {
    return (emi.amount_paid || 0).toFixed(2);
  };

  // Function to calculate progress percentage
  const calculateProgressPercentage = (emi: EMIProduct) => {
    if (!emi.tenure_months || emi.tenure_months === 0) return 0;
    return Math.round(((emi.installments_paid || 0) / emi.tenure_months) * 100);
  };

  // Function to get next installment
  const getNextInstallment = (emi: EMIProduct) => {
    if (!emi.installments || !Array.isArray(emi.installments)) return null;
    return emi.installments.find(inst => inst.status === 'pending');
  };

  // Function to handle installment payment
  const handlePayInstallment = async (installmentId: number) => {
    try {
      const resp = await emiService.payInstallment(installmentId, {});
      if (resp && resp.redirect_url) {
        window.location.href = resp.redirect_url;
        return;
      }
      // If no redirect URL, refresh data
      fetchEMIData();
      if (selectedEMI) {
        const details = await emiService.getEMIRecordDetails(selectedEMI.id);
        setSelectedEMI(details);
      }
    } catch (err) {
      console.error("Error paying installment:", err);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  // Function to handle full payment
  const handleFullPayment = async (emiRecord: EMIProduct): Promise<void> => {
    try {
      const resp = await emiService.initiateFullPayment(
        emiRecord.id,
        // the backend now derives order and amount internally, extra args are optional
        // Keeping the arg placeholders for backward compatibility but they can be omitted
        emiRecord.order.id,
        emiRecord.remaining_amount
      );
      if (resp && resp.redirect_url) {
        window.location.href = resp.redirect_url;
        return;
      }
      alert("Failed to initiate payment. Please try again.");
    } catch (err) {
      console.error("Error initiating full payment:", err);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  // Filter EMI records and applications based on status
  const filteredEMIProducts = emiProducts.filter(emi => {
    if (filter === "all") return true;
    if (filter === "current") return emi.status === "active";
    if (filter === "completed") return emi.status === "completed";
    return true;
  });

  const filteredEMIApplications = emiApplications.filter(app => {
    if (filter === "all") return true;
    if (filter === "pending") return app.status === "pending";
    if (filter === "approved") return app.status === "approved";
    if (filter === "rejected") return app.status === "rejected";
    return true;
  });

  // Combined list for display
  const hasData = filteredEMIApplications.length > 0 || filteredEMIProducts.length > 0;

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
        <div className="flex-1 max-w-[966px] flex flex-col gap-10">
          {/* Header with Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">My EMI</h2>
            <div className="flex gap-2">
              <Button variant={activeTab==='applications'? 'secondary':'ghost'} onClick={()=>setActiveTab('applications')}>Applications</Button>
              <Button variant={activeTab==='records'? 'secondary':'ghost'} onClick={()=>setActiveTab('records')}>Active EMI</Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
                              <Button onClick={fetchEMIData}>Try Again</Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && !hasData && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No EMI records or applications found.</p>
            </div>
          )}

          {/* EMI Applications Section */}
          {activeTab==='applications' && !isLoading && !error && filteredEMIApplications.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">EMI Applications</h3>
              <Card className="border-0 shadow-none">
                <CardContent className="p-0 space-y-4">
                  {filteredEMIApplications.map((app) => (
                    <div key={app.id} className="border rounded-lg p-4 hover:shadow cursor-pointer" onClick={()=>openDrawerForApplication(app)}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-900">Application #{app.id}</span>
                            <Badge 
                              className={`px-2 py-1 text-xs ${
                                app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Applied on {new Date(app.applied_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Plan:</span> {app.emi_plan.name} ({app.emi_plan.duration_months} months)
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Product Price:</span> ৳{Number(app.product_price || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Down Payment:</span> ৳{Number(app.down_payment_amount || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Monthly Installment:</span> ৳{Number(app.monthly_installment || 0).toFixed(2)}
                          </div>
                          {app.rejection_reason && (
                            <div className="text-sm text-red-600">
                              <span className="font-medium">Rejection Reason:</span> {app.rejection_reason}
                            </div>
                          )}
                          {app.admin_notes && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Admin Notes:</span> {app.admin_notes}
                            </div>
                          )}
                        </div>
                        {app.order.primary_image && (
                          <img
                            className="w-16 h-16 object-cover rounded-md"
                            alt="Product"
                            src={app.order.primary_image}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* EMI Records Table */}
          {activeTab==='records' && !isLoading && !error && filteredEMIProducts.length > 0 && (
            <div className="space-y-4">
              {filteredEMIApplications.length > 0 && <h3 className="text-lg font-semibold text-gray-900">Active EMI Records</h3>}
              <Card className="border-0 shadow-none">
              <CardContent className="p-0 space-y-8">
                {/* Table Header - Hidden on Mobile */}
                <div className="hidden md:block space-y-5">
                  <div className="flex gap-4">
                    <div className="w-[147px] text-sm text-gray-600">EMI ID</div>
                    <div className="w-[147px] text-sm text-gray-600">
                      Purchase Date
                    </div>
                    <div className="w-[147px] text-sm text-gray-600">Status</div>
                    <div className="w-[147px] text-sm text-gray-600">Total</div>
                  </div>
                  <Separator />
                </div>

                {/* EMI Product Rows */}
                <div className="space-y-5">
                  {filteredEMIProducts.map((emi) => {
                    const progressPercentage = calculateProgressPercentage(emi);
                    return (
                      <div key={emi.id} className="space-y-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0 md:h-16">
                          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                            <div className="w-full md:w-[147px] text-sm md:text-base font-medium text-gray-900">
                              <span className="md:hidden font-normal text-gray-600 mr-2">EMI ID:</span>
                              {emi.id}
                            </div>
                            <div className="w-full md:w-[147px] text-sm md:text-base font-medium text-gray-900">
                              <span className="md:hidden font-normal text-gray-600 mr-2">Date:</span>
                              {new Date(emi.order.created_at).toLocaleDateString()}
                            </div>
                            <div className="w-full md:w-[147px]">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="bg-blue-500 h-2.5 rounded-full" 
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700">{progressPercentage}%</span>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {emi.installments_paid} of {emi.tenure_months} installments
                              </div>
                            </div>
                            <div className="w-full md:w-[147px] text-sm md:text-base font-medium text-gray-900">
                              <span className="md:hidden font-normal text-gray-600 mr-2">Total:</span>
                              ৳{Number(emi.total_payable || 0).toFixed(2)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2 md:mt-0">
                            <div className="flex items-center gap-2 justify-end">
                              <img
                                className="w-16 h-16 object-cover rounded-md"
                                alt={emi.emi_plan.name}
                                src={emi.order.primary_image || "/placeholder.png"}
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-0 h-8 w-8"
                              onClick={() => openDrawerForRecord(emi)}
                            >
                              <ChevronRightIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            </Button>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </main>
      
      {/* EMI Details Drawer */}
      {drawerOpen && selectedEMI && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40" 
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-xl transition-transform">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  EMI Details - {selectedEMI.id}
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
              <div className="flex-1 overflow-y-auto p-6">
                {/* Product Info */}
                <div className="flex gap-4 mb-6">
                  <img 
                    src={selectedEMI.order.primary_image || "/placeholder.png"} 
                    alt={selectedEMI.emi_plan.name} 
                    className="w-24 h-24 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedEMI.emi_plan.name}</h3>
                    <p className="text-gray-600">Purchased on {new Date(selectedEMI.order.created_at).toLocaleDateString()}</p>
                    <p className="text-gray-900 font-semibold mt-2">৳{Number(selectedEMI.total_payable || 0).toFixed(2)}</p>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                {/* EMI Progress */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">EMI Progress</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${calculateProgressPercentage(selectedEMI)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{calculateProgressPercentage(selectedEMI)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid: ৳{calculatePaidAmount(selectedEMI)}</span>
                    <span className="text-gray-600">Remaining: ৳{calculateRemainingAmount(selectedEMI)}</span>
                  </div>
                </div>
                
                {/* Installment Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Installment Details</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Installments</span>
                      <span className="font-medium">{selectedEMI.tenure_months}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Installments</span>
                      <span className="font-medium">{selectedEMI.installments_paid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Installments</span>
                      <span className="font-medium">{selectedEMI.tenure_months - selectedEMI.installments_paid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Installment Amount</span>
                      <span className="font-medium">৳{selectedEMI.monthly_installment.toFixed(2)}/mo</span>
                    </div>
                  </div>
                </div>
                
                {/* Next Payment */}
                {getNextInstallment(selectedEMI) && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="w-4 h-4 text-blue-500" />
                      <h4 className="text-sm font-medium text-gray-700">Next Payment</h4>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Due Date</span>
                      <span className="font-medium">
                        {new Date(getNextInstallment(selectedEMI)?.due_date || new Date()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-medium">৳{(getNextInstallment(selectedEMI)?.amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                {/* Loan Details */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Loan Details</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate</span>
                      <span className="font-medium">{selectedEMI.emi_plan.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Processing Fee</span>
                      <span className="font-medium">৳{((selectedEMI.principal_amount * selectedEMI.emi_plan.processing_fee_percentage / 100) + selectedEMI.emi_plan.processing_fee_fixed).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              {getNextInstallment(selectedEMI) && (
                <div className="p-6 border-t space-y-3">
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => {
                      const nextInstallment = getNextInstallment(selectedEMI);
                      if (nextInstallment) {
                        handlePayInstallment(nextInstallment.id);
                      }
                    }}
                  >
                    <DollarSignIcon className="w-4 h-4 mr-2" />
                    Pay Current Installment
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleFullPayment(selectedEMI)}
                  >
                    <DollarSignIcon className="w-4 h-4 mr-2" />
                    Pay Full Amount
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Application Drawer */}
      {drawerOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={closeDrawer} />
          <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-xl transition-transform">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  EMI Application #{selectedApplication.id}
                </h2>
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={closeDrawer}>
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p><span className="font-medium">Status:</span> {selectedApplication.status}</p>
                <p><span className="font-medium">Plan:</span> {selectedApplication.emi_plan.name} ({selectedApplication.emi_plan.duration_months} months)</p>
                <p><span className="font-medium">Product Price:</span> ৳{Number(selectedApplication.product_price||0).toFixed(2)}</p>
                <p><span className="font-medium">Down Payment:</span> ৳{Number(selectedApplication.down_payment_amount||0).toFixed(2)}</p>
                <p><span className="font-medium">Monthly Installment:</span> ৳{Number(selectedApplication.monthly_installment||0).toFixed(2)}</p>
                {selectedApplication.status==='approved' && (
                  <div className="space-y-3 pt-4">
                    <Button className="w-full" onClick={async()=>{
                      try{
                        const recordResp = await emiService.getEMIRecords();
                        const rec = (Array.isArray(recordResp)? recordResp: recordResp.results||[]).find((r:any)=>r.order.id===selectedApplication.order.id);
                        if(!rec){alert('EMI record not found');return;}
                        const nextInst = await emiService.getNextInstallment(rec.id);
                        if(nextInst && nextInst.installment){
                          const payResp = await emiService.payInstallment(nextInst.installment.id, {});
                          if(payResp && payResp.redirect_url){
                            window.location.href = payResp.redirect_url;
                          }
                        }
                      }catch(e){console.error(e);alert('Failed to initiate payment');}
                    }}>Pay Next Installment</Button>
                    <Button variant="outline" className="w-full" onClick={async()=>{
                      try{
                        const recordResp = await emiService.getEMIRecords();
                        const rec = (Array.isArray(recordResp)? recordResp: recordResp.results||[]).find((r:any)=>r.order.id===selectedApplication.order.id);
                        if(!rec){alert('EMI record not found');return;}
                        const payResp = await emiService.initiateFullPayment(rec.id, selectedApplication.order.id, rec.remaining_amount);
                        if(payResp && payResp.redirect_url){
                          window.location.href = payResp.redirect_url;
                        }
                      }catch(e){console.error(e);alert('Failed to initiate payment');}
                    }}>Pay Full Amount</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CtaFooterByAnima />
    </div>
  );
}; 