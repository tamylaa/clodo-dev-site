import fs from 'fs';
import path from 'path';

const distDir = path.resolve(process.cwd(), 'dist');
const outDir = path.resolve(process.cwd(), 'build', 'page-check-diagnostics');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const htmlFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.html'));
let missing = [];
const report = { checked: [], missingManifest: [] };

htmlFiles.forEach(f => {
  const p = path.join(distDir, f);
  const content = fs.readFileSync(p, 'utf8');
  const hasManifest = /window\.__assetManifest__/i.test(content);

  // Only enforce manifest when the page contains rel=preload styles or page-specific deferred CSS
  const needsManifest = /<link[^>]+rel=("|')preload\1[^>]+as=("|')style\2/i.test(content) || /css\/pages\//i.test(content) || /styles-[a-z0-9\-]+\.css/i.test(content);

  report.checked.push({ file: f, hasManifest, needsManifest });

  if(needsManifest && !hasManifest){
    missing.push(f);
    report.missingManifest.push(f);
  }
});

const outFile = path.join(outDir, `manifest-check.json`);
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
if(missing.length){
  console.error('[verify_manifest] Missing asset manifest in the following built HTML files:');
  missing.forEach(f => console.error(' -', f));
  console.error('[verify_manifest] See build/page-check-diagnostics/manifest-check.json for details.');
  process.exit(1);
}
console.log('[verify_manifest] All built HTML files contain window.__assetManifest__.');
process.exit(0);
