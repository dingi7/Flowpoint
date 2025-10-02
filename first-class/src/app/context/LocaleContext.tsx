'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'bg', 'tr'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'en';

// Storage key for localStorage
const LOCALE_STORAGE_KEY = 'first-class-locale';

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize locale from localStorage or browser preference
  useEffect(() => {
    const initializeLocale = () => {
      try {
        // First, try to get from localStorage
        const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale as SupportedLocale)) {
          setLocaleState(storedLocale as SupportedLocale);
          setIsLoading(false);
          return;
        }

        // If no stored locale, try to detect from browser
        const browserLocale = detectBrowserLocale();
        setLocaleState(browserLocale);
        
        // Save the detected locale to localStorage
        localStorage.setItem(LOCALE_STORAGE_KEY, browserLocale);
      } catch (error) {
        console.warn('Failed to initialize locale:', error);
        setLocaleState(DEFAULT_LOCALE);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocale();
  }, []);

  // Function to detect browser locale
  const detectBrowserLocale = (): SupportedLocale => {
    if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

    // Get browser languages
    const browserLanguages = navigator.languages || [navigator.language];
    
    // Check each browser language against supported locales
    for (const browserLang of browserLanguages) {
      const langCode = browserLang.split('-')[0].toLowerCase();
      if (SUPPORTED_LOCALES.includes(langCode as SupportedLocale)) {
        return langCode as SupportedLocale;
      }
    }

    return DEFAULT_LOCALE;
  };

  // Function to change locale
  const setLocale = (newLocale: SupportedLocale) => {
    try {
      setLocaleState(newLocale);
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      
      // Update document language for accessibility
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    } catch (error) {
      console.error('Failed to set locale:', error);
    }
  };

  const value: LocaleContextType = {
    locale,
    setLocale,
    isLoading,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

// Custom hook to use locale context
export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Utility function to check if a locale is supported
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}
