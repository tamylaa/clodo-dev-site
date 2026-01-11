#!/usr/bin/env node
/**
 * Internal Link Optimizer
 * Analyzes internal linking patterns, suggests improvements, validates consistency
 * 
 * Usage: node scripts/seo/internal-link-optimizer.mjs --dir public --analyze --suggestions --fix-orphaned
 */

import fs from 'fs';
import path from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function extractLinks(html, baseUrl = '') {
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const links = { internal: [], external: [], broken: [] };
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim().substring(0, 100);
    
    if (href.startsWith('#')) {
      // Anchor link
      links.internal.push({ href, text, type: 'anchor', isValid: true });
    } else if (href.startsWith('/') || href.startsWith('.')) {
      // Relative internal link
      links.internal.push({ href, text, type: 'relative', isValid: true });
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
      if (href.includes('clodo.dev') || href.includes('localhost')) {
        links.internal.push({ href, text, type: 'absolute', isValid: true });
      } else {
        links.external.push({ href, text, type: 'external' });
      }
    } else if (href.match(/^[a-zA-Z0-9\-_./]+$/)) {
      links.internal.push({ href, text, type: 'relative', isValid: true });
    } else {
      links.broken.push({ href, text, type: 'malformed', isValid: false });
    }
  }
  
  return links;
}

function analyzeAnchorText(links) {
  const analysis = {
    generic: [],
    excellent: [],
    missing: [],
    descriptive: []
  };
  
  const genericTexts = ['click here', 'read more', 'learn more', 'link', 'here', 'page', 'site'];
  
  links.internal.forEach(link => {
    const text = link.text.toLowerCase();
    
    if (!text) {
      analysis.missing.push(link);
    } else if (genericTexts.some(g => text === g || text.includes(g))) {
      analysis.generic.push(link);
    } else if (text.length > 50 || text.includes('|')) {
      analysis.descriptive.push(link);
    } else {
      analysis.excellent.push(link);
    }
  });
  
  return analysis;
}

function calculateLinkingMetrics(allResults) {
  const metrics = {
    totalPages: allResults.length,
    avgInternalLinks: 0,
    avgExternalLinks: 0,
    orphanedPages: 0,
    heavyPages: 0,
    lightPages: 0,
    topLinked: {},
    linkingDensity: 0
  };
  
  let totalInternal = 0;
  let totalExternal = 0;
  let totalWords = 0;
  
  allResults.forEach(result => {
    const internalCount = result.internalLinks?.length || 0;
    const externalCount = result.externalLinks?.length || 0;
    
    totalInternal += internalCount;
    totalExternal += externalCount;
    
    if (internalCount === 0) metrics.orphanedPages++;
    if (internalCount > 15) metrics.heavyPages++;
    if (internalCount < 3) metrics.lightPages++;
    
    // Track link targets
    result.internalLinks?.forEach(link => {
      const target = link.href.split('#')[0];
      metrics.topLinked[target] = (metrics.topLinked[target] || 0) + 1;
    });
  });
  
  metrics.avgInternalLinks = Math.round(totalInternal / allResults.length);
  metrics.avgExternalLinks = Math.round(totalExternal / allResults.length);
  
  return metrics;
}

function suggestImprovements(filePath, analysis, pageStats) {
  const suggestions = [];
  const internalCount = pageStats.internalLinks?.length || 0;
  
  if (internalCount < 3) {
    suggestions.push({
      type: 'low-internal-links',
      priority: 'MEDIUM',
      message: `Only ${internalCount} internal link(s) found. Target 3-7 contextual internal links.`,
      suggestion: 'Add contextual internal links to related content'
    });
  }
  
  if (analysis.generic.length > 0) {
    suggestions.push({
      type: 'generic-anchor-text',
      priority: 'MEDIUM',
      count: analysis.generic.length,
      message: `${analysis.generic.length} generic anchor text found (e.g., "click here", "read more")`,
      suggestion: 'Use descriptive anchor text that indicates link destination'
    });
  }
  
  if (analysis.missing.length > 0) {
    suggestions.push({
      type: 'missing-anchor-text',
      priority: 'HIGH',
      count: analysis.missing.length,
      message: `${analysis.missing.length} link(s) with empty or missing anchor text`,
      suggestion: 'All links should have descriptive, accessible anchor text'
    });
  }
  
  if (internalCount > 15) {
    suggestions.push({
      type: 'over-linking',
      priority: 'LOW',
      message: `${internalCount} internal links found - consider consolidating`,
      suggestion: 'Focus links on most relevant/important related content'
    });
  }
  
  return suggestions;
}

