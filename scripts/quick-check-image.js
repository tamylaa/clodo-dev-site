import fs from 'fs';
const path = 'public/saas-product-startups-cloudflare-case-studies.html';
const html = fs.readFileSync(path, 'utf8');
const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
console.log('og:image =>', ogMatch ? ogMatch[1] : 'NOT FOUND');
const twitterMatch = html.match(/<meta name="twitter:image" content="([^"]+)"/);
console.log('twitter:image =>', twitterMatch ? twitterMatch[1] : 'NOT FOUND');
const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const ldMatches = [...html.matchAll(re)].map(m => m[1]);
const hasImage = ldMatches.some(s => /"@type"\s*:\s*"ImageObject"/.test(s));
console.log('has ImageObject JSON-LD =>', hasImage);
const imgObjs = ldMatches.map(s => {
  try { return JSON.parse(s); } catch(e){ return null }
}).filter(Boolean).filter(o => o['@type'] === 'ImageObject');
console.log('ImageObject(s):', imgObjs);
