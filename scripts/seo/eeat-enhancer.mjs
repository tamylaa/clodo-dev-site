#!/usr/bin/env node
/**
 * E-E-A-T Signal Analyzer & Enhancer
 * Detects and injects Expertise, Authority, Trust signals into pages
 * 
 * Usage: node scripts/seo/eeat-enhancer.mjs --dir public --fix --report
 */

import fs from 'fs';
import path from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const E_E_A_T_SIGNALS = {
  author: {
    pattern: /<meta\s+name=["']author["']/i,
    signal: 'Author metadata',
    weight: 10
  },
  datePublished: {
    pattern: /datePublished|published_date|article:published_time/i,
    signal: 'Publication date',
    weight: 8
  },
  dateModified: {
    pattern: /dateModified|last-modified|modified_time/i,
    signal: 'Last modified date',
    weight: 8
  },
  expertise: {
    pattern: /expert|specialist|professional|years of experience|certified/i,
    signal: 'Expertise claims',
    weight: 12
  },
  credentials: {
    pattern: /founder|ceo|phd|mba|expert|author of|contributor/i,
    signal: 'Author credentials',
    weight: 12
  },
  socialProof: {
    pattern: /testimonial|review|quote|customer|case study|success story/i,
    signal: 'Social proof',
    weight: 10
  },
  aboutAuthor: {
    pattern: /<div[^>]*class=["\']?about-author|author-bio|by-line/i,
    signal: 'Author bio section',
    weight: 15
  },
  authorLink: {
    pattern: /<a[^>]*href=["']\/?about\//i,
    signal: 'Link to about page',
    weight: 8
  },
  contentQuality: {
    pattern: /methodology|research|data|sources?|references/i,
    signal: 'Content quality indicators',
    weight: 10
  },
  recency: {
    pattern: /2024|2025|2026|january|february|march|april|may|june|july|august|september|october|november|december/i,
    signal: 'Recency indicators',
    weight: 8
  },
  orgSchema: {
    pattern: /"@type":\s*"Organization"/,
    signal: 'Organization schema',
    weight: 10
  }
};

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { flags: {} };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      result.flags[key] = value;
    }
  }
  return result.flags;
}

function analyzeEEAT(html) {
  const signals = {};
  let score = 0;
  
  Object.entries(E_E_A_T_SIGNALS).forEach(([key, { pattern, weight }]) => {
    const hasSignal = pattern.test(html);
    signals[key] = hasSignal;
    if (hasSignal) score += weight;
  });
  
  return {
    signals,
    score,
    maxScore: Object.values(E_E_A_T_SIGNALS).reduce((sum, s) => sum + s.weight, 0),
    percentage: Math.round((score / Object.values(E_E_A_T_SIGNALS).reduce((sum, s) => sum + s.weight, 0)) * 100)
  };
}

function recommendImprovements(analysis) {
  const recommendations = [];
  
  if (!analysis.signals.author) {
    recommendations.push({
      category: 'Author',
      priority: 'HIGH',
      issue: 'No author metadata detected',
      solution: 'Add <meta name="author" content="Your Name"> to <head>'
    });
  }
  
  if (!analysis.signals.datePublished) {
    recommendations.push({
      category: 'Dates',
      priority: 'HIGH',
      issue: 'No publication date',
      solution: 'Add datePublished in JSON-LD Article schema'
    });
  }
  
  if (!analysis.signals.dateModified) {
    recommendations.push({
      category: 'Dates',
      priority: 'MEDIUM',
      issue: 'No last modified date',
      solution: 'Add dateModified in JSON-LD Article schema'
    });
  }
  
  if (!analysis.signals.expertise) {
    recommendations.push({
      category: 'Expertise',
      priority: 'MEDIUM',
      issue: 'Missing expertise signals',
      solution: 'Add text highlighting expertise in content or author section'
    });
  }
  
  if (!analysis.signals.aboutAuthor) {
    recommendations.push({
      category: 'Author Bio',
      priority: 'MEDIUM',
      issue: 'No author biography section',
      solution: 'Add an "About the Author" section with credentials and bio'
    });
  }
  
  if (!analysis.signals.socialProof) {
    recommendations.push({
      category: 'Trust',
      priority: 'LOW',
      issue: 'Limited social proof',
      solution: 'Add testimonials, case studies, or customer success stories'
    });
  }
  
  return recommendations;
}

