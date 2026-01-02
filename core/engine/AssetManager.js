import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname, relative, extname } from 'path';
import * as crypto from 'crypto';

export class AssetManager {
    constructor(srcDir, distDir) {
        this.srcDir = srcDir;
        this.distDir = distDir;
        this.manifest = {};
        this.criticalCss = '';
    }

    processAssets() {
        console.log('📦 Processing Assets...');
        
        // 1. Process CSS (Minify + Hash)
        this._processCss();

        // 2. Create Critical CSS Bundle
        this._createCriticalCss();

        // 3. Create CSS Bundle (styles.css)
        this._createCssBundle();

        // 4. Process JS (Minify + Hash)
        this._processJs();

        // 5. Copy Static Assets (Images, Fonts, etc.)
        this._copyStaticAssets();

        // 6. Load Critical CSS (if available)
        this._loadCriticalCss();

        // 7. Write Manifest
        this._writeManifest();

        return this.manifest;
    }

    _processCss() {
        const cssSrc = join(this.srcDir, 'assets', 'css');
        const cssDist = join(this.distDir, 'css');

        if (!existsSync(cssSrc)) return;

        // Recursive function to process CSS files
        const processDir = (dir, relativePath = '') => {
            const entries = readdirSync(dir);
            
            for (const entry of entries) {
                const srcPath = join(dir, entry);
                const stat = statSync(srcPath);
                const relPath = relativePath ? join(relativePath, entry) : entry;

                if (stat.isDirectory()) {
                    processDir(srcPath, relPath);
                } else if (entry.endsWith('.css')) {
                    const content = readFileSync(srcPath, 'utf8');
                    const minified = this._minifyCss(content);
                    
                    // Generate Hash
                    const hash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
                    const hashedName = entry.replace('.css', `.${hash}.css`);
                    
                    // Write to Dist
                    const destPath = join(cssDist, relativePath, hashedName);
                    mkdirSync(dirname(destPath), { recursive: true });
                    writeFileSync(destPath, minified);

                    // Update Manifest
                    // Key: css/base.css -> Value: css/base.a1b2c3d4.css
                    // Normalize paths to forward slashes for web use
                    const key = `css/${relPath}`.replace(/\\/g, '/');
                    const value = `css/${relativePath ? relativePath + '/' : ''}${hashedName}`.replace(/\\/g, '/');
                    this.manifest[key] = value;
                    
                    // Also copy original filename for fallback/simplicity if needed
                    const originalDestPath = join(cssDist, relativePath, entry);
                    writeFileSync(originalDestPath, minified);
                }
            }
        };

        processDir(cssSrc);
    }

    _createCriticalCss() {
        console.log('📦 Creating Critical CSS Bundle...');
        
        // Critical CSS files (needed for initial render - above-the-fold only)
        const criticalFiles = [
            'css/critical-base.css',    // Optimized variables & resets
            'css/global/header.css',    // Header/navigation (always visible)
            'css/utilities.css'         // Essential utility classes
        ];

        let criticalContent = '';
        for (const fileKey of criticalFiles) {
            if (this.manifest[fileKey]) {
                const hashedFile = this.manifest[fileKey];
                const filePath = join(this.distDir, hashedFile);
                if (existsSync(filePath)) {
                    const content = readFileSync(filePath, 'utf8');
                    criticalContent += content + '\n';
                    console.log(`   📄 Included critical: ${fileKey} (${hashedFile})`);
                }
            } else {
                console.warn(`   ⚠️  Critical CSS file not found in manifest: ${fileKey}`);
            }
        }

        if (criticalContent) {
            // Minify the critical CSS
            const minified = this._minifyCss(criticalContent);
            
            // Write to a fixed location (not hashed since it's inlined)
            const criticalPath = join(this.distDir, 'critical.css');
            writeFileSync(criticalPath, minified);
            
            console.log(`   📦 Critical CSS: ${minified.length} bytes -> critical.css`);
            
            // Store for later use
            this.criticalCss = minified;
        } else {
            console.warn('   ⚠️  No critical CSS files found');
        }
    }

