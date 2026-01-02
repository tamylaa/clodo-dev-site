import { join, dirname } from 'path';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

export class PageProcessor {
    constructor(config, templateManager, assetManifest = {}, assetManager = null) {
        this.config = config;
        this.templates = templateManager;
        this.assetManifest = assetManifest;
        this.assetManager = assetManager;
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true
        });
    }

    process(content, filePath, relativePath) {
        let processed = content;
        let metadata = {};

        // 0. Handle Markdown
        if (filePath.endsWith('.md')) {
            const parsed = matter(content);
            metadata = parsed.data;
            processed = this.md.render(parsed.content);
            
            // Wrap in layout if specified in frontmatter or default
            // For this refactor, let's assume we wrap it in a standard HTML shell
            // that includes the header/footer SSIs.
            processed = `
<!--#include file="../templates/header.html" -->
<main class="container mx-auto px-4 py-8">
    ${processed}
</main>
<!--#include file="../templates/footer.html" -->
            `;
        }

        // 1. Inject Components (SSI Replacement)
        processed = this._processIncludes(processed, relativePath);

        // 2. Process Template Variables (after includes so included files get processed too)
        processed = this._processTemplateVariables(processed, relativePath);

        // 3. Restore Placeholders (Hero, Header, Footer)
        processed = this._processPlaceholders(processed, relativePath);

        // 4. Inject Assets (CSS/JS)
        processed = this._injectAssets(processed, relativePath);

        // 5. Inject SEO / Head
        processed = this._injectHead(processed, relativePath, metadata);

        return processed;
    }

    _processTemplateVariables(content, relativePath) {
        // Replace template variables like {{siteName}}, {{branding.colors.primary}}, etc.
        // with values from this.config, merged with page-specific data
        
        let processed = content;
        
        // Create a working copy of config
        let configForPage = { ...this.config };
        
        // Merge page-specific data if available
        if (this.config.pageData) {
            // Always include global page data
            if (this.config.pageData.global) {
                configForPage = this._deepMerge(configForPage, this.config.pageData.global);
            }
            
            // Include page-specific data if it exists
            if (this.config.pageData.pages && this.config.pageData.pages[relativePath]) {
                configForPage = this._deepMerge(configForPage, this.config.pageData.pages[relativePath]);
            }
        }

        // Load page-specific data from content/pages/{pageName}.json
        const pageData = this._loadPageData(relativePath);
        if (pageData) {
            configForPage = this._deepMerge(configForPage, pageData);
        }
        
        // Flatten config object for easy replacement
        const flattenConfig = (obj, prefix = '') => {
            let result = {};
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    Object.assign(result, flattenConfig(value, newKey));
                } else {
                    result[newKey] = value;
                }
            }
            return result;
        };
        
        const flatConfig = flattenConfig(configForPage);
        
        // Replace {{key}} with flatConfig[key]
        processed = processed.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
            return flatConfig[key] !== undefined ? flatConfig[key] : match;
        });

        // Handle basic conditional blocks {{#if condition}}content{{/if}}
        processed = processed.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
            const conditionValue = flatConfig[condition];
            // Check if condition is truthy (not null, undefined, false, or empty string)
            if (conditionValue !== null && conditionValue !== undefined && conditionValue !== false && conditionValue !== '') {
                return content;
            }
            return '';
        });
        
        return processed;
    }

    _processTemplateVariablesWithConfig(content, config) {
        // Process template variables using a specific config object
        let processed = content;
        
        // Flatten config object for easy replacement
        const flattenConfig = (obj, prefix = '') => {
            let result = {};
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    Object.assign(result, flattenConfig(value, newKey));
                } else {
                    result[key] = value;
                }
            }
            return result;
        };
        
        const flatConfig = flattenConfig(config);
        
        // Replace {{key}} with flatConfig[key]
        processed = processed.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
            return flatConfig[key] !== undefined ? flatConfig[key] : match;
        });

        // Handle basic conditional blocks {{#if condition}}content{{/if}}
        processed = processed.replace(/\{\{#if\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
            const conditionValue = flatConfig[condition];
            // Check if condition is truthy (not null, undefined, false, or empty string)
            if (conditionValue !== null && conditionValue !== undefined && conditionValue !== false && conditionValue !== '') {
                return content;
            }
            return '';
        });
        
        return processed;
    }

    _deepMerge(target, source) {
        // Deep merge source into target
        const result = { ...target };
        
        for (const [key, value] of Object.entries(source)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = this._deepMerge(result[key] || {}, value);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }

    _loadPageData(relativePath) {
        // Load page-specific data from content/pages/{pageName}.json
        if (!relativePath) {
            return null;
        }
        
        try {
            // Extract page name without extension
            const pageName = relativePath.replace(/\.[^/.]+$/, '');
            const pageDataPath = join(process.cwd(), 'content', 'pages', `${pageName}.json`);
            
            if (existsSync(pageDataPath)) {
                const pageDataContent = readFileSync(pageDataPath, 'utf8');
                return JSON.parse(pageDataContent);
            }
        } catch (error) {
            // Silently ignore errors - page data is optional
            console.warn(`Warning: Could not load page data for ${relativePath}:`, error.message);
        }
        
        return null;
    }

    _injectAssets(content, relativePath) {
        // 1. Replace CSS/JS links with hashed versions from manifest
        for (const [original, hashed] of Object.entries(this.assetManifest)) {
            // Handle both relative and absolute paths in HTML
            // e.g. href="css/base.css" or href="/css/base.css"
            
            // Simple string replacement for now - can be improved with regex if needed
            // We replace the filename part
            const originalName = original.split('/').pop();
            const hashedName = hashed.split('/').pop();
            
            if (content.includes(originalName)) {
                content = content.replaceAll(originalName, hashedName);
            }
        }

        // 2. Inject Theme Script if missing
        if (content.includes('</head>') && !content.includes('theme-script.html')) {
             const themeScript = this.templates.getLayout('theme-script');
             content = content.replace('</head>', `    ${themeScript}\n</head>`);
        }

        return content;
    }

    _processIncludes(content, relativePath) {
        // Regex to match <!--#include file="..." -->
        // We need to handle relative paths in the include file attribute
        return content.replace(/<!--#include file="([^"]+)" -->/g, (match, includePath) => {
            // Extract component name from path (e.g., "../templates/header.html" -> "header")
            const name = includePath.split('/').pop().replace('.html', '');
            
            // Load page-specific data for template variable processing
            const pageData = this._loadPageData(relativePath);
            let configForInclude = { ...this.config };
            
            // Merge page-specific data if available
            if (this.config.pageData) {
                // Always include global page data
                if (this.config.pageData.global) {
                    configForInclude = this._deepMerge(configForInclude, this.config.pageData.global);
                }
                
                // Include page-specific data if it exists
                if (this.config.pageData.pages && this.config.pageData.pages[relativePath]) {
                    configForInclude = this._deepMerge(configForInclude, this.config.pageData.pages[relativePath]);
                }
            }
            
            if (pageData) {
                configForInclude = this._deepMerge(configForInclude, pageData);
            }
            
            // Check if it's a layout partial or a component
            if (this.templates.hasLayout(name)) {
                let template = this.templates.getLayout(name);
                template = this._processTemplateVariablesWithConfig(template, configForInclude);
                return this._adjustPaths(template, relativePath);
            } else {
                let template = this.templates.getComponent(name);
                template = this._processTemplateVariablesWithConfig(template, configForInclude);
                return this._adjustPaths(template, relativePath);
            }
        });
    }

    _processPlaceholders(content, relativePath) {
        // Restore legacy placeholder logic
        // Header
        if (content.includes('<!-- HEADER_PLACEHOLDER -->')) {
            const header = this.templates.getLayout('header');
            const processedHeader = this._processTemplateVariables(header);
            content = content.replace('<!-- HEADER_PLACEHOLDER -->', this._adjustPaths(processedHeader, relativePath));
        }

        // Footer
        if (content.includes('<!-- FOOTER_PLACEHOLDER -->')) {
            const footer = this.templates.getLayout('footer');
            const processedFooter = this._processTemplateVariables(footer);
            content = content.replace('<!-- FOOTER_PLACEHOLDER -->', this._adjustPaths(processedFooter, relativePath));
        }

        // Hero
        if (content.includes('<!-- HERO_PLACEHOLDER -->')) {
            let heroTemplateName = 'hero';
            
            // Logic from legacy build.js
            if (relativePath === 'index.html') {
                heroTemplateName = 'hero-minimal';
            } else if (relativePath === 'pricing.html') {
                heroTemplateName = 'hero-pricing';
            }

            const hero = this.templates.getLayout(heroTemplateName);
            const processedHero = this._processTemplateVariables(hero);
            content = content.replace('<!-- HERO_PLACEHOLDER -->', this._adjustPaths(processedHero, relativePath));
        }

        return content;
    }

    _adjustPaths(template, relativePath) {
        // Calculate depth
        const depth = relativePath.split(/[\\/]/).length - 1;
        const prefix = depth > 0 ? '../'.repeat(depth) : '';

        if (!prefix) return template;

        return template.replace(/href="([^"]*)"/g, (match, href) => {
            if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:')) {
                return match;
            }
            return `href="${prefix}${href}"`;
        });
    }

    _injectHead(content, relativePath, metadata = {}) {
        // 1. Inject Verification Tags
        if (content.includes('<head>')) {
            const verification = this.templates.getLayout('verification');
            if (verification) {
                content = content.replace('<head>', `<head>\n    ${verification}`);
            }
            
            // Inject Metadata (Title, Description) from Frontmatter
            if (metadata.title) {
                // Simple replacement if <title> exists, or injection
                if (content.includes('<title>')) {
                    content = content.replace(/<title>.*<\/title>/, `<title>${metadata.title}</title>`);
                } else {
                    content = content.replace('<head>', `<head>\n    <title>${metadata.title}</title>`);
                }
            }
        }

        // 2. Inject Critical CSS (if available) to prevent FOUC
        // This should be done before loading the main stylesheet
        if (this.assetManager && this.assetManager.getCriticalCss()) {
            const criticalCss = this.assetManager.getCriticalCss();
            if (criticalCss && content.includes('<head>')) {
                const criticalStyleTag = `<style>${criticalCss}</style>`;
                content = content.replace('<head>', `<head>\n    ${criticalStyleTag}`);
                console.log(`   ✅ Critical CSS inlined (${criticalCss.length} bytes)`);
            }
        }

        // 3. Inject Skip Link & Lazy Loading Scripts
        // Skip for index.html to optimize LCP
        if (relativePath !== 'index.html') {
            const skipLink = '<a href="#main-content" class="skip-link">Skip to main content</a>';

            if (content.includes('<body>')) {
                content = content.replace('<body>', `<body>\n    ${skipLink}`);
            }

            // Inject lazy loading announcement script
            content = this._injectLazyLoadingScripts(content, relativePath);
        } else {
             // Index only gets skip link
             const skipLink = '<a href="#main-content" class="skip-link">Skip to main content</a>';
             if (content.includes('<body>')) {
                content = content.replace('<body>', `<body>\n    ${skipLink}`);
             }
        }

        return content;
    }

    _injectLazyLoadingScripts(content, relativePath) {
        // Inject lazy loading announcement script
        // Check if page has announcement configuration
        const pageData = this._loadPageData(relativePath);
        const hasAnnouncement = (pageData?.announcement?.enabled !== false) ||
                               this._hasGlobalAnnouncement();

        if (hasAnnouncement && content.includes('</body>')) {
            // Get the hashed JS file from manifest
            const jsKey = 'js/announcements.js';
            const jsPath = this.assetManifest[jsKey] || '/js/announcements.js';

            // Create script tag for lazy loading
            const scriptTag = `
    <!-- Lazy Loading Announcement System -->
    <script>
        // Configuration for lazy loading
        window.announcementConfig = {
            pageName: '${relativePath.replace(/\.[^/.]+$/, '')}',
            lazyLoadDelay: 1000,
            showDelay: 500
        };
    </script>
    <script src="/${jsPath}" defer></script>`;

            content = content.replace('</body>', `${scriptTag}\n</body>`);
        }

        return content;
    }

    _hasGlobalAnnouncement() {
        try {
            const globalAnnouncementPath = join(process.cwd(), 'content', 'announcement.json');
            if (existsSync(globalAnnouncementPath)) {
                const content = readFileSync(globalAnnouncementPath, 'utf8');
                const data = JSON.parse(content);
                return data.enabled !== false && data.lazyLoading?.enabled !== false;
            }
        } catch (error) {
            // Silently ignore
        }
        return false;
    }
}