function injectEEATMetadata(html, metadata = {}) {
  // Inject author metadata
  if (!html.includes('<meta name="author"') && metadata.author) {
    html = html.replace(
      /(<meta name="description"[^>]*>)/,
      `$1\n    <meta name="author" content="${metadata.author}">`
    );
  }
  
  // Inject organization schema if missing
  if (!html.includes('"@type": "Organization"')) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": metadata.orgName || "Clodo",
      "url": "https://clodo.dev",
      "logo": "https://clodo.dev/icons/icon.svg"
    };
    
    html = html.replace(
      /(<\/head>)/,
      `    <script type="application/ld+json">
    ${JSON.stringify(schema, null, 4)}
    </script>\n$1`
    );
  }
  
  return html;
}

async function processFile(filePath, fix = false) {
  try {
    const html = await readFile(filePath, 'utf8');
    const analysis = analyzeEEAT(html);
    const recommendations = recommendImprovements(analysis);
    
    let modified = false;
    let newHtml = html;
    
    if (fix && recommendations.length > 0) {
      newHtml = injectEEATMetadata(html, {
        author: 'Clodo Technical Team',
        orgName: 'Clodo'
      });
      modified = newHtml !== html;
      
      if (modified) {
        await writeFile(filePath, newHtml, 'utf8');
      }
    }
    
    return {
      file: filePath,
      analysis,
      recommendations,
      modified,
      status: 'processed'
    };
  } catch (e) {
    return {
      file: filePath,
      error: e.message,
      status: 'error'
    };
  }
}

async function main() {
  const flags = parseArgs();
  const dir = flags.dir || 'public';
  const fix = flags.fix === true;
  const report = flags.report === true;
  const output = flags.output || 'reports/eeat-audit.json';
  
  console.log(`🎯 E-E-A-T Signal Analyzer & Enhancer`);
  console.log(`📁 Scanning: ${dir}`);
  if (fix) console.log(`🔧 Fix mode: ENABLED`);
  
  const results = [];
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    files.forEach(file => {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'i18n') {
        walkDir(fullPath);
      } else if (file.endsWith('.html')) {
        const result = processFile(fullPath, fix);
        results.push(result);
      }
    });
  }
  
  walkDir(dir);
  
  // Summarize results
  const summary = {
    total: results.length,
    processed: results.filter(r => r.status === 'processed').length,
    modified: results.filter(r => r.modified).length,
    avgScore: Math.round(results.reduce((sum, r) => sum + (r.analysis?.score || 0), 0) / results.length),
    maxScore: results.reduce((max, r) => Math.max(max, r.analysis?.maxScore || 0), 0),
    results
  };
  
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(summary, null, 2));
  
  console.log(`\n✅ E-E-A-T Audit Complete`);
  console.log(`   Total files: ${summary.total}`);
  console.log(`   Processed: ${summary.processed}`);
  console.log(`   Average score: ${summary.avgScore}/${summary.maxScore} (${Math.round((summary.avgScore/summary.maxScore)*100)}%)`);
  if (fix) console.log(`   Modified: ${summary.modified}`);
  
  // Show top improvements needed
  const allRecs = results.flatMap(r => r.recommendations || []);
  const topIssues = {};
  allRecs.forEach(rec => {
    topIssues[rec.issue] = (topIssues[rec.issue] || 0) + 1;
  });
  
  console.log(`\n📋 Top Issues:`);
  Object.entries(topIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([issue, count]) => {
      console.log(`   ${count} pages: ${issue}`);
    });
  
  console.log(`\n📊 Report saved: ${output}`);
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
