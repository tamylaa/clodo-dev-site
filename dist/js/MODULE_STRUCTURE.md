# JavaScript Module Structure

Complete directory structure and module organization for the Clodo Framework website.

## 📂 Directory Structure

```
public/js/
├── main.js                 # Application entry point
├── README.md               # Module architecture documentation
│
├── config/                 # Configuration & feature flags
│   ├── index.js           # Config exports
│   ├── features.js        # Feature flag system
│   └── README.md          # Feature flags documentation
│
├── core/                   # Core functionality (always loaded)
│   ├── index.js           # Core exports ✅
│   ├── theme.js           # Theme management ✅
│   ├── app.js             # Application orchestration (TODO)
│   ├── router.js          # Client-side routing (TODO)
│   ├── events.js          # Event bus system (TODO)
│   └── storage.js         # LocalStorage wrapper (TODO)
│
├── features/               # Optional features (lazy loaded)
│   ├── index.js           # Feature exports ✅
│   ├── newsletter.js      # Newsletter subscription (TODO)
│   ├── forms.js           # Form validation & handling (TODO)
│   ├── analytics.js       # Event tracking (TODO)
│   ├── github.js          # GitHub API integration (TODO)
│   ├── search.js          # Documentation search (TODO)
│   ├── lazy-loading.js    # Image lazy loading (TODO)
│   ├── code-copy.js       # Code snippet copying (TODO)
│   └── performance.js     # Performance monitoring (TODO)
│
└── ui/                     # UI components
    ├── index.js           # UI exports ✅
    ├── navigation.js      # Navigation component (TODO)
    ├── modal.js           # Modal dialogs (TODO)
    ├── tabs.js            # Tab component (TODO)
    ├── accordion.js       # Accordion component (TODO)
    ├── tooltip.js         # Tooltip component (TODO)
    ├── animations.js      # Micro-interactions (TODO)
    ├── dropdown.js        # Dropdown menus (TODO)
    └── toast.js           # Toast notifications (TODO)
```

## 🎯 Module Categories

### **config/** - Configuration
**Purpose**: Centralized configuration and feature flags  
**When to use**: Settings, feature toggles, environment config  
**Current**: Feature flag system complete ✅

**Modules**:
- `features.js` - Feature flag management with gradual rollout
- `index.js` - Configuration exports

### **core/** - Core Functionality
**Purpose**: Essential functionality loaded on every page  
**When to use**: Base features needed site-wide  
**Load strategy**: Eager (loaded immediately)

**Planned modules**:
- ✅ `theme.js` - Theme toggling and persistence
- ⏳ `app.js` - Application initialization and coordination
- ⏳ `router.js` - Client-side routing (if needed)
- ⏳ `events.js` - Event bus for inter-module communication
- ⏳ `storage.js` - LocalStorage/SessionStorage wrapper

### **features/** - Optional Features
**Purpose**: Feature-specific functionality that can be enabled/disabled  
**When to use**: Page-specific or optional features  
**Load strategy**: Lazy (loaded when needed)

**Planned modules**:
- ⏳ `newsletter.js` - Newsletter form submission
- ⏳ `forms.js` - Form validation and submission
- ⏳ `analytics.js` - Event tracking and monitoring
- ⏳ `github.js` - GitHub stars/repo integration
- ⏳ `search.js` - Documentation search functionality
- ⏳ `lazy-loading.js` - Image and content lazy loading
- ⏳ `code-copy.js` - Copy code snippet to clipboard
- ⏳ `performance.js` - Performance monitoring and reporting

### **ui/** - UI Components
**Purpose**: Interactive UI components and widgets  
**When to use**: Reusable UI patterns  
**Load strategy**: On-demand (loaded when component is used)

**Planned modules**:
- ⏳ `navigation.js` - Navigation menu behavior
- ⏳ `modal.js` - Modal dialog component
- ⏳ `tabs.js` - Tab switching component
- ⏳ `accordion.js` - Accordion/collapse component
- ⏳ `tooltip.js` - Tooltip/popover component
- ⏳ `animations.js` - Micro-interactions and animations
- ⏳ `dropdown.js` - Dropdown menu component
- ⏳ `toast.js` - Toast notification component

## 📚 Usage Examples

### Import from Index Files

```javascript
// Import core modules
import { ThemeManager } from './core/index.js';

// Import features
import { Newsletter, Forms } from './features/index.js';

// Import UI components
import { Modal, Tabs } from './ui/index.js';
```

### Import Individual Modules

```javascript
// Direct import for specific modules
import ThemeManager from './core/theme.js';
import { isFeatureEnabled } from './config/features.js';
```

### Lazy Loading

```javascript
// Load feature on demand
async function initNewsletter() {
  const { Newsletter } = await import('./features/newsletter.js');
  Newsletter.init();
}

// Load when element is visible
const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const module = entry.target.dataset.module;
      const { init } = await import(`./features/${module}.js`);
      init(entry.target);
      observer.unobserve(entry.target);
    }
  }
});
```

### Feature Flag Integration

```javascript
import { isFeatureEnabled } from './config/features.js';

// Conditional loading based on feature flags
if (isFeatureEnabled('NEWSLETTER_MODULE')) {
  const { Newsletter } = await import('./features/newsletter.js');
  Newsletter.init();
}
```

## 🔧 Module Template

### Standard Module Structure

