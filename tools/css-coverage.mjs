import fs from 'fs';
import path from 'path';

function listFiles(dir, ext) {
  let res = [];
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isFile() && p.endsWith(ext)) res.push(p);
    else if (d.isDirectory()) res = res.concat(listFiles(p, ext));
  }
  return res;
}

function extractSelectors(cssText) {
  // Very lightweight parser: extract selectors before '{' and split by ','
  const res = new Set();
  const re = /([^{}]+)\{/g;
  let m;
  while ((m = re.exec(cssText))) {
    const sel = m[1].trim();
    if (!sel) continue;
    const parts = sel.split(',').map(s => s.trim()).filter(Boolean);
    for (const p of parts) {
      // normalize: remove pseudo-classes/elements
      const cleaned = p.replace(/:[^\s>+~.:#\[]+/g, '').replace(/::[\w-]+/g, '').trim();
      if (cleaned) res.add(cleaned);
    }
  }
  return Array.from(res);
}

function htmlContainsSelector(html, selector) {
  // Heuristics: look for class (.foo), id (#bar), or tag selectors
  try {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      const re = new RegExp(`class=["'][^"']*\\b${escapeRegExp(cls)}\\b[^"']*["']`, 'i');
      return re.test(html);
    }
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      const re = new RegExp(`id=["']${escapeRegExp(id)}["']`, 'i');
      return re.test(html);
    }
    // Attribute selectors or combinators - do a simple substring match
    if (/[\[>+~]/.test(selector)) {
      return html.includes(selector);
    }
    // Tag selector - look for '<tag' occurrences
    const tag = selector.split(/\.|#|\s/)[0];
    const reTag = new RegExp(`<${escapeRegExp(tag)}[\s>]`, 'i');
    return reTag.test(html);
  } catch (e) {
    return false;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  const cssFiles = listFiles('public/css', '.css');
  const htmlFiles = listFiles('public', '.html').concat(listFiles('dist', '.html'));
  const htmlContents = htmlFiles.map(f => ({ f, t: fs.readFileSync(f, 'utf8') }));

  const report = {
    generated: new Date().toISOString(),
    cssFiles: {}
  };

  for (const css of cssFiles) {
    const text = fs.readFileSync(css, 'utf8');
    const selectors = extractSelectors(text);
    let referencedSelectors = 0;
    const selectorResults = [];
    for (const s of selectors) {
      let foundIn = [];
      for (const h of htmlContents) {
        if (htmlContainsSelector(h.t, s)) foundIn.push(h.f);
      }
      if (foundIn.length) referencedSelectors += 1;
      selectorResults.push({ selector: s, referencedIn: foundIn });
    }

    const fileEntry = {
      path: css,
      selectorCount: selectors.length,
      referencedSelectorCount: referencedSelectors,
      selectors: selectorResults
    };
    report.cssFiles[css] = fileEntry;
  }

  fs.writeFileSync('build/css-coverage-report.json', JSON.stringify(report, null, 2), 'utf8');

  // Also write a short markdown summary
  let md = `# CSS Coverage Report - ${report.generated}\n\n`;
  for (const [cssPath, info] of Object.entries(report.cssFiles)) {
    md += `## ${path.relative(process.cwd(), cssPath)}\n`;
    md += `- Selectors: ${info.selectorCount}\n`;
    md += `- Referenced selectors: ${info.referencedSelectorCount}\n`;
    const unused = info.selectors.filter(s => s.referencedIn.length === 0).slice(0, 20).map(s => s.selector);
    md += `- Sample unused selectors (up to 20 shown): ${unused.length ? unused.join(', ') : 'None'}\n\n`;
  }
  fs.writeFileSync('build/css-coverage-report.md', md, 'utf8');
  console.log('Coverage report written to build/css-coverage-report.json and build/css-coverage-report.md');
}

main().catch(e => { console.error(e); process.exit(1); });