    _createCssBundle() {
        console.log('📦 Creating CSS Bundle (styles.css)...');
        
        // Bundle all common CSS files that were in the legacy build
        // This includes all the essential styling for the site
        const bundleFiles = [
            // Base styles
            'css/base.css',
            'css/layout.css',
            'css/utilities.css',
            
            // Components
            'css/components.css',
            'css/components-common.css',
            'css/components-reusable.css',
            'css/components/buttons.css',
            
            // Global elements
            'css/global/header.css',
            'css/global/footer.css',
            
            // Decorations and enhancements
            'css/hero-decorations.css'
        ];

        let bundledContent = '';
        for (const fileKey of bundleFiles) {
            if (this.manifest[fileKey]) {
                const hashedFile = this.manifest[fileKey];
                const filePath = join(this.distDir, hashedFile);
                if (existsSync(filePath)) {
                    const content = readFileSync(filePath, 'utf8');
                    bundledContent += content + '\n';
                    console.log(`   📄 Included: ${fileKey} (${hashedFile})`);
                }
            } else {
                console.warn(`   ⚠️  Bundle file not found in manifest: ${fileKey}`);
            }
        }

        if (bundledContent) {
            // Minify the bundle
            const minified = this._minifyCss(bundledContent);
            
            // Generate hash for the bundle
            const hash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
            const hashedName = `styles.${hash}.css`;
            
            // Write the bundle
            const bundlePath = join(this.distDir, hashedName);
            writeFileSync(bundlePath, minified);
            
            // Add to manifest
            this.manifest['styles.css'] = hashedName;
            
            // Also create unhashed version for fallback
            const originalBundlePath = join(this.distDir, 'styles.css');
            writeFileSync(originalBundlePath, minified);
            
            console.log(`   📦 CSS Bundle: ${minified.length} bytes -> ${hashedName}`);
        } else {
            console.warn('   ⚠️  No CSS files found for bundling');
        }
    }

    _processJs() {
        const jsSrc = join(this.srcDir, 'assets', 'js');
        const jsDist = join(this.distDir, 'js');

        if (!existsSync(jsSrc)) return;

        const processDir = (dir, relativePath = '') => {
            const entries = readdirSync(dir);
            
            for (const entry of entries) {
                const srcPath = join(dir, entry);
                const stat = statSync(srcPath);
                const relPath = relativePath ? join(relativePath, entry) : entry;

                if (stat.isDirectory()) {
                    processDir(srcPath, relPath);
                } else if (entry.endsWith('.js')) {
                    const content = readFileSync(srcPath, 'utf8');
                    const minified = this._minifyJs(content);
                    
                    // Generate Hash
                    const hash = crypto.createHash('sha256').update(minified).digest('hex').slice(0, 8);
                    const hashedName = entry.replace('.js', `.${hash}.js`);
                    
                    // Write to Dist
                    const destPath = join(jsDist, relativePath, hashedName);
                    mkdirSync(dirname(destPath), { recursive: true });
                    writeFileSync(destPath, minified);

                    // Update Manifest
                    const key = `js/${relPath}`.replace(/\\/g, '/');
                    const value = `js/${relativePath ? relativePath + '/' : ''}${hashedName}`.replace(/\\/g, '/');
                    this.manifest[key] = value;

                    // Copy original for fallback
                    const originalDestPath = join(jsDist, relativePath, entry);
                    writeFileSync(originalDestPath, minified);
                }
            }
        };

        processDir(jsSrc);
    }

    _copyStaticAssets() {
        const assetsSrc = join(this.srcDir, 'assets');
        
        // Copy everything EXCEPT css and js (already processed)
        if (!existsSync(assetsSrc)) return;

        const copyRecursive = (src, dest) => {
            if (!existsSync(src)) return;
            const stats = statSync(src);
            if (stats.isDirectory()) {
                if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
                readdirSync(src).forEach(child => {
                    // Skip css and js folders at root of assets
                    if (src === assetsSrc && (child === 'css' || child === 'js')) return;
                    copyRecursive(join(src, child), join(dest, child));
                });
            } else {
                copyFileSync(src, dest);
            }
        };

        copyRecursive(assetsSrc, this.distDir);
    }

    _loadCriticalCss() {
        // TODO: In a real implementation, we would generate this.
        // For now, we check if a critical.css exists in the source or was generated
        const criticalPath = join(this.distDir, 'css', 'critical.css');
        if (existsSync(criticalPath)) {
            this.criticalCss = readFileSync(criticalPath, 'utf8');
        }
    }

    _writeManifest() {
        writeFileSync(
            join(this.distDir, 'asset-manifest.json'),
            JSON.stringify(this.manifest, null, 2)
        );
    }

    _minifyCss(content) {
        // Simple regex-based minifier from legacy code
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(?<!:)\/\/.*/g, '')
            .split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n')
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*,\s*/g, ',')
            .replace(/;\s*}/g, '}')
            .replace(/\s+!important/g, ' !important')
            .trim();
    }

    _minifyJs(content) {
        return content
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(?<!:)\/\/.*/g, '')
            .replace(/^\s+|\s+$/gm, '')
            .replace(/\n+/g, '\n');
    }

    getCriticalCss() {
        return this.criticalCss;
    }
}
