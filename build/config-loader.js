#!/usr/bin/env node

/**
 * Configuration Loader for Build System
 * 
 * Loads and validates configuration files, providing a unified interface
 * for the build system to access site settings, navigation, and page bundles.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const configDir = join(rootDir, 'config');

/**
 * Load JSON configuration file
 */
function loadJsonConfig(filename) {
    const filePath = join(configDir, filename);
    if (!existsSync(filePath)) {
        console.warn(`⚠️  Config file not found: ${filename}, using defaults`);
        return null;
    }
    try {
        const content = readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error.message);
        return null;
    }
}

/**
 * Load JavaScript configuration file (ES module)
 */
async function loadJsConfig(filename) {
    const filePath = join(configDir, filename);
    if (!existsSync(filePath)) {
        console.warn(`⚠️  Config file not found: ${filename}, using defaults`);
        return null;
    }
    try {
        const module = await import(`file://${filePath.replace(/\\/g, '/')}`);
        return module.default;
    } catch (error) {
        console.error(`❌ Error loading ${filename}:`, error.message);
        return null;
    }
}

/**
 * Load environment variables from .env file (if exists)
 */
function loadEnvFile() {
    const envPath = join(rootDir, '.env');
    if (!existsSync(envPath)) {
        return {};
    }
    
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                envVars[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    
    return envVars;
}

/**
 * Default site configuration
 */
const defaultSiteConfig = {
    site: {
        name: 'My Website',
        shortName: 'MySite',
        tagline: 'Your tagline here',
        description: 'Website description',
        url: 'https://example.com',
        language: 'en',
        locale: 'en_US'
    },
    branding: {
        colors: {
            primary: '#1d4ed8',
            secondary: '#6366f1'
        }
    },
    social: {},
    contact: {
        email: {
            general: 'contact@example.com'
        }
    },
    build: {
        outDir: 'dist',
        publicDir: 'public'
    }
};

/**
 * Default pages configuration
 */
const defaultPagesConfig = {
    bundleDetection: {
        rules: [],
        defaultBundle: 'common'
    },
    pageBundles: {},
    commonCss: {
        files: []
    }
};

/**
 * Determine page bundle based on file path using config rules
 */
function getPageBundle(filePath, pagesConfig) {
    const rules = pagesConfig?.bundleDetection?.rules || [];
    const defaultBundle = pagesConfig?.bundleDetection?.defaultBundle || 'common';
    
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop().replace('.html', '');
    
    // Sort rules by priority (higher priority first)
    const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    for (const rule of sortedRules) {
        if (rule.exact) {
            // Exact match on filename
            if (normalizedPath.endsWith(rule.pattern)) {
                return rule.bundle;
            }
        } else if (rule.pattern.endsWith('/')) {
            // Directory match
            if (normalizedPath.includes(rule.pattern)) {
                return rule.bundle;
            }
        } else {
            // Substring match on filename
            if (fileName.includes(rule.pattern)) {
                return rule.bundle;
            }
        }
    }
    
    return defaultBundle;
}

/**
 * Get CSS files for a specific page bundle
 */
function getCssBundleFiles(bundleName, pagesConfig) {
    const bundle = pagesConfig?.pageBundles?.[bundleName];
    return bundle?.css || [];
}

/**
 * Get deferred CSS files for a specific page bundle
 */
function getDeferredCssFiles(bundleName, pagesConfig) {
    const bundle = pagesConfig?.pageBundles?.[bundleName];
    return bundle?.deferred || [];
}

/**
 * Get common CSS files
 */
function getCommonCssFiles(pagesConfig) {
    return pagesConfig?.commonCss?.files || [];
}

/**
 * Template variable processor
 * Replaces {{variable}} placeholders with values from config
 */
function processTemplateVariables(content, siteConfig, extraVars = {}) {
    // Build flat variable map from nested config
    const vars = {
        // Site variables
        siteName: siteConfig?.site?.name || '',
        siteShortName: siteConfig?.site?.shortName || '',
        siteTagline: siteConfig?.site?.tagline || '',
        siteDescription: siteConfig?.site?.description || '',
        siteUrl: siteConfig?.site?.url || '',
        baseUrl: siteConfig?.site?.url || '',
        language: siteConfig?.site?.language || 'en',
        locale: siteConfig?.site?.locale || 'en_US',
        
        // Copyright
        'copyright.holder': siteConfig?.site?.copyright?.holder || siteConfig?.site?.name || '',
        'copyright.year': siteConfig?.site?.copyright?.year || new Date().getFullYear(),
        'copyright.startYear': siteConfig?.site?.copyright?.startYear || new Date().getFullYear(),
        
        // Branding
        'branding.logo.path': siteConfig?.branding?.logo?.path || '/logo.svg',
        'branding.logo.alt': siteConfig?.branding?.logo?.alt || `${siteConfig?.site?.name} Logo`,
        'branding.colors.primary': siteConfig?.branding?.colors?.primary || '#1d4ed8',
        'branding.colors.secondary': siteConfig?.branding?.colors?.secondary || '#6366f1',
        'branding.colors.themeColor': siteConfig?.branding?.colors?.themeColor || '#1d4ed8',
        
        // Social links
        'social.twitter.url': siteConfig?.social?.twitter?.url || '',
        'social.twitter.handle': siteConfig?.social?.twitter?.handle || '',
        'social.github.url': siteConfig?.social?.github?.url || '',
        'social.github.org': siteConfig?.social?.github?.org || '',
        'social.github.repo': siteConfig?.social?.github?.repo || '',
        'social.linkedin.url': siteConfig?.social?.linkedin?.url || '',
        'social.discord.url': siteConfig?.social?.discord?.url || '',
        
        // Contact
        'contact.email.general': siteConfig?.contact?.email?.general || '',
        'contact.email.support': siteConfig?.contact?.email?.support || '',
        'contact.email.sales': siteConfig?.contact?.email?.sales || '',
        
        // Schema.org
        'schema.organization.name': siteConfig?.schema?.organization?.name || siteConfig?.site?.name || '',
        'schema.organization.legalName': siteConfig?.schema?.organization?.legalName || '',
        
        // Content
        'content.defaultAuthor.name': siteConfig?.content?.defaultAuthor?.name || '',
        'content.defaultAuthor.email': siteConfig?.content?.defaultAuthor?.email || '',
        
        // Extra variables passed in
        ...extraVars
    };
    
    // Replace all {{variable}} patterns
    return content.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        const trimmedName = varName.trim();
        if (trimmedName in vars) {
            return vars[trimmedName];
        }
        // Check for nested access like social.github.url
        if (trimmedName in vars) {
            return vars[trimmedName];
        }
        console.warn(`⚠️  Unknown template variable: ${trimmedName}`);
        return match; // Keep original if not found
    });
}

