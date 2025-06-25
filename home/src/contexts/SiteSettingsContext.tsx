import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import siteSettingsService, { SiteSettings, DEFAULT_SETTINGS } from '../services/api/siteSettingsService';

interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export const SiteSettingsProvider: React.FC<SiteSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[SiteSettingsContext] Fetching site settings...');
      const data = await siteSettingsService.getSettings();
      console.log('[SiteSettingsContext] Received settings:', data);
      
      // Log specific information about the logo
      if (data.header_logo) {
        console.log('[SiteSettingsContext] Header logo URL:', data.header_logo);
      } else {
        console.log('[SiteSettingsContext] No header logo in settings, using default');
      }
      
      setSettings(data);
    } catch (err) {
      console.error('[SiteSettingsContext] Error fetching site settings:', err);
      if (err instanceof Error) {
        setError(`Failed to load site settings: ${err.message}`);
      } else {
        setError('Failed to load site settings: Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, error, refreshSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}; 