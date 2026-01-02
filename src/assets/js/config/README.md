# Feature Flag System

Centralized feature flag management for gradual rollout and A/B testing of new features.

## 📋 Overview

Feature flags allow you to:
- **Gradual Rollout**: Enable features for a percentage of users
- **Environment Control**: Different features for dev/staging/production
- **Safe Deployment**: Test in production without affecting all users
- **Quick Rollback**: Disable features instantly without code changes
- **Dependency Management**: Ensure required features are enabled
- **A/B Testing**: Compare feature performance

## 🚀 Quick Start

### Check if Feature is Enabled

```javascript
import { isFeatureEnabled } from './config/features.js';

if (isFeatureEnabled('ES6_MODULES')) {
    // Use new module system
} else {
    // Use legacy code
}
```

### Get Feature Configuration

```javascript
import { getFeatureConfig } from './config/features.js';

const config = getFeatureConfig('ES6_MODULES');
console.log(config.description); // "Enable ES6 module system"
console.log(config.rollout);     // 0-100
```

### Get All Enabled Features

```javascript
import { getEnabledFeatures } from './config/features.js';

const enabled = getEnabledFeatures();
console.log('Active features:', enabled.join(', '));
```

## 🎯 Feature Flag Structure

```javascript
FEATURE_NAME: {
    enabled: true,                      // Master switch
    description: 'What this does',      // Human-readable description
    rollout: 50,                        // 0-100% gradual rollout
    environments: ['development'],      // Restrict to environments
    dependencies: ['OTHER_FEATURE'],    // Required features
    fallback: 'legacy-method',          // Fallback strategy
    experimental: true,                 // Mark as experimental
}
```

## 📚 Available Features

### JavaScript Modernization

| Flag | Status | Description |
|------|--------|-------------|
| `ES6_MODULES` | 🔴 Disabled | Enable ES6 module system |
| `MODULE_LAZY_LOADING` | 🔴 Disabled | Lazy load modules on demand |
| `THEME_MANAGER_MODULE` | 🔴 Disabled | Modular theme manager |
| `NEWSLETTER_MODULE` | 🔴 Disabled | Modular newsletter form |
| `NAVIGATION_MODULE` | 🔴 Disabled | Modular navigation component |

### Performance Features

| Flag | Status | Description |
|------|--------|-------------|
| `INTERSECTION_OBSERVER` | 🟢 Enabled | Lazy loading with IntersectionObserver |
| `IDLE_CALLBACK` | 🟢 Enabled | Defer tasks with requestIdleCallback |
| `PRELOAD_STRATEGY` | 🟢 Enabled | Strategic resource preloading |

### UI Enhancements

| Flag | Status | Description |
|------|--------|-------------|
| `BUTTON_RIPPLE_EFFECT` | 🟢 Enabled | Material-style ripple effect |
| `BUTTON_MICRO_INTERACTIONS` | 🟢 Enabled | Hover lift and active press |
| `DARK_MODE` | 🟢 Enabled | Dark mode theme support |

### Analytics & Monitoring

| Flag | Status | Description |
|------|--------|-------------|
| `PERFORMANCE_MONITORING` | 🔴 Disabled | Client-side performance tracking |
| `ERROR_TRACKING` | 🔴 Disabled | Client-side error tracking |

### Experimental Features

| Flag | Status | Description |
|------|--------|-------------|
| `WEB_COMPONENTS` | 🔴 Disabled | Web Components for UI elements |
| `SERVICE_WORKER` | 🔴 Disabled | Offline support |

## 🔧 Usage Patterns

### Basic Feature Check

```javascript
import { isFeatureEnabled } from './config/features.js';

if (isFeatureEnabled('DARK_MODE')) {
    document.documentElement.setAttribute('data-theme', 'dark');
}
```

### With Dependencies

```javascript
// NEWSLETTER_MODULE requires ES6_MODULES to be enabled
if (isFeatureEnabled('NEWSLETTER_MODULE')) {
    // This only runs if both ES6_MODULES AND NEWSLETTER_MODULE are enabled
    const Newsletter = await import('./features/newsletter.js');
    Newsletter.init();
}
```

### With User-Specific Rollout

```javascript
import { isFeatureEnabled } from './config/features.js';

// Enable for 50% of users based on their ID
const userId = getUserId(); // Get from auth system
if (isFeatureEnabled('NEW_FEATURE', { userId })) {
    // User is in the 50% that gets the new feature
}
```

### Force Enable (Testing)

```javascript
import { isFeatureEnabled } from './config/features.js';

// Force enable for testing
if (isFeatureEnabled('ES6_MODULES', { force: true })) {
    // Always runs, regardless of flag state
}
```

### Browser Support Check

```javascript
import { isBrowserSupported, getFallback } from './config/features.js';

if (isBrowserSupported('INTERSECTION_OBSERVER')) {
    // Use IntersectionObserver
    const observer = new IntersectionObserver(callback);
} else {
    const fallback = getFallback('INTERSECTION_OBSERVER');
    // Use fallback: 'scroll-listener'
}
```

## 🌍 Environment Detection

Automatically detects environment:

| Hostname | Environment |
|----------|-------------|
| `localhost`, `127.0.0.1` | `development` |
| Contains `staging`, `preview` | `staging` |
| All others | `production` |

### Environment-Specific Features

```javascript
FEATURE_NAME: {
    enabled: true,
    environments: ['development', 'staging'], // Only in dev/staging
}
```

