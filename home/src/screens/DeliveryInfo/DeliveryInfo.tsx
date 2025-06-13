import React from "react";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { DeliveryInfoContent } from "./sections/DeliveryInfoContent/DeliveryInfoContent";
import { CheckoutProvider } from "../../contexts/CheckoutContext";

export const DeliveryInfo = (): JSX.Element => {
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