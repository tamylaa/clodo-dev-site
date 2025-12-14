import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rss from '@astrojs/rss';
import node from '@astrojs/node';

export default defineConfig({
  // Output format
  output: 'static', // Can be changed to 'hybrid' if you need server-side rendering later
  outDir: './dist-astro', // Separate output from current build
  
  // Base URL for deployment
  site: 'https://clodo.dev',
  
  // Integrations
  integrations: [
    sitemap(), // Automatically generates sitemap.xml
    rss(), // RSS feed support
  ],
  
  // Adapter for Cloudflare Pages
  adapter: node({
    mode: 'standalone',
  }),
  
  // Build options
  build: {
    format: 'directory', // Generate /pricing/index.html instead of /pricing.html
  },
  
  // Vite config
  vite: {
    build: {
      minify: 'terser',
      cssCodeSplit: true,
    },
  },
});
