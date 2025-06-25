import { publicApi } from './apiUtils';
import config from '../../config';

export interface SiteSettings {
  header_logo: string | null;
  footer_logo: string | null;
  favicon: string | null;
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
}

// Default fallback settings
export const DEFAULT_SETTINGS: SiteSettings = {
  header_logo: '/logo.png',
  footer_logo: '/logo.png',
  favicon: '/favicon.ico',
  site_name: 'Phone Bay',
  site_description: 'Your one-stop shop for electronics',
  contact_email: '',
  contact_phone: '',
  address: '',
  facebook_url: '',
  twitter_url: '',
  instagram_url: '',
  linkedin_url: ''
};

class SiteSettingsService {
  /**
   * Get site settings
   */
  async getSettings(): Promise<SiteSettings> {
    try {
      console.log('[SiteSettingsService] Getting site settings');
      const response = await publicApi.get(`${config.API_URL}/admin/settings/`);
      
      if (response.data) {
        console.log('[SiteSettingsService] Got site settings:', response.data);
        
        // Process logo URLs to ensure they are absolute
        const settings = { ...response.data };
        
        // Convert relative URLs to absolute URLs for logos
        if (settings.header_logo && !settings.header_logo.startsWith('http')) {
          settings.header_logo = `${config.BASE_URL}${settings.header_logo}`;
        }
        
        if (settings.footer_logo && !settings.footer_logo.startsWith('http')) {
          settings.footer_logo = `${config.BASE_URL}${settings.footer_logo}`;
        }
        
        if (settings.favicon && !settings.favicon.startsWith('http')) {
          settings.favicon = `${config.BASE_URL}${settings.favicon}`;
        }
        
        return settings;
      }
      
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('[SiteSettingsService] Error getting site settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
}

export default new SiteSettingsService(); 