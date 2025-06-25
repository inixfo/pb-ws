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
      const data = await siteSettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching site settings:', err);
      setError('Failed to load site settings');
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