import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { HomeIcon } from 'lucide-react';
import { HeaderByAnima } from '../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima';
import { CtaFooterByAnima } from '../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima';

export const PrivacyPolicy = () => {
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
              <span className="text-gray-900 font-medium">Privacy & Policies</span>
            </nav>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 py-12 px-6 sm:px-12">
              <div className="relative max-w-3xl mx-auto">
                <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                  Privacy & Policies
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-indigo-100">
                  Last updated: June 1, 2025
                </p>
              </div>
            </div>
            
            {/* Policy Content */}
            <div className="px-6 py-10 sm:px-12">
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1) Delivery Policy</h2>
                <p className="text-gray-600">
                  {siteName} aims to deliver products to customers as quickly and securely as possible.
                </p>
                <p className="text-gray-600 mb-2"><strong>Delivery Timeframe:</strong> Standard delivery time is 3–7 working days within Dhaka city and 3–10 working days for outside Dhaka, depending on location and product availability.</p>
                <p className="text-gray-600 mb-2"><strong>Delivery Charges:</strong> Delivery fees may vary based on product category and location and will be communicated during checkout.</p>
                <p className="text-gray-600 mb-2"><strong>Delays:</strong> Delays may occur due to unavoidable circumstances like natural calamities, public holidays, or logistical issues.</p>
                <p className="text-gray-600 mb-2"><strong>Verification:</strong> Orders may require phone or email verification before shipping.</p>
                
                <div className="border-b border-gray-200 my-6"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2) Point Policy</h2>
                <p className="text-gray-600">
                  {siteName} rewards customers with points for eligible purchases and activities.
                </p>
                <p className="text-gray-600 mb-2"><strong>Earning Points:</strong> Points can be earned through successful purchases, promotional activities, and product reviews (as applicable).</p>
                <p className="text-gray-600 mb-2"><strong>Redeeming Points:</strong> Accumulated points can be used for discounts on future purchases.</p>
                <p className="text-gray-600 mb-2"><strong>Expiry:</strong> Points may expire after a defined period (e.g., 6 or 12 months), as determined by our loyalty program terms.</p>
                <p className="text-gray-600 mb-2"><strong>Misuse:</strong> Any misuse or fraudulent activity will lead to cancellation of earned points.</p>
                
                <div className="border-b border-gray-200 my-6"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3) Return Policy</h2>
                <p className="text-gray-600">
                  We want you to be satisfied with your purchase from {siteName}.
                </p>
                <p className="text-gray-600 mb-2"><strong>Eligibility:</strong> Products must be returned within 3 days of delivery.</p>
                <p className="text-gray-600 mb-2"><strong>Conditions:</strong> Items must be unused, in original packaging, and with all tags and accessories.</p>
                <p className="text-gray-600 mb-2"><strong>Non-returnable Items:</strong> Certain products like opened earphones, software licenses, and clearance items may not be eligible for return.</p>
                <p className="text-gray-600 mb-2"><strong>Process:</strong> Contact our support at 09639-000777 or email us at [support@phonebay.com] to initiate a return.</p>
                
                <div className="border-b border-gray-200 my-6"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4) Refund Policy</h2>
                <p className="text-gray-600">
                  Refunds are processed according to our return and cancellation guidelines.
                </p>
                <p className="text-gray-600 mb-2"><strong>Refund Method:</strong> Refunds will be processed to the original payment method (card, mobile payment, or bank transfer).</p>
                <p className="text-gray-600 mb-2"><strong>Processing Time:</strong> Refunds are typically processed within 7–10 business days after product return and inspection.</p>
                <p className="text-gray-600 mb-2"><strong>Shipping Fees:</strong> Delivery or return shipping charges may be deducted unless the product was defective or incorrectly delivered.</p>
                
                <div className="border-b border-gray-200 my-6"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5) Cancellation Policy</h2>
                <p className="text-gray-600 mb-2"><strong>Before Shipment:</strong> Orders can be cancelled by contacting our support team before the item is shipped.</p>
                <p className="text-gray-600 mb-2"><strong>After Shipment:</strong> Orders cannot be cancelled once they are shipped.</p>
                <p className="text-gray-600 mb-2"><strong>Refunds for Cancelled Orders:</strong> Refunds for valid cancellations will follow our Refund Policy.</p>
                <p className="text-gray-600 mb-2"><strong>{siteName} Rights:</strong> We reserve the right to cancel any order due to stock unavailability, payment issues, or verification failure.</p>
                
                <div className="border-b border-gray-200 my-6"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6) Privacy Policy</h2>
                <p className="text-gray-600">
                  {siteName} is committed to protecting your privacy.
                </p>
                <p className="text-gray-600 mb-2"><strong>Information Collection:</strong> We collect your name, contact details, and payment information to process orders.</p>
                <p className="text-gray-600 mb-2"><strong>Usage:</strong> Your data may be used for order processing, improving user experience, marketing, and communication.</p>
                <p className="text-gray-600 mb-2"><strong>Third Parties:</strong> We do not sell your personal data. However, trusted partners may process data for logistics and marketing under strict confidentiality agreements.</p>
                <p className="text-gray-600 mb-2"><strong>Security:</strong> We use secure technologies to protect your information.</p>
                <p className="text-gray-600 mb-2"><strong>User Consent:</strong> By using our website, you consent to our data practices as described in this policy.</p>
                
                <div className="border-b border-gray-200 my-6"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7) Warranty Policy</h2>
                <p className="text-gray-600">
                  {siteName} offers manufacturer or seller warranties where applicable.
                </p>
                <p className="text-gray-600 mb-2"><strong>Warranty Coverage:</strong> Warranty covers manufacturing defects but excludes damages caused by misuse, accidents, or unauthorized repairs.</p>
                <p className="text-gray-600 mb-2"><strong>Claim Procedure:</strong> Warranty claims must include the original invoice and warranty card.</p>
                <p className="text-gray-600 mb-2"><strong>Duration:</strong> Warranty periods vary by product and brand (e.g., 6–24 months).</p>
                <p className="text-gray-600 mb-8"><strong>Service Centers:</strong> Warranty support will be provided via authorized service centers or through {siteName} (if mentioned on the product page).</p>
              </div>
              
              {/* Footer actions */}
              <div className="mt-10 border-t border-gray-200 pt-8 flex justify-between">
                <Link
                  to="/help-center"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Contact Us
                </Link>
                <Link
                  to="/terms-and-conditions"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Terms and Conditions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <CtaFooterByAnima />
    </div>
  );
};

export default PrivacyPolicy; 