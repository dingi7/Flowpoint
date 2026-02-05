'use client';

import en from "@/../public/locales/en.json";
import bg from "@/../public/locales/bg.json";
import tr from "@/../public/locales/tr.json";
import { useLocale, SupportedLocale, DEFAULT_LOCALE } from "@/app/context/LocaleContext";

// Type for nested translation objects
type TranslationObject = {
  [key: string]: string | TranslationObject;
};

// Type for translation keys (for better IDE support)
type TranslationKeys = keyof typeof en;

// Translation resources
const translations: Record<SupportedLocale, TranslationObject> = {
  en: en as TranslationObject,
  bg: bg as TranslationObject,
  tr: tr as TranslationObject,
};

// Translation options for interpolation
interface TranslationOptions {
  [key: string]: string | number;
}

export const useTranslation = () => {
  const { locale, isLoading } = useLocale();
  
  // Get current translations with fallback
  const getCurrentTranslations = (targetLocale: SupportedLocale): TranslationObject => {
    return translations[targetLocale] || translations[DEFAULT_LOCALE];
  };

  const currentTranslations = getCurrentTranslations(locale);
  const fallbackTranslations = translations[DEFAULT_LOCALE];

  /**
   * Translate a key with optional interpolation
   * @param key - Translation key (dot notation supported)
   * @param options - Variables for interpolation
   * @returns Translated string
   */
  const t = (key: string, options?: TranslationOptions): string => {
    if (isLoading) {
      return key; // Return key while loading
    }

    const getValue = (translations: TranslationObject, keyPath: string): string | null => {
      const keys = keyPath.split('.');
      let result: string | TranslationObject | undefined = translations;

      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k] as string | TranslationObject;
        } else {
          return null;
        }
      }

      return typeof result === 'string' ? result : null;
    };

    // Try to get translation from current locale
    let translation = getValue(currentTranslations, key);
    
    // Fallback to default locale if not found
    if (translation === null && locale !== DEFAULT_LOCALE) {
      translation = getValue(fallbackTranslations, key);
    }

    // If still not found, return the key for debugging
    if (translation === null) {
      console.warn(`Translation missing for key: "${key}" in locale: "${locale}"`);
      return key;
    }

    // Handle interpolation
    if (options && Object.keys(options).length > 0) {
      return interpolate(translation, options);
    }

    return translation;
  };

  /**
   * Check if a translation key exists
   * @param key - Translation key to check
   * @returns Boolean indicating if key exists
   */
  const exists = (key: string): boolean => {
    const keys = key.split('.');
    let result: string | TranslationObject | undefined = currentTranslations;

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k] as string | TranslationObject;
      } else {
        return false;
      }
    }

    return typeof result === 'string';
  };

  /**
   * Get translation in a specific locale
   * @param key - Translation key
   * @param targetLocale - Target locale
   * @param options - Variables for interpolation
   * @returns Translated string
   */
  const tLocale = (key: string, targetLocale: SupportedLocale, options?: TranslationOptions): string => {
    const targetTranslations = getCurrentTranslations(targetLocale);
    const keys = key.split('.');
    let result: string | TranslationObject | undefined = targetTranslations;

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k] as string | TranslationObject;
      } else {
        return key;
      }
    }

    const translation = typeof result === 'string' ? result : key;
    
    if (options && Object.keys(options).length > 0) {
      return interpolate(translation, options);
    }

    return translation;
  };

  return { 
    t, 
    exists, 
    tLocale, 
    locale, 
    isLoading,
    currentTranslations 
  };
};

/**
 * Simple interpolation function
 * Replaces {{key}} with values from options
 */
function interpolate(template: string, options: TranslationOptions): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in options ? String(options[key]) : match;
  });
}

// Export types for better TypeScript support
export type { TranslationKeys, TranslationOptions };
