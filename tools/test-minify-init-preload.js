const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'init-preload.js'), 'utf8');
function minifyJs(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/(?<!:)\/\/.*/g, '') // Remove single-line comments
        .replace(/^\s+|\s+$/gm, '') // Trim lines
        .replace(/\n+/g, '\n') // Remove empty lines
        ;
}
const minified = minifyJs(code);
console.log(minified);
