import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { HomeIcon } from 'lucide-react';
import { HeaderByAnima } from '../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima';
import { CtaFooterByAnima } from '../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima';

export const TermsAndConditions = () => {
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
              <span className="text-gray-900 font-medium">Terms and Conditions</span>
            </nav>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-gray-700 to-gray-900 py-12 px-6 sm:px-12">
              <div className="relative max-w-3xl mx-auto">
                <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
                  Terms and Conditions
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-gray-300">
                  Last updated: June 1, 2025
                </p>
              </div>
            </div>
            
            {/* Terms Content */}
            <div className="px-6 py-10 sm:px-12">
              <div className="prose max-w-none">
                <p className="text-gray-600">
                  Welcome to {siteName}. The terms "We", "Us", "Our", and "{siteName}" are used to refer to only {siteName}. By using this website (the "Site"), you hereby accept these terms and conditions (including the linked information herein) and represent that you agree to comply with these terms and conditions (the "User Agreement"). This User Agreement is deemed effective upon your use of the Site, which signifies your acceptance of these terms. If you do not agree to be bound by this User Agreement, please do not access, register with, or use this Site. This Site is owned and operated by {siteName}.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">User Eligibility</h2>
                <p className="text-gray-600">
                  You must be at least 18 years old and capable of entering into a legally binding agreement to use our website. By using our website, you represent and warrant that you meet these eligibility requirements.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Account Information</h2>
                <p className="text-gray-600">
                  You may be required to create an account to access certain features of our website. You must provide accurate and complete information during the registration process. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. By agreeing to these terms and conditions, you vouch for the accuracy of all the information provided at the time of registration and give us permission to use this information for internal or external purposes, including sharing with third parties for marketing and research purposes. {siteName} will not be responsible for any incidents arising from the use of the information you have provided.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Product Information</h2>
                <p className="text-gray-600">
                  We strive to provide accurate and up-to-date information about our products, including descriptions, prices, and availability. However, we do not guarantee that all information is error-free, complete, or current. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update information at any time without prior notice.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Product Purchases</h2>
                <p className="text-gray-600">
                  All purchases made through our website are subject to our terms of sale. By placing an order, you agree to provide valid payment information and authorize us to charge the designated amount for the purchase.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Pricing, Discounts, and Special Offers</h2>
                <ul className="list-disc pl-5 text-gray-600">
                  <li>Product prices may change at any time depending on international supply, demand, and currency fluctuations.</li>
                  <li>Customers are responsible for paying the price at which the order was placed.</li>
                  <li>Any discounted prices shown on the website are applicable only to online orders placed through the website.</li>
                  <li>Campaigns or offers will be valid until stock lasts, and {siteName} reserves the right to change rules or end offers at any time during the campaign.</li>
                </ul>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Order Cancellation</h2>
                <ul className="list-disc pl-5 text-gray-600">
                  <li>{siteName} reserves the right to cancel any order due to unavailability, incorrect product information, or quality control issues.</li>
                  <li>Customers may cancel their orders before shipping by contacting our support team. Once an order is shipped, it cannot be cancelled.</li>
                  <li>Refunds for cancelled orders will follow our Return and Refund Policy.</li>
                </ul>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Return and Refund</h2>
                <p className="text-gray-600">
                  For any return or refund request, our Return and Refund Policy will be followed.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Cardless EMI Policy</h2>
                <p className="text-gray-600">
                  To avail our Cardless EMI service, customers must follow the specific terms and conditions of our EMI Policy. Failure to follow the EMI schedule or requirements may result in disqualification from the service. We retain the right to hold customer documents for security verification as part of this policy.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Resell and Exploitation of Service</h2>
                <p className="text-gray-600">
                  You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of our service, the use of the service, or access to the service through the website without express written permission from {siteName}.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Third-Party Links</h2>
                <p className="text-gray-600">
                  Our website may contain links to third-party websites or services that are not owned or controlled by {siteName}. We are not responsible for the content, privacy policies, or practices of any third-party websites. Accessing these links is at your own risk.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Limitation of Liability</h2>
                <p className="text-gray-600">
                  To the maximum extent permitted by law, {siteName} shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of or in connection with your use or inability to use our website or services, even if we have been advised of the possibility of such damages.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Indemnification</h2>
                <p className="text-gray-600">
                  You agree to indemnify, defend, and hold harmless {siteName} and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses arising out of your use of our website or any violation of these terms and conditions.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Intellectual Property</h2>
                <p className="text-gray-600">
                  All content on our website, including text, graphics, logos, images, and software, is protected by intellectual property laws and is the property of {siteName} or its licensors. You may not use, reproduce, modify, distribute, or display any part of our website without prior written consent.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Modifications to Terms</h2>
                <p className="text-gray-600">
                  {siteName} reserves the right to modify or update these terms and conditions at any time without prior notice. Your continued use of our website after any such changes signifies your acceptance of the modified terms.
                </p>
                
                <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Governing Law</h2>
                <p className="text-gray-600 mb-8">
                  These terms and conditions shall be governed by and construed in accordance with the laws of Bangladesh. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Bangladesh.
                </p>
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
                  to="/privacy-policy"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Privacy Policy
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

export default TermsAndConditions; 