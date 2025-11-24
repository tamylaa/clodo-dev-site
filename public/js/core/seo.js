/**
 * SEO Enhancement System
 *
 * Provides dynamic SEO optimization including:
 * - Structured data (JSON-LD)
 * - Meta tags management
 * - Open Graph optimization
 * - Twitter Cards
 * - Canonical URLs
 * - Breadcrumbs
 * - FAQ schema
 * - Article schema
 *
 * @module core/seo
 */

(function() {
    'use strict';

/**
 * SEO Manager state
 */
const state = {
    initialized: false,
    baseUrl: '',
    defaultImage: '/assets/images/og-default.jpg',
    defaultAuthor: 'Clodo Framework Team',
    twitterHandle: '@clodoframework',
};

/**
 * Initialize SEO system
 *
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - Site base URL (e.g., 'https://clodo.dev')
 * @param {string} options.defaultImage - Default OG image path
 * @param {string} options.defaultAuthor - Default author name
 * @param {string} options.twitterHandle - Twitter handle
 */
function init(options = {}) {
    if (state.initialized) {
        console.warn('[SEO] Already initialized');
        return;
    }

    state.baseUrl = options.baseUrl || window.location.origin;
    state.defaultImage = options.defaultImage || state.defaultImage;
    state.defaultAuthor = options.defaultAuthor || state.defaultAuthor;
    state.twitterHandle = options.twitterHandle || state.twitterHandle;

    state.initialized = true;

    console.log('[SEO] Initialized with base URL:', state.baseUrl);
}

/**
 * Set page metadata
 *
 * @param {Object} meta - Page metadata
 * @param {string} meta.title - Page title
 * @param {string} meta.description - Page description
 * @param {string} meta.image - OG image URL
 * @param {string} meta.url - Canonical URL
 * @param {string} meta.type - Page type (website, article, product)
 * @param {string} meta.author - Author name
 * @param {Date} meta.publishedTime - Publication date (for articles)
 * @param {Date} meta.modifiedTime - Last modified date (for articles)
 * @param {string[]} meta.keywords - Page keywords
 */
function setPageMeta(meta = {}) {
    const {
        title = document.title,
        description = '',
        image = state.defaultImage,
        url = window.location.href,
        type = 'website',
        author = state.defaultAuthor,
        publishedTime = null,
        modifiedTime = null,
        keywords = [],
    } = meta;

    // Update document title
    if (title) {
        document.title = title;
    }

    // Set meta description
    setMetaTag('name', 'description', description);

    // Set keywords
    if (keywords.length > 0) {
        setMetaTag('name', 'keywords', keywords.join(', '));
    }

    // Set author
    setMetaTag('name', 'author', author);

    // Set canonical URL
    setLinkTag('canonical', url);

    // Open Graph
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', makeAbsoluteUrl(image));
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Clodo Framework');

    // Article-specific OG tags
    if (type === 'article') {
        if (publishedTime) {
            setMetaTag('property', 'article:published_time', publishedTime.toISOString());
        }
        if (modifiedTime) {
            setMetaTag('property', 'article:modified_time', modifiedTime.toISOString());
        }
        setMetaTag('property', 'article:author', author);
    }

    // Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:site', state.twitterHandle);
    setMetaTag('name', 'twitter:creator', state.twitterHandle);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', makeAbsoluteUrl(image));

    console.log('[SEO] Page meta updated:', { title, description, url, type });
}

/**
 * Set or update a meta tag
 *
 * @param {string} attribute - Attribute name (name or property)
 * @param {string} key - Attribute value
 * @param {string} content - Meta content
 */
function setMetaTag(attribute, key, content) {
    if (!content) return;

    let tag = document.querySelector(`meta[${attribute}="${key}"]`);

    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
}

/**
 * Set or update a link tag
 *
 * @param {string} rel - Link relationship
 * @param {string} href - Link URL
 */
function setLinkTag(rel, href) {
    if (!href) return;

    let tag = document.querySelector(`link[rel="${rel}"]`);

    if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
    }

    tag.setAttribute('href', href);
}

/**
 * Add structured data (JSON-LD)
 *
 * @param {Object} data - JSON-LD structured data
 * @param {string} id - Optional ID for the script tag
 */
function addStructuredData(data, id = null) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data, null, 2);

    if (id) {
        script.id = id;

        // Remove existing script with same ID
        const existing = document.getElementById(id);
        if (existing) {
            existing.remove();
        }
    }

    document.head.appendChild(script);

    console.log('[SEO] Added structured data:', data['@type']);
}

/**
 * Add Organization schema
 *
 * @param {Object} options - Organization details
 */
function addOrganizationSchema(options = {}) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: options.name || 'Clodo Framework',
        url: state.baseUrl,
        logo: makeAbsoluteUrl(options.logo || '/assets/images/logo.svg'),
        description: options.description || 'Modern JavaScript framework for building scalable web applications',
        sameAs: options.socialLinks || [
            'https://github.com/clodoframework',
            'https://twitter.com/clodoframework',
            'https://linkedin.com/company/clodoframework',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Support',
            email: options.email || 'support@clodo.dev',
        },
    };

    addStructuredData(schema, 'schema-organization');
}

