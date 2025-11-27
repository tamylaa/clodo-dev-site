# Parallel Build Systems

This project uses **two complementary build systems** for optimal development and production workflows.

## 📋 Overview

### **Vite** - Development & Hot Reload
- ⚡ Lightning-fast dev server (instant startup)
- 🔥 Hot Module Replacement (HMR)
- 🎯 Optimized for developer experience
- 📦 Modern ES6+ support out of the box

### **build.js** - Production & Compatibility
- 🏗️ Custom build logic for templates
- 📄 Handlebars template processing
- 🎨 CSS bundling with critical/non-critical split
- 🔧 Full control over output structure
- ✅ Proven production reliability

## 🚀 Quick Start

### Development (Vite - Recommended)

```bash
# Start Vite dev server with HMR
npm run dev

# Server starts at: http://localhost:8000
# Changes reflect instantly (no page reload needed)
```

### Development (Legacy)

```bash
# Use old dev-server.js if needed
npm run dev:legacy

# Useful for debugging build.js compatibility
```

### Production Build

```bash
# Production build (uses build.js)
npm run build

# Output: ./dist/
```

### Preview Production Build

```bash
# Build with Vite (optional)
npm run build:vite

# Preview the Vite build
npm run preview

# Preview server: http://localhost:8001
```

## 🔧 Configuration Files

### **vite.config.js** - Vite Configuration

```javascript
{
  root: 'public',           // Serve from public/
  server: { port: 8000 },   // Dev server on :8000
  build: { outDir: 'dist' }, // Build output
  plugins: [handlebars]     // Template processing
}
```

Key features:
- Handlebars template support
- Path aliases (@css, @js, @images)
- Fast CSS/JS processing
- Source maps in development

### **build.js** - Production Build Script

Custom Node.js script for production builds:
- Compiles Handlebars templates
- Bundles CSS (critical vs non-critical)
- Copies JavaScript modules
- Processes all HTML files
- Generates build metadata

## 📂 File Structure

```
project/
├── vite.config.js          # Vite configuration
├── build.js                # Production build script
├── dev-server.js           # Legacy dev server
│
├── public/                 # Source files
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── images/
│
├── templates/              # Reusable templates
│   ├── header.html
│   ├── footer.html
│   └── hero.html
│
└── dist/                   # Build output (gitignored)
    ├── index.html
    ├── styles.css
    ├── script.js
    └── js/                 # ES6 modules
```

## 🎯 When to Use Which

### Use **Vite** (`npm run dev`) when:
- ✅ Actively developing features
- ✅ Iterating on CSS/JS changes
- ✅ Testing component behavior
- ✅ Want instant feedback on changes
- ✅ Working with ES6 modules

### Use **build.js** (`npm run build`) when:
- ✅ Preparing for deployment
- ✅ Testing production build
- ✅ Verifying template processing
- ✅ Checking bundle sizes
- ✅ Running in CI/CD pipeline

### Use **dev-server.js** (`npm run dev:legacy`) when:
- ✅ Debugging build.js issues
- ✅ Testing template processing
- ✅ Verifying build output locally
- ✅ Need exact production behavior

## ⚡ Performance Comparison

| Feature | Vite | build.js + dev-server |
|---------|------|----------------------|
| **Initial Startup** | <1s | ~3s |
| **Hot Reload** | <100ms | ~1-2s (full rebuild) |
| **CSS Changes** | Instant | ~1s |
| **JS Changes** | Instant | ~1s |
| **Template Changes** | Instant | ~1s |
| **Build Time** | ~5-10s | ~2-3s |

## 🔄 How They Work Together

### Development Workflow

1. **Start Vite**: `npm run dev`
2. Make changes to CSS/JS/HTML
3. Changes reflect instantly in browser
4. No manual refresh needed

### Before Commit/Deploy

