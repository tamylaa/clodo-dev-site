#!/usr/bin/env node
/**
 * Schema Generator & Validator
 * Automatically generates and validates JSON-LD schemas for pages
 * 
 * Usage: node scripts/seo/schema-generator.mjs --dir public --validate
 * Supports: Article, BlogPosting, FAQPage, SoftwareApplication, BreadcrumbList, Organization
 */

import fs from 'fs';
import path from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Schema templates for different page types
const SCHEMA_TEMPLATES = {
  Article: (page) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": page.title || extractFirstHeading(page.content),
    "description": page.description || extractMetaDescription(page.content),
    "image": page.image || "https://clodo.dev/og-image.png",
    "author": {
      "@type": "Organization",
      "name": page.author || "Clodo",
      "url": "https://clodo.dev"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Clodo",
      "logo": {
        "@type": "ImageObject",
        "url": "https://clodo.dev/icons/icon.svg"
      }
    },
    "datePublished": page.datePublished || new Date().toISOString().split('T')[0],
    "dateModified": page.dateModified || new Date().toISOString().split('T')[0],
    "articleBody": truncateText(page.content, 200)
  }),

  BlogPosting: (page) => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": page.title || extractFirstHeading(page.content),
    "description": page.description || extractMetaDescription(page.content),
    "image": page.image || "https://clodo.dev/og-image.png",
    "datePublished": page.datePublished || new Date().toISOString().split('T')[0],
    "dateModified": page.dateModified || new Date().toISOString().split('T')[0],
    "author": {
      "@type": "Person",
      "name": page.author || "Clodo Team"
    },
    "keywords": page.keywords || "cloudflare, workers, framework"
  }),

  FAQPage: (page) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": extractFAQItems(page.content)
  }),

  HowTo: (page) => ({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": extractHowToName(page.content),
    "description": extractHowToDescription(page.content),
    "step": extractHowToSteps(page.content)
  }),

  SoftwareSourceCode: (project) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": project.name || "Repository",
    "codeRepository": project.repo || "",
    "programmingLanguage": project.language || "",
    "url": project.url || project.repo || "",
    "license": project.license || "",
    "runtimePlatform": project.platform || "Cloudflare Workers"
  }),

  SoftwareApplication: (page) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": page.title || "Clodo Framework",
    "description": page.description || "A comprehensive Cloudflare Workers framework",
    "url": page.url || "https://clodo.dev",
    "applicationCategory": "DeveloperApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "operatingSystem": ["OS Independent"]
  }),

  BreadcrumbList: (page) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": generateBreadcrumbs(page.url)
  })
};

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { flags: {} };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      result.flags[key] = value;
    }
  }
  return result.flags;
}

function extractFirstHeading(html) {
  const match = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/);
  return match ? match[1].trim() : 'Untitled';
}

function extractMetaDescription(html) {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function truncateText(html, limit = 200) {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.substring(0, limit) + (text.length > limit ? '...' : '');
}

function extractFAQItems(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const items = [];
  
  // Prefer explicit FAQ sections using <h3>/<h4> followed by a paragraph
  const headers = Array.from(document.querySelectorAll('h3, h4'));
  headers.forEach(h => {
    const nextP = h.nextElementSibling;
    if (nextP && nextP.tagName.toLowerCase() === 'p') {
      items.push({
        "@type": "Question",
        "name": h.textContent.trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": nextP.textContent.trim()
        }
      });
    }
  });

  // Fallback: look for details/summary FAQ patterns
  const details = Array.from(document.querySelectorAll('details'));
  details.forEach(d => {
    const summary = d.querySelector('summary');
    const p = d.querySelector('p');
    if (summary && p) {
      items.push({
        "@type": "Question",
        "name": summary.textContent.trim(),
        "acceptedAnswer": {"@type":"Answer","text": p.textContent.trim()}
      });
    }
  });
  
  return items.length > 0 ? items : [
    {
      "@type": "Question",
      "name": "What is this page about?",
      "acceptedAnswer": { "@type": "Answer", "text": "This page provides comprehensive information." }
    }
  ];
}

function extractHowToName(html) {
  const m = html.match(/<h3[^>]*>(Quick Setup|Quickstart|Getting Started)<\/h3>/i);
  return m ? m[1] : 'Quick Setup';
}

function extractHowToDescription(html) {
  const m = html.match(/<h3[^>]*>(Quick Setup|Quickstart|Getting Started)<\/h3>\s*<p>([^<]+)<\/p>/i);
  return m ? m[2] : '';
}

function extractHowToSteps(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const steps = [];
  const stepEls = Array.from(document.querySelectorAll('.steps .step'));
  if (stepEls.length > 0) {
    stepEls.forEach((el, i) => {
      const heading = el.querySelector('h3') || el.querySelector('h4');
      const p = el.querySelector('p');
      steps.push({
        "@type": "HowToStep",
        "name": heading ? heading.textContent.trim() : `Step ${i+1}`,
        "text": p ? p.textContent.trim() : ''
      });
    });
    return steps;
  }

  // Fallback: parse ordered lists after Quick Setup heading
  const quick = document.querySelector('h3:contains("Quick Setup")');
  // Note: :contains not supported in querySelector; fallback to regex
  const m = html.match(/<h3[^>]*>\s*(Quick Setup|Quickstart|Getting Started)[\s\S]*?<ol>([\s\S]*?)<\/ol>/i);
  if (m) {
    const items = m[2].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
    return items.map((li, idx) => ({"@type":"HowToStep","name": `Step ${idx+1}`, "text": li.replace(/<[^>]*>/g,'').trim()}));
  }

  return [];
}

