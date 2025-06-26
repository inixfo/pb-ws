import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
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
import { SignIn, SignUp, ForgotPassword } from "./screens/Auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { BestSellers } from "./screens/BestSellers/BestSellers";
import { TodaysDeals } from "./screens/TodaysDeals/TodaysDeals";
import { NewArrivals } from "./screens/NewArrivals/NewArrivals";
import { Trending } from "./screens/Trending/Trending";
import { SpecialOffers } from "./screens/SpecialOffers/SpecialOffers";
import { HelpCenter } from "./screens/HelpCenter/HelpCenter";
import { OrderTrackingPage } from "./screens/OrderTracking/OrderTrackingPage";
import { TrackOrderLookup } from "./screens/OrderTracking/TrackOrderLookup";
import { AboutUs } from "./screens/AboutUs/AboutUs";
import { TermsAndConditions } from "./screens/TermsAndConditions/TermsAndConditions";
import { PrivacyPolicy } from "./screens/PrivacyPolicy/PrivacyPolicy";
import { useSiteSettings } from "./contexts/SiteSettingsContext";

// FaviconUpdater component to update the favicon from site settings
const FaviconUpdater = () => {
  const { settings } = useSiteSettings();
  
  useEffect(() => {
    try {
      // Get existing favicon link or create a new one
      const existingLink: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      const link: HTMLLinkElement = existingLink || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      
      console.log('[FaviconUpdater] Current favicon link:', existingLink?.href);
      console.log('[FaviconUpdater] Settings favicon:', settings?.favicon);
      
      // First always try to use the default favicon
      // This ensures something will show while we try the custom one
      link.href = '/favicon.ico';
      if (!existingLink) {
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      
      if (settings?.favicon && settings.favicon.startsWith('http')) {
        // Clean the URL to fix any issues with double slashes or media paths
        let faviconUrl = settings.favicon;
        
        // Fix common URL issues
        if (faviconUrl.includes('/media//media/')) {
          faviconUrl = faviconUrl.replace('/media//media/', '/media/');
          console.log('[FaviconUpdater] Fixed double media path in favicon URL');
        }
        
        // Fix any double slashes in the path (except http:// or https://)
        faviconUrl = faviconUrl.replace(/(https?:\/\/)|(\/)+/g, (match, protocol) => {
          return protocol ? protocol : '/';
        });
        
        // Update favicon if available in site settings
        console.log('[FaviconUpdater] Setting favicon to:', faviconUrl);
        
        // Use an image to test if the favicon is loadable
        const img = new Image();
        img.onload = () => {
          console.log('[FaviconUpdater] Favicon loaded successfully, updating link');
          link.href = faviconUrl;
        };
        img.onerror = () => {
          console.error('[FaviconUpdater] Favicon failed to load:', faviconUrl);
          // Keep default favicon if custom one fails
          console.log('[FaviconUpdater] Keeping default favicon');
        };
        img.src = faviconUrl;
      } else {
        console.log('[FaviconUpdater] Using default favicon');
      }
      
      // Also update the page title with the site name
      if (settings?.site_name) {
        document.title = settings.site_name;
        console.log('[FaviconUpdater] Updated page title to:', settings.site_name);
      }
    } catch (err) {
      console.error('[FaviconUpdater] Error updating favicon:', err);
    }
  }, [settings]);
  
  // This component doesn't render anything
  return null;
};

const App = () => {
  return (
    <>
      <FaviconUpdater />
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
        
        {/* New Pages */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        
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
    </>
  );
};

export default App; 