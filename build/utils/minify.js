// Utility for JS minification used by the build script.
// Attempts to use `terser` if available; falls back to a lightweight stripper.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let terser = null;
try { terser = require('terser'); } catch (e) { /* terser not installed — fallback will be used */ }

export function minifyJs(code) {
    if (terser && typeof terser.minify === 'function') {
        try {
            const result = terser.minify(code, { compress: { passes: 2 }, mangle: true });
            if (result && result.code) return result.code;
        } catch (e) {
            console.warn('[minifyJs] terser.minify failed, falling back:', e.message);
        }
    }

    // Lightweight fallback minifier — preserves safety and avoids syntax transforms
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/^\s*\/\/.*$/gm, '') // Remove whole-line single-line comments
        .replace(/\n\s+/g, '\n') // Remove leading whitespace on each line (preserve newlines for safety)
        .trim();
}
