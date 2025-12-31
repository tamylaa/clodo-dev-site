import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

// Function to extract and adapt CSS for AMP
function extractAMPStyles(canonicalPath) {
  const canonicalContent = fs.readFileSync(canonicalPath, 'utf8');
  const dom = new JSDOM(canonicalContent);
  const document = dom.window.document;

  let combinedCSS = '';

  // Function to recursively process CSS files
  function processCSSFile(cssPath) {
    if (!fs.existsSync(cssPath)) return;

    const content = fs.readFileSync(cssPath, 'utf8');

    // Handle @import statements
    const importRegex = /@import\s+url\(['"]?([^'")]+)['"]?\);?/gi;
    let processedContent = content.replace(importRegex, (match, importPath) => {
      try {
        const resolvedImportPath = path.resolve(path.dirname(cssPath), importPath);
        return processCSSFile(resolvedImportPath);
      } catch (error) {
        console.warn(`Could not process import: ${importPath}`);
        return '';
      }
    });

    return processedContent;
  }

  // Find all stylesheet links
  const styleLinks = document.querySelectorAll('link[rel="stylesheet"]');
  styleLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      try {
        // Resolve relative paths
        const cssPath = path.resolve(path.dirname(canonicalPath), href);
        const cssContent = processCSSFile(cssPath);
        if (cssContent) {
          combinedCSS += cssContent + '\n';
        }
      } catch (error) {
        console.warn(`Could not load CSS: ${href}`);
      }
    }
  });

  // Clean CSS for AMP compliance and size limits
  combinedCSS = combinedCSS
    // Remove @import statements (already processed)
    .replace(/@import[^;]+;/gi, '')
    // Remove !important (not allowed in AMP)
    .replace(/\s*!important/gi, '')
    // Remove @media queries (can be complex, we'll add basic responsive later)
    .replace(/@media[^{]*\{[^}]*\}/gi, '')
    // Remove @keyframes
    .replace(/@keyframes[^{]*\{[^}]*\}/gi, '')
    // Remove @font-face (AMP has restrictions)
    .replace(/@font-face[^{]*\{[^}]*\}/gi, '')
    // Remove complex selectors and unsupported properties
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Skip @ rules
      if (trimmed.startsWith('@')) return false;
      // Skip complex selectors (containing pseudo-elements, attribute selectors, etc.)
      if (trimmed.includes('::') || trimmed.includes('[') || trimmed.includes('>') || trimmed.includes('+') || trimmed.includes('~')) return false;
      // Skip animation, transition, transform properties
      if (trimmed.includes('animation:') || trimmed.includes('transition:') || trimmed.includes('transform:')) return false;
      // Only keep essential selectors for blog content
      const essentialSelectors = ['body', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em'];
      const hasEssentialSelector = essentialSelectors.some(sel => trimmed.includes(sel + ',') || trimmed.includes(sel + ' ') || trimmed.includes(sel + '{') || trimmed.startsWith(sel));
      return hasEssentialSelector || trimmed.includes('{') || trimmed.includes('}') || trimmed.includes(':') || trimmed.includes(';');
    })
    .join('\n')
    // Remove duplicate rules and clean up
    .split('}')
    .filter(block => block.trim().length > 10) // Keep meaningful blocks
    .join('}')
    .replace(/\n\s*\n/g, '\n'); // Remove extra newlines

  // Extract key styles for blog content
  const essentialStyles = `
    /* Essential blog content styles */
    body {
      font-family: var(--font-family-base, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      line-height: var(--line-height-base, 1.6);
      color: var(--text-color, #333);
      background: var(--bg-color, #fff);
      margin: 0;
      padding: 20px;
    }

    h1, h2, h3, h4, h5, h6 {
      color: var(--heading-color, #1a1a1a);
      font-weight: var(--font-weight-bold, 600);
      line-height: var(--heading-line-height, 1.2);
      margin-top: var(--spacing-xl, 2rem);
      margin-bottom: var(--spacing-md, 1rem);
    }

    p {
      margin-bottom: var(--spacing-md, 1rem);
      color: var(--text-color, #333);
    }

    a {
      color: var(--link-color, #0066cc);
      text-decoration: var(--link-decoration, none);
    }

    a:hover {
      color: var(--link-hover-color, #004499);
    }

    code {
      font-family: var(--font-family-mono, 'SF Mono', Monaco, 'Cascadia Code', monospace);
      background: var(--code-bg, #f5f5f5);
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 0.9em;
    }

    pre {
      background: var(--code-bg, #f5f5f5);
      padding: var(--spacing-md, 1rem);
      border-radius: 6px;
      overflow-x: auto;
      font-family: var(--font-family-mono, 'SF Mono', Monaco, 'Cascadia Code', monospace);
    }

    blockquote {
      border-left: 4px solid var(--primary-color, #0066cc);
      padding-left: var(--spacing-md, 1rem);
      margin: var(--spacing-lg, 1.5rem) 0;
      font-style: italic;
      color: var(--text-muted, #666);
    }

    /* AMP-specific overrides */
    .touch-target { min-height: 44px; min-width: 44px; }
    .amp-social-share { margin: 10px; }

    /* Mobile-first responsive adjustments */
    @media (max-width: 768px) {
      body { padding: 15px; }
      h1 { font-size: 1.8em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.3em; }
    }
  `;

  return essentialStyles;
}

