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
   * Clean up a URL by fixing common issues
   */
  private cleanUrl(url: string | null): string | null {
    if (!url) return null;
    
    console.log(`[SiteSettingsService] Cleaning URL: ${url}`);
    
    // Fix double slashes in the path (but preserve http:// or https://)
    let cleaned = url.replace(/(https?:\/\/)|(\/)+/g, (match, protocol) => {
      return protocol ? protocol : '/';
    });
    
    // Fix duplicate media paths - handle multiple variations
    cleaned = cleaned.replace(/\/media\/+media\//g, '/media/');
    
    // Handle case where URL might have incorrect double slashes
    // This matches patterns like http://phonebay.xyz/media//website/logos/
    cleaned = cleaned.replace(/(https?:\/\/[^\/]+)\/media\/+([^\/]+)/g, '$1/media/$2');
    
    console.log(`[SiteSettingsService] Cleaned URL: ${cleaned}`);
    return cleaned;
  }
  
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
      
      // Validate logo URLs
      const validateImageUrl = (url: string | null): string | null => {
        if (!url) return null;
        
        // Clean the URL first
        const cleanedUrl = this.cleanUrl(url);
        if (!cleanedUrl) return null;
        
        // Log the URL for debugging
        console.log(`[SiteSettingsService] Validating image URL: ${cleanedUrl}`);
        
        try {
          // Check if it's already a valid URL with hostname
          new URL(cleanedUrl);
          console.log(`[SiteSettingsService] URL is valid with hostname: ${cleanedUrl}`);
          return cleanedUrl;
        } catch (e) {
          // If not a valid URL, it might be a relative path
          if (cleanedUrl.startsWith('/')) {
            // It's already a root-relative path, can use as is
            console.log(`[SiteSettingsService] URL is relative path: ${cleanedUrl}`);
            return cleanedUrl;
          } else {
            // It's a relative path without leading slash, add it
            console.log(`[SiteSettingsService] Adding leading slash to relative URL: ${cleanedUrl}`);
            return `/${cleanedUrl}`;
          }
        }
      };
      
      // Process and validate image URLs
      if (!settings.header_logo) {
        console.log('[SiteSettingsService] Header logo not found, using default');
        settings.header_logo = DEFAULT_SETTINGS.header_logo;
      } else {
        settings.header_logo = validateImageUrl(settings.header_logo);
        console.log('[SiteSettingsService] Using header_logo:', settings.header_logo);
      }
      
      if (!settings.footer_logo) {
        console.log('[SiteSettingsService] Footer logo not found, using default');
        settings.footer_logo = DEFAULT_SETTINGS.footer_logo;
      } else {
        settings.footer_logo = validateImageUrl(settings.footer_logo);
        console.log('[SiteSettingsService] Using footer_logo:', settings.footer_logo);
      }
      
      if (!settings.favicon) {
        console.log('[SiteSettingsService] Favicon not found, using default');
        settings.favicon = DEFAULT_SETTINGS.favicon;
      } else {
        settings.favicon = validateImageUrl(settings.favicon);
        console.log('[SiteSettingsService] Using favicon:', settings.favicon);
        
        // If we have a favicon URL, set it as the page favicon
        if (settings.favicon) {
          this.setPageFavicon(settings.favicon);
        }
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
      // Clean the URL first
      const cleanedUrl = this.cleanUrl(faviconUrl);
      const finalUrl = cleanedUrl || faviconUrl;
      
      console.log('[SiteSettingsService] Setting favicon to:', finalUrl);
      
      // Find existing favicon link element or create a new one
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      
      // Update the href attribute to point to the new favicon
      link.href = finalUrl;
      
      console.log('[SiteSettingsService] Favicon updated successfully');
    } catch (err) {
      console.error('[SiteSettingsService] Failed to set favicon:', err);
    }
  }
}

export default new SiteSettingsService(); 