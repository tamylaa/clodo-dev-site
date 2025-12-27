#!/usr/bin/env node
/**
 * generate_experiment_pages.cjs
 * - Reads content/seo-experiments/meta-variants.json
 * - Generates static experiment pages under public/experiments/<slug>-variant-<a|b>.html
 * - By default generated pages include a meta title & description and a clear experiment banner
 * Usage: node scripts/seo/generate_experiment_pages.cjs
 */
const fs = require('fs');
const path = require('path');
const variantsFile = path.join(__dirname, '..', '..', 'content', 'seo-experiments', 'meta-variants.json');
const outDir = path.join(__dirname, '..', '..', 'public', 'experiments');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const variants = JSON.parse(fs.readFileSync(variantsFile, 'utf8'));
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
  <!-- NOTE: Experiment page for ${slug}; canonical can be adjusted depending on experiment policy -->
  <link rel="canonical" href="https://www.clodo.dev/${slug}">
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
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Wrote', filePath);
  }
}
console.log('Experiment pages generated.');
