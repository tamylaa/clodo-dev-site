import { injectSchemasIntoHTML } from '../../schema/build-integration.js';
import fs from 'fs';
const htmlPath = 'public/workers-boilerplate.html';
const html = fs.readFileSync(htmlPath, 'utf8');
console.log('Running injection test...');
const out = injectSchemasIntoHTML(htmlPath, html);
const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
let m; let i=0; const scripts=[];
while((m=scriptRegex.exec(out))!==null){ try{ const j=JSON.parse(m[1]); scripts.push(j); }catch(e){ scripts.push(m[1].slice(0,200)); } i++; }
console.log(i + ' schema scripts injected');
console.log('Parsed script types:', scripts.map(s=> (Array.isArray(s)? 'Array' : (s['@type'] || s['@graph'] ? (s['@type'] || (s['@graph'] && s['@graph'][0] && s['@graph'][0]['@type'])) : 'Unknown'))));
console.log(JSON.stringify(scripts,null,2).slice(0,1200));
