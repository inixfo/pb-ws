import { ChevronRightIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { brandService } from "../../services/api";
import { Brand } from "../../types/products";
import { BenefitsByAnima } from "./sections/BenefitsByAnima";
import { CtaFooterByAnima } from "./sections/CtaFooterByAnima";
import { HeaderByAnima } from "./sections/HeaderByAnima/HeaderByAnima";
import { NewArrivalsByAnima } from "./sections/NewArrivalsByAnima/NewArrivalsByAnima";
import { SaleBanner } from "./sections/SaleBanner/SaleBanner";
import { SpecialOffersByAnima } from "./sections/SpecialOffersByAnima/SpecialOffersByAnima";
import { TrendingProductsByAnima } from "./sections/TrendingProductsByAnima/TrendingProductsByAnima";

// Fallback brand data
const fallbackBrands = [
  { id: 1, name: "Vector", logo: "/vector.svg", slug: "vector", is_featured: true },
  { id: 2, name: "Motorola", logo: "/motorola.svg", slug: "motorola", is_featured: true },
  { id: 3, name: "Canon", logo: "/canon.svg", slug: "canon", is_featured: true },
  { id: 4, name: "Samsung", logo: "/samsung.svg", slug: "samsung", is_featured: true },
  { id: 5, name: "Sony", logo: "/sony.svg", slug: "sony", is_featured: true }
];

export const ElectronicsStore = (): JSX.Element => {
  // State for brands
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Clear cache for API requests
  useEffect(() => {
    // Clear any cached API data by setting a flag in sessionStorage
    const timestamp = new Date().getTime();
    sessionStorage.setItem('lastCacheCleared', timestamp.toString());
    
    console.log('Cleared API cache on home page load:', timestamp);
  }, []);

  // Fetch brands on component mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const data = await brandService.getAll();
        
        if (data && data.results && data.results.length > 0) {
          setBrands(data.results);
        } else {
          // Use fallback data if API returns empty
          console.warn('No brands returned from API, using fallback data');
          setBrands(fallbackBrands);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching brands:', err);
        setError('Failed to load brands');
        setBrands(fallbackBrands);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Use fallback data if needed
  const displayBrands = brands.length > 0 ? brands : fallbackBrands;

  return (
    <div className="flex flex-col w-full bg-white-100">
      <HeaderByAnima />
      <div className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 flex flex-col gap-8 sm:gap-12">
        <div className="mt-4 sm:mt-8">
          <BenefitsByAnima />
        </div>
        <div className="mt-8 sm:mt-12">
          <NewArrivalsByAnima />
        </div>
        <div className="mt-8 sm:mt-12">
          <TrendingProductsByAnima />
        </div>
        <div className="mt-8 sm:mt-12">
          <SaleBanner />
        </div>
        <div className="mt-8 sm:mt-12">
          <SpecialOffersByAnima />
        </div>
        {/* Brands section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-6 pb-8 sm:pb-12 mt-8 sm:mt-12">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="w-12 h-12 border-4 border-primarymain border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="col-span-full flex justify-center items-center py-8 text-red-500">{error}</div>
          ) : brands.length === 0 ? (
            <div className="col-span-full flex justify-center items-center py-8 text-gray-500">No brands found.</div>
          ) : (
            displayBrands.map((brand, index) => (
              <Card
                key={brand.id}
                className="h-24 sm:h-28 rounded-xl overflow-hidden border border-solid border-[#e0e5eb]"
              >
                <CardContent className="p-0 h-full flex items-center justify-center">
                  <img
                    className="w-[120px] sm:w-[164px] h-16 sm:h-20 object-contain"
                    alt={brand.name}
                    src={brand.logo}
                  />
                </CardContent>
              </Card>
            ))
          )}
          <Card
            className="h-24 sm:h-28 rounded-xl overflow-hidden border border-solid border-[#e0e5eb]"
          >
            <CardContent className="p-0 h-full flex items-center justify-center">
              <Button variant="ghost" className="flex items-center gap-1.5">
                <span className="font-navigation-nav-link-small font-[number:var(--navigation-nav-link-small-font-weight)] text-gray-700 text-[length:var(--navigation-nav-link-small-font-size)] tracking-[var(--navigation-nav-link-small-letter-spacing)] leading-[var(--navigation-nav-link-small-line-height)]">
                  All brands
                </span>
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <CtaFooterByAnima />
    </div>
  );
};
