// PostCSS Configuration with PurgeCSS
// Safe, conservative setup for Clodo development site

import postcssImport from 'postcss-import';
import purgecssPlugin from '@fullhuman/postcss-purgecss';
import cssnano from 'cssnano';

const purgecss = purgecssPlugin.default || purgecssPlugin;

export default {
  plugins: [
    // STEP 1: Resolve all @imports first (combine into single CSS file)
    postcssImport({
      path: ['public', 'public/css']
    }),
    
    // STEP 2: Run PurgeCSS on the complete bundle (production only)
    ...(process.env.NODE_ENV === 'production' 
      ? [purgecss({
          // ===== CONTENT SOURCES =====
          // Scan all HTML and JavaScript files for class names
          content: [
            './public/**/*.html',
            './public/js/**/*.js',
            './public/script.js',
            './templates/**/*.html'
          ],
          
          // ===== CSS FILES TO PURGE =====
          css: [
            './public/styles.css',
            './public/css/**/*.css'
          ],
          
          // ===== SAFELIST CONFIGURATION =====
          // CRITICAL: Protect dynamic classes added by JavaScript
          safelist: {
            // Standard classes (exact matches)
            standard: [
              // Navigation states
              'active',
              'open',
              'closed',
              
              // Form states
              'show',
              'hide',
              'visible',
              'hidden',
              'loading',
              'state-loading',
              'form-group--focused',
              
              // Lazy loading
              'lazy',
              'lazy-loaded',
              
              // Animations (from scroll-animations.js)
              'fade-in-up',
              'fade-in-left',
              'fade-in-right',
              'slide-in-up',
              'slide-in-left',
              'slide-in-right',
              
              // Theme switching
              'theme-dark',
              'theme-light',
              
              // Notifications
              'notification',
              'loading-pulse',
              
              // Modal/Overlay
              'overlay',
              'modal-open',

              // Hero section new classes
              'highlight',
              'hero-social-proof',
              'social-proof-badges',
              'social-proof-item',
              'social-proof-number',
              'social-proof-label',
              'social-proof-logos',
              'logo-placeholder',
              'logo-text',
              'hero-value-grid',
              'value-prop-card',
              'value-prop-icon',
              'value-prop-content',
              'value-prop-title',
              'value-prop-desc',
              'hero-trust-signals',
              'trust-signal',
              'trust-icon',
              'hero-urgency',
              'urgency-badge',
              'urgency-pulse',
              'btn-hero-primary',
              'btn-hero-secondary',

              // Highlights section classes
              'highlights-section',
              'highlights-content',
              'highlights-title',
              'highlights-subtitle',
              'highlights-grid',
              'highlight-card',
              'highlight-icon',
              'highlight-content',
              'highlight-title',
              'highlight-description',
              'trust-signals',
              'trust-signal',
              'trust-icon'
            ],
            
            // Greedy patterns (keeps all matching classes)
            greedy: [
              // Button variants
              /^btn-/,              // btn-primary, btn-secondary, etc.
              /^button-/,
              
              // Icon classes
              /^icon-/,
              /^fa-/,               // Font Awesome (if used)
              
              // Background utilities
              /^bg-/,
              
              // Text utilities
              /^text-/,
              
              // Spacing utilities
              /^m[tblrxy]?-/,       // margin utilities
              /^p[tblrxy]?-/,       // padding utilities
              
              // Pseudo-classes (hover, focus, etc.)
              /^hover:/,
              /^focus:/,
              /^active:/,
              /^disabled:/,
              
              // Responsive utilities
              /^sm:/,
              /^md:/,
              /^lg:/,
              /^xl:/,
              
              // Animation classes
              /^animate-/,
              /^animation-/,
              
              // State classes
              /^is-/,
              /^has-/,
              
              // Component variants
              /^card-/,
              /^nav-/,
              /^navbar-/,
              /^hero-/,
              /^feature-/,
              /^testimonial-/,
              /^pricing-/,
              /^blog-/,
              /^footer-/,
              
              // Social proof and value prop patterns
              /^social-proof-/,
              /^value-prop-/,
              /^trust-/,
              /^urgency-/,
              /^logo-/,
              
              // Data attributes
              /data-theme/,
              /data-nav/,
              /data-modal/
            ],
            
            // Deep matching (includes children)
            deep: [
              /modal/,              // All modal-related classes
              /dropdown/,           // All dropdown variants
              /tooltip/,            // Tooltip styles
              /accordion/,          // Accordion components
              /tab/,                // Tab components
              /carousel/,           // Carousel/slider
              /menu/                // Menu variants
            ],
            
            // Keep specific selectors
            keyframes: true,        // Keep all @keyframes
            fontFace: true,         // Keep all @font-face
            variables: true         // Keep all CSS custom properties
          },
          
          // ===== OUTPUT OPTIONS =====
          // Don't fail build on errors (for safety)
          rejected: process.env.PURGECSS_DEBUG === 'true',
          rejectedCss: process.env.PURGECSS_DEBUG === 'true',
          
          // Extract rejected CSS to file for analysis
          ...(process.env.PURGECSS_DEBUG === 'true' && {
            output: './purge-report.css'
          })
        })]
      : []
    ),
    
    // STEP 3: Minify CSS (production only)
    ...(process.env.NODE_ENV === 'production'
      ? [cssnano({
          preset: ['default', {
            discardComments: {
              removeAll: true
            },
            normalizeWhitespace: true,
            colormin: true,
            minifyFontValues: true,
            minifyGradients: true
          }]
        })]
      : []
    )
  ]
};
