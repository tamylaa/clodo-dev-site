/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for gradual rollout of new features.
 * 
 * Access via window.FeatureFlags
 * 
 * Strategy:
 * - Start with all new features disabled
 * - Enable on specific environments/users for testing
 * - Gradually roll out to production
 * - Remove flag once stable
 */

/**
 * Feature flag definitions
 */
const FEATURES = {
  // JavaScript Modernization
  ES6_MODULES: {
    enabled: true,
    description: 'Enable ES6 module system',
    rollout: 100, // 0-100% rollout
    environments: ['development', 'production'], // Enable in all environments
  },
  
  MODULE_LAZY_LOADING: {
    enabled: false,
    description: 'Lazy load JavaScript modules on demand',
    rollout: 0,
    dependencies: ['ES6_MODULES'], // Requires ES6_MODULES to be enabled
  },
  
  THEME_MANAGER_MODULE: {
    enabled: false,
    description: 'Use modular theme manager instead of inline script',
    rollout: 0,
    dependencies: ['ES6_MODULES'],
  },
  
  NEWSLETTER_MODULE: {
    enabled: true,
    description: 'Modular newsletter form handler',
    rollout: 100,
    dependencies: ['ES6_MODULES'],
  },
  
  NAVIGATION_MODULE: {
    enabled: false,
    description: 'Modular navigation component',
    rollout: 0,
    dependencies: ['ES6_MODULES'],
  },
  
  // Performance Features
  INTERSECTION_OBSERVER: {
    enabled: true,
    description: 'Use Intersection Observer for lazy loading',
    rollout: 100,
    fallback: 'scroll-listener', // Fallback for unsupported browsers
  },
  
  IDLE_CALLBACK: {
    enabled: true,
    description: 'Use requestIdleCallback for deferred tasks',
    rollout: 100,
    fallback: 'timeout', // Use setTimeout fallback
  },
  
  PRELOAD_STRATEGY: {
    enabled: true,
    description: 'Strategic resource preloading',
    rollout: 100,
  },
  
  // UI Enhancements
  BUTTON_RIPPLE_EFFECT: {
    enabled: true,
    description: 'Material-style ripple effect on buttons',
    rollout: 100,
  },
  
  BUTTON_MICRO_INTERACTIONS: {
    enabled: true,
    description: 'Hover lift and active press animations',
    rollout: 100,
  },
  
  DARK_MODE: {
    enabled: true,
    description: 'Dark mode theme support',
    rollout: 100,
  },
  
  // Analytics & Monitoring
  PERFORMANCE_MONITORING: {
    enabled: false,
    description: 'Client-side performance monitoring',
    rollout: 0,
    environments: ['production'],
  },
  
  ERROR_TRACKING: {
    enabled: false,
    description: 'Client-side error tracking',
    rollout: 0,
    environments: ['production'],
  },
  
  // Experimental Features
  WEB_COMPONENTS: {
    enabled: false,
    description: 'Use Web Components for UI elements',
    rollout: 0,
    experimental: true,
  },
  
  SERVICE_WORKER: {
    enabled: false,
    description: 'Offline support via service worker',
    rollout: 0,
    experimental: true,
  },
  
  BREVO_CHAT: {
    enabled: true,
    description: 'Brevo live chat widget for visitor engagement',
    rollout: 100,
    dependencies: ['ES6_MODULES'],
  },
};

/**
 * Environment detection
 */
function getEnvironment() {
  if (typeof window === 'undefined') return 'server';
  
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  }
  
  return 'production';
}

/**
 * Check if a feature is enabled
 * 
 * @param {string} featureName - Name of the feature flag
 * @param {Object} options - Additional options
 * @param {string} options.userId - User ID for gradual rollout
 * @param {boolean} options.force - Force enable (for testing)
 * @returns {boolean} Whether the feature is enabled
 */
