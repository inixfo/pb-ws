import React from "react";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { PaymentCanceled as PaymentCanceledContent } from "../ThankYou/sections/PaymentCanceled/PaymentCanceled";

export const PaymentCanceled = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white-100 min-h-screen">
      <HeaderByAnima showHeroSection={false} />
      <main className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-16 flex flex-col">
        <section className="w-full flex flex-col items-center">
          <PaymentCanceledContent />
        </section>
      </main>
      <CtaFooterByAnima />
    </div>
  );
}; 