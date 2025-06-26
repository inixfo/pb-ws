import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { HomeIcon } from 'lucide-react';
import { HeaderByAnima } from '../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima';
import { CtaFooterByAnima } from '../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima';

export const AboutUs = () => {
  const { settings } = useSiteSettings();
  const siteName = settings?.site_name || 'Phone Bay';

  return (
    <div className="flex flex-col w-full bg-white-100">
      <HeaderByAnima showHeroSection={false} />
      
      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center text-sm">
              <Link to="/" className="flex items-center text-gray-500 hover:text-gray-900">
                <HomeIcon className="h-4 w-4 mr-1" />
                Home
              </Link>
              <svg className="h-5 w-5 text-gray-400 mx-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-900 font-medium">About Us</span>
            </nav>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 py-12 px-6 sm:px-12 lg:px-16">
              <div className="relative max-w-3xl mx-auto text-center">
                <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                  About {siteName}
                </h1>
              </div>
              <div className="absolute inset-y-0 right-0 hidden lg:block lg:w-1/3">
                <svg className="absolute inset-0 h-full w-full text-white text-opacity-10" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points="0,0 100,0 50,100 0,100" />
                </svg>
              </div>
            </div>
            
            {/* About Content */}
            <div className="px-6 py-10 sm:px-12 lg:px-16">
              <div className="prose max-w-none lg:prose-lg text-gray-700">
                <p>
                  PhoneBay is a trusted and customer-focused tech retailer in Bangladesh, dedicated to offering premium smartphones, motor-bikes, cars, televisions, refrigerators, freezers, washing machines, air conditioners, home appliances, gadgets, accessories and all kinds of electronics at competitive prices. With a strong emphasis on authenticity, reliability, and user satisfaction, PhoneBay has quickly become a go-to destination for tech enthusiasts and everyday consumers seeking genuine products and transparent service.
                </p>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
                <p>
                  Our mission is to make advanced technology accessible to everyone across Bangladesh, not just through pricing but also through flexible purchasing options and dedicated customer support, with thousands of options to choose.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Product Quality</h2>
                <p>
                  All our products are 100% original, sourced directly from authorized distributors and manufacturers. Whether you're in search smartphones, motor-bikes, cars, televisions, refrigerators, freezers, washing machines, air conditioners, home appliances, gadgets, accessories and all kinds of electronics at competitive prices of flagship smartphones, budget-friendly devices, or high-quality accessories, PhoneBay ensures each item is quality-checked and comes with a valid warranty for complete peace of mind.
                </p>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Delivery Options</h2>
                <p>
                  While we currently offer doorstep delivery, we make the collection process simple and safe. After placing an order, customers are required to collect their device from the nearest delivery point or in home.
                </p>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Flexible Payment Solutions</h2>
                <p>
                  PhoneBay is also recognized for offering flexible payment solutions. Among the most popular is our Cardless EMI option, which allows customers to purchase their desired products by paying only a confirmation amount upfront. The remaining balance can be paid in monthly instalments, making it easier than ever to own high-end technology without financial strain. Additionally, we offer other accessible payment options such as mobile banking and digital wallet payments.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">User Experience</h2>
                <p>
                  Our website is designed with user convenience in mind—featuring clear product descriptions, real customer reviews, and up-to-date information on pricing, stock status, and specifications. We also have a responsive customer service team ready to assist with queries, order tracking, and post-purchase support.
                </p>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Customer Satisfaction</h2>
                <p>
                  Customer satisfaction is central to everything we do. PhoneBay follows clear Return, Refund, and Cancellation policies to ensure customers feel confident while shopping. If a customer needs to cancel an order before it is processed, or faces a product issue, we offer prompt resolutions in accordance with our policy guidelines.
                </p>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Protection</h2>
                <p>
                  PhoneBay also protects your data and privacy with advanced security measures. Whether you're creating an account or making a transaction, your personal and financial information is encrypted and handled with utmost confidentiality.
                </p>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Exclusive Offers</h2>
                <p>
                  We frequently run promotional campaigns, seasonal discounts, and exclusive offers that allow customers to get the best value for their money. All promotions are time-bound and stock-dependent, with terms clearly outlined to ensure transparency.
                </p>

                <p className="text-lg font-medium mt-8">
                  PhoneBay is your trusted online destination for the smartphones, motor-bikes, cars, televisions, refrigerators, freezers, washing machines, air conditioners, home appliances, gadgets, accessories and all kinds of electronics.
                </p>

                <div className="bg-gray-50 p-6 rounded-lg mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Company Information</h3>
                  <p className="mb-1"><strong>Trade License No.-</strong> 20242628005022236</p>
                  <p className="mb-1"><strong>Address 1-</strong> Dhanmondi 27, Level 7, 27 Shaptak Square, Plot 380, Road 27, Dhanmondi, Dhaka 1207, Dhaka, Bangladesh.</p>
                  <p><strong>Address 2-</strong> B-124, Bazar Road, Savar, Dhaka-1340.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CtaFooterByAnima />
    </div>
  );
};

export default AboutUs; 