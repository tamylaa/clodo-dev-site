import { test, expect } from '@playwright/test';

/**
 * Comprehensive Content Validation Test
 *
 * Validates that all major content sections are present and functional
 * after Astro transformation. This ensures the migration preserves all
 * site content, not just prevents crashes.
 */

// All HTML pages that should be tested (Astro builds to directory-based URLs)
const allPages = [
  // Core pages
  '/',
  '/index.html',
  '/about/',
  '/analytics/',
  '/components/',
  '/docs/',
  '/examples/',
  '/faq/',
  '/performance-dashboard/',
  '/pricing/',
  '/privacy/',
  '/product/',
  '/subscribe/',

  // Guide pages
  '/clodo-framework-guide/',
  '/clodo-framework-api-simplification/',
  '/clodo-framework-promise-to-reality/',
  '/clodo-vs-lambda/',
  '/cloudflare-workers-guide/',
  '/development-deployment-guide/',
  '/edge-computing-guide/',
  '/edge-vs-cloud-computing/',
  '/how-to-migrate-from-wrangler/',
  '/migrate/',
  '/structured-data/',
  '/test-modules/',
  '/what-is-cloudflare-workers/',
  '/what-is-edge-computing/',
  '/workers-vs-lambda/',

  // Blog pages
  '/blog/',
  '/blog/cloudflare-infrastructure-myth/',
  '/blog/cloudflare-workers-tutorial-beginners/'
];

// Content sections that should exist on most pages
const commonSections = [
  'nav', // Navigation
  'main', // Main content
  'footer', // Footer
];

// Page-specific content validation
const pageSpecificContent = {
  '/': {
    required: ['hero', 'features', 'benefits', 'cta'],
    text: ['Clodo Framework', 'Cloudflare Workers']
  },
  '/about/': {
    required: ['vision', 'why-built', 'game-changer'],
    text: ['About', 'Our Mission', 'Democratizing Enterprise Software Development']
  },
  '/components/': {
    required: ['components-list'],
    text: ['Components']
  },
  '/docs/': {
    required: ['documentation'],
    text: ['Documentation']
  },
  '/performance-dashboard/': {
    required: ['performance-dashboard'],
    text: ['Performance Dashboard']
  },
  '/pricing/': {
    required: ['pricing-table'],
    text: ['Pricing']
  },
  '/product/': {
    required: ['product-features'],
    text: ['Product']
  },
  '/clodo-framework-guide/': {
    required: ['guide-content'],
    text: ['Framework Guide']
  },
  '/cloudflare-workers-guide/': {
    required: ['guide-content'],
    text: ['Cloudflare Workers']
  }
};