function isFeatureEnabled(featureName, options = {}) {
  const feature = FEATURES[featureName];
  
  if (!feature) {
    console.warn(`Feature flag "${featureName}" not found`);
    return false;
  }
  
  // Force enable for testing
  if (options.force) {
    return true;
  }
  
  // Check if explicitly disabled
  if (feature.enabled === false) {
    return false;
  }
  
  // Check environment restrictions
  if (feature.environments) {
    const currentEnv = getEnvironment();
    if (!feature.environments.includes(currentEnv)) {
      return false;
    }
  }
  
  // Check dependencies
  if (feature.dependencies) {
    for (const dep of feature.dependencies) {
      if (!isFeatureEnabled(dep, options)) {
        return false;
      }
    }
  }
  
  // Check rollout percentage
  if (feature.rollout !== undefined && feature.rollout < 100) {
    // Simple hash-based rollout (for user-specific gradual rollout)
    if (options.userId) {
      const hash = simpleHash(options.userId);
      const userPercentile = hash % 100;
      return userPercentile < feature.rollout;
    }
    
    // Random rollout if no userId provided
    return Math.random() * 100 < feature.rollout;
  }
  
  return feature.enabled !== false;
}

/**
 * Get feature configuration
 * 
 * @param {string} featureName - Name of the feature flag
 * @returns {Object} Feature configuration
 */
function getFeatureConfig(featureName) {
  return FEATURES[featureName] || null;
}

/**
 * Get all enabled features
 * 
 * @param {Object} options - Options for checking features
 * @returns {Array} Array of enabled feature names
 */
function getEnabledFeatures(options = {}) {
  return Object.keys(FEATURES).filter(name => 
    isFeatureEnabled(name, options)
  );
}

/**
 * Check if browser supports a feature
 * 
 * @param {string} featureName - Feature to check
 * @returns {boolean} Whether browser supports the feature
 */
function isBrowserSupported(featureName) {
  const checks = {
    ES6_MODULES: () => 'noModule' in document.createElement('script'),
    INTERSECTION_OBSERVER: () => 'IntersectionObserver' in window,
    IDLE_CALLBACK: () => 'requestIdleCallback' in window,
    WEB_COMPONENTS: () => 'customElements' in window,
    SERVICE_WORKER: () => 'serviceWorker' in navigator,
  };
  
  const check = checks[featureName];
  return check ? check() : true;
}

/**
 * Get fallback configuration for a feature
 * 
 * @param {string} featureName - Name of the feature
 * @returns {string|null} Fallback strategy
 */
function getFallback(featureName) {
  const feature = FEATURES[featureName];
  return feature?.fallback || null;
}

/**
 * Simple hash function for consistent user bucketing
 * 
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Feature flag debugging helper
 * 
 * Usage: Add ?debug_features=true to URL
 */
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('debug_features') === 'true') {
    console.group('🚩 Feature Flags Status');
    console.log('Environment:', getEnvironment());
    console.log('\nEnabled Features:');
    
    const enabled = getEnabledFeatures();
    enabled.forEach(name => {
      const config = FEATURES[name];
      console.log(`✅ ${name}`, config.description);
    });
    
    console.log('\nDisabled Features:');
    Object.keys(FEATURES).forEach(name => {
      if (!enabled.includes(name)) {
        const config = FEATURES[name];
        console.log(`❌ ${name}`, config.description);
        
        if (config.dependencies) {
          console.log(`   Dependencies: ${config.dependencies.join(', ')}`);
        }
        
        if (config.environments) {
          console.log(`   Required environments: ${config.environments.join(', ')}`);
        }
      }
    });
    
    console.groupEnd();
  }
}

// Expose to window
if (typeof window !== 'undefined') {
    window.FeatureFlags = {
        FEATURES,
        isFeatureEnabled,
        getFeatureConfig,
        getEnabledFeatures,
        isBrowserSupported,
        getFallback,
        getEnvironment,
    };
}
