/**
 * Personalization Configuration System
 *
 * Industry-standard approach: User profiles with preference management
 * Benefits: A/B testing, user segmentation, personalized experiences
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { THEME_MODES, LOCALES } from '../lib/constants-extended.js';

// User profile structure
// export interface UserProfile {
//   id: string;
//   preferences: {
//     theme: 'light' | 'dark' | 'auto';
//     language: string;
//     features: string[];
//     notifications: boolean;
//   };
//   segments: string[];
//   experiments: Record<string, string>; // experimentId -> variantId
//   customizations: Record<string, any>;
// }

// Experiment configuration
// export interface Experiment {
//   id: string;
//   name: string;
//   description: string;
//   variants: Array<{
//     id: string;
//     name: string;
//     weight: number; // 0-100 percentage
//     config: Record<string, any>;
//   }>;
//   targetSegments?: string[];
//   startDate?: string;
//   endDate?: string;
// }

// Personalization rules
// export interface PersonalizationRule {
//   id: string;
//   condition: (user: UserProfile, context: any) => boolean;
//   config: Record<string, any>;
//   priority: number;
// }

// Load experiments from config
const loadExperiments = () => {
  const filePath = join(process.cwd(), 'config', 'experiments.json');
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.warn('Failed to load experiments config:', error);
  }
  return {};
};

// Load personalization rules
const loadPersonalizationRules = () => {
  const filePath = join(process.cwd(), 'config', 'personalization.json');
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.warn('Failed to load personalization config:', error);
  }
  return [];
};

const experiments = loadExperiments();
const personalizationRules = loadPersonalizationRules();

/**
 * Get user profile (server-side or client-side)
 */
export const getUserProfile = (userId) => {
  // Server-side: check database or external service
  if (typeof window === 'undefined') {
    if (!userId) return null;
    // TODO: Implement server-side user profile fetching
    return null;
  }

  // Client-side: check localStorage or API
  const stored = localStorage.getItem('userProfile');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn('Invalid user profile in localStorage');
    }
  }

  // Create anonymous profile
  return {
    id: 'anonymous',
    preferences: {
      theme: THEME_MODES.AUTO,
      language: LOCALES.ENGLISH,
      features: [],
      notifications: true
    },
    segments: ['anonymous'],
    experiments: {},
    customizations: {}
  };
};

/**
 * Assign user to experiment variant
 */
export const assignExperimentVariant = (user, experimentId) => {
  const experiment = experiments[experimentId];
  if (!experiment) return 'control';

  // Check if user is already assigned
  if (user.experiments[experimentId]) {
    return user.experiments[experimentId];
  }

  // Check segment targeting
  if (experiment.targetSegments) {
    const hasMatchingSegment = experiment.targetSegments.some(segment =>
      user.segments.includes(segment)
    );
    if (!hasMatchingSegment) return 'control';
  }

  // Simple random assignment based on weights
  const random = Math.random() * 100;
  let cumulativeWeight = 0;

  for (const variant of experiment.variants) {
    cumulativeWeight += variant.weight;
    if (random <= cumulativeWeight) {
      user.experiments[experimentId] = variant.id;
      return variant.id;
    }
  }

  return 'control';
};

/**
 * Get personalized config by applying user-specific overrides
 */
export const getPersonalizedConfig = (baseConfig, user) => {
  let personalizedConfig = { ...baseConfig };

  // Apply experiment variants
  for (const [experimentId, variantId] of Object.entries(user.experiments)) {
    const experiment = experiments[experimentId];
    const variant = experiment?.variants.find(v => v.id === variantId);

    if (variant) {
      personalizedConfig = deepMerge(personalizedConfig, variant.config);
    }
  }

  // Apply personalization rules
  const applicableRules = personalizationRules
    .filter(rule => rule.condition(user, { config: baseConfig }))
    .sort((a, b) => b.priority - a.priority);

  for (const rule of applicableRules) {
    personalizedConfig = deepMerge(personalizedConfig, rule.config);
  }

  // Apply user preferences
  if (user.preferences.theme !== THEME_MODES.AUTO) {
    personalizedConfig.theme = {
      ...personalizedConfig.theme,
      mode: user.preferences.theme
    };
  }

  return personalizedConfig;
};

/**
 * Update user profile
 */
export const updateUserProfile = (updates) => {
  if (typeof window === 'undefined') return;

  const current = getUserProfile();
  if (!current) return;

  const updated = { ...current, ...updates };
  localStorage.setItem('userProfile', JSON.stringify(updated));
};

/**
 * Deep merge utility
 */
const deepMerge = (target, source) => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
};

/**
 * Check if user has feature enabled
 */
export const hasUserFeature = (user, featureName) => {
  return user.preferences.features.includes(featureName);
};

/**
 * Get user segment
 */
export const getUserSegment = (user) => {
  return user.segments[0] || 'anonymous';
};