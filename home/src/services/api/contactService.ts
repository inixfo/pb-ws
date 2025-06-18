import axios from 'axios';
import { API_URL } from '../../config';

// Default contact information as a fallback
export const DEFAULT_CONTACT_INFO = {
  id: 1,
  company_name: "Phone Bay",
  address: "123 Tech Street, Digital City, 10001",
  email: "support@phonebay.com",
  phone: "+1 (555) 123-4567",
  working_hours: "Mon-Fri: 9:00 AM - 6:00 PM",
  facebook_url: "https://facebook.com/phonebay",
  twitter_url: "https://twitter.com/phonebay",
  instagram_url: "https://instagram.com/phonebay",
  whatsapp_number: "+1 (555) 987-6543",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z"
};

class ContactService {
  async getContactInfo() {
    try {
      const response = await axios.get(`${API_URL}/contact/info/active/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching contact info:', error);
      // Return default contact info instead of null to prevent UI errors
      return DEFAULT_CONTACT_INFO;
    }
  }

  async submitContactForm(formData: any) {
    try {
      const response = await axios.post(`${API_URL}/contact/submit/`, formData);
      return response.data;
    } catch (error) {
      console.error('Error submitting contact form:', error);
      return { success: false, message: 'Failed to submit form. Please try again later.' };
    }
  }
}

export default new ContactService(); 