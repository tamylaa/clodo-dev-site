import { defineConfig } from 'vite';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    configResolved(config) {
      console.log('⚙️  Vite config resolved - Template processor ready');
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        console.log('🔧 Processing HTML templates...');
        
        try {
          // Load templates using absolute paths with validation
          const templatesMap = {
            'header.html': 'header',
            'footer.html': 'footer',
            'hero.html': 'hero',
            'nav-main.html': 'nav-main'
          };
          
          const templates = {};
          for (const [filename, name] of Object.entries(templatesMap)) {
            const templatePath = join(__dirname, 'templates', filename);
            if (!fs.existsSync(templatePath)) {
              console.warn(`⚠️  Template not found: ${templatePath}`);
              templates[name] = '';
            } else {
              templates[name] = fs.readFileSync(templatePath, 'utf-8');
              console.log(`  ✓ Loaded ${name}.html (${templates[name].length} bytes)`);
            }
          }
          
          console.log('✅ Templates loaded successfully');
          
          // Replace header placeholder
          if (html.includes('<!-- HEADER_PLACEHOLDER -->')) {
            html = html.replace('<!-- HEADER_PLACEHOLDER -->', templates.header);
            console.log('  ✓ Header template injected');
          }
          
          // Replace SSI includes for nav-main
          if (html.includes('<!--#include file="../templates/nav-main.html" -->')) {
            html = html.replace(/<!--#include file="\.\.\/templates\/nav-main\.html" -->/g, templates['nav-main']);
            console.log('  ✓ Nav-main template injected');
          }
          
          // Replace hero placeholder
          if (html.includes('<!-- HERO_PLACEHOLDER -->')) {
            html = html.replace('<!-- HERO_PLACEHOLDER -->', templates.hero);
            console.log('  ✓ Hero template injected');
          }
          
          // Replace footer placeholder
          if (html.includes('<!-- FOOTER_PLACEHOLDER -->')) {
            html = html.replace('<!-- FOOTER_PLACEHOLDER -->', templates.footer);
            console.log('  ✓ Footer template injected');
          }
          
          console.log('✨ HTML templates processing complete');
          return html;
        } catch (error) {
          console.error('❌ Error processing templates:', error.message);
          throw error;
        }
      }
    }
  };
}

// Middleware plugin to log server startup details
function serverLogPlugin() {
  let serverStarted = false;
  
  return {
    name: 'vite-plugin-server-logger',
    configResolved(config) {
      if (!serverStarted) {
        console.log('\n⚙️  Vite Config Resolved');
        console.log(`   Root: ${config.root}`);
        console.log(`   Base: ${config.base}\n`);
      }
    },
    configureServer(server) {
      if (!serverStarted) {
        serverStarted = true;
        console.log('📦 Vite Dev Server Initialized');
        console.log(`   Port: ${server.config.server.port}`);
        console.log(`   Strict Port: ${server.config.server.strictPort}`);
        console.log('✅ Server middleware configured\n');
      }
      
      return () => {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0]; // Remove query params
          if (url === '/' || url.endsWith('.html')) {
            console.log(`📄 Serving: ${url}`);
          }
          next();
        });
      };
    }
  };
}

export default defineConfig({
  // Root directory - serve from dist after build
  root: 'dist',
  
  // Base public path
  base: '/',
  
  // Disable default public dir - dist IS the public dir
  publicDir: false,
  
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
    outDir: '../dist-vite',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2015',
    cssTarget: 'chrome90',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'dist/index.html'),
        about: resolve(__dirname, 'dist/about.html'),
        docs: resolve(__dirname, 'dist/docs.html'),
        examples: resolve(__dirname, 'dist/examples.html'),
        pricing: resolve(__dirname, 'dist/pricing.html'),
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
    serverLogPlugin(),
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
      '@': resolve(__dirname, 'dist'),
      '@css': resolve(__dirname, 'dist/css'),
      '@js': resolve(__dirname, 'dist/js'),
      '@images': resolve(__dirname, 'dist/images'),
    },
  },
  
  // Define environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
