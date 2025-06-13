import React from "react";

export const SeasonalSaleByAnima = (): JSX.Element => {
  return (
    <section className="pt-3 mt-2 md:mt-3 lg:mt-4 w-full">
      <div className="flex flex-col md:flex-row w-full">
        {/* Left Column - 20% OFF */}
        <div className="mb-3 md:mb-0 md:w-1/4">
          <div className="relative flex flex-col items-center justify-center h-full py-3">
            {/* Background for desktop */}
            <div className="absolute top-0 start-0 w-full h-full hidden md:block">
              <span 
                className="absolute top-0 start-0 w-full h-full rounded-2xl dark:hidden" 
                style={{ backgroundColor: "#accbee" }}
              ></span>
              <span 
                className="absolute top-0 start-0 w-full h-full rounded-2xl hidden dark:block" 
                style={{ backgroundColor: "#1b273a" }}
              ></span>
            </div>
            
            {/* Background for mobile */}
            <div className="absolute top-0 start-0 w-full h-full md:hidden">
              <span 
                className="absolute top-0 start-0 w-full h-full rounded-t-2xl dark:hidden" 
                style={{ background: "linear-gradient(90deg, #accbee 0%, #e7f0fd 100%)" }}
              ></span>
              <span 
                className="absolute top-0 start-0 w-full h-full rounded-t-2xl hidden dark:block" 
                style={{ background: "linear-gradient(90deg, #1b273a 0%, #1f2632 100%)" }}
              ></span>
            </div>
            
            {/* 20% OFF Text */}
            <div className="relative z-10 text-5xl font-bold text-gray-900 dark:text-gray-100 text-nowrap mb-0">
              20
              <span className="inline-block ml-1">
                <span className="block text-2xl">%</span>
                <span className="block text-base">OFF</span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Right Column - Content */}
        <div className="relative md:w-3/4">
          {/* Dotted line separator (visible on desktop) */}
          <div className="absolute top-0 start-0 h-full overflow-hidden rounded-full z-10 hidden md:block" style={{ color: "var(--cz-body-bg)", marginLeft: "-2px" }}>
            <svg width="4" height="180" viewBox="0 0 4 180" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 0L1.99998 180" stroke="currentColor" strokeWidth="3" strokeDasharray="8 12" strokeLinecap="round"></path>
            </svg>
          </div>
          
          {/* Content container */}
          <div className="relative">
            {/* Background */}
            <span 
              className="absolute top-0 start-0 w-full h-full rounded-2xl dark:hidden" 
              style={{ background: "linear-gradient(90deg, #accbee 0%, #e7f0fd 100%)" }}
            ></span>
            <span 
              className="absolute top-0 start-0 w-full h-full rounded-2xl hidden dark:block" 
              style={{ background: "linear-gradient(90deg, #1b273a 0%, #1f2632 100%)" }}
            ></span>
            
            {/* Content */}
            <div className="flex flex-col md:flex-row items-center relative z-10">
              {/* Text content */}
              <div className="mb-2 md:mb-0 md:w-1/2">
                <div className="text-center md:text-start py-3 px-4 md:ps-5 md:pe-0 md:me-[-20px]">
                  <h3 className="uppercase font-bold md:ps-3 pb-1 mb-1 text-gray-900 dark:text-gray-100 text-lg md:text-xl">
                    Seasonal weekly sale 2024
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 md:ps-3 mb-0 text-sm md:text-base">
                    Use code{" "}
                    <span className="inline-block font-semibold bg-white text-gray-900 rounded-full py-0.5 px-2">
                      Sale 2024
                    </span>{" "}
                    to get best offer
                  </p>
                </div>
              </div>
              
              {/* Image */}
              <div className="flex justify-center md:justify-end pb-3 md:pb-0 md:w-1/2">
                <div className="md:me-4">
                  <div className="w-full" style={{ maxWidth: "320px" }}>
                    <img
                      alt="Camera"
                      loading="lazy"
                      width="640"
                      height="384"
                      className="block h-auto max-h-[140px] md:max-h-[160px] object-contain"
                      src="/image-1.png"
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