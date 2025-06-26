import React, { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Separator } from "../../../../components/ui/separator";
import { categoryService, contactService } from '../../../../services/api';
import { Link } from "react-router-dom";
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  LinkedinIcon,
  HelpCircleIcon,
  CreditCard
} from "lucide-react";
import { useSiteSettings } from '../../../../contexts/SiteSettingsContext';

// Card logo components to prevent duplicate rendering
const VisaLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="46" height="20" viewBox="0 0 70 32" fill="none">
    <path d="M26.513 21.5823H20.9834L24.2603 7.1377H29.7899L26.513 21.5823Z" fill="#00579F"/>
    <path d="M47.8039 7.3677C46.7679 6.9777 45.0159 6.5477 42.8899 6.5477C37.4999 6.5477 33.7839 9.2977 33.7639 13.1477C33.7239 16.0177 36.3839 17.6277 38.3659 18.6277C40.3879 19.6477 41.0099 20.3077 41.0099 21.1977C40.9899 22.5777 39.2579 23.2177 37.6459 23.2177C35.4199 23.2177 34.2239 22.9077 32.4129 22.1577L31.6969 21.8577L30.9299 26.4577C32.1659 26.9877 34.5139 27.4577 36.9799 27.4777C42.7299 27.4777 46.3859 24.7677 46.4259 20.6377C46.4459 18.3177 45.0159 16.5277 42.0139 15.0477C40.1829 14.0877 39.0179 13.4277 39.0179 12.4877C39.0379 11.6377 40.0079 10.7677 42.0939 10.7677C43.7869 10.7277 45.0559 11.1177 46.0719 11.5077L46.5719 11.7177L47.3079 7.4277L47.8039 7.3677Z" fill="#00579F"/>
    <path d="M55.2598 17.3177C55.7598 16.1577 57.6098 11.4477 57.6098 11.4477C57.5898 11.4877 58.0898 10.1277 58.3898 9.2777L58.8098 11.2577C58.8098 11.2577 59.9258 16.3477 60.1658 17.3177C59.4458 17.3177 56.2798 17.3177 55.2598 17.3177ZM63.0158 7.1377H59.0298C57.7738 7.1377 56.8338 7.5077 56.2798 8.8477L48.1299 27.1377H53.9798C53.9798 27.1377 54.9798 24.5277 55.1998 23.9277C55.7798 23.9277 61.3358 23.9277 62.0758 23.9277C62.2358 24.6677 62.7558 27.1377 62.7558 27.1377H67.9858L63.0158 7.1377Z" fill="#00579F"/>
    <path d="M18.8499 7.1377L13.4199 21.3577L12.8999 18.8577C11.9999 15.9677 9.07993 12.8577 5.87993 11.1577L10.8799 27.1177H16.7699L24.9199 7.1377H18.8499Z" fill="#00579F"/>
    <path d="M8.62987 7.1377H0.129866L0.00986633 7.5477C6.95987 9.3377 11.6799 13.7777 13.6399 18.8577L11.6999 8.8677C11.3399 7.5277 10.0899 7.1577 8.62987 7.1377Z" fill="#FAA61A"/>
  </svg>
);

