/**
 * Page Generator
 * 
 * Generates static HTML pages from content JSON files.
 * Enables spinning up new sites by just modifying content files.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { loadContent, renderTemplate, defaultHelpers, sectionRenderers } from './content-renderer.js';
import { loadConfig } from './config-loader.js';

const ROOT_DIR = process.cwd();

/**
 * Load all page content files from content/pages/
 */
export function loadAllPageContent() {
    const pagesDir = join(ROOT_DIR, 'content', 'pages');
    const pages = {};
    
    if (!existsSync(pagesDir)) {
        console.warn('⚠️  No content/pages directory found');
        return pages;
    }
    
    const files = readdirSync(pagesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
        const pageName = basename(file, '.json');
        pages[pageName] = loadContent(join(pagesDir, file));
    }
    
    return pages;
}

/**
 * Load blog content
 */
export function loadBlogContent() {
    const blogDir = join(ROOT_DIR, 'content', 'blog');
    
    return {
        config: loadContent(join(blogDir, 'config.json')),
        posts: loadContent(join(blogDir, 'posts.json'))?.posts || []
    };
}

/**
 * Generate dynamic sections from page content
 */
export function generateSections(pageContent) {
    if (!pageContent || !pageContent.sections) return '';
    
    const sections = pageContent.sections;
    const html = [];
    
    // Generate each section in order
    if (sections.hero) {
        html.push(sectionRenderers.hero(sections.hero));
    }
    
    if (sections.features) {
        html.push(sectionRenderers.features(sections.features));
    }
    
    if (sections.benefits) {
        html.push(sectionRenderers.features({ 
            ...sections.benefits,
            sectionTitle: sections.benefits.sectionTitle || 'Benefits'
        }));
    }
    
    if (sections.comparison) {
        html.push(generateComparisonSection(sections.comparison));
    }
    
    if (sections.testimonials) {
        html.push(sectionRenderers.testimonials(sections.testimonials));
    }
    
    if (sections.cta) {
        html.push(generateCtaSection(sections.cta));
    }
    
    return html.join('\n');
}

/**
 * Generate comparison table section
 */
