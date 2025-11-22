import { defineConfig } from 'vite';
import { resolve } from 'path';
import handlebars from 'vite-plugin-handlebars';
import fs from 'fs';

/**
 * Vite Configuration for Development
 * 
 * Purpose: Fast development server with Hot Module Replacement (HMR)
 * Production builds still use build.js for compatibility
 * 
 * Features:
 * - Instant server start
 * - Lightning-fast HMR
 * - Template processing (Handlebars)
 * - CSS preprocessing
 * - ES6 module support
 */

// Load templates for Handlebars
const templates = {
  header: fs.readFileSync('./templates/header.html', 'utf-8'),
  footer: fs.readFileSync('./templates/footer.html', 'utf-8'),
  hero: fs.readFileSync('./templates/hero.html', 'utf-8'),
  'nav-main': fs.readFileSync('./templates/nav-main.html', 'utf-8'),
  'resource-hints': fs.readFileSync('./templates/resource-hints.html', 'utf-8'),
};

export default defineConfig({
  // Root directory
  root: 'public',
  
  // Base public path
  base: '/',
  
  // Server configuration
  server: {
    port: 8000,
    strictPort: false,
    host: true,
    open: false,
    cors: true,
    hmr: {
      overlay: true,
    },
  },
  
  // Build configuration (for when using Vite build)
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2015',
    cssTarget: 'chrome90',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        about: resolve(__dirname, 'public/about.html'),
        docs: resolve(__dirname, 'public/docs.html'),
        examples: resolve(__dirname, 'public/examples.html'),
        pricing: resolve(__dirname, 'public/pricing.html'),
        // Add other HTML files as needed
      },
    },
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },
  
  // Plugins
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'templates'),
      context: {
        // Global context available to all templates
        siteTitle: 'Clodo Framework',
        currentYear: new Date().getFullYear(),
      },
      helpers: {
        // Custom Handlebars helpers
        eq: (a, b) => a === b,
        ne: (a, b) => a !== b,
        lt: (a, b) => a < b,
        gt: (a, b) => a > b,
        and: (a, b) => a && b,
        or: (a, b) => a || b,
      },
      compileOptions: {
        noEscape: true,
      },
      reloadOnPartialChange: true,
    }),
  ],
  
  // Dependency optimization
  optimizeDeps: {
    include: [],
    exclude: [],
  },
  
  // Preview server (for production build preview)
  preview: {
    port: 8001,
    strictPort: false,
    host: true,
    open: false,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'public'),
      '@css': resolve(__dirname, 'public/css'),
      '@js': resolve(__dirname, 'public/js'),
      '@images': resolve(__dirname, 'public/images'),
    },
  },
  
  // Define environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
