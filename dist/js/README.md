# JavaScript Module Structure

**Status**: Foundation Phase (Quick Win #5)  
**Created**: November 22, 2025  
**Branch**: `modernization`

## Overview

This directory contains the modularized JavaScript architecture for the Clodo Framework website. The module system is being built in parallel with the legacy `script.js` to enable gradual migration without breaking changes.

## Architecture

```
public/js/
├── main.js                 # Entry point, orchestrates all modules
├── core/                   # Core functionality (always loaded)
│   ├── theme.js           # ✅ Theme manager (light/dark mode)
│   ├── app.js             # 🔜 Main application coordinator
│   └── config.js          # 🔜 Configuration and constants
├── features/              # Page-specific features (lazy loaded)
│   ├── newsletter/        # 🔜 Newsletter subscription
│   │   ├── form.js
│   │   ├── api.js
│   │   └── validator.js
│   ├── navigation/        # 🔜 Navigation system
│   │   ├── mobile-menu.js
│   │   ├── dropdown.js
│   │   └── active-state.js
│   ├── forms/             # 🔜 Form handlers
│   │   ├── contact.js
│   │   └── validator.js
│   └── integrations/      # 🔜 Third-party integrations
│       ├── stackblitz.js
│       ├── github.js
│       └── analytics.js
└── ui/                    # UI utilities
    ├── notifications.js   # 🔜 Toast notifications
    ├── loading.js         # 🔜 Loading states
    └── animations.js      # 🔜 Scroll animations

✅ = Completed
🔜 = Planned
```

## Module Guidelines

### Imports/Exports
```javascript
// Named exports (preferred for utilities)
export function init() { ... }
export class ThemeManager { ... }

// Default exports (use for main classes)
export default ThemeManager;
```

### Initialization Pattern
```javascript
export class FeatureModule {
    constructor(options = {}) {
        this.options = options;
    }

    init() {
        // Setup code here
        console.log('[FeatureModule] Initialized');
    }
}

export function init(options) {
    const module = new FeatureModule(options);
    module.init();
    return module;
}
```

### Error Handling
```javascript
try {
    // Feature code
} catch (e) {
    console.warn('[ModuleName] Feature not available:', e);
    // Graceful degradation
}
```

## Loading Strategy

### Critical (Inline/Preload)
- Theme management
- Core application logic

### Deferred (Lazy Load)
- Analytics
- Third-party integrations
- Non-essential animations

### On-Demand (Dynamic Import)
```javascript
button.addEventListener('click', async () => {
    const { openStackBlitz } = await import('./integrations/stackblitz.js');
    openStackBlitz(url);
});
```

## Feature Flags

Modules check `FEATURE_FLAGS` in `main.js` to enable/disable functionality:

```javascript
const FEATURE_FLAGS = {
    useModules: false,          // Master switch
    enableModulePreload: false, // Use <link rel="modulepreload">
    enableCodeSplitting: false  // Dynamic imports for code splitting
};
```

## Migration Status

### Completed
- ✅ Created `main.js` entry point
- ✅ Created `core/theme.js` module
- ✅ Established module structure
- ✅ Documented architecture

### In Progress
- 🔨 Create remaining core modules
- 🔨 Extract feature modules
- 🔨 Setup event delegation
- 🔨 Remove inline event handlers

### Pending
- ⏳ Convert global functions to modules
- ⏳ Update HTML to use ES6 modules
- ⏳ Enable feature flags
- ⏳ Remove legacy script.js

## Testing

### Module Loading Test
```html
<!-- Add to test page -->
<script type="module">
    import { init } from './js/main.js';
    init();
</script>
```

### Individual Module Test
```html
<script type="module">
    import { ThemeManager } from './js/core/theme.js';
    const theme = new ThemeManager();
    theme.init();
</script>
```

## Rollback Plan

If modules cause issues:

1. Set `FEATURE_FLAGS.useModules = false` in `main.js`
2. Remove `<script type="module">` tags from HTML
3. Revert to `<script src="script.js">` only

## Next Steps

1. Create remaining core modules (app.js, config.js)
2. Extract newsletter module from script.js
3. Extract navigation module from script.js
4. Setup parallel loading with feature flags
5. Test on staging environment
6. Gradual rollout with beta parameter

## Resources

- [MDN: JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [V8: JavaScript Modules](https://v8.dev/features/modules)
- [web.dev: Fast load times](https://web.dev/fast/)

---

**Created for Quick Win #5**: Foundation for JavaScript modularization  
**Branch**: modernization  
**Risk Level**: LOW (disabled by default, no breaking changes)
