import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  // Output format - static site generation
  output: 'static',
  outDir: './dist-astro', // Separate output from current build
  
  // Base URL for deployment
  site: 'https://clodo.dev',
  
  // Integrations
  integrations: [
    sitemap(), // Automatically generates sitemap.xml
    // RSS can be added later in routes once blog collection is ready
  ],
  
  // Adapter for Cloudflare Pages
  adapter: node({
    mode: 'standalone',
  }),
  
  // Build options
  build: {
    format: 'directory', // Generate /pricing/index.html instead of /pricing.html
  },
  
  // Content collection configuration
  content: {
    collections: {},
  },
  
  // Vite config
  vite: {
    build: {
      minify: 'terser',
      cssCodeSplit: true,
      reportCompressedSize: false,
    },
    // Disable CSS linting to allow duplicate selectors
    css: {
      postcss: null,
    },
  },
});
