// Utility for JS minification used by the build script
export function minifyJs(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/^\s*\/\/.*$/gm, '') // Remove whole-line single-line comments
        .replace(/\n\s+/g, '\n') // Remove leading whitespace on each line (preserve newlines for safety)
        .trim();
}
