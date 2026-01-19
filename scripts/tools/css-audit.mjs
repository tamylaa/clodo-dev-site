import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function walk(dir, cb) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const full = path.join(dir, f);
    const st = fs.statSync(full);
    if (st.isDirectory()) return walk(full, cb);
    cb(full);
  });
}

function gzipSize(buf) {
  try {
    return zlib.gzipSync(buf).length;
  } catch (e) { return null; }
}

function extractRules(css) {
  // crude regex to get selector and block - not a full parser but good for heuristics
  // Filter out at-rules and keyframes / percentage-only selectors to reduce noise
  const ruleRegex = /([^\{]+)\{([^\}]*)\}/g;
  const rules = [];
  let m;
  while ((m = ruleRegex.exec(css)) !== null) {
    let selector = m[1].trim().replace(/\s+/g,' ');
    const block = m[2].trim().replace(/\s+/g,' ');

    // Skip at-rules (e.g., @media, @keyframes blocks captured as selectors)
    if (selector.startsWith('@')) continue;

    // Skip keyframe percentage or 'from'/'to' selectors (noise from keyframes)
    const parts = selector.split(',').map(s=>s.trim()).filter(Boolean);
    const filtered = parts.filter(p => {
      if (!p) return false;
      // percentage or numeric-only selectors
      if (/^\d+%$/.test(p)) return false;
      if (/^from$|^to$/i.test(p)) return false;
      // pseudo-only selectors like :root or ::before are OK; full numeric values are not
      return true;
    });

    if (filtered.length === 0) continue;

    selector = filtered.join(', ');

    // Avoid trivial selectors that are actually values (artifact noise)
    if (/^(\d+%|\d+px|0|none)$/.test(selector)) continue;

    rules.push({ selector, block });
  }
  return rules;
}

async function main() {
  const cssDir = path.resolve('public','css');
  const out = { generatedAt: new Date().toISOString(), files: [], selectorIndex: {}, blockIndex: {} };
  const cssFiles = [];
  walk(cssDir, f => { if (f.endsWith('.css')) cssFiles.push(f); });

  for (const f of cssFiles) {
    const buf = fs.readFileSync(f);
    const s = buf.toString('utf8');
    const size = buf.length;
    const gz = gzipSize(buf);
    const rules = extractRules(s);
    out.files.push({ file: path.relative(process.cwd(), f), size, gzip: gz, rulesCount: rules.length });

    // add selectors
    rules.forEach(r => {
      const parts = r.selector.split(',').map(p=>p.trim()).filter(Boolean);
      parts.forEach(sel => {
        if (!out.selectorIndex[sel]) out.selectorIndex[sel] = { count: 0, files: new Set() };
        out.selectorIndex[sel].count += 1;
        out.selectorIndex[sel].files.add(path.relative(process.cwd(), f));
      });
      // block dedupe
      const key = r.selector + ' { ' + r.block.slice(0,300) + ' }';
      out.blockIndex[key] = out.blockIndex[key] || { count:0, files: new Set() };
      out.blockIndex[key].count += 1;
      out.blockIndex[key].files.add(path.relative(process.cwd(), f));
    });
  }

  // convert sets to arrays and generate summaries
  const selectorSummary = Object.entries(out.selectorIndex).map(([sel, v]) => ({ selector: sel, count: v.count, files: Array.from(v.files) }));
  const blockSummary = Object.entries(out.blockIndex).map(([block, v]) => ({ block: block, count: v.count, files: Array.from(v.files) }));

  // sort files by gzip size desc
  out.files.sort((a,b)=> (b.gzip||0) - (a.gzip||0));
  const topFiles = out.files.slice(0,20);
  const dupSelectors = selectorSummary.filter(s => s.files.length > 1).sort((a,b)=> b.files.length - a.files.length).slice(0,40);
  const dupBlocks = blockSummary.filter(b => b.files.length > 1).sort((a,b)=> b.count - a.count).slice(0,40);

  const report = { generatedAt: out.generatedAt, totalCssFiles: cssFiles.length, topFiles, dupSelectors, dupBlocks };
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/css-audit.json', JSON.stringify(report, null, 2));
  console.log('CSS audit complete. Report: reports/css-audit.json');
}

main().catch(e=>{ console.error(e); process.exit(1); });