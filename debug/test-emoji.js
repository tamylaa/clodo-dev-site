function adjustTemplatePaths(template, prefix) {
    if (!prefix) return template;
    return template.replace(/href="([^"]*)"/g, (match, href) => {
        if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:')) {
            return match;
        }
        return `href="${prefix}${href}"`;
    });
}

const test = '⚖️ Comparisons 🚀 Guides';
console.log('Original:', test);
console.log('Adjusted:', adjustTemplatePaths(test, '../'));
console.log('Still contains scale:', adjustTemplatePaths(test, '../').includes('⚖️'));