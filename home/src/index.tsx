import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ElectronicsStore } from "./screens/ElectronicsStore/ElectronicsStore";
import { ShopCategories } from "./screens/ShopCategories/ShopCategories";
import { ShopCatalog } from "./screens/ShopCatalog/ShopCatalog";
import { ElectronicsProduct } from "./screens/ElectronicsProduct/ElectronicsProduct";
import { ShoppingCart } from "./screens/ShoppingCart/ShoppingCart";
import { DeliveryInfo } from "./screens/DeliveryInfo/DeliveryInfo";
import { ThankYou } from "./screens/ThankYou";
import { PaymentCanceled } from "./screens/PaymentCanceled";
import { Account, PaymentMethods, Addresses, Notifications, MyEMI } from "./screens/Account";
import { MyReviews } from "./screens/Account/MyReviews";
import { PersonalInfo } from "./screens/Account/PersonalInfo";
import { CartProvider } from "./context/CartContext";
import { SignIn, SignUp, ForgotPassword } from "./screens/Auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { SiteSettingsProvider, useSiteSettings } from "./contexts/SiteSettingsContext";
import { BestSellers } from "./screens/BestSellers/BestSellers";
import { TodaysDeals } from "./screens/TodaysDeals/TodaysDeals";
import { NewArrivals } from "./screens/NewArrivals/NewArrivals";
import { Trending } from "./screens/Trending/Trending";
import { SpecialOffers } from "./screens/SpecialOffers/SpecialOffers";
import { HelpCenter } from "./screens/HelpCenter/HelpCenter";
import { OrderTrackingPage } from "./screens/OrderTracking/OrderTrackingPage";
import { TrackOrderLookup } from "./screens/OrderTracking/TrackOrderLookup";

// FaviconUpdater component to update the favicon from site settings
const FaviconUpdater = () => {
  const { settings } = useSiteSettings();
  
  useEffect(() => {
    if (settings.favicon) {
      // Update favicon if available in site settings
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'shortcut icon';
      link.href = settings.favicon;
      document.getElementsByTagName('head')[0].appendChild(link);
      console.log('[FaviconUpdater] Updated favicon to:', settings.favicon);
    }
  }, [settings.favicon]);
  
  // This component doesn't render anything
  return null;
};

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
      <CartProvider>
      <SiteSettingsProvider>
        <FaviconUpdater />
        <Routes>
          <Route path="/" element={<ElectronicsStore />} />
          <Route path="/categories" element={<ShopCategories />} />
          <Route path="/category/:slug" element={
            <ShopCatalog />
          } />
          <Route path="/catalog" element={<ShopCatalog />} />
          <Route path="/catalog/:slug" element={
            <ShopCatalog />
          } />
          
          {/* Promotional Category Pages */}
          <Route path="/best-sellers" element={<BestSellers />} />
          <Route path="/todays-deals" element={<TodaysDeals />} />
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/special-offers" element={<SpecialOffers />} />
          <Route path="/help-center" element={<HelpCenter />} />
          
          {/* Product routes - support multiple URL patterns */}
          <Route path="/product/:productId" element={<ElectronicsProduct />} />
          <Route path="/products/:productId" element={<ElectronicsProduct />} />
          
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/checkout" element={<DeliveryInfo />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />
          <Route path="/track-order" element={<TrackOrderLookup />} />
          <Route path="/track-order/:orderId" element={<OrderTrackingPage />} />
            
            {/* Protected Account Routes */}
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
            <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
            <Route path="/personal-info" element={<ProtectedRoute><PersonalInfo /></ProtectedRoute>} />
            <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/my-emi" element={<ProtectedRoute><MyEMI /></ProtectedRoute>} />
            
            {/* Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </SiteSettingsProvider>
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
