/**
 * Constants Centralization Guide
 *
 * This document maps all scattered constants to their centralized locations
 * in lib/constants-extended.js
 *
 * Status: Ready for implementation
 * Priority: High (affects 15+ files)
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

## Before & After Examples

### PORTS

**BEFORE** (scattered across files):
```javascript
// build/global-config.js
devServer: 8000,

// tooling.config.js
'http://localhost:8000'
'http://localhost:5173'

// build/core/dev-server.js (hardcoded)
const PORT = 8000;
```

**AFTER** (centralized):
```javascript
import { PORTS, getServicePort, getLocalhost } from './lib/constants-extended.js';

const devPort = PORTS.DEV_SERVER;
const vitePort = PORTS.VITE_DEV;
const localUrl = getLocalhost('main');  // 'http://localhost:8000'
```

### ENVIRONMENTS

**BEFORE** (scattered):
```javascript
// build/global-config.js
development: ['localhost', '127.0.0.1', '0.0.0.0'],
production: ['clodo.dev', 'www.clodo.dev'],

// tools/config-test.js
['development', 'staging', 'production'].includes(config.environment.current)

// config/personalization.js (hardcoded)
theme: 'auto'
```

**AFTER** (centralized):
```javascript
import { ENVIRONMENTS, THEME_MODES } from './lib/constants-extended.js';

const validEnvs = ENVIRONMENTS.ALL;
const devHosts = ENVIRONMENTS.HOSTS[ENVIRONMENTS.DEVELOPMENT];
const themeMode = THEME_MODES.AUTO;
```

### THEME MODES & COLORS

**BEFORE** (scattered):
```javascript
// config/personalization.js
'light' | 'dark' | 'auto'

// config/types.d.ts
theme: 'light' | 'dark' | 'auto'

// tests/test-navigation-static.js
const colors = { /* manual definition */ }
```

**AFTER** (centralized):
```javascript
import { THEME_MODES, THEME_COLORS } from './lib/constants-extended.js';

const validModes = THEME_MODES.ALL;
const primaryColor = THEME_COLORS.PRIMARY.light;
const successColor = THEME_COLORS.STATUS.success;
```

### PERFORMANCE THRESHOLDS

**BEFORE** (scattered):
```javascript
// build/global-config.js
LIGHTHOUSE_PERFORMANCE_TARGET: 90

// lib/constants.js (duplicate)
LIGHTHOUSE_PERFORMANCE_TARGET: 90

// Multiple test files (hardcoded)
if (score < 90) { /* fail */ }
```

**AFTER** (centralized):
```javascript
import { PERFORMANCE, getLighthouseThresholds } from './lib/constants-extended.js';

const targets = getLighthouseThresholds();
const minPerf = PERFORMANCE.LIGHTHOUSE.PERFORMANCE;
const vitals = PERFORMANCE.WEB_VITALS;
```

### LOCALES

**BEFORE** (scattered):
```javascript
// config/types.d.ts
'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh'

// config/i18n.js
manually defined

// Multiple files (hardcoded strings)
if (lang === 'en') { /* ... */ }
```

**AFTER** (centralized):
```javascript
import { LOCALES } from './lib/constants-extended.js';

const validLocales = LOCALES.ALL;
const region = LOCALES.REGIONS['en'];
```

### CONFIGURATION EXTENSIONS

**BEFORE** (scattered):
```javascript
// config/manager.js
['.json', '.js', '.ts', '.mjs']

// build/some-script.js
const ext = '.json'

// Multiple places, hardcoded
```

**AFTER** (centralized):
```javascript
import { CONFIG_EXTENSIONS } from './lib/constants-extended.js';

