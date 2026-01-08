#!/usr/bin/env node
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function main() {
  const inPath = path.resolve('reports', 'seo-report.json');
  const csvOut = path.resolve('reports', 'seo-canonical-mismatches.csv');
  const mdOut = path.resolve('reports', 'seo-canonical-mismatches.md');

  const raw = await readFile(inPath, 'utf8');
  const data = JSON.parse(raw);

  const mismatches = [];
  for (const r of data) {
    // Missing canonical or mismatch after rules
    const missingCanon = !r.canonical;
    const mismatch = r.canonical && !r.canonicalMatchesFinal;
    // Canonical points to root (site root) while final URL is not root
    const canonIsRoot = r.canonical && /https?:\/\/[^\/]+\/?$/.test(r.canonical);
    const finalIsRoot = r.finalUrl && /https?:\/\/[^\/]+\/?$/.test(r.finalUrl);
    if (missingCanon || mismatch || (canonIsRoot && !finalIsRoot)) {
      mismatches.push({ inputUrl: r.inputUrl, finalUrl: r.finalUrl, canonical: r.canonical, canonicalAfterRules: r.canonicalAfterRules, canonicalMatchesFinal: r.canonicalMatchesFinal, metaRobots: r.metaRobots, xRobotsTag: r.xRobotsTag, finalStatus: r.finalStatus, redirectChain: r.redirectChain });
    }
  }

  // Write CSV
  const headers = ['inputUrl','finalUrl','canonical','canonicalAfterRules','canonicalMatchesFinal','metaRobots','xRobotsTag','finalStatus','redirectChain'];
  const rows = [headers.join(',')];
  for (const m of mismatches) {
    rows.push([m.inputUrl,m.finalUrl,m.canonical || '',m.canonicalAfterRules || '',String(m.canonicalMatchesFinal),m.metaRobots || '',m.xRobotsTag || '',String(m.finalStatus),JSON.stringify(m.redirectChain).replace(/"/g,'""')].map(v => v.includes(',')||v.includes('\n')?`"${v.replace(/"/g,'""')}"`:v).join(','));
  }
  await writeFile(csvOut, rows.join('\n'), 'utf8');

  // Write human readable md
  let md = '# Canonical Mismatches Report\n\n';
  md += 'Total mismatches: ' + mismatches.length + '\n\n';
  let i = 1;
  for (const m of mismatches) {
    md += '## ' + i + '. ' + m.inputUrl + ' (final: ' + m.finalUrl + ')\n';
    md += '- canonical: ' + '`' + (m.canonical || '') + '`' + '\n';
    md += '- canonicalAfterRules: ' + '`' + (m.canonicalAfterRules || '') + '`' + '\n';
    md += '- canonicalMatchesFinal: ' + String(m.canonicalMatchesFinal) + '\n';
    md += '- meta[name="robots"]: ' + '`' + (m.metaRobots || '') + '`' + '\n';
    md += '- X-Robots-Tag: ' + '`' + (m.xRobotsTag || '') + '`' + '\n';
    md += '- HTTP status: ' + String(m.finalStatus) + '\n';
    md += '- Redirect chain: ' + '`' + JSON.stringify(m.redirectChain).replace(/"/g, '\\"') + '`' + '\n';
    md += '\n**Suggested action:**';
    if (!m.canonical) md += ' Add an explicit canonical tag that points to the intended final URL.';
    if (m.canonical && !m.canonicalMatchesFinal) md += ' Update canonical generation so that the canonical (after build rewrite rules) equals the final URL for the page.';
    if (m.canonical && /https?:\/\/[^\/]+\/?$/.test(m.canonical) && m.finalUrl && !/https?:\/\/[^\/]+\/?$/.test(m.finalUrl)) md += ' Replace site-root canonical on detail pages (e.g., AMP or tag pages) with page-specific canonical URLs.';
    md += '\n\n---\n\n';
    i++;
  }
  await writeFile(mdOut, md, 'utf8');

  console.log('Canonical mismatches:', mismatches.length);
  console.log('Wrote', csvOut, 'and', mdOut);
}

main().catch(e => { console.error(e); process.exit(1); });
