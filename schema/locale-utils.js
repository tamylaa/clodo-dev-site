/**
 * schema/locale-utils.js
 * Utilities for locale detection and localization in schema generation
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULTS_I18N = JSON.parse(fs.readFileSync(path.join(__dirname, 'defaults-i18n.json'), 'utf8'));

/**
 * Map of all supported locales with their metadata
 */
export const SUPPORTED_LOCALES = {
  'en': 'en-US',
  'de': 'de-DE',
  'it': 'it-IT',
  'ar': 'ar-SA',
  'he': 'he-IL',
  'fa': 'fa-IR',
  'br': 'pt-BR',
  'es-419': 'es-419',
  'in': 'en-IN'
};

/**
 * RTL (Right-to-Left) language codes
 */
export const RTL_LANGUAGES = ['ar', 'he', 'fa'];

/**
 * Detect locale from file path
 * Examples:
 *   'blog/article.html' → 'en' (default)
 *   'i18n/de/article.html' → 'de'
 *   'i18n/it/docs.html' → 'it'
 *   'i18n/ar/docs.html' → 'ar'
 */
export function detectLocaleFromPath(filePath) {
  const pathSegments = filePath.split(path.sep);
  
  // Check if path contains i18n segment
  const i18nIndex = pathSegments.indexOf('i18n');
  if (i18nIndex !== -1 && i18nIndex + 1 < pathSegments.length) {
    const potentialLocale = pathSegments[i18nIndex + 1];
    if (SUPPORTED_LOCALES[potentialLocale]) {
      return potentialLocale;
    }
  }
  
  // Default to English
  return 'en';
}

/**
 * Get locale configuration from defaults
 */
export function getLocaleConfig(locale) {
  return DEFAULTS_I18N.locales[locale] || DEFAULTS_I18N.locales['en'];
}

/**
 * Get organization data for a specific locale
 */
export function getOrganizationForLocale(locale) {
  const config = getLocaleConfig(locale);
  return {
    ...DEFAULTS_I18N.shared.softwareApplication,
    ...config.organization,
    inLanguage: config.locale,
    sameAs: config.organization.sameAs
  };
}

/**
 * Build locale-specific URL
 * Example: en → https://www.clodo.dev
 *          de → https://www.clodo.dev/i18n/de
 *          it → https://www.clodo.dev/i18n/it
 */
export function buildLocaleUrl(basePath, locale) {
  if (locale === 'en') {
    // English is default - no locale prefix
    return `https://www.clodo.dev${basePath}`;
  }
  
  // Other locales get /i18n/<locale> prefix
  return `https://www.clodo.dev/i18n/${locale}${basePath}`;
}

/**
 * Get alternate language links for SEO
 * Returns hreflang links for all locales
 */
export function generateAlternateLanguageLinks(basePath) {
  const links = [];
  
  // English default (x-default)
  links.push({
    rel: 'alternate',
    hreflang: 'en',
    href: `https://clodo.dev${basePath}`
  });
  
  // All other locales
  Object.keys(SUPPORTED_LOCALES).forEach(locale => {
    if (locale !== 'en') {
      const url = buildLocaleUrl(basePath, locale);
      links.push({
        rel: 'alternate',
        hreflang: SUPPORTED_LOCALES[locale],
        href: url
      });
    }
  });
  
  // x-default points to English
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `https://clodo.dev${basePath}`
  });
  
  return links;
}

/**
 * Check if locale is RTL
 */
export function isRTLLocale(locale) {
  return RTL_LANGUAGES.includes(locale);
}

/**
 * Get language code from locale
 * Examples: en-US → en, de-DE → de
 */
export function getLanguageCode(locale) {
  return locale.split('-')[0];
}

/**
 * Get full list of configured locales
 */
export function getAllLocales() {
  return Object.keys(DEFAULTS_I18N.locales);
}

/**
 * Build locale-specific breadcrumb URL
 */
export function buildLocalizedBreadcrumbUrl(basePath, locale) {
  if (locale === 'en') {
    return `https://clodo.dev${basePath}`;
  }
  return `https://clodo.dev/i18n/${locale}${basePath}`;
}

/**
 * Check if file should have schema injection
 * (filters out navigation, footer, and other non-content pages)
 */
export function shouldInjectSchemas(filePath) {
  const excludePatterns = [
    /^(nav-system|templates|scripts|styles|icons|js|css)\//,
    /\.(js|css|json|map|txt|xml)$/,
    /^(_[a-z]|error|404|500)/
  ];
  
  return !excludePatterns.some(pattern => pattern.test(filePath));
}

export default {
  SUPPORTED_LOCALES,
  RTL_LANGUAGES,
  detectLocaleFromPath,
  getLocaleConfig,
  getOrganizationForLocale,
  buildLocaleUrl,
  generateAlternateLanguageLinks,
  isRTLLocale,
  getLanguageCode,
  getAllLocales,
  buildLocalizedBreadcrumbUrl,
  shouldInjectSchemas
};
