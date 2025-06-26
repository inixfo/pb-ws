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
      // Try multiple endpoints in case one fails
      const endpoints = [
        `${config.API_URL}/admin/settings/`,
        `${config.API_URL}/adminpanel/settings/`
      ];
      
      console.log('[SiteSettingsService] Trying to fetch site settings from multiple endpoints');
      
      let response = null;
      let error = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`[SiteSettingsService] Trying endpoint: ${endpoint}`);
          response = await publicApi.get(endpoint);
          if (response.data) {
            console.log(`[SiteSettingsService] Successfully fetched from ${endpoint}`, response.data);
            break;
          }
        } catch (err) {
          console.log(`[SiteSettingsService] Failed to fetch from ${endpoint}`, err);
          error = err;
        }
      }
      
      if (!response || !response.data) {
        console.error('[SiteSettingsService] All endpoints failed, using default settings');
        throw error || new Error('Failed to fetch site settings from any endpoint');
      }
      
      // Process received data
      const settings = { ...response.data };
      
      console.log('[SiteSettingsService] Raw settings data:', settings);
      
      // Use the URLs as provided by the backend (now they should be absolute)
      // But if they're not set, use defaults
      if (!settings.header_logo) {
        console.log('[SiteSettingsService] Header logo not found, using default');
        settings.header_logo = DEFAULT_SETTINGS.header_logo;
      } else {
        console.log('[SiteSettingsService] Using header_logo from server:', settings.header_logo);
      }
      
      if (!settings.footer_logo) {
        console.log('[SiteSettingsService] Footer logo not found, using default');
        settings.footer_logo = DEFAULT_SETTINGS.footer_logo;
      } else {
        console.log('[SiteSettingsService] Using footer_logo from server:', settings.footer_logo);
      }
      
      if (!settings.favicon) {
        console.log('[SiteSettingsService] Favicon not found, using default');
        settings.favicon = DEFAULT_SETTINGS.favicon;
      } else {
        console.log('[SiteSettingsService] Using favicon from server:', settings.favicon);
        
        // If we have a favicon URL, set it as the page favicon
        this.setPageFavicon(settings.favicon);
      }
      
      return settings;
    } catch (error) {
      console.error('[SiteSettingsService] Error getting site settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  /**
   * Set the page favicon
   */
  private setPageFavicon(faviconUrl: string): void {
    try {
      // Find existing favicon link element or create a new one
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      
      // Update the href attribute to point to the new favicon
      link.href = faviconUrl;
      
      console.log('[SiteSettingsService] Favicon updated to:', faviconUrl);
    } catch (err) {
      console.error('[SiteSettingsService] Failed to set favicon:', err);
    }
  }
}

export default new SiteSettingsService(); 