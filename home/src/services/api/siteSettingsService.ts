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
      
      // Process logo URLs to ensure they are absolute
      const settings = { ...response.data };
      
      console.log('[SiteSettingsService] Raw settings data:', settings);
      
      // Convert relative URLs to absolute URLs for logos
      if (settings.header_logo) {
        // Check if it's a relative URL (doesn't start with http or //)
        if (!settings.header_logo.startsWith('http') && !settings.header_logo.startsWith('//')) {
          // If it starts with a slash, remove it
          const path = settings.header_logo.startsWith('/') 
            ? settings.header_logo.substring(1) 
            : settings.header_logo;
          
          settings.header_logo = `${config.MEDIA_URL}/${path}`;
        }
        console.log('[SiteSettingsService] Processed header_logo:', settings.header_logo);
      } else {
        console.log('[SiteSettingsService] Header logo not found, using default');
        settings.header_logo = DEFAULT_SETTINGS.header_logo;
      }
      
      if (settings.footer_logo) {
        if (!settings.footer_logo.startsWith('http') && !settings.footer_logo.startsWith('//')) {
          const path = settings.footer_logo.startsWith('/') 
            ? settings.footer_logo.substring(1) 
            : settings.footer_logo;
          
          settings.footer_logo = `${config.MEDIA_URL}/${path}`;
        }
        console.log('[SiteSettingsService] Processed footer_logo:', settings.footer_logo);
      } else {
        settings.footer_logo = DEFAULT_SETTINGS.footer_logo;
      }
      
      if (settings.favicon) {
        if (!settings.favicon.startsWith('http') && !settings.favicon.startsWith('//')) {
          const path = settings.favicon.startsWith('/') 
            ? settings.favicon.substring(1) 
            : settings.favicon;
          
          settings.favicon = `${config.MEDIA_URL}/${path}`;
        }
        console.log('[SiteSettingsService] Processed favicon:', settings.favicon);
      } else {
        settings.favicon = DEFAULT_SETTINGS.favicon;
      }
      
      return settings;
    } catch (error) {
      console.error('[SiteSettingsService] Error getting site settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
}

export default new SiteSettingsService(); 