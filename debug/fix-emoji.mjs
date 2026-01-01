import fs from 'fs';
const content = fs.readFileSync('public/blog/cloudflare-infrastructure-myth.html', 'utf8');
const fixed = content.replace(/ðŸ"‘/g, '📑');
fs.writeFileSync('public/blog/cloudflare-infrastructure-myth.html', fixed, 'utf8');
console.log('Fixed');