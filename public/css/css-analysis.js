#!/usr/bin/env node

/**
 * CSS Reusability and Consolidation Analysis Script
 *
 * This script analyzes the CSS folder structure to identify opportunities for:
 * - Reusability: Common patterns that can be abstracted into reusable components
 * - Consolidation: Duplicate styles that can be merged or standardized
 * - Consistency: Inconsistent naming, values, or approaches
 * - Design System Integration: Styles that should use design tokens
 *
 * Usage: node css-analysis.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CSSAnalyzer {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.files = [];
        this.analysis = {
            selectors: new Map(),
            properties: new Map(),
            values: new Map(),
            colors: new Map(),
            spacing: new Map(),
            typography: new Map(),
            components: new Map(),
            duplicates: new Map(),
            patterns: new Map()
        };
    }

    async scanDirectory(dirPath = '') {
        const fullPath = path.join(this.rootPath, dirPath);
        const items = await readdir(fullPath);

        for (const item of items) {
            const itemPath = path.join(fullPath, item);
            const relativePath = path.join(dirPath, item);
            const stats = await stat(itemPath);

            if (stats.isDirectory()) {
                await this.scanDirectory(relativePath);
            } else if (item.endsWith('.css')) {
                this.files.push({
                    path: relativePath,
                    fullPath: itemPath,
                    size: stats.size,
                    name: item
                });
            }
        }
    }

    async analyzeFiles() {
        console.log(`🔍 Analyzing ${this.files.length} CSS files...\n`);

        for (const file of this.files) {
            try {
                const content = await readFile(file.fullPath, 'utf8');
                this.analyzeFile(file, content);
            } catch (error) {
                console.warn(`⚠️  Could not read ${file.path}: ${error.message}`);
            }
        }
    }

    analyzeFile(file, content) {
        // Remove comments and normalize whitespace
        const cleanContent = content
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // Extract selectors
        this.extractSelectors(file, cleanContent);

        // Extract properties and values
        this.extractProperties(file, cleanContent);

        // Extract colors
        this.extractColors(file, cleanContent);

        // Extract spacing patterns
        this.extractSpacing(file, cleanContent);

        // Extract typography patterns
        this.extractTypography(file, cleanContent);

        // Identify component patterns
        this.identifyComponents(file, cleanContent);
    }

    extractSelectors(file, content) {
        // Match CSS selectors (simplified regex)
        const selectorRegex = /([^{}]+)\s*\{[^}]*\}/g;
        let match;

        while ((match = selectorRegex.exec(content)) !== null) {
            const selector = match[1].trim();
            const key = selector.toLowerCase().replace(/\s+/g, ' ');

            if (!this.analysis.selectors.has(key)) {
                this.analysis.selectors.set(key, []);
            }
            this.analysis.selectors.get(key).push({
                selector,
                file: file.path,
                line: this.getLineNumber(content, match.index)
            });
        }
    }

    extractProperties(file, content) {
        const propertyRegex = /([a-z-]+)\s*:\s*([^;]+);/g;
        let match;

        while ((match = propertyRegex.exec(content)) !== null) {
            const property = match[1].trim();
            const value = match[2].trim();

            if (!this.analysis.properties.has(property)) {
                this.analysis.properties.set(property, new Map());
            }

            const propMap = this.analysis.properties.get(property);
            if (!propMap.has(value)) {
                propMap.set(value, []);
            }
            propMap.get(value).push({
                file: file.path,
                line: this.getLineNumber(content, match.index)
            });
        }
    }

    extractColors(file, content) {
        const colorRegex = /#([0-9a-f]{3,8})|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/gi;
        let match;

        while ((match = colorRegex.exec(content)) !== null) {
            const color = match[0].toLowerCase();
            if (!this.analysis.colors.has(color)) {
                this.analysis.colors.set(color, []);
            }
            this.analysis.colors.get(color).push({
                file: file.path,
                line: this.getLineNumber(content, match.index)
            });
        }
    }

    extractSpacing(file, content) {
        const spacingProps = ['margin', 'padding', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                             'padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
        const spacingRegex = new RegExp(`(${spacingProps.join('|')})\\s*:\\s*([^;]+);`, 'g');
        let match;

        while ((match = spacingRegex.exec(content)) !== null) {
            const value = match[2].trim();
            if (!this.analysis.spacing.has(value)) {
                this.analysis.spacing.set(value, []);
            }
            this.analysis.spacing.get(value).push({
                property: match[1],
                file: file.path,
                line: this.getLineNumber(content, match.index)
            });
        }
    }

    extractTypography(file, content) {
        const typographyProps = ['font-size', 'font-weight', 'font-family', 'line-height', 'letter-spacing'];
        const typographyRegex = new RegExp(`(${typographyProps.join('|')})\\s*:\\s*([^;]+);`, 'g');
        let match;

        while ((match = typographyRegex.exec(content)) !== null) {
            const value = match[2].trim();
            if (!this.analysis.typography.has(value)) {
                this.analysis.typography.set(value, []);
            }
            this.analysis.typography.get(value).push({
                property: match[1],
                file: file.path,
                line: this.getLineNumber(content, match.index)
            });
        }
    }

    identifyComponents(file, content) {
        // Look for common component patterns
        const componentPatterns = [
            { name: 'buttons', regex: /\.btn|\.button/g },
            { name: 'cards', regex: /\.card/g },
            { name: 'heroes', regex: /\.hero/g },
            { name: 'grids', regex: /\.grid/g },
            { name: 'forms', regex: /\.form|\.input/g },
            { name: 'navigation', regex: /\.nav|\.menu/g },
            { name: 'modals', regex: /\.modal/g },
            { name: 'tables', regex: /\.table/g }
        ];

        componentPatterns.forEach(pattern => {
            if (pattern.regex.test(content)) {
                if (!this.analysis.components.has(pattern.name)) {
                    this.analysis.components.set(pattern.name, []);
                }
                this.analysis.components.get(pattern.name).push({
                    file: file.path,
                    matches: content.match(pattern.regex)?.length || 0
                });
            }
        });
    }

    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    analyzeDuplicates() {
        // Find duplicate selectors
        for (const [selector, occurrences] of this.analysis.selectors) {
            if (occurrences.length > 1) {
                this.analysis.duplicates.set(selector, occurrences);
            }
        }
    }

    identifyPatterns() {
        // Identify common value patterns that could be design tokens
        this.identifyValuePatterns('colors', this.analysis.colors, 3);
        this.identifyValuePatterns('spacing', this.analysis.spacing, 5);
        this.identifyValuePatterns('typography', this.analysis.typography, 3);
    }

    identifyValuePatterns(type, data, threshold) {
        const patterns = [];

        for (const [value, occurrences] of data) {
            if (occurrences.length >= threshold) {
                patterns.push({
                    value,
                    count: occurrences.length,
                    files: [...new Set(occurrences.map(o => o.file))]
                });
            }
        }

        patterns.sort((a, b) => b.count - a.count);
        this.analysis.patterns.set(type, patterns);
    }

    generateReport() {
        console.log('📊 CSS Reusability & Consolidation Analysis Report\n');
        console.log('=' .repeat(60));

        // File overview
        console.log(`\n📁 Files Analyzed: ${this.files.length}`);
        console.log(`📏 Total CSS Size: ${Math.round(this.files.reduce((sum, f) => sum + f.size, 0) / 1024)}KB`);

        // Duplicate selectors
        console.log(`\n🔄 Duplicate Selectors: ${this.analysis.duplicates.size}`);
        if (this.analysis.duplicates.size > 0) {
            console.log('Top duplicates:');
            const sorted = [...this.analysis.duplicates.entries()]
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 10);

            sorted.forEach(([selector, occurrences]) => {
                console.log(`  • "${selector}" (${occurrences.length} times)`);
                console.log(`    Files: ${occurrences.map(o => o.file).join(', ')}`);
            });
        }

        // Color patterns
        console.log(`\n🎨 Color Patterns: ${this.analysis.patterns.get('colors')?.length || 0}`);
        const colors = this.analysis.patterns.get('colors') || [];
        if (colors.length > 0) {
            console.log('Most used colors (potential design tokens):');
            colors.slice(0, 10).forEach(color => {
                console.log(`  • ${color.value} (${color.count} uses in ${color.files.length} files)`);
            });
        }

        // Spacing patterns
        console.log(`\n📐 Spacing Patterns: ${this.analysis.patterns.get('spacing')?.length || 0}`);
        const spacing = this.analysis.patterns.get('spacing') || [];
        if (spacing.length > 0) {
            console.log('Most used spacing values (potential design tokens):');
            spacing.slice(0, 10).forEach(space => {
                console.log(`  • ${space.value} (${space.count} uses in ${space.files.length} files)`);
            });
        }

        // Typography patterns
        console.log(`\n📝 Typography Patterns: ${this.analysis.patterns.get('typography')?.length || 0}`);
        const typography = this.analysis.patterns.get('typography') || [];
        if (typography.length > 0) {
            console.log('Most used typography values (potential design tokens):');
            typography.slice(0, 10).forEach(typo => {
                console.log(`  • ${typo.value} (${typo.count} uses in ${typo.files.length} files)`);
            });
        }

        // Component patterns
        console.log(`\n🧩 Component Patterns:`);
        for (const [component, files] of this.analysis.components) {
            const totalUses = files.reduce((sum, f) => sum + f.matches, 0);
            console.log(`  • ${component}: ${totalUses} uses across ${files.length} files`);
        }

        // Recommendations
        this.generateRecommendations();
    }

    generateRecommendations() {
        console.log(`\n💡 Recommendations for Reusability & Consolidation:`);
        console.log('-'.repeat(50));

        // Design token recommendations
        const colorTokens = (this.analysis.patterns.get('colors') || []).length;
        const spacingTokens = (this.analysis.patterns.get('spacing') || []).length;
        const typographyTokens = (this.analysis.patterns.get('typography') || []).length;

        if (colorTokens > 0) {
            console.log(`🎨 Add ${colorTokens} color values to design-tokens.css`);
        }
        if (spacingTokens > 0) {
            console.log(`📐 Add ${spacingTokens} spacing values to design-tokens.css`);
        }
        if (typographyTokens > 0) {
            console.log(`📝 Add ${typographyTokens} typography values to design-tokens.css`);
        }

        // Component consolidation
        const componentCount = this.analysis.components.size;
        if (componentCount > 0) {
            console.log(`🧩 Create ${componentCount} reusable component classes in components.css`);
        }

        // Duplicate consolidation
        const duplicateCount = this.analysis.duplicates.size;
        if (duplicateCount > 0) {
            console.log(`🔄 Consolidate ${duplicateCount} duplicate selectors`);
        }

        // Framework integration
        console.log(`🔧 Migrate page-specific styles to use framework design tokens`);
        console.log(`📦 Create utility classes for common property-value combinations`);
        console.log(`🎯 Implement consistent naming conventions across all CSS files`);

        console.log(`\n🚀 Next Steps:`);
        console.log(`1. Review duplicate selectors and consolidate where possible`);
        console.log(`2. Add identified patterns to design-tokens.css`);
        console.log(`3. Create reusable component classes`);
        console.log(`4. Update existing CSS files to use the framework`);
        console.log(`5. Establish CSS architecture guidelines`);
    }

    async run() {
        console.log('🚀 Starting CSS Reusability Analysis...\n');
        console.log('CSS Path:', this.rootPath);

        await this.scanDirectory();
        console.log(`Found ${this.files.length} CSS files`);

        await this.analyzeFiles();
        this.analyzeDuplicates();
        this.identifyPatterns();
        this.generateReport();

        console.log('\n✅ Analysis complete!');
    }
}

// Run the analysis
async function main() {
    console.log('Starting main function...');
    const cssPath = path.join(process.cwd(), 'public', 'css');

    if (!fs.existsSync(cssPath)) {
        console.error('❌ CSS directory not found:', cssPath);
        console.error('Please run this script from the project root directory.');
        process.exit(1);
    }

    console.log('CSS path exists:', cssPath);
    const analyzer = new CSSAnalyzer(cssPath);
    await analyzer.run();
}

// Always run main when this file is executed directly
main().catch(console.error);

export default CSSAnalyzer;