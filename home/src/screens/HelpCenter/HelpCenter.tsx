import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Separator } from "../../components/ui/separator";
import { useToast } from "../../components/ui/use-toast-hook";
import { contactService } from "../../services/api";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima";
import { 
  MapPinIcon, 
  PhoneIcon, 
  MailIcon, 
  ClockIcon, 
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon
} from "lucide-react";

// Interface for contact info from the backend
interface ContactInfo {
  id: number;
  address: string;
  phone: string;
  email: string;
  support_hours?: string;
  google_maps_embed?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
}

export const HelpCenter = (): JSX.Element => {
  // Form state
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Contact info state
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { toast } = useToast();

  // Fetch contact info on component mount
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoading(true);
        const data = await contactService.getContactInfo();
        if (data) {
          setContactInfo(data);
        } else {
          // Use default data if API call fails
          setContactInfo({
            id: 0,
            address: "123 Main Street, Dhaka, Bangladesh",
            phone: "+880 1234-567890",
            email: "support@phonebay.com",
            support_hours: "Mon-Fri: 9AM-5PM | Sat: 10AM-2PM",
          });
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      setSubmitError("Please fill out all required fields.");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await contactService.submitContactForm({
        name,
        email,
        phone,
        subject,
        message,
      });
      
      // Clear form on success
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your message has been sent. We'll get back to you soon.",
        variant: "default",
      });
    } catch (error: any) {
      setSubmitError(
        error.response?.data?.message || 
        "Something went wrong. Please try again later."
      );
      
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-white-100">
      <HeaderByAnima showHeroSection={false} />
      
      <main className="w-full max-w-[1296px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600 mb-8">Get in touch with our customer support team</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {contactInfo?.address && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primarymain/10 rounded-full">
                      <MapPinIcon className="w-5 h-5 text-primarymain" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Address</h3>
                      <p className="text-gray-600">{contactInfo.address}</p>
                    </div>
                  </div>
                )}
                
                {contactInfo?.phone && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primarymain/10 rounded-full">
                      <PhoneIcon className="w-5 h-5 text-primarymain" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Phone</h3>
                      <p className="text-gray-600">{contactInfo.phone}</p>
                    </div>
                  </div>
                )}
                
                {contactInfo?.email && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primarymain/10 rounded-full">
                      <MailIcon className="w-5 h-5 text-primarymain" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Email</h3>
                      <p className="text-gray-600">{contactInfo.email}</p>
                    </div>
                  </div>
                )}
                
                {contactInfo?.support_hours && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primarymain/10 rounded-full">
                      <ClockIcon className="w-5 h-5 text-primarymain" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Working Hours</h3>
                      <p className="text-gray-600">{contactInfo.support_hours}</p>
                    </div>
                  </div>
                )}
                
                {/* Social Media Links */}
                {(contactInfo?.facebook_url || contactInfo?.twitter_url || 
                  contactInfo?.instagram_url || contactInfo?.linkedin_url) && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Follow Us</h3>
                    <div className="flex gap-4">
                      {contactInfo.facebook_url && (
                        <a 
                          href={contactInfo.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <FacebookIcon className="w-5 h-5 text-gray-700" />
                        </a>
                      )}
                      
                      {contactInfo.twitter_url && (
                        <a 
                          href={contactInfo.twitter_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <TwitterIcon className="w-5 h-5 text-gray-700" />
                        </a>
                      )}
                      
                      {contactInfo.instagram_url && (
                        <a 
                          href={contactInfo.instagram_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <InstagramIcon className="w-5 h-5 text-gray-700" />
                        </a>
                      )}
                      
                      {contactInfo.linkedin_url && (
                        <a 
                          href={contactInfo.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                        >
                          <LinkedinIcon className="w-5 h-5 text-gray-700" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="How can we help you?"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your question or issue in detail..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  {submitError && (
                    <div className="text-red-500 text-sm py-2">
                      {submitError}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primarymain hover:bg-primarymain/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Map Section */}
        {contactInfo?.google_maps_embed && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Find Us</h2>
            <div className="w-full h-[400px] rounded-lg overflow-hidden">
              <div dangerouslySetInnerHTML={{ __html: contactInfo.google_maps_embed }} />
            </div>
          </div>
        )}
        
        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How do I track my order?</h3>
              <p className="text-gray-600">
                You can track your order by going to your account dashboard and selecting the "Orders" section. 
                Alternatively, you can use the tracking number provided in your order confirmation email.
              </p>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">What is your return policy?</h3>
              <p className="text-gray-600">
                We offer a 30-day return policy for most items. Products must be returned in their original 
                condition and packaging. Some products may have specific return requirements.
              </p>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Do you offer international shipping?</h3>
              <p className="text-gray-600">
                Yes, we ship to most countries worldwide. Shipping rates and delivery times vary depending 
                on your location. You can see the shipping options available during checkout.
              </p>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">How can I cancel my order?</h3>
              <p className="text-gray-600">
                If you need to cancel your order, please contact us as soon as possible. Orders that have 
                already been shipped cannot be canceled, but you can return them once received.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <CtaFooterByAnima />
    </div>
  );
}; 