// Function to convert canonical HTML to AMP
function convertToAMP(canonicalPath, ampPath, locale = 'en') {
  const canonicalContent = fs.readFileSync(canonicalPath, 'utf8');
  const dom = new JSDOM(canonicalContent);
  const document = dom.window.document;

  // Extract key elements
  const title = document.querySelector('title')?.textContent || 'Clodo Blog';
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  const canonicalUrl = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
    (locale === 'en'
      ? canonicalPath.replace(/\\/g, '/').replace('public/blog/', '/blog/').replace('.html', '')
      : canonicalPath.replace(/\\/g, '/').replace(`public/i18n/${locale}/blog/`, `/i18n/${locale}/blog/`).replace('.html', '')
    );
  const ampUrl = ampPath.replace(/\\/g, '/').replace('public/', '/');

  // Extract main content (assuming it's in <main> or <article>)
  const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
  let contentHTML = mainContent ? mainContent.innerHTML : '';

  // Clean up content for AMP (remove non-AMP elements)
  contentHTML = contentHTML
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove inline styles
    .replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, '') // Remove external CSS
    .replace(/<img([^>]*?)>/gi, '<amp-img$1 layout="responsive"></amp-img>') // Convert img to amp-img
    .replace(/<iframe([^>]*?)>/gi, '<amp-iframe$1 layout="responsive"></amp-iframe>') // Convert iframe to amp-iframe
    .replace(/class="([^"]*?)"/gi, (match, classes) => {
      // Keep only AMP-safe classes
      const safeClasses = classes.split(' ').filter(cls => !cls.includes('js-') && !cls.includes('no-amp'));
      return safeClasses.length ? `class="${safeClasses.join(' ')}"` : '';
    })
    // Adjust relative links for AMP location - point to canonical pages, not AMP versions
    .replace(/href="\.\.\/([^"]*)"/gi, (match, path) => {
      // For AMP pages, internal links should point to canonical pages
      return `href="/${path}"`;
    })
    .replace(/href='\.\.\/([^']*)'/gi, (match, path) => {
      return `href='/${path}'`;
    });

  // Extract and adapt CSS for AMP
  const ampCSS = extractAMPStyles(canonicalPath);

  // AMP boilerplate with locale support
  const ampHTML = `<!doctype html>
<html ⚡ lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${description}">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-social-share" src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"></script>
  <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
  <script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>
  <style amp-custom>
    ${ampCSS}
  </style>
</head>
<body>
  <header>
    <h1><a href="${locale === 'en' ? '/' : '/'}">Clodo</a></h1>
    <nav>
      <a href="${locale === 'en' ? '/blog' : `/i18n/${locale}/blog`}" class="touch-target">Blog</a>
      <a href="${locale === 'en' ? '/docs' : `/i18n/${locale}/docs.html`}" class="touch-target">Docs</a>
      <a href="/community" class="touch-target">Community</a>
    </nav>
  </header>

  <main>
    ${contentHTML}
  </main>

  <footer>
    <amp-social-share type="twitter" width="60" height="44" data-param-text="${title}" data-param-url="${ampUrl}"></amp-social-share>
    <amp-social-share type="linkedin" width="60" height="44" data-param-url="${ampUrl}"></amp-social-share>
    <amp-social-share type="facebook" width="60" height="44" data-param-url="${ampUrl}"></amp-social-share>
    <p>&copy; 2025 Clodo. All rights reserved.</p>
  </footer>

  <amp-analytics type="googleanalytics">
    <script type="application/json">
    {
      "vars": {
        "account": "UA-XXXXX-Y"
      },
      "triggers": {
        "trackPageview": {
          "on": "visible",
          "request": "pageview"
        }
      }
    }
    </script>
  </amp-analytics>
</body>
</html>`;

  fs.writeFileSync(ampPath, ampHTML);
  console.log(`Generated AMP: ${ampPath}`);
}