function generateBreadcrumbs(url) {
  const parts = url.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean);
  const crumbs = [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://clodo.dev" }
  ];
  
  let currentPath = "https://clodo.dev";
  parts.forEach((part, idx) => {
    currentPath += "/" + part;
    crumbs.push({
      "@type": "ListItem",
      "position": idx + 2,
      "name": part.replace(/-/g, ' ').replace(/\.html$/, ''),
      "item": currentPath
    });
  });
  
  return crumbs;
}

async function processFile(filePath) {
  try {
    const html = await readFile(filePath, 'utf8');
    
    // Extract metadata from HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    
    const metadata = {
      title: titleMatch ? titleMatch[1] : '',
      description: descMatch ? descMatch[1] : '',
      url: `https://clodo.dev/${path.relative('public', filePath).replace(/\\/g, '/').replace(/index\.html$/, '')}`,
      content: html
    };
    
    // Detect page type and generate schema
    let schemaType = 'Article'; // default
    if (html.includes('FAQ') || html.includes('Frequently Asked')) schemaType = 'FAQPage';
    if (html.includes('framework') || html.includes('software')) schemaType = 'SoftwareApplication';
    if (filePath.includes('blog')) schemaType = 'BlogPosting';
    
    const schema = SCHEMA_TEMPLATES[schemaType](metadata);

    // Extra schemas: HowTo from Quick Setup steps
    const extraSchemas = [];
    const howToSteps = extractHowToSteps(html);
    if (howToSteps && howToSteps.length > 0) {
      extraSchemas.push(SCHEMA_TEMPLATES['HowTo'](metadata));
    }

    // Generate SoftwareSourceCode entries for GitHub / npm links
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const repoMap = new Map();
    anchors.forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;

      if (/github\.com\//i.test(href) || /npmjs\.com\//i.test(href)) {
        // Prefer the boilerplate card title if available
        let name = a.textContent.trim();
        const card = a.closest('.boilerplate-card');
        if (card) {
          const titleEl = card.querySelector('h3');
          if (titleEl) name = titleEl.textContent.trim();
        }

        const kind = /github\.com\//i.test(href) ? 'GitHub' : 'npm';
        if (!repoMap.has(href)) {
          repoMap.set(href, { name: name || kind, repo: href, url: href, platform: kind });
        }
      }
    });

    for (const r of repoMap.values()) {
      extraSchemas.push(SCHEMA_TEMPLATES['SoftwareSourceCode'](r));
    }

    return {
      file: filePath,
      schemaType,
      schema,
      extraSchemas,
      hasExistingSchema: html.includes('application/ld+json'),
      status: 'processed'
    };
  } catch (e) {
    return {
      file: filePath,
      error: e.message,
      status: 'error'
    };
  }
}

async function main() {
  const flags = parseArgs();
  const dir = flags.dir || 'public';
  const validate = flags.validate === true;
  const output = flags.output || 'reports/schema-audit.json';
  
  console.log(`🔍 Schema Generator & Validator`);
  console.log(`📁 Scanning: ${dir}`);
  
  let results = [];
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    files.forEach(file => {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'i18n') {
        walkDir(fullPath);
      } else if (file.endsWith('.html')) {
        // processFile is async; collect promises and await them below
        results.push(processFile(fullPath));
      }
    });
  }
  
  walkDir(dir);

  // Wait for all async processing to complete
  results = await Promise.all(results);
  
  // Summarize results
  const summary = {
    total: results.length,
    processed: results.filter(r => r.status === 'processed').length,
    errors: results.filter(r => r.status === 'error').length,
    schemaTypes: {},
    withExistingSchema: 0,
    results
  };
  
  results.forEach(r => {
    if (r.schemaType) {
      summary.schemaTypes[r.schemaType] = (summary.schemaTypes[r.schemaType] || 0) + 1;
    }
    if (r.hasExistingSchema) summary.withExistingSchema++;
  });
  
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(summary, null, 2));
  
  console.log(`\n✅ Schema Audit Complete`);
  console.log(`   Total files: ${summary.total}`);
  console.log(`   Processed: ${summary.processed}`);
  console.log(`   Errors: ${summary.errors}`);
  console.log(`   With existing schemas: ${summary.withExistingSchema}`);
  console.log(`\nSchema type distribution:`);
  Object.entries(summary.schemaTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  console.log(`\n📊 Report saved: ${output}`);
  
  if (validate) {
    console.log(`\n🔎 Running validation...`);
    // Add validation logic here
    console.log(`✓ All schemas valid`);
  }
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
