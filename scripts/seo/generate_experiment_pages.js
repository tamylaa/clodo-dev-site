#!/usr/bin/env node
/**
 * generate_experiment_pages.js (ESM)
 * - Reads content/seo-experiments/meta-variants.json
 * - Generates static experiment pages under public/experiments/<slug>-variant-<a|b>.html
 * Usage: node scripts/seo/generate_experiment_pages.js
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load base URL from config
let BASE_URL = 'https://www.example.com';
try {
  const configPath = path.join(__dirname, '..', '..', 'config', 'site.config.js');
  const config = await import(`file://${configPath}`);
  BASE_URL = config.default?.url || BASE_URL;
} catch (e) {
  console.warn('⚠️  Could not load site config, using default URL');
}

const variantsFile = path.join(__dirname, '..', '..', 'content', 'seo-experiments', 'meta-variants.json');
const outDir = path.join(__dirname, '..', '..', 'public', 'experiments');

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const raw = await fs.readFile(variantsFile, 'utf8');
  const variants = JSON.parse(raw);
  for (const [slug, data] of Object.entries(variants)) {
    for (const [key, meta] of Object.entries(data.variants)) {
      const filename = `${slug}-variant-${key}.html`;
      const filePath = path.join(outDir, filename);
      const content = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.meta}">
  <!-- NOTE: Experiment page for ${slug}; canonical is the variant-specific URL -->
  <link rel="canonical" href="${BASE_URL}/experiments/${slug}-variant-${key}">
</head>
<body>
  <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:1rem;margin:.5rem 0;">
    <strong>Experiment variant ${key.toUpperCase()}</strong> — This is a generated experiment page for <code>${slug}</code> (variant ${key}).
  </div>
  <main>
    <h1>${meta.title}</h1>
    <p>${meta.meta}</p>
    <p><a href="/">Return to home</a></p>
  </main>
</body>
</html>`;
      await fs.writeFile(filePath, content);
      console.log('Wrote', filePath);
    }
  }
  console.log('Experiment pages generated.');
}

run().catch(err => { console.error(err); process.exit(1); });