// Function to process a specific blog directory
function processBlogDirectory(blogDir, locale, ampBaseDir) {
  console.log(`🔍 Processing blog directory: ${blogDir} (locale: ${locale})`);

  if (!fs.existsSync(blogDir)) {
    console.log(`❌ Directory does not exist: ${blogDir}`);
    return;
  }

  // Create locale-specific AMP directory
  const localeAmpDir = path.join(ampBaseDir, locale, 'blog');
  if (!fs.existsSync(localeAmpDir)) {
    fs.mkdirSync(localeAmpDir, { recursive: true });
    console.log(`📁 Created AMP directory: ${localeAmpDir}`);
  }

  const files = fs.readdirSync(blogDir).filter(file =>
    file.endsWith('.html') && !file.endsWith('.amp.html')
  );

  if (files.length === 0) {
    console.log(`📭 No HTML files found in ${blogDir}`);
    return;
  }

  console.log(`📄 Found ${files.length} canonical files in ${locale}:`, files);

  files.forEach(file => {
    const canonicalPath = path.join(blogDir, file);
    const ampPath = path.join(localeAmpDir, file.replace('.html', '.amp.html'));
    console.log(`🔄 Processing ${canonicalPath} -> ${ampPath}`);
    convertToAMP(canonicalPath, ampPath, locale);
  });
}

// Function to process all blog directories (English + localized)
function generateAllAMP() {
  const baseBlogDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'blog');
  const ampBaseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'amp');
  const i18nDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'i18n');

  console.log('🎯 Starting AMP generation process...');

  // Ensure AMP base directory exists
  if (!fs.existsSync(ampBaseDir)) {
    fs.mkdirSync(ampBaseDir, { recursive: true });
    console.log('📁 Created AMP base directory:', ampBaseDir);
  }

  console.log('📝 Processing English blog...');
  if (fs.existsSync(baseBlogDir)) {
    processBlogDirectory(baseBlogDir, 'en', ampBaseDir);
  }

  console.log('🌍 Checking for localized blogs...');
  if (fs.existsSync(i18nDir)) {
    const locales = fs.readdirSync(i18nDir).filter(item => {
      const itemPath = path.join(i18nDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

    locales.forEach(locale => {
      const localeBlogDir = path.join(i18nDir, locale, 'blog');
      if (fs.existsSync(localeBlogDir)) {
        console.log(`📝 Processing ${locale} blog...`);
        processBlogDirectory(localeBlogDir, locale, ampBaseDir);
      } else {
        console.log(`⏭️  No blog directory found for ${locale}, skipping...`);
      }
    });
  }

  console.log('✅ All AMP files processed successfully!');
  console.log('📍 AMP files located in:', ampBaseDir);
}

// Run if called directly
generateAllAMP();

export { convertToAMP, generateAllAMP, processBlogDirectory };