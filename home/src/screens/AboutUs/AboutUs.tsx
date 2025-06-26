import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../contexts/SiteSettingsContext';
import { HomeIcon } from 'lucide-react';

export const AboutUs = () => {
  const { settings } = useSiteSettings();

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
                About {settings?.site_name || 'Phone Bay'}
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg text-blue-100">
                Your trusted partner for high-quality electronics, exceptional service, and unbeatable value.
              </p>
            </div>
            <div className="absolute inset-y-0 right-0 hidden lg:block lg:w-1/3">
              <svg className="absolute inset-0 h-full w-full text-white text-opacity-10" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="0,0 100,0 50,100 0,100" />
              </svg>
            </div>
          </div>
          
          {/* Mission Section */}
          <div className="px-6 py-10 sm:px-12 lg:px-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Products</h3>
                <p className="text-gray-600">We curate the best electronics from top brands, ensuring every product meets our high standards.</p>
              </div>
              
              <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Affordable Pricing</h3>
                <p className="text-gray-600">We believe everyone deserves access to technology through competitive pricing and flexible payment options.</p>
              </div>
              
              <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Outstanding Support</h3>
                <p className="text-gray-600">Our dedicated team provides exceptional customer service before, during, and after your purchase.</p>
              </div>
            </div>
          </div>
          
          {/* Story Section */}
          <div className="bg-gray-50 px-6 py-10 sm:px-12 lg:px-16">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="prose lg:prose-lg text-gray-600">
                <p>
                  Founded in 2020, {settings?.site_name || 'Phone Bay'} started with a simple mission: to provide consumers with high-quality electronics at affordable prices.
                </p>
                <p>
                  What began as a small shop has grown into a trusted online destination for tech enthusiasts across the country. Our journey has been defined by our commitment to customer satisfaction and our passion for technology.
                </p>
                <p>
                  Today, we offer a curated selection of the latest smartphones, laptops, and other electronics from the world's leading brands, along with flexible payment options and dedicated customer support.
                </p>
              </div>
            </div>
          </div>
          
          {/* Team Section */}
          <div className="px-6 py-10 sm:px-12 lg:px-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Team</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {/* Team Member 1 */}
              <div className="text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto bg-gray-200">
                  <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">John Smith</h3>
                <p className="text-sm text-gray-500">Founder & CEO</p>
              </div>
              
              {/* Team Member 2 */}
              <div className="text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto bg-gray-200">
                  <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Emily Johnson</h3>
                <p className="text-sm text-gray-500">COO</p>
              </div>
              
              {/* Team Member 3 */}
              <div className="text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mx-auto bg-gray-200">
                  <svg className="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Michael Chen</h3>
                <p className="text-sm text-gray-500">CTO</p>
              </div>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="bg-gray-50 px-6 py-10 sm:px-12 lg:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <p className="text-lg text-gray-600 mb-8">
                Have questions or want to learn more about our company? We'd love to hear from you.
              </p>
              <Link
                to="/help-center"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 