/**
 * Add WebSite schema with search action
 *
 * @param {Object} options - Website details
 */
function addWebSiteSchema(options = {}) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: options.name || 'Clodo Framework',
        url: state.baseUrl,
        description: options.description || 'Modern JavaScript framework for building scalable web applications',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${state.baseUrl}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    };

    addStructuredData(schema, 'schema-website');
}

/**
 * Add Breadcrumb schema
 *
 * @param {Array} items - Breadcrumb items [{name, url}, ...]
 */
function addBreadcrumbSchema(items) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: makeAbsoluteUrl(item.url),
        })),
    };

    addStructuredData(schema, 'schema-breadcrumb');
}

/**
 * Add Article schema
 *
 * @param {Object} options - Article details
 */
function addArticleSchema(options = {}) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: options.title || document.title,
        description: options.description || '',
        image: makeAbsoluteUrl(options.image || state.defaultImage),
        datePublished: options.publishedTime ? options.publishedTime.toISOString() : null,
        dateModified: options.modifiedTime ? options.modifiedTime.toISOString() : null,
        author: {
            '@type': 'Person',
            name: options.author || state.defaultAuthor,
        },
        publisher: {
            '@type': 'Organization',
            name: 'Clodo Framework',
            logo: {
                '@type': 'ImageObject',
                url: makeAbsoluteUrl('/assets/images/logo.svg'),
            },
        },
    };

    // Remove null values
    Object.keys(schema).forEach(key => {
        if (schema[key] === null) {
            delete schema[key];
        }
    });

    addStructuredData(schema, 'schema-article');
}

/**
 * Add FAQ schema
 *
 * @param {Array} faqs - FAQ items [{question, answer}, ...]
 */
function addFAQSchema(faqs) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    addStructuredData(schema, 'schema-faq');
}

/**
 * Add Product schema
 *
 * @param {Object} options - Product details
 */
function addProductSchema(options = {}) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: options.name || 'Clodo Framework',
        description: options.description || '',
        image: makeAbsoluteUrl(options.image || state.defaultImage),
        brand: {
            '@type': 'Brand',
            name: 'Clodo Framework',
        },
        offers: {
            '@type': 'Offer',
            price: options.price || '0',
            priceCurrency: options.currency || 'USD',
            availability: 'https://schema.org/InStock',
        },
    };

    // Add rating if provided
    if (options.rating) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: options.rating.value,
            reviewCount: options.rating.count,
        };
    }

    addStructuredData(schema, 'schema-product');
}

/**
 * Add SoftwareApplication schema
 *
 * @param {Object} options - Software details
 */
function addSoftwareSchema(options = {}) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: options.name || 'Clodo Framework',
        operatingSystem: 'Any',
        applicationCategory: 'DeveloperApplication',
        description: options.description || 'Modern JavaScript framework for building scalable web applications',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        downloadUrl: options.downloadUrl || `${state.baseUrl}/docs/quick-start`,
        softwareVersion: options.version || '1.0.0',
    };

    // Add rating if provided
    if (options.rating) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: options.rating.value,
            reviewCount: options.rating.count,
        };
    }

    addStructuredData(schema, 'schema-software');
}

/**
 * Generate sitemap data
 *
 * @param {Array} pages - Array of page objects [{url, lastmod, changefreq, priority}, ...]
 * @returns {string} XML sitemap
 */
function generateSitemap(pages) {
    const urls = pages.map(page => {
        const url = makeAbsoluteUrl(page.url);
        const lastmod = page.lastmod ? new Date(page.lastmod).toISOString().split('T')[0] : '';
        const changefreq = page.changefreq || 'weekly';
        const priority = page.priority || '0.5';

        return `
    <url>
        <loc>${url}</loc>
        ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
    </url>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Make URL absolute
 *
 * @param {string} url - Relative or absolute URL
 * @returns {string} Absolute URL
 */
function makeAbsoluteUrl(url) {
    if (!url) return '';

    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Make absolute
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${state.baseUrl}${cleanUrl}`;
}

/**
 * Get current page metadata from DOM
 *
 * @returns {Object} Current page metadata
 */
function getCurrentMeta() {
    return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        image: document.querySelector('meta[property="og:image"]')?.content || '',
        url: document.querySelector('link[rel="canonical"]')?.href || window.location.href,
        keywords: document.querySelector('meta[name="keywords"]')?.content?.split(',').map(k => k.trim()) || [],
    };
}

/**
 * Public API
 */
const SEO = {
    init,
    setPageMeta,
    addStructuredData,
    addOrganizationSchema,
    addWebSiteSchema,
    addBreadcrumbSchema,
    addArticleSchema,
    addFAQSchema,
    addProductSchema,
    addSoftwareSchema,
    generateSitemap,
    makeAbsoluteUrl,
    getCurrentMeta,
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.SEO = SEO;
}

// Remove ES6 exports - this is now an IIFE
// export default SEO;

})();
