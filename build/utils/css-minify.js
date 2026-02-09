/**
 * CSS minification utility.
 * Shared between CSS bundling and individual-file minification.
 * Properly preserves @keyframes, !important, and calc() expressions.
 */
export function minifyCssContent(css) {
    return css
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove single-line comments (but not URLs)
        .replace(/(?<!:)\/\/.*/g, '')
        // Remove leading/trailing whitespace per line and empty lines
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
        // Minify spacing while preserving important syntax
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*:\s*/g, ':')
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*,\s*/g, ',')
        .replace(/;\s*}/g, '}')
        // Preserve space before !important flag
        .replace(/\s+!important/g, ' !important')
        // Preserve spaces in calc()
        .replace(/calc\s*\(\s*/g, 'calc(')
        .trim();
}
