#!/usr/bin/env node
/**
 * Extract all HTML files from filesystem into manifest format
 * Reverse-engineers page structure from public/ directory
 * 
 * Output: Array of { path, file, type, locale, isIndex, isAdmin, isExperiment }
 * 
 * Usage: node tools/extract-filesystem-manifest.js > /tmp/filesystem-manifest.json
 */
import fs from 'fs';
import path from 'path';

const skipDirs = ['node_modules', 'css', 'js', 'icons', 'demo', 'images', 'assets', 'fonts', 'vendor', '_next', '.git', 'amp'];

function fileToPath(filePath) {
  // Convert file path to URL path
  let p = filePath
    .replace(/\\/g, '/') // Windows paths
    .replace(/^public\//, '') // Remove public/ prefix
    .replace(/\.html$/, ''); // Remove .html extension
  
  if (p === 'index') p = '/';
  else if (!p.startsWith('/')) p = '/' + p;
  
  return p;
}

function isI18nPath(filePath) {
  return filePath.includes('/i18n/');
}

function isAdminPage(filePath) {
  const adminPatterns = [
    '/analytics', '/content-performance-monitoring', '/performance-dashboard',
    '/404', '/download/thanks', '/subscribe/thanks'
  ];
  return adminPatterns.some(p => filePath === p || filePath.startsWith(p + '/'));
}

function isExperimentPage(filePath) {
  return filePath.startsWith('/experiments/');
}

function isBlogPost(filePath) {
  return filePath.startsWith('/blog/') && filePath !== '/blog' && filePath !== '/blog/index';
}

function getCaseStudy(filePath) {
  return filePath.startsWith('/case-studies/') && filePath !== '/case-studies' && filePath !== '/case-studies/index';
}

function getLocaleFromPath(filePath) {
  const match = filePath.match(/\/i18n\/([a-z0-9-]+)\//);
  return match ? match[1] : 'en';
}

function getAllHtmlFiles(dir, prefix = '') {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        if (skipDirs.includes(entry.name) || entry.name.startsWith('.')) continue;
        results.push(...getAllHtmlFiles(fullPath, relativePath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const urlPath = fileToPath(relativePath);
        
        results.push({
          path: urlPath,
          file: relativePath.replace(/\\/g, '/'),
          type: isBlogPost(urlPath) ? 'blog-post' : getCaseStudy(urlPath) ? 'case-study' : isExperimentPage(urlPath) ? 'experiment' : 'page',
          locale: getLocaleFromPath(urlPath),
          isI18n: isI18nPath(urlPath),
          isAdmin: isAdminPage(urlPath),
          isExperiment: isExperimentPage(urlPath),
          isIndex: relativePath.endsWith('/index.html')
        });
      }
    }
  } catch (e) {
    console.error(`Error reading ${dir}:`, e.message);
  }
  return results;
}

const filesystem = getAllHtmlFiles('public').sort((a, b) => a.path.localeCompare(b.path));

console.log(JSON.stringify(filesystem, null, 2));
process.exit(0);
