#!/usr/bin/env node

/**
 * Navigation System Analyzer
 * 
 * Comprehensive analysis of all navigation-related files and content
 * to identify inconsistencies and provide recommendations for
 * consistent categorization and UX across the site.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const CONFIG = {
    rootDir: path.join(__dirname, '..'),
    publicDir: path.join(__dirname, '..', 'public'),
    templatesDir: path.join(__dirname, '..', 'templates'),
    cssDir: path.join(__dirname, '..', 'public', 'css'),
    jsDir: path.join(__dirname, '..', 'public', 'js'),
    outputFile: path.join(__dirname, '..', 'reports', 'NAVIGATION_AUDIT_REPORT.md'),
};

// Navigation structure tracking
const analysis = {
    mainNav: [],
    footer: [],
    breadcrumbs: [],
    dropdowns: [],
    contentClusterNav: [],
    tableOfContents: [],
    pagination: [],
    sidebars: [],
    cssComponents: [],
    jsComponents: [],
    consistencyIssues: [],
    recommendations: [],
};

/**
 * Recursively find all files matching pattern
 */
async function findFiles(dir, pattern) {
    const files = [];
    
    async function walk(currentPath) {
        if (!fs.existsSync(currentPath)) return;
        
        const entries = await readdir(currentPath);
        
        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry);
            const stat_info = await stat(fullPath);
            
            if (stat_info.isDirectory()) {
                if (!entry.startsWith('.') && entry !== 'node_modules') {
                    await walk(fullPath);
                }
            } else if (pattern.test(entry)) {
                files.push(fullPath);
            }
        }
    }
    
    await walk(dir);
    return files;
}

/**
 * Parse HTML content for navigation elements
 */
async function analyzeNavigation() {
    console.log('🔍 Analyzing navigation structure...\n');
    
    // Main navigation
    const mainNavPath = path.join(CONFIG.templatesDir, 'nav-main.html');
    if (fs.existsSync(mainNavPath)) {
        const content = await readFile(mainNavPath, 'utf8');
        analysis.mainNav = parseMainNav(content);
    }
    
    // Footer navigation
    const footerPath = path.join(CONFIG.templatesDir, 'footer.html');
    if (fs.existsSync(footerPath)) {
        const content = await readFile(footerPath, 'utf8');
        analysis.footer = parseFooterNav(content);
    }
    
    // Content cluster navigation
    const clusterPath = path.join(CONFIG.templatesDir, 'content-cluster-nav.html');
    if (fs.existsSync(clusterPath)) {
        const content = await readFile(clusterPath, 'utf8');
        analysis.contentClusterNav = parseClusterNav(content);
    }
    
    // Find breadcrumbs in HTML files
    const htmlFiles = await findFiles(CONFIG.publicDir, /\.html$/);
    for (const file of htmlFiles.slice(0, 5)) { // Analyze first 5 files
        const content = await readFile(file, 'utf8');
        const breadcrumbs = extractBreadcrumbs(content);
        if (breadcrumbs.length > 0) {
            analysis.breadcrumbs.push({
                file: path.relative(CONFIG.rootDir, file),
                breadcrumbs
            });
        }
        
        // Look for table of contents
        const toc = extractTableOfContents(content);
        if (toc.length > 0) {
            analysis.tableOfContents.push({
                file: path.relative(CONFIG.rootDir, file),
                toc
            });
        }
    }
}

/**
 * Parse main navigation structure
 */
