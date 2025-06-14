import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { Toaster } from 'react-hot-toast';

// Admin Panel Pages
import UserManagement from "./pages/Admin/UserManagement";
import ProductManagement from "./pages/Admin/ProductManagement";
import ProductForm from "./pages/Admin/ProductForm";
import CategoryManagement from "./pages/Admin/CategoryManagement";
import BrandManagement from "./pages/Admin/BrandManagement";
import OrderManagement from "./pages/Admin/OrderManagement";
import EMIPlans from "./pages/Admin/EMIPlans";
import EMIApplications from "./pages/Admin/EMIApplications";
import VendorManagement from "./pages/Admin/VendorManagement";
import ReviewManagement from "./pages/Admin/ReviewManagement";
import CustomFields from "./pages/Admin/CustomFields";
import VendorPayouts from "./pages/Admin/VendorPayouts";
import PromotionsManagement from "./pages/Admin/PromotionsManagement";

// Vendor Panel Pages
import VendorDashboard from "./pages/Vendor/VendorDashboard";
import VendorProducts from "./pages/Vendor/VendorProducts";
import VendorOrders from "./pages/Vendor/VendorOrders";
import VendorAnalytics from "./pages/Vendor/VendorAnalytics";
import VendorProfile from "./pages/Vendor/VendorProfile";
import VendorEarnings from "./pages/Vendor/VendorEarnings";
import VendorPaymentSettings from "./pages/Vendor/VendorPaymentSettings";

// Auth Context Provider
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Add this class at the top level of the file
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>
            <summary>Show error details</summary>
            <p>{this.state.error && this.state.error.toString()}</p>
            <p>Component Stack:</p>
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" />
        <AuthProvider>
          <ScrollToTop />
          <Routes>
            {/* Auth Layout */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Dashboard Layout - Protected Routes */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Common Dashboard */}
              <Route index path="/" element={<Home />} />
              <Route path="/profile" element={<UserProfiles />} />

              {/* Admin Routes */}
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/products" element={<ProductManagement />} />
              <Route path="/admin/products/new" element={<ProductForm />} />
              <Route path="/admin/products/edit/:id" element={<ProductForm />} />
              <Route path="/admin/categories" element={<CategoryManagement />} />
              <Route path="/admin/brands" element={<BrandManagement />} />
              <Route path="/admin/custom-fields" element={<CustomFields />} />
              <Route path="/admin/orders" element={<OrderManagement />} />
              <Route path="/admin/emi-plans" element={<EMIPlans />} />
              <Route path="/admin/emi-applications" element={<EMIApplications />} />
              <Route path="/admin/vendors" element={<VendorManagement />} />
              <Route path="/admin/vendor-payouts" element={<VendorPayouts />} />
              <Route path="/admin/reviews" element={<ReviewManagement />} />
              <Route path="/admin/promotions" element={<PromotionsManagement />} />

              {/* Vendor Routes */}
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />
              <Route path="/vendor/products" element={<VendorProducts />} />
              <Route path="/vendor/products/new" element={<ProductForm />} />
              <Route path="/vendor/products/edit/:id" element={<ProductForm />} />
              <Route path="/vendor/orders" element={<VendorOrders />} />
              <Route path="/vendor/analytics" element={<VendorAnalytics />} />
              <Route path="/vendor/earnings" element={<VendorEarnings />} />
              <Route path="/vendor/payment-settings" element={<VendorPaymentSettings />} />
              <Route path="/vendor/profile" element={<VendorProfile />} />

              {/* Form Components */}
              <Route path="/form-elements" element={<FormElements />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
