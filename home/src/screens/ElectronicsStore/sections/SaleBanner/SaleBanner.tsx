import React, { useEffect, useState } from "react";
import { promotionsService } from "../../../../services/api";

// Interface for the sale banner data
interface SaleBanner {
  id: number;
  percentage: number;
  title: string;
  subtitle: string;
  promo_code: string;
  image: string;
  bg_color_start: string;
  bg_color_end: string;
  dark_bg_color_start: string;
  dark_bg_color_end: string;
  is_active: boolean;
}

export const SaleBanner = (): JSX.Element => {
  // State for banner data
  const [bannerData, setBannerData] = useState<SaleBanner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch banner data on component mount
  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        setLoading(true);
        const data = await promotionsService.getSaleBanner();
        if (data) {
          setBannerData(data);
          console.log('Fetched sale banner:', data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching sale banner:', err);
        setError('Failed to load sale banner');
        setBannerData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBannerData();
  }, []);

  // Default values for when API data is not available
  const percentage = bannerData?.percentage || 20;
  const title = bannerData?.title || "Seasonal weekly sale 2024";
  const subtitle = bannerData?.subtitle || "Use code";
  const promoCode = bannerData?.promo_code || "Sale 2024";
  const image = bannerData?.image || "/image-1.png";
  const bgColorStart = bannerData?.bg_color_start || "rgb(172, 203, 238)";
  const bgColorEnd = bannerData?.bg_color_end || "rgb(231, 240, 253)";
  const darkBgColorStart = bannerData?.dark_bg_color_start || "rgb(27, 39, 58)";
  const darkBgColorEnd = bannerData?.dark_bg_color_end || "rgb(31, 38, 50)";

  // Gradient styles
  const lightGradient = `linear-gradient(90deg, ${bgColorStart} 0%, ${bgColorEnd} 100%)`;
  const darkGradient = `linear-gradient(90deg, ${darkBgColorStart} 0%, ${darkBgColorEnd} 100%)`;

  return (
    <section className="pt-3 mt-2 md:mt-3 lg:mt-4 w-full">
      <div className="flex flex-col md:flex-row w-full">
        {/* Left percentage column */}
        <div className="mb-3 md:mb-0 md:w-1/4">
          <div className="relative flex flex-col items-center justify-center h-full py-3">
            <div className="absolute top-0 start-0 w-full h-full hidden md:block">
              <span className="absolute top-0 start-0 w-full h-full rounded-2xl dark:hidden" style={{ backgroundColor: bgColorStart }}></span>
              <span className="absolute top-0 start-0 w-full h-full rounded-2xl hidden dark:block" style={{ backgroundColor: darkBgColorStart }}></span>
            </div>
            <div className="absolute top-0 start-0 w-full h-full md:hidden">
              <span className="absolute top-0 start-0 w-full h-full rounded-t-2xl dark:hidden" style={{ background: lightGradient }}></span>
              <span className="absolute top-0 start-0 w-full h-full rounded-t-2xl hidden dark:block" style={{ background: darkGradient }}></span>
            </div>
            <div className="relative z-10 text-5xl font-bold text-gray-900 dark:text-gray-100 text-nowrap mb-0">
              {percentage}
              <span className="inline-block ml-1">
                <span className="block text-2xl">%</span>
                <span className="block text-base">OFF</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Right content column */}
        <div className="relative md:w-3/4">
          <div className="absolute top-0 start-0 h-full overflow-hidden rounded-full z-10 hidden md:block" style={{ color: "var(--cz-body-bg)", marginLeft: "-2px" }}>
            <svg width="4" height="180" viewBox="0 0 4 180" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 0L1.99998 180" stroke="currentColor" strokeWidth="3" strokeDasharray="8 12" strokeLinecap="round"></path>
            </svg>
          </div>
          <div className="relative">
            <span className="absolute top-0 start-0 w-full h-full rounded-2xl dark:hidden" style={{ background: lightGradient }}></span>
            <span className="absolute top-0 start-0 w-full h-full rounded-2xl hidden dark:block" style={{ background: darkGradient }}></span>
            <div className="flex flex-col md:flex-row items-center relative z-10">
              <div className="mb-2 md:mb-0 md:w-1/2">
                <div className="text-center md:text-start py-3 px-4 md:ps-5 md:pe-0 md:me-[-20px]">
                  <h3 className="uppercase font-bold md:ps-3 pb-1 mb-1 text-gray-900 dark:text-gray-100 text-lg md:text-xl">{title}</h3>
                  <p className="text-gray-700 dark:text-gray-300 md:ps-3 mb-0 text-sm md:text-base">
                    {subtitle} <span className="inline-block font-semibold bg-white text-gray-900 rounded-full py-0.5 px-2">{promoCode}</span> to get best offer
                  </p>
                </div>
              </div>
              <div className="flex justify-center md:justify-end pb-3 md:pb-0 md:w-1/2">
                <div className="md:me-4">
                  <div className="w-full" style={{ maxWidth: "320px" }}>
                    <img 
                      alt="Sale" 
                      loading="lazy" 
                      width="640" 
                      height="384" 
                      className="block h-auto max-h-[140px] md:max-h-[160px] object-contain" 
                      src={image} 
                    />
                  </div>
                  <div className="hidden lg:block" style={{ marginBottom: "-5%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block" style={{ paddingBottom: "1%" }}></div>
    </section>
  );
}; 