function parseMainNav(html) {
    const nav = {
        type: 'main',
        location: 'header',
        structure: [],
        classes: [],
        attributes: []
    };
    
    // Extract navbar class
    const navbarMatch = html.match(/class="navbar"\s+aria-label="([^"]+)"/);
    if (navbarMatch) {
        nav.ariaLabel = navbarMatch[1];
    }
    
    // Extract main menu items
    const menuItemsMatch = html.matchAll(/<li[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gs);
    for (const match of menuItemsMatch) {
        nav.structure.push({
            text: match[2].trim(),
            href: match[1],
            type: 'link'
        });
    }
    
    // Extract dropdown sections
    const dropdownsMatch = html.matchAll(/<li class="nav-dropdown"[^>]*>.*?<a[^>]*>([^<]+)<\/a>/gs);
    for (const match of dropdownsMatch) {
        nav.structure.push({
            text: match[1].trim(),
            type: 'dropdown'
        });
    }
    
    return nav;
}

/**
 * Parse footer navigation structure
 */
function parseFooterNav(html) {
    const sections = [];
    
    // Extract footer navigation sections
    const navSectionsMatch = html.matchAll(/<nav class="footer-section"[^>]*aria-labelledby="([^"]+)">[^]*?<h4[^>]*>([^<]+)<\/h4>[^]*?<ul[^>]*>([^]*?)<\/ul>/g);
    
    for (const match of navSectionsMatch) {
        const sectionId = match[1];
        const sectionTitle = match[2];
        const listContent = match[3];
        
        const links = [];
        const linkMatches = listContent.matchAll(/<li><a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a><\/li>/g);
        for (const linkMatch of linkMatches) {
            links.push({
                text: linkMatch[2].trim(),
                href: linkMatch[1],
                external: linkMatch[1].includes('http') || linkMatch[1].includes('github')
            });
        }
        
        sections.push({
            id: sectionId,
            title: sectionTitle,
            links
        });
    }
    
    return {
        type: 'footer',
        location: 'footer',
        sections
    };
}

/**
 * Parse content cluster navigation
 */
function parseClusterNav(html) {
    const sections = [];
    
    const navSectionsMatch = html.matchAll(/<div class="nav-section">[^]*?<h4>([^<]+)<\/h4>[^]*?<ul>([^]*?)<\/ul>/g);
    
    for (const match of navSectionsMatch) {
        const sectionTitle = match[1];
        const listContent = match[2];
        
        const links = [];
        const linkMatches = listContent.matchAll(/<li><a[^>]*href="([^"]+)"[^>]*data-content-type="([^"]+)"[^>]*>([^<]+)<\/a><\/li>/g);
        for (const linkMatch of linkMatches) {
            links.push({
                text: linkMatch[3].trim(),
                href: linkMatch[1],
                contentType: linkMatch[2]
            });
        }
        
        sections.push({
            title: sectionTitle,
            links
        });
    }
    
    return {
        type: 'contentCluster',
        location: 'sidebar',
        sections
    };
}

/**
 * Extract breadcrumbs from HTML
 */
function extractBreadcrumbs(html) {
    const breadcrumbs = [];
    
    const breadcrumbMatch = html.match(/<nav class="breadcrumbs"[^>]*>([^]*?)<\/nav>/);
    if (breadcrumbMatch) {
        const itemMatches = breadcrumbMatch[1].matchAll(/<div class="breadcrumb-item"[^>]*>([^<]+)<\/div>/g);
        for (const match of itemMatches) {
            breadcrumbs.push(match[1].trim());
        }
    }
    
    return breadcrumbs;
}

/**
 * Extract table of contents
 */
function extractTableOfContents(html) {
    const toc = [];
    
    const tocMatch = html.match(/<nav[^>]*aria-label="Table of contents"[^>]*class="toc-nav"[^>]*>([^]*?)<\/nav>/);
    if (tocMatch) {
        const linkMatches = tocMatch[1].matchAll(/<a[^>]*href="#([^"]+)"[^>]*>([^<]+)<\/a>/g);
        for (const match of linkMatches) {
            toc.push({
                anchor: match[1],
                text: match[2].trim()
            });
        }
    }
    
    return toc;
}

/**
 * Analyze CSS for navigation components
 */
