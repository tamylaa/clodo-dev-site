/**
 * Theme CSS Generator
 * 
 * Generates CSS custom properties from theme.json configuration.
 * Run during build to create theme.css with all variables.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

/**
 * Load theme configuration
 */
export function loadTheme() {
    const themePath = join(ROOT_DIR, 'config', 'theme.json');
    if (!existsSync(themePath)) {
        console.warn('⚠️  No theme.json found, using defaults');
        return null;
    }
    return JSON.parse(readFileSync(themePath, 'utf8'));
}

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Flatten nested object to CSS variable format
 */
function flattenToCssVars(obj, prefix = '') {
    const vars = [];
    
    for (const [key, value] of Object.entries(obj)) {
        const varName = prefix ? `${prefix}-${toKebabCase(key)}` : toKebabCase(key);
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            vars.push(...flattenToCssVars(value, varName));
        } else {
            vars.push({ name: `--${varName}`, value: String(value) });
        }
    }
    
    return vars;
}

/**
 * Generate CSS custom properties from theme
 */
export function generateThemeCss(theme) {
    if (!theme) return '';
    
    const sections = [];
    
    // Generate color variables
    if (theme.colors) {
        sections.push('  /* Colors */');
        const colorVars = flattenToCssVars(theme.colors, 'color');
        sections.push(...colorVars.map(v => `  ${v.name}: ${v.value};`));
    }
    
    // Generate typography variables
    if (theme.typography) {
        sections.push('\n  /* Typography */');
        const typoVars = flattenToCssVars(theme.typography, 'font');
        sections.push(...typoVars.map(v => `  ${v.name}: ${v.value};`));
    }
    
    // Generate spacing variables
    if (theme.spacing) {
        sections.push('\n  /* Spacing */');
        const spacingVars = flattenToCssVars(theme.spacing, 'spacing');
        sections.push(...spacingVars.map(v => `  ${v.name}: ${v.value};`));
    }
    
    // Generate border radius
    if (theme.borderRadius) {
        sections.push('\n  /* Border Radius */');
        const radiusVars = flattenToCssVars(theme.borderRadius, 'radius');
        sections.push(...radiusVars.map(v => `  ${v.name}: ${v.value};`));
    }
    
    // Generate shadows
    if (theme.shadows) {
        sections.push('\n  /* Shadows */');
        const shadowVars = flattenToCssVars(theme.shadows, 'shadow');
        sections.push(...shadowVars.map(v => `  ${v.name}: ${v.value};`));
    }
    
    // Generate animation
    if (theme.animation) {
        sections.push('\n  /* Animation */');
        const animVars = flattenToCssVars(theme.animation, 'animation');
        sections.push(...animVars.map(v => `  ${v.name}: ${v.value};`));
    }
    
    // Generate component variables
    if (theme.components) {
        sections.push('\n  /* Components */');
        const compVars = flattenToCssVars(theme.components, 'component');
        sections.push(...compVars.map(v => `  ${v.name}: ${v.value};`));
    }
    
    return `/**
 * Theme Variables
 * Generated from config/theme.json
 * DO NOT EDIT DIRECTLY - modify theme.json instead
 */

:root {
${sections.join('\n')}
}

/* Dark mode overrides */
[data-theme="dark"],
.dark {
  --color-background-light: var(--color-background-dark);
  --color-background-light-alt: var(--color-background-dark-alt);
  --color-text-light-primary: var(--color-text-dark-primary);
  --color-text-light-secondary: var(--color-text-dark-secondary);
  --color-text-light-muted: var(--color-text-dark-muted);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-background-light: var(--color-background-dark);
    --color-background-light-alt: var(--color-background-dark-alt);
    --color-text-light-primary: var(--color-text-dark-primary);
    --color-text-light-secondary: var(--color-text-dark-secondary);
    --color-text-light-muted: var(--color-text-dark-muted);
  }
}
`;
}

/**
 * Generate utility classes from theme
 */
export function generateUtilityClasses(theme) {
    if (!theme) return '';
    
    const utilities = [];
    
    // Color utilities
    if (theme.colors?.brand) {
        utilities.push('/* Brand Color Utilities */');
        for (const [name, value] of Object.entries(theme.colors.brand)) {
            const className = toKebabCase(name);
            utilities.push(`.text-${className} { color: ${value}; }`);
            utilities.push(`.bg-${className} { background-color: ${value}; }`);
            utilities.push(`.border-${className} { border-color: ${value}; }`);
        }
    }
    
    // Spacing utilities (optional, can be large)
    // Add more as needed
    
    return utilities.join('\n');
}

/**
 * Write theme CSS to file
 */
export function writeThemeCss(outputPath = 'public/css/theme.css') {
    const theme = loadTheme();
    const css = generateThemeCss(theme);
    const fullPath = join(ROOT_DIR, outputPath);
    
    writeFileSync(fullPath, css);
    console.log(`✅ Theme CSS generated: ${outputPath}`);
    
    return css;
}

// CLI support
if (process.argv[1].includes('theme-generator')) {
    writeThemeCss();
}

export default {
    loadTheme,
    generateThemeCss,
    generateUtilityClasses,
    writeThemeCss
};
