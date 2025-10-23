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
    const htmlFiles = ['index.html', 'about.html', 'docs.html', 'examples.html', 'pricing.html'];
    htmlFiles.forEach(file => {
        const srcPath = path.join('public', file);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join('dist', file));
        }
    });
}

// Minify CSS (simple minification)
function minifyCss() {
    console.log('🎨 Minifying CSS...');
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

// Copy other assets
function copyAssets() {
    console.log('📦 Copying assets...');
    // Copy styles-organized.css
    if (fs.existsSync(path.join('public', 'styles-organized.css'))) {
        fs.copyFileSync(
            path.join('public', 'styles-organized.css'),
            path.join('dist', 'styles-organized.css')
        );
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
    minifyCss();
    minifyJs();
    copyAssets();
    generateBuildInfo();

    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: ./dist');
    console.log('🚀 Ready for deployment');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}