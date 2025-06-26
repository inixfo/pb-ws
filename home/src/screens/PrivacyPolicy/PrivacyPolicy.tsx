import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { HomeIcon } from 'lucide-react';

export const PrivacyPolicy = () => {
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
            <span className="text-gray-900 font-medium">Privacy Policy</span>
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
                Privacy Policy
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-indigo-100">
                Last updated: January 1, 2025
              </p>
            </div>
          </div>
          
          {/* Policy Content */}
          <div className="px-6 py-10 sm:px-12">
            <div className="prose max-w-none">
              <p className="text-gray-600">
                {siteName} ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by {siteName}.
              </p>
              <p className="text-gray-600">
                This Privacy Policy applies to our website, and its associated subdomains (collectively, our "Service") alongside our applications, {siteName}. By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
              <p className="text-gray-600">
                We collect personal information that you provide to us such as name, contact information, and payment information. We may also collect information automatically when you use our Service, such as your IP address, device information, browser type and version, and information about how you use our Service.
              </p>
              
              <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">1.1 Personal Information</h3>
              <p className="text-gray-600">
                When you register an account or place an order with us, we may collect the following types of information:
              </p>
              <ul className="list-disc pl-5 text-gray-600">
                <li>Name, email address, phone number, and physical address</li>
                <li>Payment information (credit card numbers, bank account information)</li>
                <li>Purchase history and preferences</li>
                <li>Communications with our customer service team</li>
              </ul>
              
              <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">1.2 Automatically Collected Information</h3>
              <p className="text-gray-600">
                When you visit our website, we may automatically collect certain information, including:
              </p>
              <ul className="list-disc pl-5 text-gray-600">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Pages you visit and features you use</li>
                <li>Time spent on pages</li>
                <li>Links you click and searches you conduct</li>
                <li>Device information</li>
              </ul>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-600">
                We use your information for various purposes, including:
              </p>
              <ul className="list-disc pl-5 text-gray-600">
                <li>Processing and fulfilling your orders</li>
                <li>Providing customer support</li>
                <li>Sending you important information about your account, purchases, and our Service</li>
                <li>Sending marketing communications you have opted into</li>
                <li>Improving our website, products, and services</li>
                <li>Detecting, preventing, and addressing fraud, security issues, or technical problems</li>
                <li>Complying with legal obligations</li>
              </ul>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Sharing Your Information</h2>
              <p className="text-gray-600">
                We may share your information in the following situations:
              </p>
              <ul className="list-disc pl-5 text-gray-600">
                <li><strong>With service providers:</strong> We may share your information with third-party vendors who help us operate our business and Service.</li>
                <li><strong>For legal reasons:</strong> We may disclose your information if required to do so by law or in response to valid legal requests.</li>
                <li><strong>Business transfers:</strong> If we're involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
                <li><strong>With your consent:</strong> We may share your information with third parties when you have given us your consent to do so.</li>
              </ul>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600">
                We use cookies and similar tracking technologies to collect and use information about you. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Data Security</h2>
              <p className="text-gray-600">
                We have implemented appropriate technical and organizational security measures to protect your information from unauthorized access, use, or disclosure. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
              <p className="text-gray-600">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-5 text-gray-600">
                <li>The right to access and receive a copy of your personal information</li>
                <li>The right to rectify or update your personal information</li>
                <li>The right to erase your personal information</li>
                <li>The right to restrict processing of your personal information</li>
                <li>The right to object to processing of your personal information</li>
                <li>The right to data portability</li>
              </ul>
              <p className="text-gray-600">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-600">
                Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Changes to This Privacy Policy</h2>
              <p className="text-gray-600">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p className="text-gray-600">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
              
              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
              <p className="text-gray-600 mb-8">
                If you have any questions about this Privacy Policy, please contact us through our Help Center or by email at privacy@phonebay.xyz.
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
  );
};

export default PrivacyPolicy; 