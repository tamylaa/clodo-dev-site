import fs from 'fs';
import { dirname } from 'path';

const content = fs.readFileSync('public/blog/index.html', 'utf8');
const pattern = /<link[^>]*rel="stylesheet"[^>]*href="(?:\.\.\/)?styles\.css"[^>]*>/g;
console.log('Pattern matches:', content.match(pattern));
console.log('Content includes href="../styles.css":', content.includes('href="../styles.css"'));

const file = 'blog/index.html';
const fileDir = dirname(file);
const isSubdirectory = fileDir !== '.' && fileDir !== '';
const pathPrefix = isSubdirectory ? '../' : '';

console.log('File path:', file);
console.log('File directory:', fileDir);
console.log('isSubdirectory:', isSubdirectory);
console.log('pathPrefix:', pathPrefix);