/**
 * Main configuration loader
 */
async function loadConfig() {
    console.log('📁 Loading configuration files...');
    
    // Load environment variables first
    const envVars = loadEnvFile();
    
    // Load site config (JS module for flexibility)
    let siteConfig = await loadJsConfig('site.config.js');
    if (!siteConfig) {
        console.log('   Using default site configuration');
        siteConfig = defaultSiteConfig;
    }
    
    // Load navigation config
    const navigationConfig = loadJsonConfig('navigation.json');
    
    // Load pages config
    let pagesConfig = loadJsonConfig('pages.config.json');
    if (!pagesConfig) {
        console.log('   Using default pages configuration');
        pagesConfig = defaultPagesConfig;
    }
    
    // Merge environment variables into config
    if (envVars.BREVO_API_KEY) {
        siteConfig.services = siteConfig.services || {};
        siteConfig.services.newsletter = siteConfig.services.newsletter || {};
        siteConfig.services.newsletter.apiKey = envVars.BREVO_API_KEY;
    }
    if (envVars.BREVO_LIST_ID) {
        siteConfig.services = siteConfig.services || {};
        siteConfig.services.newsletter = siteConfig.services.newsletter || {};
        siteConfig.services.newsletter.listId = envVars.BREVO_LIST_ID;
    }
    if (envVars.BREVO_WIDGET_ID) {
        siteConfig.services = siteConfig.services || {};
        siteConfig.services.chat = siteConfig.services.chat || {};
        siteConfig.services.chat.widgetId = envVars.BREVO_WIDGET_ID;
    }
    
    console.log(`   ✓ Site: ${siteConfig.site?.name || 'Not configured'}`);
    console.log(`   ✓ Navigation: ${navigationConfig ? 'Loaded' : 'Using defaults'}`);
    console.log(`   ✓ Pages: ${Object.keys(pagesConfig?.pageBundles || {}).length} bundles configured`);
    
    return {
        site: siteConfig,
        navigation: navigationConfig,
        pages: pagesConfig,
        env: envVars,
        
        // Helper functions
        getPageBundle: (filePath) => getPageBundle(filePath, pagesConfig),
        getCssBundleFiles: (bundleName) => getCssBundleFiles(bundleName, pagesConfig),
        getDeferredCssFiles: (bundleName) => getDeferredCssFiles(bundleName, pagesConfig),
        getCommonCssFiles: () => getCommonCssFiles(pagesConfig),
        processTemplateVariables: (content, extraVars) => processTemplateVariables(content, siteConfig, extraVars)
    };
}

export {
    loadConfig,
    loadJsonConfig,
    loadJsConfig,
    loadEnvFile,
    getPageBundle,
    getCssBundleFiles,
    getDeferredCssFiles,
    getCommonCssFiles,
    processTemplateVariables,
    defaultSiteConfig,
    defaultPagesConfig
};

export default loadConfig;