const supported = CONFIG_EXTENSIONS.ALL;
const jsonExt = CONFIG_EXTENSIONS.JSON;
```

// ============================================================================
// FILES TO UPDATE (PRIORITY ORDER)
// ============================================================================

### HIGH PRIORITY (Used in multiple places)

1. **build/global-config.js**
   - Replace port definitions with PORTS.*
   - Replace environment definitions with ENVIRONMENTS.*
   - Use getEnvironmentConfig(), isDevelopment(), isProduction()

2. **tooling.config.js**
   - Replace hardcoded 'http://localhost:8000' with getLocalhost('main')
   - Replace hardcoded 'http://localhost:5173' with getLocalhost('vite')
   - Use PORTS.DEV_SERVER, PORTS.VITE_DEV

3. **config/manager.js**
   - Replace ['.json', '.js', '.ts', '.mjs'] with CONFIG_EXTENSIONS.ALL
   - Replace 'development' default with ENVIRONMENTS.DEVELOPMENT

4. **config/personalization.js**
   - Replace 'light' | 'dark' | 'auto' with THEME_MODES.* constants
   - Import and use THEME_MODES.AUTO, THEME_MODES.LIGHT, etc.

5. **config/i18n.js**
   - Use LOCALES.ALL instead of manual definitions
   - Use LOCALES.REGIONS for locale->region mapping

6. **build/core/dev-server.js**
   - Replace hardcoded 8000 with getServicePort('devServer')
   - Replace hardcoded timeout values with PERFORMANCE.TIMEOUTS.*

### MEDIUM PRIORITY (Test files, utilities)

7. **tests/** (all test files)
   - Replace 'http://localhost:8000' with getLocalhost('main')
   - Replace 'http://localhost:5173' with getLocalhost('vite')
   - Replace hardcoded color definitions with THEME_COLORS.CONSOLE
   - Replace hardcoded timeouts with PERFORMANCE.TIMEOUTS.*

8. **tools/config-test.js**
   - Use ENVIRONMENTS.ALL instead of hardcoded array
   - Use PERFORMANCE thresholds

9. **vite.config.js**
   - Use isDevelopment(), isProduction() from constants
   - Use PORTS.VITE_DEV
   - Use PERFORMANCE.LIGHTHOUSE thresholds

### LOW PRIORITY (Nice to have)

10. **config/types.d.ts**
    - Update union types to reference THEME_MODES.ALL
    - Update LOCALE type to reference LOCALES.ALL

11. **lib/constants.js**
    - Re-export relevant items from constants-extended.js
    - Remove duplicates (DEFAULT_DEV_PORT, etc.)

12. **public/css files**
    - Use CSS variables that match THEME_COLORS definitions

// ============================================================================
// IMPLEMENTATION STEPS
// ============================================================================

### Step 1: Add to build/global-config.js

\`\`\`javascript
import { 
  PORTS, 
  ENVIRONMENTS, 
  PERFORMANCE,
  getEnvironmentConfig,
  isDevelopment,
  isProduction 
} from '../../lib/constants-extended.js';

export const GLOBAL_CONFIG = {
  ports: {
    devServer: PORTS.DEV_SERVER,
    smokeTest: PORTS.SMOKE_TEST,
    lighthouse: PORTS.LIGHTHOUSE
  },
  
  environments: ENVIRONMENTS.HOSTS,
  
  performance: {
    thresholds: PERFORMANCE.LIGHTHOUSE,
    webVitals: PERFORMANCE.WEB_VITALS,
    timeouts: PERFORMANCE.TIMEOUTS
  },
  // ... rest of config
};

export { isDevelopment, isProduction };
\`\`\`

### Step 2: Add to tooling.config.js

\`\`\`javascript
import { PORTS, getLocalhost } from '../lib/constants-extended.js';

export default {
  server: {
    urls: {
      local: process.env.LOCAL_URL || getLocalhost('main'),
      vite: process.env.VITE_URL || getLocalhost('vite'),
    },
    ports: {
      local: PORTS.DEV_SERVER,
      vite: PORTS.VITE_DEV,
    }
  },
  // ... rest
};
\`\`\`

### Step 3: Add to config/personalization.js

\`\`\`javascript
import { THEME_MODES, LOCALES } from '../lib/constants-extended.js';

export const getUserProfile = (userId) => {
  // ...
  return {
    preferences: {
      theme: THEME_MODES.AUTO,
      language: LOCALES.ENGLISH,
      features: [],
      notifications: true
    },
    // ...
  };
};
\`\`\`

### Step 4: Update test files

\`\`\`javascript
import { getLocalhost, PERFORMANCE, THEME_COLORS } from '../../lib/constants-extended.js';

const BASE_URL = getLocalhost('main');
const TEST_TIMEOUT = PERFORMANCE.TIMEOUTS.SMOKE_TEST;
const LOG_COLORS = THEME_COLORS.CONSOLE;
\`\`\`

// ============================================================================
// VERIFICATION CHECKLIST
// ============================================================================

- [ ] constants-extended.js created and exported properly
- [ ] All exported constants have JSDoc comments
- [ ] Utility functions tested manually
- [ ] build/global-config.js updated
- [ ] tooling.config.js updated
- [ ] config/manager.js updated
- [ ] config/personalization.js updated
- [ ] 5+ test files updated
- [ ] vite.config.js updated
- [ ] No more hardcoded 'localhost:8000' in non-test files
- [ ] No more hardcoded port numbers scattered
- [ ] No more hardcoded environment strings
- [ ] All tests pass
- [ ] TypeScript compilation succeeds

// ============================================================================
// BENEFITS AFTER IMPLEMENTATION
// ============================================================================

✅ Single source of truth for all configuration values
✅ Easy to maintain - change once, updates everywhere
✅ Type-safe with intellisense in modern IDEs
✅ Reduces duplication by ~80%
✅ New developers onboard faster
✅ Tests easier to maintain
✅ Less error-prone (no typos in magic strings)
✅ Environment-specific values easier to manage

// ============================================================================
// ESTIMATED EFFORT
// ============================================================================

- Creating constants-extended.js: 30 min (✅ Done)
- Updating 5 core files: 45 min
- Updating test files: 30 min
- Testing & verification: 30 min
- **Total: ~2-3 hours**

// ============================================================================
// ROLLBACK PLAN
// ============================================================================

If issues arise:
1. constants-extended.js is non-breaking (new file)
2. Files that import it can revert to hardcoded values
3. Keep lib/constants.js as fallback
4. No database changes needed
5. No production impact

**No rollback needed - purely additive!**
