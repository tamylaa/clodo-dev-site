import fs from 'fs';
import path from 'path';

const patterns = [
  'c3a2e2809dc2b4',
  'c3a2e280bae280a6', 
  'c3a2c5bde2809d',
  'c3a2e284a2e2809a',
  'c3b0c5b8e2809dc290'
];

function walk(dir) {
  const files = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) files.push(...walk(p));
    else if (f.name.endsWith('.html')) files.push(p);
  }
  return files;
}

const all = walk('public');
for (const f of all) {
  const s = fs.readFileSync(f, 'utf8');
  for (const hex of patterns) {
    const bad = Buffer.from(hex, 'hex').toString('utf8');
    const idx = s.indexOf(bad);
    if (idx >= 0) {
      const ctx = s.substring(Math.max(0, idx - 30), idx + 40);
      console.log(f);
      console.log('  Pattern:', hex);
      console.log('  Context:', ctx.replace(/\n/g, ' '));
      console.log();
    }
  }
}
