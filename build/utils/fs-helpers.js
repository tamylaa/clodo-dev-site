/**
 * File-system helpers shared across build steps.
 */
import { readdirSync, statSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

/**
 * Recursively copy a directory tree.
 * @param {string} src  - Source directory
 * @param {string} dest - Destination directory
 * @param {object} [options]
 * @param {(name:string, fullPath:string, isDir:boolean) => boolean} [options.filter]
 */
export function copyRecursive(src, dest, options = {}) {
    const { filter } = options;
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
        const srcPath = join(src, entry);
        const destPath = join(dest, entry);
        const isDir = statSync(srcPath).isDirectory();
        if (filter && !filter(entry, srcPath, isDir)) continue;
        if (isDir) {
            copyRecursive(srcPath, destPath, options);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Adjust template paths for subdirectory files.
 * Prefixes relative href and src attributes with the given path prefix.
 */
export function adjustTemplatePaths(template, prefix) {
    if (!prefix) return template;
    const adjustAttr = (match, attr, value) => {
        if (value.startsWith('http') || value.startsWith('//') || value.startsWith('/') || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('data:')) {
            return match;
        }
        return `${attr}="${prefix}${value}"`;
    };
    return template
        .replace(/href="([^"]*)"/g, (match, href) => adjustAttr(match, 'href', href))
        .replace(/src="([^"]*)"/g, (match, src) => adjustAttr(match, 'src', src));
}
