import { rmSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { TemplateManager } from './TemplateManager.js';
import { PageProcessor } from './PageProcessor.js';
import { AssetManager } from './AssetManager.js';
import { SeoGenerator } from './SeoGenerator.js';
import { I18nProcessor } from './I18nProcessor.js';

export class BuildEngine {
    constructor(config) {
        this.config = config;
        this.srcDir = 'src';
        this.distDir = 'dist';
        this.templateManager = new TemplateManager(join(this.srcDir, 'layouts'), join(this.srcDir, 'components'));
        this.assetManager = new AssetManager(this.srcDir, this.distDir);
        this.seoGenerator = new SeoGenerator(config);
        this.i18nProcessor = new I18nProcessor(config);
    }

    async build() {
        console.log('🚀 Starting Build Engine...');
        
        // 1. Clean Dist
        this.cleanDist();

        // 2. Process Assets (Minify, Hash, Manifest)
        // Must be done BEFORE pages so we have the manifest
        const assetManifest = this.assetManager.processAssets();

        // 3. Load Templates
        this.templateManager.loadAll();

        // 4. Initialize Processor with Manifest
        const processor = new PageProcessor(this.config, this.templateManager, assetManifest, this.assetManager);

        // 5. Process Pages
        const processedFiles = this.processPages(processor);

        // 6. Generate SEO Files
        this.seoGenerator.generate(processedFiles, this.distDir);

        // 7. Generate Localized Pages
        await this.i18nProcessor.generate(processedFiles, this.distDir);

        console.log('✅ Build Complete.');
    }

    cleanDist() {
        if (existsSync(this.distDir)) {
            rmSync(this.distDir, { recursive: true, force: true });
        }
        mkdirSync(this.distDir, { recursive: true });
    }

    processPages(processor) {
        const pagesDir = join(this.srcDir, 'pages');
        const files = this.getFiles(pagesDir);
        const processedFiles = [];

        for (const file of files) {
            const relativePath = relative(pagesDir, file);
            // Handle .md files -> .html in dist
            const distRelativePath = relativePath.replace('.md', '.html');
            const distPath = join(this.distDir, distRelativePath);
            
            if (file.endsWith('.html') || file.endsWith('.md')) {
                console.log(`📄 Processing: ${relativePath}`);
                const content = readFileSync(file, 'utf8');
                const processed = processor.process(content, file, relativePath);
                
                mkdirSync(dirname(distPath), { recursive: true });
                writeFileSync(distPath, processed);
                processedFiles.push(distRelativePath);
            } else {
                // Copy non-html files in pages dir (e.g. images in blog folders)
                mkdirSync(dirname(distPath), { recursive: true });
                copyFileSync(file, distPath);
            }
        }
        return processedFiles;
    }

    // copyAssets removed - handled by AssetManager

    getFiles(dir) {
        let results = [];
        if (!existsSync(dir)) return results;
        
        const list = readdirSync(dir);
        for (const file of list) {
            const filePath = join(dir, file);
            const stat = statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(this.getFiles(filePath));
            } else {
                results.push(filePath);
            }
        }
        return results;
    }

    copyRecursive(src, dest) {
        if (!existsSync(src)) return;
        const stats = statSync(src);
        if (stats.isDirectory()) {
            if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
            readdirSync(src).forEach(childItemName => {
                this.copyRecursive(join(src, childItemName), join(dest, childItemName));
            });
        } else {
            copyFileSync(src, dest);
        }
    }
}
