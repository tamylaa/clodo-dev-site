import { promises as fs } from 'fs';
import { join } from 'path';

async function findHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const root = process.argv[2] || 'dist';
  const htmlFiles = await findHtmlFiles(root);

  const failures = [];
  for (const file of htmlFiles) {
    const content = await fs.readFile(file, 'utf8');
    const hasJsonLd = /<script[^>]*type\s*=\s*["']?application\/ld\+json["']?/i.test(content);
    if (hasJsonLd) {
      const nonceOk = /<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*nonce\s*=\s*["']?N0Nc3Cl0d0["']?/i.test(content);
      if (!nonceOk) failures.push(file);
    }
  }

  if (failures.length) {
    console.error('✖ JSON-LD scripts missing required nonce attribute:');
    failures.forEach(f => console.error('  -', f));
    process.exit(2);
  }

  console.log('✓ All JSON-LD script tags include nonce attribute where applicable');
}

main().catch(e => { console.error(e); process.exit(3); });