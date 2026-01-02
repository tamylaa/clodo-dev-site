import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export class SeoGenerator {
    constructor(config) {
        this.config = config;
        this.siteUrl = config.site?.site?.url || 'https://example.com';
    }

    generate(pages, distDir) {
        console.log('🗺️  Generating SEO files...');
        
        this._generateSitemap(pages, distDir);
        this._generateRobotsTxt(distDir);
    }

    _generateSitemap(pages, distDir) {
        const sitemapPath = join(distDir, 'sitemap.xml');
        
        const urls = pages.map(page => {
            // Convert file path to URL path
            // e.g. "blog/my-post.html" -> "/blog/my-post"
            // e.g. "index.html" -> "/"
            let urlPath = page.replace(/\\/g, '/'); // Normalize slashes
            
            if (urlPath.endsWith('index.html')) {
                urlPath = urlPath.replace('index.html', '');
            } else {
                urlPath = urlPath.replace('.html', '');
            }

            // Ensure leading slash
            if (!urlPath.startsWith('/')) {
                urlPath = '/' + urlPath;
            }

            return `
    <url>
        <loc>${this.siteUrl}${urlPath}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${urlPath === '/' ? '1.0' : '0.8'}</priority>
    </url>`;
        }).join('');

        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        writeFileSync(sitemapPath, sitemapContent);
        console.log(`   ✅ Generated sitemap.xml with ${pages.length} URLs`);
    }

    _generateRobotsTxt(distDir) {
        const robotsPath = join(distDir, 'robots.txt');
        const content = `User-agent: *
Allow: /

Sitemap: ${this.siteUrl}/sitemap.xml
`;
        writeFileSync(robotsPath, content);
        console.log('   ✅ Generated robots.txt');
    }
}