function generateComparisonSection(data) {
    return `
        <section class="comparison" id="comparison">
            <div class="section-header">
                <h2>${data.sectionTitle}</h2>
                ${data.sectionSubtitle ? `<p>${data.sectionSubtitle}</p>` : ''}
            </div>
            <div class="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            ${data.competitors.map(c => `<th>${c}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map(item => `
                            <tr>
                                <td>${item.feature}</td>
                                ${item.values.map(v => `<td class="${v ? 'yes' : 'no'}">${v ? '✓' : '✗'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

/**
 * Generate CTA section
 */
function generateCtaSection(data) {
    return `
        <section class="cta-section" id="cta">
            <div class="cta-content">
                <h2>${data.title}</h2>
                ${data.subtitle ? `<p>${data.subtitle}</p>` : ''}
                <div class="cta-buttons">
                    ${data.primary ? `<a href="${data.primary.href}" class="btn btn--primary btn--large">${data.primary.text}</a>` : ''}
                    ${data.secondary ? `<a href="${data.secondary.href}" class="btn btn--secondary">${data.secondary.text}</a>` : ''}
                </div>
            </div>
        </section>
    `;
}

/**
 * Inject content into page template
 * Looks for special markers like <!-- CONTENT:hero --> and replaces them
 */
export function injectContent(templateHtml, pageContent, siteConfig) {
    let result = templateHtml;
    
    // Inject generated sections at <!-- CONTENT:sections --> marker
    if (result.includes('<!-- CONTENT:sections -->')) {
        const sectionsHtml = generateSections(pageContent);
        result = result.replace('<!-- CONTENT:sections -->', sectionsHtml);
    }
    
    // Inject specific sections at their markers
    const sectionTypes = ['hero', 'features', 'benefits', 'pricing', 'faq', 'testimonials', 'comparison', 'cta'];
    for (const sectionType of sectionTypes) {
        const marker = `<!-- CONTENT:${sectionType} -->`;
        if (result.includes(marker) && pageContent?.sections?.[sectionType]) {
            const sectionData = pageContent.sections[sectionType];
            let sectionHtml = '';
            
            if (sectionRenderers[sectionType]) {
                sectionHtml = sectionRenderers[sectionType](sectionData);
            } else if (sectionType === 'comparison') {
                sectionHtml = generateComparisonSection(sectionData);
            } else if (sectionType === 'cta') {
                sectionHtml = generateCtaSection(sectionData);
            }
            
            result = result.replace(marker, sectionHtml);
        }
    }
    
    // Inject page metadata
    if (pageContent?.meta) {
        const meta = pageContent.meta;
        
        // Title
        result = result.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
        
        // Meta description
        result = result.replace(
            /<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${meta.description}">`
        );
        
        // OG tags
        if (meta.ogTitle) {
            result = result.replace(
                /<meta property="og:title" content="[^"]*">/,
                `<meta property="og:title" content="${meta.ogTitle}">`
            );
        }
        if (meta.ogDescription) {
            result = result.replace(
                /<meta property="og:description" content="[^"]*">/,
                `<meta property="og:description" content="${meta.ogDescription}">`
            );
        }
    }
    
    // Process any remaining template variables
    const data = { ...siteConfig, page: pageContent };
    result = renderTemplate(result, data, defaultHelpers);
    
    return result;
}

/**
 * Generate all content-driven pages
 */
export async function generateAllPages(options = {}) {
    const { siteConfig } = await loadConfig();
    const pagesContent = loadAllPageContent();
    const blogContent = loadBlogContent();
    
    console.log('\n📄 Generating content-driven pages...');
    
    const results = {
        success: [],
        failed: [],
        skipped: []
    };
    
    // Process each page content file
    for (const [pageName, content] of Object.entries(pagesContent)) {
        if (!content) {
            results.skipped.push(pageName);
            continue;
        }
        
        // Find matching template
        const templatePath = findPageTemplate(pageName);
        if (!templatePath) {
            console.log(`  ⚠️  No template found for ${pageName}, skipping`);
            results.skipped.push(pageName);
            continue;
        }
        
        try {
            let templateHtml = readFileSync(templatePath, 'utf8');
            const outputHtml = injectContent(templateHtml, content, siteConfig);
            
            // Determine output path
            const outputPath = pageName === 'index' 
                ? join(ROOT_DIR, 'dist', 'index.html')
                : join(ROOT_DIR, 'dist', pageName, 'index.html');
            
            // Ensure directory exists
            const outputDir = dirname(outputPath);
            if (!existsSync(outputDir)) {
                mkdirSync(outputDir, { recursive: true });
            }
            
            writeFileSync(outputPath, outputHtml);
            console.log(`  ✅ Generated: ${pageName}`);
            results.success.push(pageName);
            
        } catch (error) {
            console.error(`  ❌ Failed to generate ${pageName}: ${error.message}`);
            results.failed.push({ page: pageName, error: error.message });
        }
    }
    
    // Generate blog index if blog content exists
    if (blogContent.posts.length > 0) {
        try {
            const blogIndexHtml = generateBlogIndex(blogContent, siteConfig);
            const blogOutputPath = join(ROOT_DIR, 'dist', 'blog', 'index.html');
            
            const blogDir = dirname(blogOutputPath);
            if (!existsSync(blogDir)) {
                mkdirSync(blogDir, { recursive: true });
            }
            
            writeFileSync(blogOutputPath, blogIndexHtml);
            console.log(`  ✅ Generated: blog index (${blogContent.posts.length} posts)`);
            results.success.push('blog-index');
            
        } catch (error) {
            console.error(`  ❌ Failed to generate blog index: ${error.message}`);
            results.failed.push({ page: 'blog-index', error: error.message });
        }
    }
    
    console.log(`\n📊 Page generation complete:`);
    console.log(`   ✅ Success: ${results.success.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log(`   ⏭️  Skipped: ${results.skipped.length}`);
    
    return results;
}

/**
 * Find the template file for a page
 */
function findPageTemplate(pageName) {
    const possiblePaths = [
        join(ROOT_DIR, 'templates', 'pages', `${pageName}.html`),
        join(ROOT_DIR, 'templates', `${pageName}.html`),
        join(ROOT_DIR, 'src', 'pages', `${pageName}.html`),
        join(ROOT_DIR, 'src', `${pageName}.html`)
    ];
    
    for (const templatePath of possiblePaths) {
        if (existsSync(templatePath)) {
            return templatePath;
        }
    }
    
    return null;
}

/**
 * Generate blog index page
 */
function generateBlogIndex(blogContent, siteConfig) {
    const { config, posts } = blogContent;
    
    // Sort posts by date (newest first)
    const sortedPosts = [...posts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    // Filter only published posts
    const publishedPosts = sortedPosts.filter(p => p.status === 'published');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config?.settings?.title || 'Blog'} | ${siteConfig?.site?.name || 'Site'}</title>
    <meta name="description" content="${config?.settings?.description || 'Read our latest articles'}">
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>
    <main class="blog-page">
        <header class="blog-header">
            <h1>${config?.settings?.title || 'Blog'}</h1>
            <p>${config?.settings?.description || ''}</p>
        </header>
        
        ${config?.categories?.length > 0 ? `
        <nav class="blog-categories">
            <a href="/blog" class="category-link active">All</a>
            ${config.categories.map(cat => `
                <a href="/blog/category/${cat.slug}" class="category-link">${cat.name}</a>
            `).join('')}
        </nav>
        ` : ''}
        
        <div class="blog-grid">
            ${publishedPosts.map(post => `
                <article class="blog-card">
                    ${post.image?.src ? `
                    <a href="/blog/${post.slug}" class="blog-card-image">
                        <img src="${post.image.src}" alt="${post.image.alt || post.title}" loading="lazy">
                    </a>
                    ` : ''}
                    <div class="blog-card-content">
                        <span class="blog-card-category">${post.category}</span>
                        <h2 class="blog-card-title">
                            <a href="/blog/${post.slug}">${post.title}</a>
                        </h2>
                        <p class="blog-card-excerpt">${post.excerpt}</p>
                        <footer class="blog-card-meta">
                            <span class="blog-card-author">${post.author}</span>
                            <span class="blog-card-date">${new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span class="blog-card-readtime">${post.readTime} min read</span>
                        </footer>
                    </div>
                </article>
            `).join('')}
        </div>
        
        ${config?.newsletter?.enabled ? `
        <section class="blog-newsletter">
            <h3>${config.newsletter.title}</h3>
            <p>${config.newsletter.description}</p>
            <form class="newsletter-form" action="${config.newsletter.action}" method="POST">
                <input type="email" name="email" placeholder="${config.newsletter.placeholder}" required>
                <button type="submit" class="btn btn--primary">${config.newsletter.buttonText}</button>
            </form>
        </section>
        ` : ''}
    </main>
</body>
</html>`;
}

/**
 * Generate a single blog post page
 */
export function generateBlogPost(post, blogConfig, siteConfig) {
    const author = blogConfig?.authors?.find(a => a.id === post.authorId) || { name: post.author || 'Unknown' };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${post.title} | ${siteConfig?.site?.name || 'Blog'}</title>
    <meta name="description" content="${post.excerpt}">
    <meta property="og:title" content="${post.title}">
    <meta property="og:description" content="${post.excerpt}">
    ${post.image?.src ? `<meta property="og:image" content="${post.image.src}">` : ''}
    <link rel="stylesheet" href="/css/main.css">
    
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "${post.title}",
        "description": "${post.excerpt}",
        "datePublished": "${post.publishedAt}",
        ${post.updatedAt ? `"dateModified": "${post.updatedAt}",` : ''}
        "author": {
            "@type": "Person",
            "name": "${author.name}"
        },
        ${post.image?.src ? `"image": "${post.image.src}",` : ''}
        "publisher": {
            "@type": "Organization",
            "name": "${siteConfig?.site?.name || 'Site'}"
        }
    }
    </script>
</head>
<body>
    <article class="blog-post">
        <header class="blog-post-header">
            <span class="blog-post-category">${post.category}</span>
            <h1>${post.title}</h1>
            <div class="blog-post-meta">
                <span class="author">${author.name}</span>
                <time datetime="${post.publishedAt}">${new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                <span class="read-time">${post.readTime} min read</span>
            </div>
        </header>
        
        ${post.image?.src ? `
        <figure class="blog-post-image">
            <img src="${post.image.src}" alt="${post.image.alt || post.title}">
        </figure>
        ` : ''}
        
        <div class="blog-post-content">
            <!-- Content will be injected from markdown file -->
            {{content}}
        </div>
        
        ${post.tags?.length > 0 ? `
        <footer class="blog-post-tags">
            ${post.tags.map(tag => `<a href="/blog/tag/${tag}" class="tag">#${tag}</a>`).join('')}
        </footer>
        ` : ''}
    </article>
</body>
</html>`;
}

// CLI support
if (process.argv[1].includes('page-generator')) {
    generateAllPages().catch(console.error);
}

export default {
    loadAllPageContent,
    loadBlogContent,
    generateSections,
    injectContent,
    generateAllPages,
    generateBlogPost
};