// Payment icon components
const VisaIcon = () => (
  <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.4 21.9001H13.2L15.84 10.1001H20.04L17.4 21.9001Z" fill="#00579F"/>
    <path d="M34.5599 10.3C33.7199 10.02 32.4 9.7 30.84 9.7C26.88 9.7 24 11.8 23.9999 14.7C23.9799 16.9 26.04 18.1 27.6 18.9C29.1799 19.7 29.64 20.2 29.64 20.9C29.6199 21.9 28.3799 22.4 27.1999 22.4C25.44 22.4 24.54 22.2 23.16 21.6L22.5999 21.4L22 24.9C22.9599 25.3 24.6799 25.7 26.4799 25.7C30.6799 25.7 33.4799 23.6 33.5199 20.5C33.5399 18.8 32.4399 17.5 30.1199 16.4C28.7199 15.7 27.8799 15.2 27.8799 14.5C27.8999 13.9 28.5799 13.2 30.1599 13.2C31.4399 13.1 32.3999 13.4 33.1599 13.7L33.5199 13.9L34.0799 10.4L34.5599 10.3Z" fill="#00579F"/>
    <path d="M39.5999 17.8C39.9799 16.9 41.3599 13.4 41.3599 13.4C41.3399 13.4 41.6999 12.4 41.9199 11.8L42.2399 13.3C42.2399 13.3 43.0799 17 43.2599 17.8C42.6999 17.8 40.3599 17.8 39.5999 17.8ZM44.8799 10.1H41.6999C40.7999 10.1 40.0999 10.4 39.6999 11.4L33.9599 21.9H38.1599C38.1599 21.9 38.8799 20.1 39.0399 19.6C39.4599 19.6 43.4799 19.6 44.0399 19.6C44.1599 20.2 44.5399 21.9 44.5399 21.9H48.2799L44.8799 10.1Z" fill="#00579F"/>
    <path d="M12.7999 10.1L8.95991 18.4L8.55991 16.5C7.85991 14.4 5.83991 12.1 3.55991 10.9L7.13991 21.9H11.3799L17.5599 10.1H12.7999Z" fill="#00579F"/>
    <path d="M5.8 10.1H0.0799935L0 10.4C4.52 11.7 7.52 14.8 8.56 18.4L7.32 11.4C7.08 10.4 6.52 10.1 5.8 10.1Z" fill="#FAA61A"/>
  </svg>
);

const MastercardIcon = () => (
  <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30.24 7.8999H17.68V24.0999H30.24V7.8999Z" fill="#FF5F00"/>
    <path d="M18.64 16C18.64 12.8 20.12 9.94 22.36 8C20.76 6.74 18.78 5.9 16.6 5.9C11.12 5.9 6.64001 10.4 6.64001 16C6.64001 21.6 11.12 26.1 16.6 26.1C18.78 26.1 20.76 25.26 22.36 24C20.12 22.06 18.64 19.2 18.64 16Z" fill="#EB001B"/>
    <path d="M41.36 16C41.36 21.6 36.88 26.1 31.4 26.1C29.22 26.1 27.24 25.26 25.64 24C27.92 22.06 29.36 19.2 29.36 16C29.36 12.8 27.88 9.94 25.64 8C27.24 6.74 29.22 5.9 31.4 5.9C36.88 5.9 41.36 10.4 41.36 16Z" fill="#F79E1B"/>
  </svg>
);

const AmexIcon = () => (
  <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.06 0H4.94C2.22 0 0 2.24 0 5V27C0 29.76 2.22 32 4.94 32H43.06C45.78 32 48 29.76 48 27V5C48 2.24 45.78 0 43.06 0Z" fill="#016FD0"/>
    <path d="M20.36 16.9L21.72 13.64H25.4V21.9H22.72V16.06L20.88 21.9H18.64L16.8 16.08V21.9H12.54L11.88 20.28H7.92L7.28 21.9H4.28L7.84 13.64H11.38L14.76 21.24V13.64H18.56L20.36 16.9ZM8.68 18.2H11.14L9.9 14.96L8.68 18.2Z" fill="white"/>
    <path d="M43.7 21.9L40.46 17.92L43.62 13.64H40.56L38.7 16.2L36.9 13.64H33.72L36.78 17.84L33.54 21.9H36.6L38.6 19.18L40.5 21.9H43.7ZM31.1 21.9H25.78V13.64H31.1V15.72H28.46V16.9H31V18.94H28.46V19.86H31.1V21.9Z" fill="white"/>
  </svg>
);

const BkashIcon = () => (
  <svg width="48" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#E2136E"/>
    <path d="M11.66 10.96C12.64 9.42 14.46 8.46 16.44 8.46C19.92 8.46 22.74 11.26 22.74 14.72C22.74 18.18 19.92 20.98 16.44 20.98C14.46 20.98 12.64 20.02 11.66 18.48C10.68 20.02 8.84 20.98 6.88 20.98C3.4 20.98 0.58 18.18 0.58 14.72C0.58 11.26 3.4 8.46 6.88 8.46C8.84 8.46 10.68 9.42 11.66 10.96ZM37.04 13.88V20.44H34.36V14.6C34.36 13.04 33.44 12.06 32.04 12.06C30.38 12.06 29.4 13.18 29.4 15.12V20.44H26.72V8.98H29.4V10.42C30.12 9.32 31.24 8.64 32.88 8.64C35.4 8.64 37.04 10.7 37.04 13.88ZM45.02 8.98V11.5H42.56V16.24C42.56 17.28 42.98 17.64 43.86 17.64H45.02V20.44H43.24C40.72 20.44 39.88 19.36 39.88 17.02V11.5H38.18V8.98H39.88V6.12H42.56V8.98H45.02Z" fill="white"/>
  </svg>
);

