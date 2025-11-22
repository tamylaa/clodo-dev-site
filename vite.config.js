import { defineConfig } from 'vite';
import { resolve } from 'path';
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
 * - Template processing (SSI includes and placeholders)
 * - CSS preprocessing
 * - ES6 module support
 */

// Custom plugin to process template includes
function templatePlugin() {
  return {
    name: 'vite-plugin-template-processor',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        // Load templates
        const headerTemplate = fs.readFileSync('./templates/header.html', 'utf-8');
        const footerTemplate = fs.readFileSync('./templates/footer.html', 'utf-8');
        const heroTemplate = fs.readFileSync('./templates/hero.html', 'utf-8');
        const navMainTemplate = fs.readFileSync('./templates/nav-main.html', 'utf-8');
        
        // Replace header placeholder
        html = html.replace('<!-- HEADER_PLACEHOLDER -->', headerTemplate);
        
        // Replace SSI includes for nav-main
        html = html.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, navMainTemplate);
        
        // Replace hero placeholder
        html = html.replace('<!-- HERO_PLACEHOLDER -->', heroTemplate);
        
        // Replace footer placeholder
        html = html.replace('<!-- FOOTER_PLACEHOLDER -->', footerTemplate);
        
        return html;
      }
    }
  };
}

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
    templatePlugin(),
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
