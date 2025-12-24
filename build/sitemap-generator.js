/**
 * Sitemap Generator
 * 
 * Generates sitemap.xml and robots.txt from content configuration.
 * Automatically includes all pages and blog posts.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

/**
 * Load site configuration
 */
function loadSiteConfig() {
    const configPath = join(ROOT_DIR, 'config', 'site.config.js');
    if (!existsSync(configPath)) {
        console.warn('⚠️  No site.config.js found');
        return { site: { url: 'https://example.com' } };
    }
    // Dynamic import for ES module
    return import(configPath).then(m => m.default || m);
}

/**
 * Load all page content files
 */
function loadPageContent() {
    const pagesDir = join(ROOT_DIR, 'content', 'pages');
    const pages = [];
    
    if (!existsSync(pagesDir)) return pages;
    
    const files = readdirSync(pagesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
        try {
            const content = JSON.parse(readFileSync(join(pagesDir, file), 'utf8'));
            const slug = file.replace('.json', '');
            pages.push({
                slug: slug === 'index' ? '' : slug,
                lastmod: content.meta?.lastModified || new Date().toISOString().split('T')[0],
                priority: content.meta?.priority || (slug === 'index' ? '1.0' : '0.8'),
                changefreq: content.meta?.changefreq || 'weekly'
            });
        } catch (e) {
            console.warn(`⚠️  Could not parse ${file}: ${e.message}`);
        }
    }
    
    return pages;
}

/**
 * Load blog posts
 */
function loadBlogPosts() {
    const postsPath = join(ROOT_DIR, 'content', 'blog', 'posts.json');
    if (!existsSync(postsPath)) return [];
    
    try {
        const data = JSON.parse(readFileSync(postsPath, 'utf8'));
        return (data.posts || [])
            .filter(p => p.status === 'published')
            .map(post => ({
                slug: `blog/${post.slug}`,
                lastmod: post.updatedAt || post.publishedAt,
                priority: '0.6',
                changefreq: 'monthly'
            }));
    } catch (e) {
        console.warn(`⚠️  Could not parse blog posts: ${e.message}`);
        return [];
    }
}

/**
 * Load services
 */
function loadServices() {
    const servicesPath = join(ROOT_DIR, 'content', 'services.json');
    if (!existsSync(servicesPath)) return [];
    
    try {
        const data = JSON.parse(readFileSync(servicesPath, 'utf8'));
        return (data.services || []).map(service => ({
            slug: `services/${service.slug}`,
            lastmod: new Date().toISOString().split('T')[0],
            priority: '0.7',
            changefreq: 'monthly'
        }));
    } catch (e) {
        return [];
    }
}

/**
 * Discover HTML files in public directory
 */
function discoverHtmlFiles() {
    const publicDir = join(ROOT_DIR, 'public');
    const htmlFiles = [];
    
    function scanDir(dir, basePath = '') {
        if (!existsSync(dir)) return;
        
        const items = readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const itemPath = join(dir, item.name);
            const urlPath = basePath + '/' + item.name;
            
            if (item.isDirectory()) {
                // Skip certain directories
                if (!['css', 'js', 'images', 'icons', 'fonts', 'assets'].includes(item.name)) {
                    scanDir(itemPath, urlPath);
                }
            } else if (item.name.endsWith('.html') && item.name !== '404.html') {
                let slug = urlPath.replace('/index.html', '').replace('.html', '').replace(/^\//, '');
                if (slug === 'index') slug = '';
                htmlFiles.push({
                    slug,
                    lastmod: new Date().toISOString().split('T')[0],
                    priority: slug === '' ? '1.0' : '0.5',
                    changefreq: 'weekly'
                });
            }
        }
    }
    
    scanDir(publicDir);
    return htmlFiles;
}

/**
 * Generate sitemap XML
 */
export async function generateSitemap(options = {}) {
    const config = await loadSiteConfig();
    const siteUrl = options.siteUrl || config.site?.url || 'https://example.com';
    
    // Collect all URLs
    const pages = loadPageContent();
    const posts = loadBlogPosts();
    const services = loadServices();
    const htmlFiles = discoverHtmlFiles();
    
    // Merge and deduplicate
    const allUrls = new Map();
    
    // Priority: content pages > discovered HTML
    [...htmlFiles, ...services, ...posts, ...pages].forEach(item => {
        allUrls.set(item.slug, item);
    });
    
    // Generate XML
    const urls = Array.from(allUrls.values());
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(url => `  <url>
    <loc>${siteUrl}/${url.slug}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
    
    const outputPath = join(ROOT_DIR, 'dist', 'sitemap.xml');
    writeFileSync(outputPath, xml);
    console.log(`✅ Sitemap generated: ${urls.length} URLs`);
    
    return { xml, urls };
}

/**
 * Generate robots.txt
 */
export async function generateRobotsTxt(options = {}) {
    const config = await loadSiteConfig();
    const siteUrl = options.siteUrl || config.site?.url || 'https://example.com';
    
    const robotsTxt = `# robots.txt for ${siteUrl}
# Generated by clodo-web-starter

User-agent: *
Allow: /

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_*

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml

# Crawl-delay (optional, for polite crawlers)
# Crawl-delay: 1
`;
    
    const outputPath = join(ROOT_DIR, 'dist', 'robots.txt');
    writeFileSync(outputPath, robotsTxt);
    console.log('✅ robots.txt generated');
    
    return robotsTxt;
}

/**
 * Generate both sitemap and robots.txt
 */
export async function generateSeoFiles(options = {}) {
    await generateSitemap(options);
    await generateRobotsTxt(options);
}

// CLI support
if (process.argv[1].includes('sitemap-generator')) {
    generateSeoFiles().catch(console.error);
}

export default {
    generateSitemap,
    generateRobotsTxt,
    generateSeoFiles
};