async function processFile(filePath) {
  try {
    const html = await readFile(filePath, 'utf8');
    const links = extractLinks(html);
    const anchorAnalysis = analyzeAnchorText(links.internal);
    const suggestions = suggestImprovements(filePath, anchorAnalysis, links);
    
    const wordCount = html.split(/\s+/).length;
    const linkDensity = links.internal.length > 0 ? Math.round((links.internal.length / wordCount) * 1000) / 10 : 0;
    
    return {
      file: filePath,
      internalLinks: links.internal.length,
      externalLinks: links.external.length,
      brokenLinks: links.broken.length,
      wordCount,
      linkDensity, // links per 100 words
      anchorTextQuality: {
        excellent: anchorAnalysis.excellent.length,
        descriptive: anchorAnalysis.descriptive.length,
        generic: anchorAnalysis.generic.length,
        missing: anchorAnalysis.missing.length
      },
      suggestions,
      status: suggestions.length === 0 ? 'optimal' : 'needs-improvement'
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
  const analyze = flags.analyze === true;
  const suggestions = flags.suggestions === true;
  const output = flags.output || 'reports/internal-links-audit.json';
  
  console.log(`🎯 Internal Link Optimizer`);
  console.log(`📁 Scanning: ${dir}`);
  
  const results = [];
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    files.forEach(file => {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'i18n') {
        walkDir(fullPath);
      } else if (file.endsWith('.html')) {
        const result = processFile(fullPath);
        results.push(result);
      }
    });
  }
  
  walkDir(dir);
  
  // Calculate metrics
  const validResults = results.filter(r => r.status !== 'error');
  const metrics = calculateLinkingMetrics(validResults);
  
  // Summarize
  const summary = {
    scanned: validResults.length,
    optimal: validResults.filter(r => r.status === 'optimal').length,
    needsImprovement: validResults.filter(r => r.status === 'needs-improvement').length,
    metrics,
    topSuggestions: [],
    results
  };
  
  // Collect top suggestions
  const allSuggestions = {};
  validResults.forEach(r => {
    r.suggestions?.forEach(s => {
      const key = s.type;
      allSuggestions[key] = (allSuggestions[key] || 0) + 1;
    });
  });
  
  summary.topSuggestions = Object.entries(allSuggestions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, affectedPages: count }));
  
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(summary, null, 2));
  
  console.log(`\n✅ Internal Link Analysis Complete`);
  console.log(`   Total pages: ${summary.scanned}`);
  console.log(`   Optimal: ${summary.optimal}`);
  console.log(`   Needs improvement: ${summary.needsImprovement}`);
  console.log(`\n📊 Metrics:`);
  console.log(`   Average internal links/page: ${metrics.avgInternalLinks}`);
  console.log(`   Average external links/page: ${metrics.avgExternalLinks}`);
  console.log(`   Orphaned pages (0 internal links): ${metrics.orphanedPages}`);
  console.log(`   Heavy pages (>15 links): ${metrics.heavyPages}`);
  console.log(`   Light pages (<3 links): ${metrics.lightPages}`);
  
  if (summary.topSuggestions.length > 0) {
    console.log(`\n💡 Top Opportunities:`);
    summary.topSuggestions.forEach(s => {
      console.log(`   ${s.affectedPages} pages: ${s.type}`);
    });
  }
  
  console.log(`\n📊 Report saved: ${output}`);
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
