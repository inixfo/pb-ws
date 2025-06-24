import React, { useEffect } from "react";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { DeliveryInfoContent } from "./sections/DeliveryInfoContent/DeliveryInfoContent";
import { CheckoutProvider } from "../../contexts/CheckoutContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const DeliveryInfo = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    // If authentication check is complete and user is not logged in, redirect to login
    if (!loading && !user) {
      navigate('/login?redirect=/checkout');
    }
  }, [user, loading, navigate]);

  // If still loading, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, don't render checkout content
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col w-full bg-white-100 min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      <main className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4 lg:mt-6 mb-6 sm:mb-10 lg:mb-16 flex flex-col">
        <section className="w-full flex flex-col items-center">
          <CheckoutProvider>
            <DeliveryInfoContent />
          </CheckoutProvider>
        </section>
      </main>
      <CtaFooterByAnima />
    </div>
  );
}; 