1. **Build for production**: `npm run build`
2. **Test E2E**: `npm run test:e2e`
3. **Check performance**: `npm run lighthouse`
4. **Verify output**: Check `dist/` folder

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
- name: Install dependencies
  run: npm ci

- name: Build for production
  run: npm run build

- name: Run tests
  run: npm run test:all

- name: Deploy
  run: npm run deploy
```

## 🎨 Template Processing

Both systems support Handlebars templates:

### In HTML Files

```html
<!-- Include header -->
{{> header}}

<!-- Include hero with data -->
{{> hero variant="premium" showBadge=true}}

<!-- Include footer -->
{{> footer}}
```

### Vite Processing

Vite uses `vite-plugin-handlebars` to process templates on-the-fly during development.

### build.js Processing

build.js uses the `handlebars` package to compile templates during production build.

## 🔌 Module Support

### ES6 Modules (Both Systems)

```javascript
// Import from modules
import { isFeatureEnabled } from './config/features.js';
import { ThemeManager } from './core/theme.js';

// Export from modules
export class MyFeature {
  init() { /* ... */ }
}

export default MyFeature;
```

### Path Aliases (Vite Only)

```javascript
// Use path aliases in Vite
import styles from '@css/components/buttons.css';
import config from '@js/config/features.js';
import logo from '@images/logo.svg';
```

### Legacy Script (Both Systems)

```html
<!-- Still works in both systems -->
<script src="/script.js"></script>

<!-- Modern modules -->
<script type="module" src="/js/main.js"></script>
```

## 🐛 Troubleshooting

### Vite server won't start

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Kill processes on port 8000
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process

# Try again
npm run dev
```

### Templates not updating

**Vite**: Restart dev server
```bash
# Ctrl+C to stop
npm run dev
```

**build.js**: Rebuild
```bash
npm run build
```

### CSS not loading

Check browser console for errors. Verify:
- CSS files exist in `public/css/`
- Build completed successfully
- No syntax errors in CSS

### Module import errors

Ensure:
- File extensions included: `import x from './file.js'`
- Paths are correct (case-sensitive on Linux)
- Module exported correctly

## 📊 Build Comparison

### Vite Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # Bundled with hash
│   ├── index-[hash].css     # Bundled with hash
│   └── vendor-[hash].js     # Third-party libs
└── images/
```

### build.js Output

```
dist/
├── index.html              # Processed templates
├── styles.css              # Bundled CSS
├── critical.css            # Critical CSS
├── script.js               # Legacy script
├── js/                     # ES6 modules (unbundled)
│   ├── main.js
│   ├── core/
│   └── features/
└── images/
```

## 🎯 Best Practices

### Development

1. **Use Vite** for all day-to-day development
2. **Save often** - HMR updates instantly
3. **Check console** for errors/warnings
4. **Test in multiple browsers** before committing

### Before Commit

1. **Build with build.js**: `npm run build`
2. **Run linters**: `npm run lint`
3. **Run tests**: `npm run test:all`
4. **Check bundle size**: Review `dist/` folder

### Production

1. **Always use build.js** for deployments
2. **Test production build** locally first
3. **Run Lighthouse**: `npm run lighthouse`
4. **Monitor performance** after deployment

## 🔮 Future Enhancements

- [ ] Vite plugin for critical CSS extraction
- [ ] Unified template system (one source of truth)
- [ ] Shared build configuration
- [ ] Incremental builds in development
- [ ] Better source map support

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [ES6 Modules Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## 🎓 Learning More

### Vite Concepts

- **HMR**: Hot Module Replacement - updates without page reload
- **Pre-bundling**: Dependencies pre-bundled for speed
- **Tree-shaking**: Removes unused code automatically

### build.js Concepts

- **Template compilation**: Handlebars → HTML
- **CSS bundling**: Multiple CSS files → Single bundle
- **Critical CSS**: Above-the-fold styles inlined

---

**TL;DR**: Use `npm run dev` (Vite) for development, `npm run build` (build.js) for production. Both work seamlessly together! 🚀