## 📊 Gradual Rollout

### Percentage-Based Rollout

```javascript
NEW_FEATURE: {
    enabled: true,
    rollout: 25, // Enable for 25% of users
}
```

**How it works:**
- Uses simple hash of userId for consistent bucketing
- Same user always gets same experience
- If no userId provided, uses random rollout

### Rollout Strategy

1. **0%**: Feature complete, disabled for all
2. **10%**: Enable for internal testing (dev team)
3. **25%**: Beta testers
4. **50%**: Half of production users
5. **100%**: Full rollout
6. **Remove**: Once stable, remove flag and make permanent

## 🐛 Debugging

### Debug All Features

Add `?debug_features=true` to URL:

```
http://localhost:8000/?debug_features=true
```

Console output:
```
🚩 Feature Flags Status
Environment: development

Enabled Features:
✅ INTERSECTION_OBSERVER Use Intersection Observer for lazy loading
✅ IDLE_CALLBACK Use requestIdleCallback for deferred tasks
✅ DARK_MODE Dark mode theme support

Disabled Features:
❌ ES6_MODULES Enable ES6 module system
   Required environments: development
❌ NEWSLETTER_MODULE Modular newsletter form handler
   Dependencies: ES6_MODULES
```

### Manual Check in Console

```javascript
import features from './js/config/features.js';

// Check all enabled
features.getEnabledFeatures();

// Check specific feature
features.isFeatureEnabled('ES6_MODULES');

// Get config
features.getFeatureConfig('ES6_MODULES');
```

## 🔄 Migration Workflow

### Phase 1: Create Feature (Flag OFF)

```javascript
// Add to features.js
MY_NEW_FEATURE: {
    enabled: false,
    description: 'New awesome feature',
    rollout: 0,
    environments: ['development'],
}
```

### Phase 2: Development Testing

```javascript
// Enable in development only
MY_NEW_FEATURE: {
    enabled: true,
    environments: ['development'],
    rollout: 100,
}
```

### Phase 3: Staging Testing

```javascript
// Add staging
MY_NEW_FEATURE: {
    enabled: true,
    environments: ['development', 'staging'],
    rollout: 100,
}
```

### Phase 4: Production Rollout

```javascript
// Gradual rollout in production
MY_NEW_FEATURE: {
    enabled: true,
    rollout: 10, // Start with 10%
}
```

### Phase 5: Full Rollout

```javascript
// Enable for everyone
MY_NEW_FEATURE: {
    enabled: true,
    rollout: 100,
}
```

### Phase 6: Cleanup

Once stable, remove the feature flag and make the code permanent.

## 🎯 Best Practices

### 1. Always Add Description
```javascript
FEATURE: {
    description: 'Clear description of what this does',
    // ...
}
```

### 2. Use Dependencies
```javascript
ADVANCED_FEATURE: {
    dependencies: ['BASE_FEATURE'], // Ensure base is enabled first
    // ...
}
```

### 3. Start Small
```javascript
NEW_FEATURE: {
    enabled: true,
    rollout: 5, // Start with 5%, increase gradually
}
```

### 4. Environment Restrictions
```javascript
EXPERIMENTAL: {
    environments: ['development'], // Don't leak to production
}
```

### 5. Provide Fallbacks
```javascript
MODERN_API: {
    fallback: 'legacy-api', // Document fallback strategy
}
```

### 6. Mark Experimental Features
```javascript
CUTTING_EDGE: {
    experimental: true, // Warning to developers
}
```

### 7. Clean Up Old Flags
Remove flags after 2-3 weeks at 100% rollout with no issues.

## 🚨 Common Pitfalls

### ❌ Don't: Nest Feature Checks
```javascript
// BAD
if (isFeatureEnabled('A')) {
    if (isFeatureEnabled('B')) {
        // Complex logic
    }
}
```

### ✅ Do: Use Dependencies
```javascript
// GOOD
FEATURE_B: {
    dependencies: ['FEATURE_A'], // B requires A
}

if (isFeatureEnabled('FEATURE_B')) {
    // Automatically checks FEATURE_A too
}
```

### ❌ Don't: Create Too Many Flags
Keep flags focused and temporary.

### ✅ Do: Remove Flags Quickly
Once stable, make permanent and remove flag.

### ❌ Don't: Use Flags for Configuration
```javascript
// BAD - Use config files for this
API_ENDPOINT: { enabled: 'https://api.example.com' }
```

### ✅ Do: Use Flags for Code Paths
```javascript
// GOOD - Use flags for enabling/disabling features
USE_NEW_API: { enabled: true }
```

## 📈 Monitoring

Track feature flag usage:
- How many users have each feature
- Error rates per feature
- Performance impact
- User feedback per feature

Integration with analytics:
```javascript
if (isFeatureEnabled('NEW_FEATURE')) {
    analytics.track('feature_enabled', { feature: 'NEW_FEATURE' });
}
```

## 🎓 Next Steps

1. ✅ Feature flag system created
2. ⏭️ Enable ES6_MODULES in development
3. ⏭️ Test module loading
4. ⏭️ Gradually enable additional features
5. ⏭️ Monitor performance and errors
6. ⏭️ Roll out to production (10% → 100%)
7. ⏭️ Remove flags once stable

## 📚 Resources

- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)
- [A/B Testing Guide](https://www.optimizely.com/optimization-glossary/ab-testing/)
- [Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)
