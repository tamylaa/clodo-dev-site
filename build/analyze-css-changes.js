/**
 * CSS Changes Analyzer
 * Compares modified CSS files with git history to identify:
 * 1. What styling was removed
 * 2. What styling is actually used on pages
 * 3. What can be defer-loaded vs needs to be critical
 * 4. Recommendations for restoring necessary styles
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSS files that were modified (from git status)
const MODIFIED_CSS_FILES = [
    'public/css/base.css',
    'public/css/components.css',
    'public/css/layout.css',
    'public/css/pages/index.css',
    'public/css/pages/index/hero.css',
    'public/css/pages/subscribe.css',
    'public/css/utilities.css',
    'public/styles.css'
];

// New CSS files created (not in git)
const NEW_CSS_FILES = [
    'public/css/components-common.css',
    'public/css/components-common-backup.css',
    'public/css/components-page-specific.css',
    'public/css/critical-base.css',
    'public/css/hero-decorations.css',
    'public/css/pages/index/hero-animations.css'
];

/**
 * Get git diff for a file
 */
function getGitDiff(filePath) {
    try {
        const diff = execSync(`git diff HEAD -- "${filePath}"`, { 
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        return diff;
    } catch (error) {
        return null;
    }
}

/**
 * Get committed version of file
 */
function getCommittedVersion(filePath) {
    try {
        const content = execSync(`git show HEAD:"${filePath}"`, { 
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024
        });
        return content;
    } catch (error) {
        return null;
    }
}

/**
 * Parse CSS to extract selectors
 */
function extractCSSSelectors(cssContent) {
    const selectors = [];
    // Match CSS selectors (simplified - handles most common cases)
    const regex = /([.#]?[\w-]+(?:\s*[>+~]\s*[\w-]+)*(?:\s*:\w+)?)\s*\{/g;
    let match;
    
    while ((match = regex.exec(cssContent)) !== null) {
        selectors.push(match[1].trim());
    }
    
    return selectors;
}

/**
 * Extract CSS rules (selector + properties)
 */
function extractCSSRules(cssContent) {
    const rules = [];
    // Match complete CSS rules
    const regex = /([^{}]+)\{([^{}]+)\}/g;
    let match;
    
    while ((match = regex.exec(cssContent)) !== null) {
        const selector = match[1].trim();
        const properties = match[2].trim();
        rules.push({ selector, properties });
    }
    
    return rules;
}

/**
 * Check if selector is used in HTML files
 */
function isSelectorUsedInHTML(selector, htmlDir = 'dist') {
    try {
        // Clean selector for searching (remove pseudo-classes, etc)
        const cleanSelector = selector.replace(/:[^\s,]+/g, '').replace(/\s*[>+~]\s*/g, ' ');
        const searchTerms = cleanSelector.match(/[.#][\w-]+/g);
        
        if (!searchTerms) return false;
        
        // Search for class or id in HTML files
        for (const term of searchTerms) {
            const searchValue = term.substring(1); // Remove . or #
            const isClass = term.startsWith('.');
            const pattern = isClass ? `class="[^"]*${searchValue}[^"]*"` : `id="${searchValue}"`;
            
            try {
                const result = execSync(`findstr /s /i /c:"${searchValue}" "${htmlDir}\\*.html"`, {
                    encoding: 'utf-8',
                    stdio: ['pipe', 'pipe', 'ignore']
                });
                if (result) return true;
            } catch (e) {
                // No match found
            }
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Categorize CSS rules
 */
function categorizeCSS(rules) {
    const categories = {
        critical: [],      // Above-the-fold (hero, header, nav)
        aboveFold: [],     // Potentially visible on load
        belowFold: [],     // Definitely below fold
        interactive: [],   // Hover, focus, active states
        responsive: [],    // Media queries
        animations: [],    // Animations and transitions
        unused: []         // Not found in HTML
    };
    
    rules.forEach(rule => {
        const { selector, properties } = rule;
        
        // Critical: header, nav, hero
        if (/^(header|nav|\.hero|#hero|\.navbar)/i.test(selector)) {
            categories.critical.push(rule);
        }
        // Interactive states
        else if (/:hover|:focus|:active|:checked/i.test(selector)) {
            categories.interactive.push(rule);
        }
        // Animations
        else if (/@keyframes|animation|transition/i.test(selector + properties)) {
            categories.animations.push(rule);
        }
        // Media queries
        else if (/@media/i.test(selector)) {
            categories.responsive.push(rule);
        }
        // Below fold sections
        else if (/(footer|testimonial|feature|pricing|cta|subscribe)/i.test(selector)) {
            categories.belowFold.push(rule);
        }
        // Check if used in HTML
        else if (!isSelectorUsedInHTML(selector)) {
            categories.unused.push(rule);
        }
        else {
            categories.aboveFold.push(rule);
        }
    });
    
    return categories;
}

/**
 * Analyze removed CSS
 */
function analyzeRemovedCSS(diff) {
    const removed = [];
    const lines = diff.split('\n');
    
    let currentRule = '';
    lines.forEach(line => {
        if (line.startsWith('-') && !line.startsWith('---')) {
            currentRule += line.substring(1) + '\n';
        }
    });
    
    return extractCSSRules(currentRule);
}

/**
 * Analyze added CSS
 */
function analyzeAddedCSS(diff) {
    const added = [];
    const lines = diff.split('\n');
    
    let currentRule = '';
    lines.forEach(line => {
        if (line.startsWith('+') && !line.startsWith('+++')) {
            currentRule += line.substring(1) + '\n';
        }
    });
    
    return extractCSSRules(currentRule);
}

/**
 * Generate recommendations
 */
function generateRecommendations(analysis) {
    const recommendations = [];
    
    // Check for removed critical styles
    if (analysis.removed.critical.length > 0) {
        recommendations.push({
            priority: 'HIGH',
            category: 'Critical Styles Removed',
            action: 'RESTORE IMMEDIATELY',
            details: `${analysis.removed.critical.length} critical styles removed (header/nav/hero)`,
            selectors: analysis.removed.critical.map(r => r.selector).slice(0, 10)
        });
    }
    
    // Check for removed interactive styles
    if (analysis.removed.interactive.length > 0) {
        recommendations.push({
            priority: 'MEDIUM',
            category: 'Interactive Styles Removed',
            action: 'DEFER LOAD',
            details: `${analysis.removed.interactive.length} interactive styles removed (hover/focus states)`,
            selectors: analysis.removed.interactive.map(r => r.selector).slice(0, 10)
        });
    }
    
    // Check for removed below-fold styles
    if (analysis.removed.belowFold.length > 0) {
        recommendations.push({
            priority: 'MEDIUM',
            category: 'Below-fold Styles Removed',
            action: 'DEFER LOAD',
            details: `${analysis.removed.belowFold.length} below-fold styles removed`,
            selectors: analysis.removed.belowFold.map(r => r.selector).slice(0, 10)
        });
    }
    
    // Check for removed animations
    if (analysis.removed.animations.length > 0) {
        recommendations.push({
            priority: 'LOW',
            category: 'Animation Styles Removed',
            action: 'DEFER LOAD',
            details: `${analysis.removed.animations.length} animation styles removed`,
            selectors: analysis.removed.animations.map(r => r.selector).slice(0, 10)
        });
    }
    
    return recommendations;
}

/**
 * Main analysis
 */
async function analyzeChanges() {
    console.log('🔍 CSS Changes Analyzer\n');
    console.log('='.repeat(80));
    
    const allAnalysis = {
        files: {},
        totalRemoved: 0,
        totalAdded: 0,
        recommendations: []
    };
    
    // Analyze each modified file
    for (const filePath of MODIFIED_CSS_FILES) {
        console.log(`\n📄 Analyzing: ${filePath}`);
        console.log('-'.repeat(80));
        
        const diff = getGitDiff(filePath);
        if (!diff) {
            console.log('   ⚠️  No changes or file not in git');
            continue;
        }
        
        const committedVersion = getCommittedVersion(filePath);
        const currentVersion = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
        
        // Extract rules
        const removedRules = analyzeRemovedCSS(diff);
        const addedRules = analyzeAddedCSS(diff);
        
        // Categorize removed rules
        const removedCategories = categorizeCSS(removedRules);
        const addedCategories = categorizeCSS(addedRules);
        
        console.log(`   ➖ Removed: ${removedRules.length} rules`);
        console.log(`      - Critical: ${removedCategories.critical.length}`);
        console.log(`      - Interactive: ${removedCategories.interactive.length}`);
        console.log(`      - Below-fold: ${removedCategories.belowFold.length}`);
        console.log(`      - Animations: ${removedCategories.animations.length}`);
        console.log(`      - Unused: ${removedCategories.unused.length}`);
        
        console.log(`   ➕ Added: ${addedRules.length} rules`);
        
        allAnalysis.files[filePath] = {
            removed: removedCategories,
            added: addedCategories,
            removedCount: removedRules.length,
            addedCount: addedRules.length
        };
        
        allAnalysis.totalRemoved += removedRules.length;
        allAnalysis.totalAdded += addedRules.length;
    }
    
    // Generate overall recommendations
    console.log('\n\n📊 OVERALL ANALYSIS');
    console.log('='.repeat(80));
    console.log(`Total CSS rules removed: ${allAnalysis.totalRemoved}`);
    console.log(`Total CSS rules added: ${allAnalysis.totalAdded}`);
    console.log(`Net change: ${allAnalysis.totalAdded - allAnalysis.totalRemoved}`);
    
    // Aggregate all removed styles by category
    const aggregatedRemoved = {
        critical: [],
        interactive: [],
        belowFold: [],
        animations: [],
        unused: []
    };
    
    Object.values(allAnalysis.files).forEach(fileAnalysis => {
        Object.keys(aggregatedRemoved).forEach(category => {
            aggregatedRemoved[category].push(...fileAnalysis.removed[category]);
        });
    });
    
    console.log('\n📋 REMOVED STYLES BY CATEGORY:');
    console.log(`   Critical (header/nav/hero): ${aggregatedRemoved.critical.length} rules`);
    console.log(`   Interactive (hover/focus): ${aggregatedRemoved.interactive.length} rules`);
    console.log(`   Below-fold: ${aggregatedRemoved.belowFold.length} rules`);
    console.log(`   Animations: ${aggregatedRemoved.animations.length} rules`);
    console.log(`   Unused: ${aggregatedRemoved.unused.length} rules`);
    
    // Generate recommendations
    allAnalysis.recommendations = generateRecommendations({ removed: aggregatedRemoved });
    
    console.log('\n\n💡 RECOMMENDATIONS');
    console.log('='.repeat(80));
    
    allAnalysis.recommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);
        console.log(`   Action: ${rec.action}`);
        console.log(`   Details: ${rec.details}`);
        if (rec.selectors && rec.selectors.length > 0) {
            console.log(`   Example selectors:`);
            rec.selectors.slice(0, 5).forEach(sel => console.log(`      - ${sel}`));
        }
    });
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'css-changes-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(allAnalysis, null, 2));
    console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
    
    // Generate defer-load CSS file
    console.log('\n\n🎯 GENERATING DEFER-LOAD CSS...');
    generateDeferLoadCSS(aggregatedRemoved);
    
    return allAnalysis;
}

/**
 * Generate defer-load CSS file from removed styles
 */
function generateDeferLoadCSS(removedStyles) {
    const deferLoadContent = [
        '/**',
        ' * Deferred CSS - Below-the-fold and Interactive Styles',
        ' * This file contains non-critical styles that can be loaded after initial render',
        ' * Generated by: analyze-css-changes.js',
        ' */',
        '',
        '/* ========================================',
        '   INTERACTIVE STATES (Hover, Focus, Active)',
        '   ======================================== */',
        ''
    ];
    
    // Add interactive styles
    removedStyles.interactive.slice(0, 50).forEach(rule => {
        deferLoadContent.push(`${rule.selector} {`);
        deferLoadContent.push(`  ${rule.properties}`);
        deferLoadContent.push('}');
        deferLoadContent.push('');
    });
    
    deferLoadContent.push('/* ========================================');
    deferLoadContent.push('   BELOW-THE-FOLD SECTIONS');
    deferLoadContent.push('   ======================================== */');
    deferLoadContent.push('');
    
    // Add below-fold styles
    removedStyles.belowFold.slice(0, 50).forEach(rule => {
        deferLoadContent.push(`${rule.selector} {`);
        deferLoadContent.push(`  ${rule.properties}`);
        deferLoadContent.push('}');
        deferLoadContent.push('');
    });
    
    deferLoadContent.push('/* ========================================');
    deferLoadContent.push('   ANIMATIONS & TRANSITIONS');
    deferLoadContent.push('   ======================================== */');
    deferLoadContent.push('');
    
    // Add animation styles
    removedStyles.animations.slice(0, 30).forEach(rule => {
        deferLoadContent.push(`${rule.selector} {`);
        deferLoadContent.push(`  ${rule.properties}`);
        deferLoadContent.push('}');
        deferLoadContent.push('');
    });
    
    const deferCSSPath = path.join(__dirname, '..', 'public', 'css', 'components-deferred.css');
    fs.writeFileSync(deferCSSPath, deferLoadContent.join('\n'));
    
    console.log(`   ✅ Created: public/css/components-deferred.css`);
    console.log(`   📦 Size: ${Math.round(deferLoadContent.join('\n').length / 1024)}KB`);
    console.log(`   💡 Update defer-css.js to load this file`);
}

// Run analysis
analyzeChanges().catch(console.error);
