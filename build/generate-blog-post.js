/**
 * Blog Post Generator
 * 
 * Generates HTML blog posts from JSON data files using the blog post schema.
 * Ensures consistency across all posts and makes updates centralized.
 * 
 * Usage:
 *   node build/generate-blog-post.js data/posts/cloudflare-infrastructure-myth.json
 *   node build/generate-blog-post.js --all
 * 
 * Output:
 *   - public/blog/[slug].html
 *   - Validates against blog-post.schema.json
 *   - Uses templates from templates/blog/
 */

const fs = require('fs');
const path = require('path');

// Paths
const DATA_DIR = path.join(__dirname, '../data');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const TEMPLATES_DIR = path.join(__dirname, '../templates/blog');
const OUTPUT_DIR = path.join(__dirname, '../public/blog');
const BLOG_DATA = require(path.join(DATA_DIR, 'blog-data.json'));

/**
 * Load and parse a blog post JSON file
 */
function loadPost(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Get author data from central blog-data.json
 */
function getAuthor(authorId) {
    return BLOG_DATA.authors[authorId] || BLOG_DATA.authors['tamyla'];
}

/**
 * Get testimonials by topic
 */
function getTestimonials(topicId) {
    return BLOG_DATA.testimonials[topicId] || [];
}

/**
 * Get source by ID
 */
function getSource(sourceId) {
    return BLOG_DATA.sources[sourceId];
}

/**
 * Get related articles by slugs
 */
function getRelatedArticles(slugs) {
    const allArticles = [
        ...BLOG_DATA.relatedArticles['cloudflare-workers'],
        ...BLOG_DATA.relatedArticles['developer-experience']
    ];
    return slugs.map(slug => allArticles.find(a => a.slug === slug)).filter(Boolean);
}

/**
 * Generate Article Schema JSON-LD
 */
function generateArticleSchema(post, author) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.description,
        "image": post.featuredImage?.url || "https://clodo.dev/og-image.png",
        "author": {
            "@type": "Person",
            "name": author.name,
            "url": author.url,
            "jobTitle": author.jobTitle,
            "sameAs": Object.values(author.social)
        },
        "publisher": {
            "@type": "Organization",
            "name": "Clodo Framework",
            "url": "https://clodo.dev",
            "logo": {
                "@type": "ImageObject",
                "url": "https://clodo.dev/icons/icon.svg"
            }
        },
        "datePublished": post.publishedDate,
        "dateModified": post.modifiedDate || post.publishedDate,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://clodo.dev/blog/${post.slug}.html`
        },
        "articleSection": post.category,
        "keywords": post.seo?.keywords || post.tags,
        "wordCount": post.readingTime * 200 // Estimate
    };
}

/**
 * Generate FAQ Schema JSON-LD
 */
function generateFAQSchema(faqItems) {
    if (!faqItems || faqItems.length === 0) return null;
    
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };
}

/**
 * Generate HowTo Schema JSON-LD
 */
function generateHowToSchema(post) {
    if (!post.howToSteps || post.howToSteps.length === 0) return null;
    
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": `How to ${post.title.replace(/:.*/g, '')}`,
        "description": post.description,
        "step": post.howToSteps.map(step => ({
            "@type": "HowToStep",
            "position": step.position,
            "name": step.name,
            "text": step.text
        }))
    };
}

/**
 * Generate Breadcrumb Schema JSON-LD
 */
function generateBreadcrumbSchema(post) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://clodo.dev"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": "https://clodo.dev/blog/"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": `https://clodo.dev/blog/${post.slug}.html`
            }
        ]
    };
}

/**
 * Generate Table of Contents HTML
 */
function generateTOC(sections) {
    const items = sections.map((section, i) => 
        `<li><a href="#${section.id}">${section.title}</a></li>`
    ).join('\n                    ');
    
    return `
            <nav class="table-of-contents" aria-label="Table of Contents">
                <h2>📑 Quick Navigation</h2>
                <ol>
                    ${items}
                </ol>
            </nav>`;
}

/**
 * Generate Opinion Callout HTML
 */
function generateOpinionCallout(opinion) {
    if (!opinion) return '';
    
    const styleClass = opinion.style === 'strong' ? 'opinion-callout--strong' : '';
    
    return `
                <div class="opinion-callout ${styleClass}">
                    <p><strong>${opinion.emoji} ${opinion.label}</strong> ${opinion.text}</p>
                </div>`;
}

/**
 * Generate Our Results Section HTML
 */
