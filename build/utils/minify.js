// Utility for JS minification used by the build script
export function minifyJs(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        // Remove whole-line single-line comments only (avoid stripping '//' in regex literals or URLs)
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/^\s+|\s+$/gm, '') // Trim lines
        .replace(/\n+/g, '\n') // Remove empty lines
        ;
}
