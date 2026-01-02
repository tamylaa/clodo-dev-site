/**
 * Configuration Type Definitions
 *
 * Industry-standard: TypeScript definitions for all config objects
 * Benefits: IDE autocompletion, compile-time type checking, documentation
 */

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  developmentUrl: string;
  stagingUrl?: string;
  language: string;
  locale: string;
  copyright: {
    holder: string;
    year: number;
    startYear: number;
  };
}

export interface ThemeConfig {
  colors: {
    brand: {
      primary: string;
      secondary: string;
      accent?: string;
    };
    background: {
      light: string;
      dark: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary?: string;
      mono?: string;
    };
    fontSize: Record<string, string>;
    fontWeight: Record<string, string | number>;
  };
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavigationItem[];
  icon?: string;
  badge?: string;
}

export interface NavigationConfig {
  main: NavigationItem[];
  footer?: NavigationItem[];
  social?: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
}

export interface PageConfig {
  [key: string]: {
    title: string;
    description?: string;
    keywords?: string[];
    layout?: string;
    components?: string[];
    metadata?: Record<string, any>;
  };
}

export interface SocialConfig {
  twitter: {
    url: string;
    handle: string;
  };
  github: {
    url: string;
    org: string;
    repo: string;
  };
  linkedin?: {
    url: string;
    company?: string;
  };
  discord?: {
    url: string;
    invite?: string;
  };
}

export interface FeatureFlag {
  enabled: boolean;
  description: string;
  rollout: number; // 0-100 percentage
  environments?: string[];
  dependencies?: string[];
  userGroups?: string[];
  startDate?: string;
  endDate?: string;
}

export interface FeatureFlags {
  [key: string]: FeatureFlag;
}

export interface Config {
  site: SiteConfig;
  theme: ThemeConfig;
  navigation: NavigationConfig;
  pages: PageConfig;
  social: SocialConfig;
  contact: any;
  services: any;
  pwa: any;
  seo: any;
  build: any;
  environment: any;
}

export interface BuildConfig {
  tooling: any;
  analytics: any;
  deployment: any;
}

// Helper types for localization
export type Locale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
export type TranslationKey = string;

export interface LocalizedConfig {
  [locale: string]: {
    site: Partial<SiteConfig>;
    navigation: Partial<NavigationConfig>;
    pages: Record<string, Partial<PageConfig[string]>>;
  };
}

// Helper types for personalization
export interface UserProfile {
  id: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: Locale;
    features: string[];
  };
  segments: string[];
  experiments: Record<string, string>;
}

export interface PersonalizedConfig {
  user: UserProfile;
  overrides: Partial<Config>;
}