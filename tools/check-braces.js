import fs from 'fs';
const file = 'tools/validate-production-site.js';
const s = fs.readFileSync(file, 'utf8');
let stack = [];
let inSingle=false, inDouble=false, inBack=false, inLineComment=false, inBlockComment=false;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  const prev = s[i-1];
  if (inLineComment) { if (ch === '\n') inLineComment = false; continue; }
  if (inBlockComment) { if (prev === '*' && ch === '/') inBlockComment = false; continue; }
  if (!inSingle && !inDouble && !inBack && ch === '/' && s[i+1] === '/') { inLineComment = true; continue; }
  if (!inSingle && !inDouble && !inBack && ch === '/' && s[i+1] === '*') { inBlockComment = true; continue; }
  if (!inDouble && !inBack && ch === "'") { inSingle = !inSingle; continue; }
  if (!inSingle && !inBack && ch === '"') { inDouble = !inDouble; continue; }
  if (!inSingle && !inDouble && ch === '`') { inBack = !inBack; continue; }
  if (inSingle || inDouble || inBack) continue;
  if (ch === '{') stack.push(i);
  else if (ch === '}') { if (stack.length) stack.pop(); else console.log('Extra closing brace at', i); }
}
if (stack.length === 0) { console.log('All braces balanced'); process.exit(0); }
console.log('Unmatched open brace count:', stack.length);
const idx = stack[stack.length-1];
const lines = s.slice(0, idx).split('\n');
const line = lines.length;
const col = lines[lines.length-1].length + 1;
console.log('Last unmatched at line', line, 'col', col);
const fileLines = s.split('\n');
for (let L = Math.max(0, line-6); L < Math.min(fileLines.length, line+3); L++) {
  console.log((L+1).toString().padStart(4,' ')+': '+fileLines[L]);
}
process.exit(1);