```javascript
/**
 * Module Name
 * 
 * Description of what this module does.
 * 
 * @module features/example
 */

// Private variables
let isInitialized = false;
const config = {
  // Module configuration
};

// Private functions
function privateHelper() {
  // Private implementation
}

// Public API
export class ExampleFeature {
  constructor(options = {}) {
    this.options = { ...config, ...options };
  }

  init() {
    if (isInitialized) return;
    
    // Initialization logic
    this.setupEventListeners();
    
    isInitialized = true;
  }

  setupEventListeners() {
    // Event listener setup
  }

  destroy() {
    // Cleanup logic
    isInitialized = false;
  }
}

// Default export
export default ExampleFeature;

// Named exports
export { ExampleFeature };
```

## 📊 Module Dependencies

### Dependency Graph

```
main.js
  ├── config/features.js (always)
  ├── core/
  │   ├── theme.js
  │   ├── app.js → events.js, storage.js
  │   └── router.js → events.js
  │
  ├── features/ (conditional)
  │   ├── newsletter.js → forms.js, analytics.js
  │   ├── forms.js → events.js
  │   ├── analytics.js
  │   └── github.js
  │
  └── ui/ (on-demand)
      ├── navigation.js → dropdown.js
      ├── modal.js → animations.js
      └── tabs.js
```

### Import Rules

1. **No circular dependencies**: Module A imports B, B cannot import A
2. **Core modules only import core**: Core modules shouldn't import features
3. **Features can import core**: Features can use core functionality
4. **UI components are independent**: Minimal dependencies

## 🎯 Migration Strategy

### Phase 1: Foundation (Complete ✅)
- [x] Create directory structure
- [x] Add index files to each directory
- [x] Document module organization
- [x] Establish import patterns

### Phase 2: Extract Features (Tasks 14-20)
- [ ] Extract newsletter functionality
- [ ] Extract form handling
- [ ] Extract GitHub integration
- [ ] Extract analytics
- [ ] Extract search
- [ ] Extract lazy loading
- [ ] Extract code copying

### Phase 3: Core Modules (Tasks 21-24)
- [ ] Create App orchestrator
- [ ] Implement Router (if needed)
- [ ] Create Event Bus
- [ ] Create Storage wrapper

### Phase 4: UI Components (Tasks 25-28)
- [ ] Extract navigation behavior
- [ ] Create Modal component
- [ ] Create Tabs component
- [ ] Create Tooltip component
- [ ] Add micro-interactions

## 🧪 Testing Modules

### Unit Tests

```javascript
// tests/unit/features/newsletter.test.js
import { Newsletter } from '@js/features/newsletter.js';

describe('Newsletter', () => {
  test('validates email format', () => {
    const newsletter = new Newsletter();
    expect(newsletter.validateEmail('test@example.com')).toBe(true);
    expect(newsletter.validateEmail('invalid')).toBe(false);
  });
});
```

### Integration Tests

```javascript
// tests/e2e/newsletter.spec.js
test('newsletter subscription flow', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-newsletter-email]', 'test@example.com');
  await page.click('[data-newsletter-submit]');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 📏 Best Practices

### 1. Single Responsibility
Each module should do one thing well.

### 2. Clear API
Export clear, documented public APIs.

### 3. Avoid Global State
Use dependency injection or event bus for communication.

### 4. Lazy Load When Possible
Load features only when needed.

### 5. Feature Flags
Use feature flags for gradual rollout.

### 6. Error Handling
Always handle errors gracefully.

```javascript
export class SafeFeature {
  async init() {
    try {
      await this.setupFeature();
    } catch (error) {
      console.error('[SafeFeature] Init failed:', error);
      // Graceful degradation
    }
  }
}
```

### 7. Type Safety (Future)
Add JSDoc or TypeScript types.

```javascript
/**
 * @typedef {Object} NewsletterOptions
 * @property {string} endpoint - API endpoint
 * @property {boolean} validateOnInput - Validate as user types
 */

/**
 * @param {NewsletterOptions} options
 */
export function init(options) {
  // Implementation
}
```

## 🔍 Debugging Modules

### Enable Debug Mode

```javascript
// In config/features.js or main.js
const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Module]', ...args);
  }
}
```

### Module Load Tracking

```javascript
// Track which modules are loaded
window.__loadedModules = window.__loadedModules || new Set();

export function trackModule(name) {
  window.__loadedModules.add(name);
  console.log(`[Loaded] ${name}`, Array.from(window.__loadedModules));
}
```

## 🚀 Performance Considerations

### Bundle Size
- Keep modules small and focused
- Use dynamic imports for non-critical features
- Tree-shake unused code

### Load Strategy
- **Critical**: Load in `<head>` or early in body
- **Important**: Load after DOM ready
- **Optional**: Lazy load when needed

### Caching
- Modules benefit from browser caching
- Hash filenames for cache busting in production

## 📊 Module Metrics

Track these metrics for each module:
- **Size**: File size in bytes
- **Load time**: Time to download and parse
- **Usage**: How often it's loaded
- **Dependencies**: Number of dependencies
- **Test coverage**: Percentage covered by tests

## 🎓 Next Steps

1. ✅ Module structure established
2. ⏭️ Extract features from script.js (Tasks 14-20)
3. ⏭️ Create core modules (Tasks 21-24)
4. ⏭️ Build UI components (Tasks 25-28)
5. ⏭️ Add comprehensive tests
6. ⏭️ Document each module's API
7. ⏭️ Optimize bundle sizes

---

**Status**: Foundation complete ✅  
**Next**: Begin feature extraction (Task 14)  
**Progress**: 13/100 tasks complete (13%)
