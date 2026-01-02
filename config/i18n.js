/**
 * Internationalization (i18n) Configuration
 *
 * Industry-standard approach: Separate locale files with fallback support
 * Benefits: Easy translation management, runtime language switching, CDN-friendly
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Supported locales
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de'];


// Default locale
export const DEFAULT_LOCALE = 'en';

// Translation files structure (example)
const TranslationData = {
  // Site-wide translations
  site: {
    name: 'string',
    description: 'string',
    copyright: 'string'
  },

  // Navigation translations
  navigation: {
    // [key: string]: string;
  },

  // Page-specific translations
  pages: {
    // [pageId: string]: {
    //   title: string;
    //   description?: string;
    //   content?: Record<string, string>;
    // };
  },

  // Common UI elements
  common: {
    buttons: {},
    labels: {},
    messages: {}
  },

  // SEO translations
  seo: {
    keywords: [],
    meta: {}
  }
};

// Cache for loaded translations
const translationCache = new Map();

/**
 * Load translation file for a locale
 */
const loadTranslationFile = (locale) => {
  const filePath = join(process.cwd(), 'config', 'locales', `${locale}.json`);

  try {
    if (existsSync(filePath)) {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      translationCache.set(locale, data);
      return data;
    }
  } catch (error) {
    console.warn(`Failed to load translation file for locale ${locale}:`, error);
  }

  return null;
};

/**
 * Get translation for a key with fallback support
 */
export const t = (
  key,
  locale = DEFAULT_LOCALE,
  fallback = key
) => {
  // Load translation if not cached
  if (!translationCache.has(locale)) {
    loadTranslationFile(locale);
  }

  const translations = translationCache.get(locale);
  if (!translations) {
    // Try default locale as fallback
    if (locale !== DEFAULT_LOCALE) {
      return t(key, DEFAULT_LOCALE, fallback);
    }
    return fallback;
  }

  // Navigate through nested object structure
  const parts = key.split('.');
  let value = translations;

  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) {
      // Try default locale as fallback
      if (locale !== DEFAULT_LOCALE) {
        return t(key, DEFAULT_LOCALE, fallback);
      }
      return fallback;
    }
  }

  return typeof value === 'string' ? value : fallback;
};

/**
 * Get current locale from various sources
 */
export const getCurrentLocale = () => {
  // Check URL path (e.g., /es/page)
  if (typeof window !== 'undefined') {
    const pathLocale = window.location.pathname.split('/')[1];
    if (SUPPORTED_LOCALES.includes(pathLocale)) {
      return pathLocale;
    }
  }

  // Check localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale');
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      return stored;
    }
  }

  // Check navigator.language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LOCALES.includes(browserLang)) {
      return browserLang;
    }
  }

  return DEFAULT_LOCALE;
};

/**
 * Set current locale
 */
export const setCurrentLocale = (locale) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
    // Trigger re-render or redirect to localized URL
    window.location.href = `/${locale}${window.location.pathname}`;
  }
};

/**
 * Get localized config by merging base config with locale overrides
 */
export const getLocalizedConfig = (baseConfig, locale = DEFAULT_LOCALE) => {
  const translations = translationCache.get(locale);
  if (!translations) return baseConfig;

  // Deep merge base config with localized overrides
  return {
    ...baseConfig,
    site: {
      ...baseConfig.site,
      ...translations.site
    },
    navigation: {
      ...baseConfig.navigation,
      main: baseConfig.navigation.main.map((item) => ({
        ...item,
        label: translations.navigation[item.label] || item.label
      }))
    },
    pages: Object.keys(baseConfig.pages).reduce((acc, pageId) => {
      acc[pageId] = {
        ...baseConfig.pages[pageId],
        ...translations.pages[pageId]
      };
      return acc;
    }, {})
  };
};