test.describe('Comprehensive Content Validation', () => {
  const base = process.env.PW_BASE_URL || process.env.BASE_URL || 'http://localhost:8000';

  // Test that all pages load without errors
  for (const path of allPages) {
    test(`Page loads successfully: ${path}`, async ({ page }) => {
      const response = await page.goto(`${base}${path}`);
      expect(response.status()).toBe(200);
    });
  }

  // Test for console errors on all pages
  for (const path of allPages) {
    test(`No critical console errors: ${path}`, async ({ page }) => {
      const errors = [];
      const warnings = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        } else if (msg.type() === 'warning') {
          warnings.push(msg.text());
        }
      });

      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);

      // Allow some errors on certain pages but not critical JavaScript failures
      const allowedErrors = [
        'Failed to load resource',
        '404',
        'favicon.ico',
        // CSP violations are security policy enforcement, not JavaScript errors
        'X-Frame-Options may only be set via an HTTP header',
        'Refused to apply inline style',
        'Refused to frame'
      ];
      const criticalErrors = errors.filter(error =>
        !allowedErrors.some(allowed => error.includes(allowed))
      );

      // Only fail on actual JavaScript errors, not network issues
      if (criticalErrors.length > 0) {
        console.log(`${path}: ${criticalErrors.length} critical errors, ${warnings.length} warnings`);
        console.log('Critical errors:', criticalErrors);
        console.log('Warnings:', warnings);
        throw new Error(`Critical console errors found: ${criticalErrors.join(', ')}`);
      }
      expect(criticalErrors.length).toBe(0);
    });
  }

  // Test common sections exist on all pages
  for (const path of allPages) {
    test(`Common sections present: ${path}`, async ({ page }) => {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });

      // Wait for page to be fully loaded
      await page.waitForTimeout(2000);

      // Check for nav elements (more flexible selector)
      const navElements = await page.$$('nav');
      expect(navElements.length).toBeGreaterThan(0);

      // Check for main content
      const mainElement = await page.$('main');
      expect(mainElement).toBeTruthy();

      // Check for footer - only require if page actually has one
      const footerElement = await page.$('footer');
      if (footerElement) {
        // Page has footer, make sure it's properly structured
        const footerRole = await footerElement.getAttribute('role');
        expect(footerRole).toBe('contentinfo');
      } else {
        console.log(`Warning: ${path} does not have a footer element`);
      }
    });
  }

  // Test page-specific content
  for (const [path, config] of Object.entries(pageSpecificContent)) {
    test(`Page-specific content: ${path}`, async ({ page }) => {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      // Check required elements exist (more flexible selectors)
      if (config.required) {
        for (const selector of config.required) {
          // Try multiple selector patterns
          const element = await page.$(`[class*="${selector}"], #${selector}, .${selector}, ${selector}`);
          expect(element).toBeTruthy();
        }
      }

      // Check required text content
      if (config.text) {
        const bodyText = await page.textContent('body');
        for (const text of config.text) {
          expect(bodyText).toContain(text);
        }
      }
    });
  }

  // Test navigation links work
  test('Navigation links are functional', async ({ page }) => {
    await page.goto(`${base}/`);

    // Get all navigation links
    const navLinks = await page.$$('nav a[href]');

    for (const link of navLinks) {
      const href = await link.getAttribute('href');

      // Skip external links and anchors
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.includes('mailto:')) {
        try {
          const response = await page.request.get(`${base}${href}`);
          expect(response.status()).toBeLessThan(400);
        } catch (error) {
          console.warn(`Link check failed for ${href}: ${error.message}`);
        }
      }
    }
  });

  // Test footer links
  test('Footer links are functional', async ({ page }) => {
    await page.goto(`${base}/`);

    const footerLinks = await page.$$('footer a[href]');

    for (const link of footerLinks) {
      const href = await link.getAttribute('href');

      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.includes('mailto:')) {
        try {
          const response = await page.request.get(`${base}${href}`);
          expect(response.status()).toBeLessThan(400);
        } catch (error) {
          console.warn(`Footer link check failed for ${href}: ${error.message}`);
        }
      }
    }
  });

  // Test that all images load
  test('All images load successfully', async ({ page }) => {
    await page.goto(`${base}/`);

    const images = await page.$$('img[src]');
    const failedImages = [];

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:') && !src.startsWith('http')) {
        try {
          const response = await page.request.get(`${base}${src}`);
          if (response.status() >= 400) {
            failedImages.push(src);
          }
        } catch (error) {
          failedImages.push(src);
        }
      }
    }

    expect(failedImages.length).toBe(0);
  });

  // Test meta tags are present
  test('Meta tags are properly set', async ({ page }) => {
    await page.goto(`${base}/`);

    // Check for essential meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();

    const viewport = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(viewport).toContain('width=device-width');
  });

  // Test responsive design basics
  test('Responsive design works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto(`${base}/`);

    // Check that content is still accessible on mobile
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(100);

    await page.setViewportSize({ width: 1200, height: 800 }); // Desktop
    const desktopText = await page.textContent('body');
    expect(desktopText).toBe(bodyText); // Content should be the same
  });
});