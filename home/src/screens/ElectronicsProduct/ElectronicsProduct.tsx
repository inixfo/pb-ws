import React from "react";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { ProductNavbarSection } from "./sections/ProductNavbarSection/ProductNavbarSection";
import { CheaperTogetherSection } from "./sections/CheaperTogetherSection/CheaperTogetherSection";
import { TrendingProductsSection } from "./sections/TrendingProductsSection/TrendingProductsSection";
import { RecentlyViewedProductsSection } from "./sections/RecentlyViewedProductsSection/RecentlyViewedProductsSection";
import { ProductProvider } from "../../contexts/ProductContext";

export const ElectronicsProduct = (): JSX.Element => {
  return (
    <ProductProvider>
      <div className="flex flex-col w-full bg-white-100 min-h-screen">
        <HeaderByAnima showHeroSection={false} />
        <main className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4 lg:mt-6 mb-6 sm:mb-10 lg:mb-16 flex flex-col gap-8 sm:gap-12 lg:gap-16">
          {/* Product main info (gallery, options, price, etc.) */}
          <section className="w-full flex flex-col items-center min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] mb-4 sm:mb-8 lg:mb-12 product-tabs-container">
            <ProductNavbarSection />
          </section>
          
          {/* Cheaper together - moved before trending products */}
          <section className="w-full flex flex-col items-center mt-0 pt-0">
            <CheaperTogetherSection />
          </section>
          
          {/* Trending products */}
          <section className="w-full flex flex-col items-center mt-0 sm:mt-4 lg:mt-8">
            <TrendingProductsSection />
          </section>
          
          {/* Recently viewed products */}
          <section className="w-full flex flex-col items-center mt-0 sm:mt-4 lg:mt-8">
            <RecentlyViewedProductsSection />
          </section>
        </main>
        <CtaFooterByAnima />
      </div>
    </ProductProvider>
  );
}; 