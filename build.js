#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple build script for Clodo Framework website
 * Minifies CSS and JS, copies assets to dist folder
 */

console.log('🚀 Building Clodo Framework website...');

// Clean dist directory
function cleanDist() {
    console.log('🧹 Cleaning dist directory...');
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }
    fs.mkdirSync('dist', { recursive: true });
}

// Copy HTML files
function copyHtml() {
    console.log('📄 Copying HTML files...');
    const htmlFiles = ['index.html', 'about.html', 'docs.html', 'examples.html', 'pricing.html', 'components.html', 'subscribe.html'];
    htmlFiles.forEach(file => {
        const srcPath = path.join('public', file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join('dist', file));
        }
    });
}

// Minify CSS (simple minification)
function bundleCss() {
    console.log('🎨 Bundling CSS...');
    const cssFiles = [
        'base.css',
        'utilities.css',
        'components.css',
        'layout.css',
        'pages/index.css',
        'pages/subscribe.css'
    ];
    let bundled = '';

    cssFiles.forEach(file => {
        const filePath = path.join('public', 'css', file);
        if (fs.existsSync(filePath)) {
            bundled += fs.readFileSync(filePath, 'utf8') + '\n';
        }
    });

    // Simple minification
    let minified = bundled
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*{\s*/g, '{') // Remove spaces around braces
        .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
        .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
        .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
        .trim();

    fs.writeFileSync(path.join('dist', 'styles.css'), minified);
    fs.writeFileSync(path.join('public', 'styles.css'), minified);
}

function minifyCss() {
    console.log('🎨 Minifying individual CSS...');
    const cssDir = path.join('public', 'css');
    const distCssDir = path.join('dist', 'css');

    if (!fs.existsSync(cssDir)) return;

    fs.mkdirSync(distCssDir, { recursive: true });

    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));

    cssFiles.forEach(file => {
        const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
        // Simple minification: remove comments, extra whitespace
        let minified = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/\s*{\s*/g, '{') // Remove spaces around braces
            .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
            .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
            .replace(/;\s*}/g, '}') // Remove semicolon before closing brace
            .trim();

        fs.writeFileSync(path.join(distCssDir, file), minified);
    });
}

// Minify JavaScript (simple minification)
function minifyJs() {
    console.log('⚡ Minifying JavaScript...');
    const jsFile = path.join('public', 'script.js');
    const distJsFile = path.join('dist', 'script.js');

    if (!fs.existsSync(jsFile)) return;

    let content = fs.readFileSync(jsFile, 'utf8');

    // Simple minification: remove comments and extra whitespace
    let minified = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/\s*{\s*/g, '{') // Remove spaces around braces
        .replace(/\s*}\s*/g, '}') // Remove spaces around closing braces
        .replace(/\s*\(\s*/g, '(') // Remove spaces around parentheses
        .replace(/\s*\)\s*/g, ')') // Remove spaces around parentheses
        .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
        .trim();

    fs.writeFileSync(distJsFile, minified);
}

// Copy JavaScript config files
function copyJsConfigs() {
    console.log('📋 Copying JavaScript config files...');

    // Handle brevo-config.js specially - inline secure config if available
    const configSrc = path.join('public', 'brevo-config.js');
    const configDist = path.join('dist', 'brevo-config.js');
    const secureConfigSrc = path.join('public', 'brevo-secure-config.js');

    if (fs.existsSync(configSrc)) {
        let configContent = fs.readFileSync(configSrc, 'utf8');

        // If secure config exists, inline it into the main config
        if (fs.existsSync(secureConfigSrc)) {
            const secureContent = fs.readFileSync(secureConfigSrc, 'utf8');
            // Extract the BREVO_SECURE_CONFIG object
            const secureMatch = secureContent.match(/window\.BREVO_SECURE_CONFIG\s*=\s*({[\s\S]*?});/);
            if (secureMatch) {
                const secureConfig = secureMatch[1];
                // Add the secure config at the beginning of brevo-config.js
                configContent = `// Inlined secure configuration for production
window.BREVO_SECURE_CONFIG = ${secureConfig};

${configContent}`;
                console.log('  ✓ Inlined secure config into brevo-config.js');
            } else {
                console.log('  ⚠️  Could not parse secure config, copying separately');
                fs.copyFileSync(configSrc, configDist);
            }
        } else if (process.env.BREVO_API_KEY && process.env.BREVO_LIST_ID) {
            // Generate from environment variables
            const secureConfig = `{
    API_KEY: '${process.env.BREVO_API_KEY}',
    LIST_ID: ${parseInt(process.env.BREVO_LIST_ID)}
}`;
            configContent = `// Generated secure configuration from environment variables
window.BREVO_SECURE_CONFIG = ${secureConfig};

${configContent}`;
            console.log('  ✓ Generated and inlined secure config from environment variables');
        } else {
            console.log('  ⚠️  No secure config available, copying brevo-config.js as-is');
            fs.copyFileSync(configSrc, configDist);
        }

        fs.writeFileSync(configDist, configContent);
    }
}

// Copy other assets
function copyAssets() {
    console.log('📦 Copying assets...');
    // Copy bundled stylesheet
    if (fs.existsSync(path.join('public', 'styles.css'))) {
        fs.copyFileSync(
            path.join('public', 'styles.css'),
            path.join('dist', 'styles.css')
        );
    }
    // Copy legacy stylesheet for any pages that may still reference it
    if (fs.existsSync(path.join('public', 'styles-organized.css'))) {
        fs.copyFileSync(
            path.join('public', 'styles-organized.css'),
            path.join('dist', 'styles-organized.css')
        );
    }
    // Copy root assets like sitemap and robots if present
    ['robots.txt', 'sitemap.xml', 'site.webmanifest'].forEach(file => {
        const src = path.join('public', file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join('dist', file));
        }
    });

    // Copy icons directory if present
    const iconsSrc = path.join('public', 'icons');
    const iconsDest = path.join('dist', 'icons');
    if (fs.existsSync(iconsSrc)) {
        fs.mkdirSync(iconsDest, { recursive: true });
        for (const entry of fs.readdirSync(iconsSrc)) {
            const srcPath = path.join(iconsSrc, entry);
            const destPath = path.join(iconsDest, entry);
            const stat = fs.statSync(srcPath);
            if (stat.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                for (const sub of fs.readdirSync(srcPath)) {
                    fs.copyFileSync(path.join(srcPath, sub), path.join(destPath, sub));
                }
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

// Generate build info
function generateBuildInfo() {
    console.log('📊 Generating build info...');
    const buildInfo = {
        buildTime: new Date().toISOString(),
        version: require('./package.json').version,
        commit: process.env.GITHUB_SHA || 'local-build'
    };

    fs.writeFileSync(
        path.join('dist', 'build-info.json'),
        JSON.stringify(buildInfo, null, 2)
    );
}

// Main build process
try {
    cleanDist();
    copyHtml();
    bundleCss();
    minifyCss();
    minifyJs();
    copyJsConfigs();
    copyAssets();
    generateBuildInfo();

    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: ./dist');
    console.log('🚀 Ready for deployment');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}