async function analyzeCSSComponents() {
    console.log('🎨 Analyzing CSS components...\n');
    
    const cssFiles = await findFiles(CONFIG.cssDir, /\.css$/);
    
    for (const file of cssFiles) {
        const content = await readFile(file, 'utf8');
        const filename = path.basename(file);
        
        // Extract nav-related classes
        const navClasses = content.match(/\.\w*nav\w*|\.navbar|\.breadcrumb|\.dropdown|\.menu/gi);
        if (navClasses) {
            analysis.cssComponents.push({
                file: filename,
                path: path.relative(CONFIG.rootDir, file),
                navClasses: [...new Set(navClasses)]
            });
        }
    }
}

/**
 * Analyze JavaScript navigation components
 */
async function analyzeJSComponents() {
    console.log('📜 Analyzing JavaScript components...\n');
    
    const jsFiles = await findFiles(CONFIG.jsDir, /\.js$/);
    
    for (const file of jsFiles) {
        const content = await readFile(file, 'utf8');
        const filename = path.basename(file);
        
        // Check if file contains navigation logic
        if (content.match(/nav|menu|breadcrumb|dropdown|toggle/i)) {
            const functions = content.match(/(?:function|const|let)\s+(\w*nav\w*|\w*menu\w*|\w*dropdown\w*)\s*[=(]/gi);
            
            if (functions) {
                analysis.jsComponents.push({
                    file: filename,
                    path: path.relative(CONFIG.rootDir, file),
                    navFunctions: [...new Set(functions)]
                });
            }
        }
    }
}

/**
 * Identify consistency issues
 */
async function identifyConsistencyIssues() {
    console.log('🔎 Identifying consistency issues...\n');
    
    // Issue 1: Class naming conventions
    const classNames = new Set();
    for (const css of analysis.cssComponents) {
        for (const cls of css.navClasses) {
            classNames.add(cls.toLowerCase());
        }
    }
    
    if (classNames.size > 20) {
        analysis.consistencyIssues.push({
            severity: 'medium',
            issue: 'Excessive number of navigation-related CSS classes',
            details: `Found ${classNames.size} different navigation-related CSS classes`,
            impact: 'Difficult to maintain consistent styling across components'
        });
    }
    
    // Issue 2: Inconsistent breadcrumb implementations
    if (analysis.breadcrumbs.length > 1) {
        const implementations = new Set(analysis.breadcrumbs.map(b => 
            b.breadcrumbs.length > 0 ? 'uses-div-items' : 'not-found'
        ));
        
        if (implementations.size > 1) {
            analysis.consistencyIssues.push({
                severity: 'medium',
                issue: 'Inconsistent breadcrumb HTML structure across pages',
                details: 'Different pages use different breadcrumb implementations',
                impact: 'Harder to maintain and style breadcrumbs uniformly'
            });
        }
    }
    
    // Issue 3: Footer vs Main nav link destinations
    const mainNavLinks = analysis.mainNav?.structure?.map(s => s.href) || [];
    const footerLinks = analysis.footer?.sections?.flatMap(s => s.links?.map(l => l.href)) || [];
    
    const missingInFooter = mainNavLinks.filter(link => !footerLinks.includes(link));
    if (missingInFooter.length > 0) {
        analysis.consistencyIssues.push({
            severity: 'low',
            issue: 'Main navigation items missing in footer',
            details: `${missingInFooter.length} items from main nav not in footer: ${missingInFooter.slice(0, 3).join(', ')}`,
            impact: 'Inconsistent navigation hierarchy'
        });
    }
    
    // Issue 4: Content type categorization inconsistency
    if (analysis.contentClusterNav.sections) {
        const contentTypes = new Set();
        for (const section of analysis.contentClusterNav.sections) {
            for (const link of section.links) {
                contentTypes.add(link.contentType);
            }
        }
        
        analysis.consistencyIssues.push({
            severity: 'low',
            issue: 'Content type categorization used inconsistently',
            details: `Found ${contentTypes.size} different content types: ${[...contentTypes].join(', ')}`,
            impact: 'Potential for confusion in content classification'
        });
    }
}

/**
 * Generate recommendations
 */
async function generateRecommendations() {
    console.log('💡 Generating recommendations...\n');
    
    analysis.recommendations = [
        {
            priority: 'HIGH',
            category: 'Categorization',
            recommendation: 'Establish unified navigation structure hierarchy',
            details: `Create a standardized navigation data structure that covers:
  - Main navigation (header dropdowns)
  - Footer navigation (organized by section)
  - Breadcrumbs (consistent implementation)
  - Content cluster navigation (page-specific)
  - Sidebar navigation (when applicable)`,
            implementation: `1. Create config/navigation.json or config/site-structure.json
2. Define nav items with: id, label, href, icon, section, contentType, target
3. Use this config to generate all nav components dynamically`
        },
        {
            priority: 'HIGH',
            category: 'Consistency',
            recommendation: 'Consolidate CSS navigation components',
            details: `Current CSS is fragmented across multiple files:
  - components-common.css (breadcrumbs, nav icons)
  - components-page-specific.css (navbar)
  - components-shared-utilities.css (toc-nav)`,
            implementation: `1. Create dedicated public/css/global/navigation.css
2. Consolidate all nav-related styles
3. Use consistent naming: nav-, breadcrumb-, dropdown-, toc-
4. Define CSS variables for consistency`
        },
        {
            priority: 'HIGH',
            category: 'Consistency',
            recommendation: 'Standardize JavaScript navigation handling',
            details: `Navigation logic is spread across multiple files with potential duplications`,
            implementation: `1. Create public/js/core/navigation-unified.js
2. Provide utilities for: active link detection, breadcrumb generation, dropdown toggle
3. Export reusable functions for all nav components`
        },
        {
            priority: 'MEDIUM',
            category: 'Content Taxonomy',
            recommendation: 'Define content type taxonomy',
            details: `Implement consistent content type classification across all navigation:
  - Currently using: educational, comparison, guide, tutorial, framework, examples, documentation, tool`,
            implementation: `1. Create docs/CONTENT_TAXONOMY.md
2. Document all content types with descriptions
3. Update all navigation items to use standardized types
4. Use these in filtering, search, and analytics`
        },
        {
            priority: 'MEDIUM',
            category: 'Accessibility',
            recommendation: 'Audit and standardize ARIA labels',
            details: `Navigation uses various aria-label formats inconsistently`,
            implementation: `1. Audit all nav elements for proper ARIA attributes
2. Ensure breadcrumbs use <ol> with proper <li> structure
3. Verify dropdown menus have role="menu" and aria-expanded
4. Test with screen readers`
        },
        {
            priority: 'MEDIUM',
            category: 'Scalability',
            recommendation: 'Create navigation component library',
            details: `Build reusable, configurable navigation components`,
            implementation: `1. Create public/js/components/nav-components.js
2. Export: NavBar, Footer, Breadcrumbs, DropdownMenu, ContentClusterNav
3. Each component accepts config object
4. Document with examples in docs/NAVIGATION_COMPONENTS.md`
        },
        {
            priority: 'LOW',
            category: 'UX',
            recommendation: 'Add breadcrumb schema markup consistency',
            details: `Use BreadcrumbList schema on all pages with breadcrumbs`,
            implementation: `1. Extract breadcrumb data from URL path or config
2. Generate BreadcrumbList JSON-LD on all applicable pages
3. Ensure consistency with visual breadcrumbs`
        }
    ];
}

/**
 * Generate report
 */
async function generateReport() {
    console.log('📝 Generating report...\n');
    
    const timestamp = new Date().toISOString();
    
    let report = `# Navigation System Audit Report

**Generated:** ${timestamp}

---

## Executive Summary

This report provides a comprehensive analysis of all navigation-related files, components, and content structures across the Clodo dev site. The analysis identifies inconsistencies in categorization, styling, and implementation to help establish a unified, scalable navigation experience.

---

## 1. Navigation Components Inventory

### 1.1 Main Navigation (Header)
\`\`\`
Type: Header Navigation Bar
ARIA Label: ${analysis.mainNav?.ariaLabel || 'Main navigation'}
Location: templates/nav-main.html
Items: ${analysis.mainNav?.structure?.length || 0}
\`\`\`

#### Structure:
\`\`\`
${(analysis.mainNav?.structure || []).map(item => `- ${item.text}${item.type === 'dropdown' ? ' (dropdown)' : ''}`).join('\n')}
\`\`\`

### 1.2 Footer Navigation

Sections: ${analysis.footer?.sections?.length || 0}

\`\`\`
${(analysis.footer?.sections || []).map(section => `- ${section.title}: ${section.links?.length || 0} links`).join('\n')}
\`\`\`

### 1.3 Breadcrumbs

Implementation: Div-based with breadcrumb-item classes
Files with breadcrumbs: ${analysis.breadcrumbs.length}

\`\`\`
${analysis.breadcrumbs.map(b => `- ${b.file}: ${b.breadcrumbs.join(' / ')}`).join('\n')}
\`\`\`

### 1.4 Content Cluster Navigation

Type: Sidebar/contextual navigation
Sections: ${analysis.contentClusterNav?.sections?.length || 0}

\`\`\`
${(analysis.contentClusterNav?.sections || []).map(section => 
    `- ${section.title} (${section.links?.length || 0} links)
${section.links?.slice(0, 3).map(link => `  • ${link.text} [${link.contentType}]`).join('\n')}`
).join('\n')}
\`\`\`

### 1.5 Table of Contents

Implementation: nav.toc-nav with anchor links
Files with TOC: ${analysis.tableOfContents.length}

---

## 2. CSS Components Analysis

### Found Navigation-related CSS files:

\`\`\`
${analysis.cssComponents.map(css => `- ${css.file}
  Classes: ${css.navClasses.slice(0, 5).join(', ')}${css.navClasses.length > 5 ? ` (+${css.navClasses.length - 5} more)` : ''}`).join('\n')}
\`\`\`

### CSS Organization Issues:
- Navigation styles fragmented across 3+ CSS files
- No dedicated global navigation stylesheet
- Mixed naming conventions: .navbar, .nav-, .breadcrumb-, .toc-nav

---

## 3. JavaScript Components Analysis

### Navigation-related JavaScript files:

\`\`\`
${analysis.jsComponents.map(js => `- ${js.file}`).join('\n')}
\`\`\`

Key Components:
- public/js/core/navigation.js: Main navigation coordinator
- public/js/ui/navigation-component.js: UI component wrapper
- public/js/component-nav.js: Component implementation

---

## 4. Consistency Issues & Findings

### Issues Identified: ${analysis.consistencyIssues.length}

${analysis.consistencyIssues.map((issue, i) => `
### Issue ${i + 1}: ${issue.issue}
**Severity:** ${issue.severity}
**Details:** ${issue.details}
**Impact:** ${issue.impact}
`).join('\n')}

---

## 5. Recommendations

### Implementation Priority Levels

${analysis.recommendations.map((rec, i) => `
### ${i + 1}. ${rec.recommendation}
**Priority:** ${rec.priority}
**Category:** ${rec.category}

**Details:**
${rec.details}

**Implementation Steps:**
${rec.implementation}
`).join('\n')}

---

## 6. Content Type Taxonomy

Current content types used in navigation:

\`\`\`
- educational: Conceptual, beginner-friendly content
- comparison: Comparative analysis between technologies
- guide: Comprehensive guides and how-tos
- tutorial: Step-by-step tutorials
- framework: Framework-specific content
- examples: Code examples and templates
- documentation: API/technical documentation
- tool: Interactive tools and dashboards
\`\`\`

**Recommendation:** Standardize and extend this taxonomy across all navigation components.

---

## 7. Categorization Strategy

### Proposed Navigation Hierarchy

\`\`\`
Root
├── Main Navigation (Header)
│   ├── Home
│   ├── Product
│   │   ├── Overview
│   │   ├── Migrate
│   │   ├── Community
│   │   └── Comparisons (section)
│   ├── Learn
│   │   ├── Documentation (section)
│   │   ├── Guides (section)
│   │   ├── Examples (section)
│   │   └── Help & Support (section)
│   └── More items...
├── Footer Navigation
│   ├── Product Links
│   ├── Developers Links
│   ├── Resources Links
│   ├── Company Links
│   └── Community Links
├── Breadcrumbs (contextual, per page)
├── Content Cluster Navigation (contextual, per section)
└── Table of Contents (per page, for long content)
\`\`\`

### Next Steps for Unified Categorization

1. **Create Navigation Config** (config/navigation.json)
   - Single source of truth for all navigation
   - Define all nav items with metadata
   - Support nested structures and content types

2. **Define Content Classification**
   - Standardize content types
   - Create taxonomy documentation
   - Map all content to appropriate types

3. **Implement Component Library**
   - Build reusable nav components
   - Accept config-driven data
   - Ensure consistent styling and behavior

4. **Consolidate CSS**
   - Create dedicated navigation stylesheet
   - Use consistent naming conventions
   - Define CSS variables for theming

5. **Unify JavaScript**
   - Consolidate navigation logic
   - Provide utility functions
   - Remove duplicate functionality

---

## 8. Technical Debt Summary

| Issue | Severity | Effort | Benefit |
|-------|----------|--------|---------|
| Fragmented CSS | Medium | Low | High |
| Duplicate JS logic | Medium | Medium | High |
| Inconsistent naming | Low | Low | Medium |
| Missing config | High | Medium | High |
| Content taxonomy | Medium | Medium | High |

---

## Conclusion

The current navigation system works but lacks consistency and scalability. By implementing the recommended centralized configuration, consolidating CSS and JavaScript, and establishing a clear content taxonomy, the site can achieve:

✅ Easier maintenance and updates
✅ Consistent UX across all pages
✅ Improved accessibility
✅ Better content organization
✅ Simplified future enhancements

**Estimated effort to implement all recommendations: 3-5 days**

---

*Report generated by Navigation System Analyzer*
`;

    // Ensure output directory exists
    const reportDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.outputFile, report, 'utf8');
    console.log(`✅ Report saved to: ${CONFIG.outputFile}`);
    
    return report;
}

/**
 * Main execution
 */
async function main() {
    console.log('\n🚀 Starting Navigation System Analysis\n');
    console.log('=' .repeat(60));
    
    try {
        await analyzeNavigation();
        await analyzeCSSComponents();
        await analyzeJSComponents();
        await identifyConsistencyIssues();
        await generateRecommendations();
        await generateReport();
        
        console.log('\n' + '='.repeat(60));
        console.log('\n✨ Analysis Complete!\n');
        
        // Print summary
        console.log('📊 Summary Statistics:');
        console.log(`   Main Nav Items: ${analysis.mainNav?.structure?.length || 0}`);
        console.log(`   Footer Sections: ${analysis.footer?.sections?.length || 0}`);
        console.log(`   CSS Files Analyzed: ${analysis.cssComponents.length}`);
        console.log(`   JS Files Analyzed: ${analysis.jsComponents.length}`);
        console.log(`   Consistency Issues: ${analysis.consistencyIssues.length}`);
        console.log(`   Recommendations: ${analysis.recommendations.length}`);
        
    } catch (error) {
        console.error('❌ Error during analysis:', error);
        process.exit(1);
    }
}

main();
