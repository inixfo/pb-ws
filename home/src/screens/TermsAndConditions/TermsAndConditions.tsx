import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { HomeIcon } from 'lucide-react';

export const TermsAndConditions = () => {
  const { settings } = useSiteSettings();
  const siteName = settings?.site_name || 'Phone Bay';

  return (
    <div className="min-h-screen bg-gray-50">
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
                Last updated: January 1, 2025
              </p>
            </div>
          </div>
          
          {/* Terms Content */}
          <div className="px-6 py-10 sm:px-12">
            <div className="prose max-w-none">
              <p className="text-gray-600">
                Please read these terms and conditions carefully before using the {siteName} website and services.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-600">
                These Terms and Conditions govern your use of our website located at <span className="text-blue-600">www.phonebay.xyz</span> (together or individually "Service") operated by {siteName}.
              </p>
              <p className="text-gray-600">
                By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Accounts</h2>
              <p className="text-gray-600">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
              </p>
              <p className="text-gray-600">
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Purchases</h2>
              <p className="text-gray-600">
                If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
              </p>
              <p className="text-gray-600">
                You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct, and complete.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Product Availability and Pricing</h2>
              <p className="text-gray-600">
                We reserve the right to limit the quantities of items purchased by each customer. We also reserve the right to discontinue any product at any time. Prices for our products are subject to change without notice.
              </p>
              <p className="text-gray-600">
                We are not responsible for pricing, typographical, or other errors in any offer by us and we reserve the right to cancel any orders arising from such errors.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Returns and Refunds</h2>
              <p className="text-gray-600">
                Our return and refund policy is designed to ensure your satisfaction with our products. Please refer to our separate Returns & Refunds Policy for detailed information.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-600">
                The Service and its original content, features, and functionality are and will remain the exclusive property of {siteName} and its licensors.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Termination</h2>
              <p className="text-gray-600">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
              <p className="text-gray-600">
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-600">
                In no event shall {siteName}, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Governing Law</h2>
              <p className="text-gray-600">
                These Terms shall be governed and construed in accordance with the laws of Bangladesh, without regard to its conflict of law provisions.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">10. Changes</h2>
              <p className="text-gray-600">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
              </p>
              <p className="text-gray-600">
                What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 mb-8">
                If you have any questions about these Terms, please contact us through our Help Center.
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
  );
};

export default TermsAndConditions; 