export const CtaFooterByAnima = (): JSX.Element => {
  // State for newsletter subscription
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Contact info state for social media links
  const [contactInfo, setContactInfo] = useState<any>(null);

  // Get site settings for logo
  const { settings } = useSiteSettings();
  
  // Footer links data
  const footerLinks = {
    company: [
      { name: "Home", path: "/" },
      { name: "About Us", path: "/about-us" },
      { name: "Terms & Conditions", path: "/terms-and-conditions" },
      { name: "Privacy Policy", path: "/privacy-policy" },
      { name: "Help Center", path: "/help-center" },
    ],
    account: [
      { name: "My Account", path: "/account" },
      { name: "My Orders", path: "/account" },
      { name: "My Reviews", path: "/my-reviews" },

    ],
    popularPages: [
      { name: "Best Sellers", path: "/best-sellers" },
      { name: "Today's Deals", path: "/todays-deals" },
      { name: "New Arrivals", path: "/new-arrivals" },
      { name: "Trending", path: "/trending" },
      { name: "Special Offers", path: "/special-offers" }
    ],
  };

  // Fetch contact info for social media links
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const data = await contactService.getContactInfo();
        if (data) {
          setContactInfo(data);
        }
      } catch (err) {
        console.error("Error fetching contact info:", err);
      }
    };
    
    fetchContactInfo();
  }, []);

  // Handle newsletter form submission
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      setSubmitError("Please enter your email address");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitError("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await contactService.subscribeNewsletter(email);
      setSubmitSuccess(true);
      setEmail("");
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error: any) {
      setSubmitError(
        error.response?.data?.message || 
        "Failed to subscribe. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="flex flex-col w-full">
      {/* Newsletter Section */}
      <section className="w-full py-12 md:py-16 lg:py-24 px-4 md:px-8 lg:px-16 bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-16 lg:gap-24">
          {/* Newsletter Subscription */}
          <div className="flex flex-col gap-8 md:gap-12 flex-1">
            <div className="flex flex-col gap-6 md:gap-8 max-w-xl">
              <div className="flex flex-col gap-2">
                <h4 className="font-semibold text-xl md:text-2xl text-gray-900">
                  Sign up to our newsletter
                </h4>
                <p className="text-sm md:text-base text-gray-600">
                  Receive our latest updates about our products &amp; promotions
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Input
                    className="flex-1 px-4 py-3 bg-white border-gray-300 rounded-lg text-gray-600"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="submit" 
                    className="px-6 py-3 bg-primarymain text-white rounded-lg font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </Button>
                </div>
                
                {submitError && (
                  <p className="text-red-500 text-sm">{submitError}</p>
                )}
                
                {submitSuccess && (
                  <p className="text-green-500 text-sm">
                    Thanks for subscribing to our newsletter!
                  </p>
                )}
              </form>
            </div>

            <div className="flex items-center gap-4">
              {contactInfo && (
                <>
                  {contactInfo.facebook_url && (
                    <a 
                      href={contactInfo.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 rounded-[20px] hover:bg-gray-200 transition-colors"
                    >
                      <FacebookIcon className="w-4 h-4 text-gray-700" />
                    </a>
                  )}
                  
                  {contactInfo.twitter_url && (
                    <a 
                      href={contactInfo.twitter_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 rounded-[20px] hover:bg-gray-200 transition-colors"
                    >
                      <TwitterIcon className="w-4 h-4 text-gray-700" />
                    </a>
                  )}
                  
                  {contactInfo.instagram_url && (
                    <a 
                      href={contactInfo.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 rounded-[20px] hover:bg-gray-200 transition-colors"
                    >
                      <InstagramIcon className="w-4 h-4 text-gray-700" />
                    </a>
                  )}
                  
                  {contactInfo.linkedin_url && (
                    <a 
                      href={contactInfo.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-3 bg-gray-100 rounded-[20px] hover:bg-gray-200 transition-colors"
                    >
                      <LinkedinIcon className="w-4 h-4 text-gray-700" />
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <section className="w-full pt-12 md:pt-16 lg:pt-[72px] pb-6 px-4 md:px-8 lg:px-16 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto flex flex-col gap-12 md:gap-16 lg:gap-[72px]">
          {/* Footer Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-[134px]">
            {/* Company Info */}
            <div className="flex flex-col gap-6">
              {settings?.footer_logo ? (
                <React.Fragment>
                <img 
                  className="w-24 h-10 sm:w-32 sm:h-12 md:w-40 md:h-14 object-contain" 
                  alt={`${settings.site_name || 'Phone Bay'} Logo`} 
                  src={settings.footer_logo?.startsWith('http') ? settings.footer_logo : `/logo.png`}
                  onError={(e) => {
                      console.log('[Footer] Logo failed to load:', settings.footer_logo);
                      console.log('[Footer] Attempting to load default logo');
                      
                      if (settings.footer_logo && !settings.footer_logo.includes('/logo.png')) {
                        e.currentTarget.src = '/logo.png';
                        return;
                      }
                      
                    e.currentTarget.style.display = 'none';
                    
                      // Find the fallback element
                    const parent = e.currentTarget.parentElement;
                      const fallbackEl = parent?.querySelector('.logo-text-fallback');
                      
                      if (fallbackEl) {
                        // Show existing fallback
                        console.log('[Footer] Showing existing fallback element');
                        fallbackEl.classList.remove('hidden');
                      } else if (parent) {
                        // Create a fallback text element if it doesn't exist
                        console.log('[Footer] Creating new fallback element');
                      const nameDiv = document.createElement('div');
                        nameDiv.className = "text-white font-bold text-lg logo-text-fallback";
                      nameDiv.textContent = settings.site_name || 'Phone Bay';
                      parent.appendChild(nameDiv);
                    }
                  }}
                />
                  <div className="text-white font-bold text-lg logo-text-fallback hidden">
                    {settings.site_name || 'Phone Bay'}
                  </div>
                </React.Fragment>
              ) : (
                <div className="text-white font-bold text-lg">
                  {settings.site_name || 'Phone Bay'}
                </div>
              )}
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-300">
                  Got question? Contact us 24/7
                </p>
                <Link to="/help-center">
                  <Button
                    variant="outline"
                    className="flex justify-between w-full px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg border-none hover:bg-gray-600"
                  >
                    <span className="text-sm">
                      Help and consultation
                    </span>
                    <HelpCircleIcon className="w-4 h-4 text-gray-200" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Company Links */}
            <div className="flex flex-col gap-4">
              <h6 className="font-semibold text-base text-white">
                Company
              </h6>
              <div className="flex flex-col gap-2">
                {footerLinks.company.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="font-normal text-gray-200 text-sm leading-[22px]"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Account Links */}
            <div className="flex flex-col gap-4">
              <h6 className="font-semibold text-base text-white">
                Account
              </h6>
              <div className="flex flex-col gap-2">
                {footerLinks.account.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="font-normal text-gray-200 text-sm leading-[22px]"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular Pages Links */}
            <div className="flex flex-col gap-4">
              <h6 className="font-semibold text-base text-white">
                Popular Pages
              </h6>
              <div className="flex flex-col gap-2">
                {footerLinks.popularPages.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="font-normal text-gray-200 text-sm leading-[22px]"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <Separator className="bg-gray-700" />

          {/* Payment Methods and Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Payment methods logos */}
              <div 
                className="h-10 md:h-12 bg-contain bg-no-repeat"
                style={{
                  backgroundImage: "url('/SSLCommerz01.png')",
                  width: "300px"
                }}
              ></div>
              
            </div>
            <p className="text-sm text-gray-400 text-center sm:text-right">
              © 2025 All Rights Reserved. Made with ❤️ by <a href="https://bangladeshdigitalagency.com" target="_blank" rel="noopener noreferrer" className="underline">BDA</a>
            </p>
          </div>
        </div>
      </section>
    </footer>
  );
};
