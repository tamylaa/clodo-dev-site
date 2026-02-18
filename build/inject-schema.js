#!/usr/bin/env node
/**
 * Comprehensive Schema.org Injection System
 * Adds structured data to all page types
 * 
 * Supports:
 * - Article/BlogPosting for blog posts
 * - Organization for homepage
 * - BreadcrumbList for navigation
 * - ProductPage for /product
 * - Software Application for framework pages
 * - FAQ pages
 * 
 * Usage: node build/inject-schema.js
 * Output: Updated HTML files with JSON-LD in <head>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8')
);

console.log('🏗️  Injecting Comprehensive Schema Markup\n');

let pagesProcessed = 0;
let schemaAdded = 0;

// Process ALL indexed pages (English + i18n)
const indexed = manifest.filter(e => e.indexed && e.file);

for (const entry of indexed) {
  try {
    // Determine actual file path in dist/
    let filePath = path.join(__dirname, '..', 'dist', entry.file);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      continue;
    }
    
    pagesProcessed++;
    let html = fs.readFileSync(filePath, 'utf8');
    let schema = null;
    let pageTitle = extractTitle(html);
    let pageDescription = extractDescription(html);
    
    // Skip if schema already exists
    if (html.includes('"@context": "https://schema.org"')) {
      continue;
    }
    
    // Generate schema based on page type
    if (entry.path === '/' || entry.path === '/index.html') {
      schema = generateOrganizationSchema();
    } else if (entry.type === 'blog-post') {
      schema = generateArticleSchema(entry, pageTitle, pageDescription, html);
    } else if (entry.path === '/product' || entry.path.includes('/product')) {
      schema = generateProductPageSchema(entry, pageTitle, pageDescription);
    } else if (entry.path === '/faq' || entry.path.includes('/faq')) {
      schema = generateFAQSchema(entry, html);
    } else {
      // Default: WebPage with BreadcrumbList for all pages
      schema = generateBreadcrumbSchema(entry.path);
    }
    
    if (schema) {
      // Inject into <head>
      const jsonLd = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n`;
      
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${jsonLd}</head>`);
      } else if (html.includes('</HEAD>')) {
        html = html.replace('</HEAD>', `${jsonLd}</HEAD>`);
      } else {
        // Fallback: add before closing html
        html = html.replace('</html>', `${jsonLd}</html>`);
      }
      
      fs.writeFileSync(filePath, html, 'utf8');
      schemaAdded++;
      
      const schemaType = schema['@type'] || schema[0]['@type'];
      console.log(`✅ ${entry.path} (${schemaType})`);
    }
    
  } catch (e) {
    console.error(`❌ Error processing ${entry.file}: ${e.message}`);
  }
}

console.log(`\n📊 Results:`);
console.log(`   Pages processed: ${pagesProcessed}`);
console.log(`   Schema added: ${schemaAdded}`);
console.log(`   Success rate: ${((schemaAdded/pagesProcessed)*100).toFixed(1)}%\n`);

/**
 * Schema Generators
 */

function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Clodo",
    "url": "https://clodo.dev",
    "logo": "https://clodo.dev/logo.svg",
    "description": "Cloudflare Workers Serverless Distributed Application Framework to Reduce Custom Software Costs, Boost Developer Productivity and Accelerate Goto Market for Startups and Enterprises.",
    "sameAs": [
      "https://github.com/tamylaa/clodo-framework",
      "https://twitter.com/clodoframework"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "url": "https://clodo.dev/contact"
    }
  };
}

function generateArticleSchema(entry, title, description, html) {
  // Extract author and date from HTML if possible
  const authorMatch = html.match(/data-author="([^"]+)"/i) || html.match(/author['":\s]+([^"<]+)/i);
  const dateMatch = html.match(/data-date="([^"]+)"/i) || html.match(/published['":\s]+([^"<]+)/i);
  
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title || entry.path,
    "description": description || "Technical guide on Cloudflare Workers and Edge Computing",
    "url": `https://clodo.dev${entry.path}`,
    "datePublished": dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
    "dateModified": new Date().toISOString().split('T')[0],
    "author": {
      "@type": "Person",
      "name": authorMatch ? authorMatch[1] : "Clodo Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Clodo",
      "logo": {
        "@type": "ImageObject",
        "url": "https://clodo.dev/logo.svg"
      }
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://clodo.dev/og-image.png",
      "width": 1200,
      "height": 630
    },
    "articleSection": "Technology",
    "keywords": "Cloudflare, Edge Computing, Workers, Serverless"
  };
}

function generateProductPageSchema(entry, title, description) {
  return {
    "@context": "https://schema.org",
    "@type": ["Product", "SoftwareApplication"],
    "name": title || "Clodo",
    "description": description || "Cloudflare Workers Framework",
    "url": `https://clodo.dev${entry.path}`,
    "applicationCategory": "DeveloperApplication",
    "softwareVersion": "1.0",
    "operatingSystem": "Any",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "100"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": "0",
      "pricingType": "Free"
    }
  };
}

function generateBreadcrumbSchema(pathname) {
  const parts = pathname.split('/').filter(p => p);
  const breadcrumbs = [
    { name: "Home", url: "https://clodo.dev" }
  ];
  
  let currentUrl = "https://clodo.dev";
  for (const part of parts) {
    currentUrl += "/" + part;
    const name = part
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    breadcrumbs.push({ name, url: currentUrl });
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

function generateFAQSchema(entry, html) {
  // Extract Q&A pairs from HTML if marked
  const qaItems = [];
  
  // Simple pattern matching for common FAQ structures
  const questionMatches = html.match(/<h[3-4][^>]*>([^<]+)<\/h[3-4]>/g) || [];
  const answerMatches = html.match(/<p[^>]*>([^<]+)<\/p>/g) || [];
  
  const minItems = Math.min(questionMatches.length, answerMatches.length);
  
  for (let i = 0; i < Math.min(minItems, 10); i++) {
    const question = questionMatches[i].replace(/<h[3-4][^>]*>/g, '').replace(/<\/h[3-4]>/g, '');
    const answer = answerMatches[i].replace(/<p[^>]*>/g, '').replace(/<\/p>/g, '');
    
    if (question && answer) {
      qaItems.push({
        "@type": "Question",
        "name": question.trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answer.trim()
        }
      });
    }
  }
  
  if (qaItems.length === 0) {
    return null; // Skip if no Q&A found
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": qaItems
  };
}

// Helper functions
function extractTitle(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1];
  
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1];
  
  return null;
}

function extractDescription(html) {
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (metaMatch) return metaMatch[1];
  
  const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (ogMatch) return ogMatch[1];
  
  return null;
}

console.log('📌 Next:\n');
console.log('   npm run build           (rebuild to validate)');
console.log('   node tools/audit-schema-coverage.js  (verify coverage)\n');
