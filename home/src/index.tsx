import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { AuthProvider } from "./context/AuthContext";
import { BestSellers } from "./screens/BestSellers/BestSellers";
import { TodaysDeals } from "./screens/TodaysDeals/TodaysDeals";
import { NewArrivals } from "./screens/NewArrivals/NewArrivals";
import { Trending } from "./screens/Trending/Trending";
import { SpecialOffers } from "./screens/SpecialOffers/SpecialOffers";
import { HelpCenter } from "./screens/HelpCenter/HelpCenter";
import { OrderTrackingPage } from "./screens/OrderTracking/OrderTrackingPage";
import { TrackOrderLookup } from "./screens/OrderTracking/TrackOrderLookup";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<ElectronicsStore />} />
          <Route path="/categories" element={<ShopCategories />} />
          <Route path="/category/:slug" element={<ShopCatalog />} />
          <Route path="/catalog" element={<ShopCatalog />} />
          <Route path="/catalog/:slug" element={<ShopCatalog />} />
          
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
      </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
