/**
 * Content Renderer
 * 
 * Renders pages from JSON content files + HTML templates.
 * This enables "spin up a new site with a click" by just changing content files.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Load JSON content file
 */
export function loadContent(contentPath) {
    const fullPath = contentPath.startsWith('/') ? contentPath : join(process.cwd(), contentPath);
    if (!existsSync(fullPath)) {
        console.warn(`⚠️  Content file not found: ${contentPath}`);
        return null;
    }
    return JSON.parse(readFileSync(fullPath, 'utf8'));
}

/**
 * Render a template string with data
 * Supports: {{variable}}, {{#each items}}...{{/each}}, {{#if condition}}...{{/if}}
 */
export function renderTemplate(template, data, helpers = {}) {
    let result = template;
    
    // Process {{#each array}}...{{/each}} blocks
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
        const array = getNestedValue(data, arrayName);
        if (!Array.isArray(array)) return '';
        return array.map((item, index) => {
            const itemData = { ...data, ...item, '@index': index, '@first': index === 0, '@last': index === array.length - 1 };
            return renderTemplate(content, itemData, helpers);
        }).join('');
    });
    
    // Process {{#if condition}}...{{else}}...{{/if}} blocks
    result = result.replace(/\{\{#if\s+(.+?)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (match, condition, ifContent, elseContent = '') => {
        const value = getNestedValue(data, condition.trim());
        return value ? renderTemplate(ifContent, data, helpers) : renderTemplate(elseContent, data, helpers);
    });
    
    // Process {{#unless condition}}...{{/unless}} blocks
    result = result.replace(/\{\{#unless\s+(.+?)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, content) => {
        const value = getNestedValue(data, condition.trim());
        return !value ? renderTemplate(content, data, helpers) : '';
    });
    
    // Process helper functions {{helper arg1 arg2}}
    result = result.replace(/\{\{(\w+)\s+([^}]+)\}\}/g, (match, helperName, args) => {
        if (helpers[helperName]) {
            const argValues = args.split(/\s+/).map(arg => {
                if (arg.startsWith('"') && arg.endsWith('"')) return arg.slice(1, -1);
                if (arg.startsWith("'") && arg.endsWith("'")) return arg.slice(1, -1);
                return getNestedValue(data, arg);
            });
            return helpers[helperName](...argValues);
        }
        return match;
    });
    
    // Process simple {{variable}} replacements
    result = result.replace(/\{\{([^#/}][^}]*)\}\}/g, (match, varName) => {
        const value = getNestedValue(data, varName.trim());
        return value !== undefined ? String(value) : '';
    });
    
    return result;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

/**
 * Built-in template helpers
 */
export const defaultHelpers = {
    // Format date
    formatDate: (dateStr, format = 'long') => {
        const date = new Date(dateStr);
        const options = format === 'short' 
            ? { month: 'short', day: 'numeric', year: 'numeric' }
            : { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', /** @type {any} */ (options));
    },
    
    // Format currency
    formatCurrency: (amount, currency = 'USD') => {
        if (amount === null || amount === undefined) return 'Custom';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    },
    
    // Pluralize
    pluralize: (count, singular, plural) => {
        return count === 1 ? singular : (plural || singular + 's');
    },
    
    // Truncate text
    truncate: (text, length = 100) => {
        if (!text || text.length <= length) return text;
        return text.substring(0, length).trim() + '...';
    },
    
    // JSON stringify for schema
    json: (obj) => JSON.stringify(obj, null, 2),
    
    // Generate star rating HTML
    stars: (rating) => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    },
    
    // Check mark or X
    checkmark: (value) => value ? '✓' : '✗',
    
    // Slugify text
    slugify: (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    
    // Equal comparison
    eq: (a, b) => a === b,
    
    // Greater than
    gt: (a, b) => a > b,
    
    // Less than
    lt: (a, b) => a < b
};

/**
 * Section renderers for common page sections
 */
export const sectionRenderers = {
    /**
     * Render hero section
     */
    hero: (data) => `
        <section class="hero" id="hero">
            <div class="hero-content">
                <h1 id="hero-title">${data.title}</h1>
                ${data.subtitle ? `<p class="hero-subtitle">${data.subtitle}</p>` : ''}
                ${data.description ? `<p class="hero-description">${data.description}</p>` : ''}
                ${data.cta ? `
                    <div class="hero-buttons">
                        ${data.cta.primary ? `<a href="${data.cta.primary.href}" class="btn btn--primary">${data.cta.primary.text}</a>` : ''}
                        ${data.cta.secondary ? `<a href="${data.cta.secondary.href}" class="btn btn--secondary">${data.cta.secondary.text}</a>` : ''}
                    </div>
                ` : ''}
            </div>
            ${data.stats ? `
                <div class="hero-stats">
                    ${data.stats.map(stat => `
                        <div class="stat">
                            <span class="stat-value">${stat.value}</span>
                            <span class="stat-label">${stat.label}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </section>
    `,

    /**
     * Render features grid
     */
    features: (data) => `
        <section class="features" id="features">
            <div class="section-header">
                <h2>${data.sectionTitle}</h2>
                ${data.sectionSubtitle ? `<p>${data.sectionSubtitle}</p>` : ''}
            </div>
            <div class="features-grid">
                ${data.items.map(feature => `
                    <div class="feature-card">
                        ${feature.icon ? `<div class="feature-icon">${feature.icon}</div>` : ''}
                        <h3>${feature.title}</h3>
                        <p>${feature.description}</p>
                        ${feature.link ? `<a href="${feature.link.href}" class="feature-link">${feature.link.text} →</a>` : ''}
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    /**
     * Render pricing cards
     */
    pricing: (data) => `
        <section class="pricing" id="pricing">
            <div class="section-header">
                <h2>${data.hero?.title || 'Pricing'}</h2>
                ${data.hero?.subtitle ? `<p>${data.hero.subtitle}</p>` : ''}
            </div>
            <div class="pricing-cards">
                ${data.plans.map(plan => `
                    <div class="pricing-card ${plan.highlighted ? 'pricing-card--highlighted' : ''}">
                        ${plan.badge ? `<span class="pricing-badge">${plan.badge}</span>` : ''}
                        <h3>${plan.name}</h3>
                        <p class="pricing-description">${plan.description}</p>
                        <div class="pricing-price">
                            ${plan.price.custom 
                                ? `<span class="price-custom">${plan.price.label}</span>`
                                : `<span class="price-amount">$${plan.price.monthly}</span><span class="price-period">/month</span>`
                            }
                        </div>
                        <ul class="pricing-features">
                            ${plan.features.map(f => `
                                <li class="${f.included ? 'included' : 'excluded'}">
                                    <span class="check">${f.included ? '✓' : '✗'}</span>
                                    ${f.text}
                                </li>
                            `).join('')}
                        </ul>
                        <a href="${plan.cta.href}" class="btn ${plan.highlighted ? 'btn--primary' : 'btn--secondary'}">${plan.cta.text}</a>
                    </div>
                `).join('')}
            </div>
        </section>
    `,

    /**
     * Render FAQ accordion
     */
    faq: (data) => `
        <section class="faq" id="faq">
            <div class="section-header">
                <h2>${data.hero?.title || 'FAQ'}</h2>
                ${data.hero?.subtitle ? `<p>${data.hero.subtitle}</p>` : ''}
            </div>
            ${data.categories ? data.categories.map(category => `
                <div class="faq-category">
                    <h3>${category.name}</h3>
                    <div class="faq-items">
                        ${category.items.map(item => `
                            <details class="faq-item">
                                <summary>${item.question}</summary>
                                <div class="faq-answer">${item.answer}</div>
                            </details>
                        `).join('')}
                    </div>
                </div>
            `).join('') : data.items?.map(item => `
                <details class="faq-item">
                    <summary>${item.question}</summary>
                    <div class="faq-answer">${item.answer}</div>
                </details>
            `).join('')}
        </section>
    `,

    /**
     * Render testimonials
     */
    testimonials: (data) => `
        <section class="testimonials" id="testimonials">
            <div class="section-header">
                <h2>${data.sectionTitle}</h2>
                ${data.sectionSubtitle ? `<p>${data.sectionSubtitle}</p>` : ''}
            </div>
            <div class="testimonials-grid">
                ${data.items.map(t => `
                    <blockquote class="testimonial-card">
                        <p class="testimonial-quote">"${t.quote}"</p>
                        <footer class="testimonial-author">
                            ${t.author.avatar ? `<img src="${t.author.avatar}" alt="${t.author.name}" class="author-avatar">` : ''}
                            <div class="author-info">
                                <cite>${t.author.name}</cite>
                                <span>${t.author.title}, ${t.author.company}</span>
                            </div>
                        </footer>
                        ${t.rating ? `<div class="testimonial-rating">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>` : ''}
                    </blockquote>
                `).join('')}
            </div>
        </section>
    `,

    /**
     * Render blog post list
     */
    blogList: (posts, config) => `
        <section class="blog-list">
            ${posts.map(post => `
                <article class="blog-card">
                    ${post.image ? `<img src="${post.image.src}" alt="${post.image.alt}" class="blog-card-image">` : ''}
                    <div class="blog-card-content">
                        <span class="blog-card-category">${post.category}</span>
                        <h2><a href="/blog/${post.slug}">${post.title}</a></h2>
                        <p>${post.excerpt}</p>
                        <footer class="blog-card-meta">
                            <span class="blog-card-date">${new Date(post.publishedAt).toLocaleDateString()}</span>
                            <span class="blog-card-readtime">${post.readTime} min read</span>
                        </footer>
                    </div>
                </article>
            `).join('')}
        </section>
    `
};

/**
 * Generate a complete page from content
 */
export function generatePage(contentPath, templatePath, outputPath, config = {}) {
    const content = loadContent(contentPath);
    if (!content) return false;
    
    let template = readFileSync(templatePath, 'utf8');
    
    // Merge content with site config
    const data = {
        ...config.siteConfig,
        page: content,
        ...content
    };
    
    // Render with helpers
    const html = renderTemplate(template, data, { ...defaultHelpers, ...config.helpers });
    
    // Ensure output directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }
    
    writeFileSync(outputPath, html);
    return true;
}

export default {
    loadContent,
    renderTemplate,
    defaultHelpers,
    sectionRenderers,
    generatePage
};