function generateOurResults(results) {
    if (!results?.enabled) return '';
    
    const metricsHtml = results.metrics.map(m => `
                        <div class="result-card">
                            <div class="result-metric">${m.value}</div>
                            <div class="result-label">${m.label}</div>
                            <div class="result-context">${m.context}</div>
                        </div>`).join('');
    
    const methodologyHtml = results.methodology ? `
                    <details class="methodology-details">
                        <summary>📋 Our Methodology (Click to expand)</summary>
                        <div class="methodology-content">
                            <p><strong>Test Environment:</strong> ${results.methodology.testEnvironment}</p>
                            <p><strong>Time Period:</strong> ${results.methodology.timePeriod}</p>
                            <p><strong>Measurement Tools:</strong> ${results.methodology.tools}</p>
                            <p><strong>Sample Size:</strong> ${results.methodology.sampleSize}</p>
                        </div>
                    </details>` : '';
    
    return `
                <section id="our-results" class="our-results">
                    <h2>📊 Our Results: What We've Measured Firsthand</h2>
                    <div class="results-grid">
                        ${metricsHtml}
                    </div>
                    ${methodologyHtml}
                </section>`;
}

/**
 * Generate Changelog HTML
 */
function generateChangelog(changelog) {
    if (!changelog || changelog.length === 0) return '';
    
    const entriesHtml = changelog.map(entry => {
        const plannedBadge = entry.isPlanned ? '<span class="planned-badge">Planned</span>' : '';
        const plannedClass = entry.isPlanned ? 'changelog-entry--planned' : '';
        
        return `
                        <div class="changelog-entry ${plannedClass}">
                            <dt><time datetime="${entry.date}">${formatDate(entry.date)}</time> ${plannedBadge}</dt>
                            <dd>${entry.description}</dd>
                        </div>`;
    }).join('');
    
    return `
                <section id="updates" class="article-updates" aria-labelledby="updates-heading">
                    <h2 id="updates-heading">📝 Article Updates</h2>
                    <p class="updates-intro">We update this article as the ecosystem evolves. Transparency builds trust.</p>
                    <dl class="changelog">
                        ${entriesHtml}
                    </dl>
                    <p class="subscribe-updates"><strong>Want updates?</strong> <a href="#newsletter-footer">Subscribe to our newsletter</a> to get notified.</p>
                </section>`;
}

/**
 * Generate Sources Section HTML
 */
function generateSources(sourceIds) {
    if (!sourceIds || sourceIds.length === 0) return '';
    
    const sourcesHtml = sourceIds.map((id, i) => {
        const source = getSource(id);
        if (!source) return '';
        
        return `
                        <li id="source-${i + 1}">
                            <strong>[${i + 1}] ${source.title}</strong> — 
                            <a href="${source.url}" rel="nofollow noopener" target="_blank">${new URL(source.url).hostname}</a>
                            <span class="source-note">— ${source.description}</span>
                        </li>`;
    }).join('');
    
    return `
                <section id="sources" class="sources-section">
                    <h2>📚 Sources & Further Reading</h2>
                    <ol class="sources-list">
                        ${sourcesHtml}
                    </ol>
                </section>`;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

/**
 * Main generation function
 */
function generatePost(postData) {
    const author = getAuthor(postData.author);
    
    // Generate all schemas
    const schemas = [];
    if (postData.schemas?.article !== false) {
        schemas.push(generateArticleSchema(postData, author));
    }
    if (postData.schemas?.faq && postData.faq) {
        schemas.push(generateFAQSchema(postData.faq));
    }
    if (postData.schemas?.howTo && postData.howToSteps) {
        schemas.push(generateHowToSchema(postData));
    }
    if (postData.schemas?.breadcrumb !== false) {
        schemas.push(generateBreadcrumbSchema(postData));
    }
    
    // Generate schema script tags
    const schemaScripts = schemas
        .filter(Boolean)
        .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 4)}\n</script>`)
        .join('\n    ');
    
    console.log(`✅ Generated: ${postData.slug}`);
    console.log(`   - Author: ${author.name}`);
    console.log(`   - Schemas: ${schemas.filter(Boolean).length}`);
    console.log(`   - Sections: ${postData.content.sections.length}`);
    console.log(`   - Sources: ${postData.sources?.length || 0}`);
    
    return {
        slug: postData.slug,
        schemas: schemaScripts,
        toc: generateTOC(postData.content.sections),
        opinion: generateOpinionCallout(postData.content.opinionStatement),
        ourResults: generateOurResults(postData.content.ourResults),
        changelog: generateChangelog(postData.changelog),
        sources: generateSources(postData.sources)
    };
}

// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--all')) {
        // Generate all posts
        const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));
        files.forEach(file => {
            const post = loadPost(path.join(POSTS_DIR, file));
            generatePost(post);
        });
    } else if (args[0]) {
        // Generate single post
        const post = loadPost(args[0]);
        generatePost(post);
    } else {
        console.log('Usage:');
        console.log('  node generate-blog-post.js <post.json>');
        console.log('  node generate-blog-post.js --all');
    }
}

module.exports = { generatePost, loadPost, getAuthor, getTestimonials };
