/**
 * Blog Post Generator (ESM)
 * 
 * Generates schema/metadata components from JSON data files.
 * Validates against blog-post.schema.json for consistency.
 * 
 * Usage:
 *   node build/generate-blog-post.mjs data/posts/cloudflare-infrastructure-myth.json
 *   node build/generate-blog-post.mjs --validate-all
 *   node build/generate-blog-post.mjs --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '../data');
const POSTS_DIR = path.join(DATA_DIR, 'posts');
const SCHEMA_PATH = path.join(DATA_DIR, 'blog-post.schema.json');

// Load central blog data
const BLOG_DATA = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'blog-data.json'), 'utf-8'));

/**
 * Load and parse a blog post JSON file
 */
export function loadPost(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
}

/**
 * Get author data from central blog-data.json
 */
export function getAuthor(authorId) {
    return BLOG_DATA.authors[authorId] || BLOG_DATA.authors['tamyla'];
}

/**
 * Get testimonials by topic
 */
export function getTestimonials(topicId) {
    return BLOG_DATA.testimonials[topicId] || [];
}

/**
 * Get source by ID
 */
export function getSource(sourceId) {
    return BLOG_DATA.sources[sourceId];
}

/**
 * Validate a post against required fields
 */
export function validatePost(post, filePath) {
    const errors = [];
    const warnings = [];
    
    // Required fields
    const required = ['slug', 'title', 'description', 'author', 'publishedDate', 'category', 'tags'];
    for (const field of required) {
        if (!post[field]) {
            errors.push(`Missing required field: ${field}`);
        }
    }
    
    // Title length (SEO best practice)
    if (post.title && (post.title.length < 20 || post.title.length > 100)) {
        warnings.push(`Title length (${post.title.length}) should be 20-100 chars for SEO`);
    }
    
    // Description length (SEO best practice)
    if (post.description && (post.description.length < 100 || post.description.length > 300)) {
        warnings.push(`Description length (${post.description.length}) should be 100-300 chars for SEO`);
    }
    
    // Date format validation
    if (post.publishedDate && !/^\d{4}-\d{2}-\d{2}$/.test(post.publishedDate)) {
        errors.push(`publishedDate must be YYYY-MM-DD format`);
    }
    
    // Check date is not in future (relative to Dec 12, 2025)
    if (post.publishedDate) {
        const pubDate = new Date(post.publishedDate);
        const today = new Date('2025-12-12');
        if (pubDate > today) {
            errors.push(`publishedDate ${post.publishedDate} is in the future`);
        }
    }
    
    // Tags validation
    if (post.tags && (post.tags.length < 2 || post.tags.length > 8)) {
        warnings.push(`Tags count (${post.tags.length}) should be 2-8`);
    }
    
    // Category validation
    const validCategories = [
        'Infrastructure', 'Technical Deep-Dive', 'Developer Experience',
        'Community', 'Impact Analysis', 'Tutorial', 'Case Study'
    ];
    if (post.category && !validCategories.includes(post.category)) {
        errors.push(`Invalid category: ${post.category}. Valid: ${validCategories.join(', ')}`);
    }
    
    // Check corresponding HTML file exists
    const htmlPath = path.join(__dirname, '../public/blog', `${post.slug}.html`);
    if (!fs.existsSync(htmlPath)) {
        warnings.push(`No HTML file found at public/blog/${post.slug}.html`);
    }
    
    return { errors, warnings, valid: errors.length === 0 };
}

/**
 * Generate Article Schema JSON-LD
 */
export function generateArticleSchema(post, author) {
    return {
        "@context": "https://schema.org",
        "@type": post.category === 'Tutorial' ? 'TechArticle' : 'Article',
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
            "@id": `https://clodo.dev/blog/${post.slug}`
        },
        "articleSection": post.category,
        "keywords": post.seo?.keywords || post.tags,
        "wordCount": (post.readingTime || 10) * 200
    };
}

/**
 * Generate FAQ Schema JSON-LD
 */
export function generateFAQSchema(faqItems) {
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
export function generateHowToSchema(post) {
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
            "text": step.text,
            ...(step.url && { "url": step.url })
        }))
    };
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
 * Main generation function - generates metadata/schemas
 */
export function generatePost(postData) {
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
    
    console.log(`✅ Generated: ${postData.slug}`);
    console.log(`   - Author: ${author.name}`);
    console.log(`   - Category: ${postData.category}`);
    console.log(`   - Schemas: ${schemas.filter(Boolean).length}`);
    console.log(`   - FAQs: ${postData.faq?.length || 0}`);
    console.log(`   - HowTo Steps: ${postData.howToSteps?.length || 0}`);
    
    return {
        slug: postData.slug,
        schemas: schemas.filter(Boolean),
        meta: {
            title: postData.title,
            description: postData.description,
            publishedDate: postData.publishedDate,
            category: postData.category
        }
    };
}

/**
 * Validate all posts
 */
export function validateAllPosts() {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));
    let hasErrors = false;
    
    console.log('\n📋 Validating blog posts...\n');
    
    for (const file of files) {
        const filePath = path.join(POSTS_DIR, file);
        const post = loadPost(filePath);
        const result = validatePost(post, filePath);
        
        console.log(`📄 ${file}`);
        
        if (result.errors.length > 0) {
            hasErrors = true;
            console.log(`   ❌ Errors:`);
            result.errors.forEach(e => console.log(`      - ${e}`));
        }
        
        if (result.warnings.length > 0) {
            console.log(`   ⚠️  Warnings:`);
            result.warnings.forEach(w => console.log(`      - ${w}`));
        }
        
        if (result.valid && result.warnings.length === 0) {
            console.log(`   ✅ Valid`);
        }
        
        console.log('');
    }
    
    return !hasErrors;
}

// CLI entry point
const args = process.argv.slice(2);

if (args.includes('--validate-all') || args.includes('-v')) {
    const valid = validateAllPosts();
    process.exit(valid ? 0 : 1);
} else if (args.includes('--all')) {
    console.log('\n🔄 Generating all posts...\n');
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));
    files.forEach(file => {
        const post = loadPost(path.join(POSTS_DIR, file));
        generatePost(post);
        console.log('');
    });
} else if (args[0] && !args[0].startsWith('-')) {
    const post = loadPost(args[0]);
    const result = validatePost(post, args[0]);
    
    if (!result.valid) {
        console.log('❌ Validation failed:');
        result.errors.forEach(e => console.log(`   - ${e}`));
        process.exit(1);
    }
    
    generatePost(post);
} else {
    console.log(`
Blog Post Generator & Validator

Usage:
  node build/generate-blog-post.mjs <post.json>     Generate single post
  node build/generate-blog-post.mjs --all           Generate all posts  
  node build/generate-blog-post.mjs --validate-all  Validate all posts (CI)
  node build/generate-blog-post.mjs -v              Same as --validate-all

Examples:
  node build/generate-blog-post.mjs data/posts/cloudflare-infrastructure-myth.json
  node build/generate-blog-post.mjs --validate-all
`);
}
