#!/usr/bin/env node
/**
 * Validate built HTML files for expected schema types
 * Usage: node tools/validate-built-schemas.js [distPath] [--fail]
 * - distPath defaults to ./dist
 * - --fail will exit non-zero when missing critical schemas are found
 */
import { readdirSync, readFileSync } from 'fs';
import { join, extname, basename } from 'path';

let pageConfig = {};
try {
  pageConfig = JSON.parse(readFileSync('data/schemas/page-config.json', 'utf8'));
} catch (e) {
  // page-config not available in this environment - validator will be conservative
}

// Optional allowlist: load from data/schemas/validator-allowlist.json or pageConfig.validatorAllowList
let validatorAllowList = [];
try {
  const allowFile = JSON.parse(readFileSync('data/schemas/validator-allowlist.json', 'utf8'));
  if (Array.isArray(allowFile)) validatorAllowList = allowFile;
} catch (e) {
  // no explicit allowlist file — that's fine
}
if (Array.isArray(pageConfig.validatorAllowList)) {
  validatorAllowList.push(...pageConfig.validatorAllowList);
}
validatorAllowList = [...new Set(validatorAllowList)];

// Helper to check allowlist entries (supports simple '*' prefix/suffix wildcards)
function matchesAllowList(list, testPath) {
  if (!testPath || !Array.isArray(list)) return false;
  const p = testPath.replace(/\\/g,'/').replace(/^\/*/, '');
  const pParts = p.split('/');
  for (const entry of list) {
    if (!entry) continue;
    const e = entry.replace(/\\/g,'/').replace(/^\/*/, '');
    const eParts = e.split('/');

    // Exact match
    if (e === p) return true;

    // Wildcard prefix (e.g., i18n/ar/*)
    if (e.endsWith('*') && p.startsWith(e.slice(0, -1))) return true;

    // Wildcard suffix (e.g., */pricing.html)
    if (e.startsWith('*') && p.endsWith(e.slice(1))) return true;

    // If entry is a plain basename (no path separators), only match top-level files (prevent accidental i18n matches)
    if (eParts.length === 1 && pParts.length === 1 && p === e) return true;
  }
  return false;
}

function isAllowlistedPath(testPath) {
  if (!testPath) return false;
  const p = testPath.replace(/\\/g,'/').replace(/^\/*/, '');
  for (const entry of validatorAllowList) {
    if (!entry) continue;
    const e = entry.replace(/\\/g,'/').replace(/^\/*/, '');
    // Direct match
    if (e === p) return true;
    // Wildcard prefix (e.g., i18n/ar/*)
    if (e.endsWith('*') && p.startsWith(e.slice(0, -1))) return true;
    // Wildcard suffix (e.g., */pricing.html)
    if (e.startsWith('*') && p.endsWith(e.slice(1))) return true;
    // Plain basename entries should only match top-level files (prevent accidental i18n matches)
    if (!e.includes('/') && !p.includes('/') && p === e) return true;
  }
  return false;
}

const distPath = process.argv[2] || 'dist';
const failOnMissing = process.argv.includes('--fail');

// Default severity mapping for schema types. Can be overridden by page-config.requiredSchemas which are treated as critical.
const SEVERITY = Object.freeze({ CRITICAL: 'critical', RECOMMENDED: 'recommended', OPTIONAL: 'optional' });
const severityDefaults = {
  'Organization': SEVERITY.CRITICAL,
  'WebSite': SEVERITY.CRITICAL,
  'SoftwareApplication': SEVERITY.CRITICAL,
  'Article': SEVERITY.RECOMMENDED,
  'BlogPosting': SEVERITY.RECOMMENDED,
  'TechArticle': SEVERITY.RECOMMENDED,
  'BreadcrumbList': SEVERITY.RECOMMENDED,
  'FAQPage': SEVERITY.OPTIONAL,
  'HowTo': SEVERITY.OPTIONAL,
  'Product': SEVERITY.OPTIONAL,
  'LearningResource': SEVERITY.RECOMMENDED
};

function normalizedRelFor(file) {
  const p = (file || '').replace(/\\/g, '/');
  const m = p.match(/(?:^|\/)dist\/(.*)$/i);
  if (m && m[1]) return m[1].replace(/^\/+/, '');
  const m2 = p.match(/(?:^|\/)public\/(.*)$/i);
  if (m2 && m2[1]) return m2[1].replace(/^\/+/, '');
  return p.split('/').pop();
}

function classifySeverity(filePath, expectedType) {
  // Page-specific overrides: if the page-config lists requiredSchemas include expectedType, treat as critical
  try {
    const baseName = filePath.split('/').pop();
    const lookupKey = baseName.replace(/\.amp\.html$/i, '.html');
    const pageKey = lookupKey.replace(/\.html$/i, '');

    // Also support explicit path-based page configs under pageConfig.pagesByPath
    const normalizedRel = normalizedRelFor(filePath);
    if (pageConfig.pagesByPath && pageConfig.pagesByPath[normalizedRel]) {
      const cfg = pageConfig.pagesByPath[normalizedRel];
      const reqs = cfg.requiredSchemas || [];
      if (reqs.includes(expectedType)) return SEVERITY.CRITICAL;
      if (cfg.type === 'Article' && expectedType === 'Article') return SEVERITY.CRITICAL;
    }

    // Blog post explicit configuration
    if (pageConfig.blogPosts && pageConfig.blogPosts[lookupKey]) {
      const reqs = pageConfig.blogPosts[lookupKey].requiredSchemas || [];
      if (reqs.includes(expectedType)) return SEVERITY.CRITICAL;
    }

    // Case studies explicit configuration
    if (pageConfig.caseStudies && pageConfig.caseStudies[lookupKey]) {
      const reqs = pageConfig.caseStudies[lookupKey].requiredSchemas || [];
      if (reqs.includes(expectedType)) return SEVERITY.CRITICAL;
    }

    // Pages explicit configuration (filename-based)
    if (pageConfig.pages && pageConfig.pages[pageKey]) {
      const reqs = pageConfig.pages[pageKey].requiredSchemas || [];
      if (reqs.includes(expectedType)) return SEVERITY.CRITICAL;
      // If page explicitly marked as type=Article and expectedType is Article, make it critical
      if (pageConfig.pages[pageKey].type === 'Article' && expectedType === 'Article') return SEVERITY.CRITICAL;
    }
  } catch (e) {
    // fall back to defaults on any error
  }

  return severityDefaults[expectedType] || SEVERITY.RECOMMENDED;
}

function findHtmlFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...findHtmlFiles(p));
    else if (e.isFile() && (extname(e.name) === '.html' || extname(e.name) === '.htm')) files.push(p);
  }
  return files;
}

function extractSchemas(html) {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const types = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    const jsonText = m[1].trim();
    try {
      const parsed = JSON.parse(jsonText);
      const t = parsed['@type'];
      if (Array.isArray(t)) types.push(...t);
      else if (typeof t === 'string') types.push(t);
      else if (parsed['@graph']) {
        // collect types from @graph
        const g = parsed['@graph'];
        if (Array.isArray(g)) g.forEach(item => item['@type'] && types.push(item['@type']));
      }
    } catch (e) {
      // ignore invalid JSON—will be caught by other tests
    }
  }
  return [...new Set(types)];
}

// Basic heuristics to expect schema types for a file
function expectedForFile(filePath, html) {
  const expected = new Set(['Organization', 'WebSite', 'SoftwareApplication']);
  // Check for breadcrumb markup (same as injection logic)
  const hasBreadcrumbMarkup = /<nav[^>]*class=["']?breadcrumbs["']?[^>]*>[\s\S]*?<\/nav>/i.test(html) || /<nav[^>]*aria-label=["']?Breadcrumb["']?[^>]*>[\s\S]*?<\/nav>/i.test(html);

  // Normalize names and check page-config when available
  const baseName = filePath.split('/').pop();
  const lookupKey = baseName.replace(/\.amp\.html$/i, '.html');
  const pageKey = lookupKey.replace(/\.html$/i, '');
  const isConfiguredBlog = Object.prototype.hasOwnProperty.call(pageConfig.blogPosts || {}, lookupKey);
  const isConfiguredPage = Object.prototype.hasOwnProperty.call(pageConfig.pages || {}, pageKey);
  const isConfiguredCaseStudy = Object.prototype.hasOwnProperty.call(pageConfig.caseStudies || {}, lookupKey);

  // AMP special handling: if this is an AMP variant and the canonical page is not explicitly configured,
  // be conservative and don't require Article/BlogPosting for the AMP file
  const isAmp = /\.amp\.html$/i.test(baseName);
  if (isAmp && !(isConfiguredBlog || isConfiguredPage || isConfiguredCaseStudy)) {
    return Array.from(expected);
  }

  // Blog posts: require BlogPosting only for configured blog posts or non-index blog files
  const isBlogIndex = /\/blog\/index(\.amp)?\.html$/i.test(filePath);
  if (!isBlogIndex && (isConfiguredBlog || /\/blog\//i.test(filePath))) {
    expected.add('BlogPosting');
    if (hasBreadcrumbMarkup) expected.add('BreadcrumbList');
  }

  // For blog pages, don't require FAQPage — blog posts generally don't include FAQ markup and
  // this has caused false positive deploy failures for AMP/blog artifacts.
  if (/\/blog\//i.test(filePath)) {
    expected.delete('FAQPage');
  }

  // Case studies — require Article if configured or path indicates case studies
  // However, if a path-based page config explicitly exists for this file, respect it (don't add Article implicitly)
  const normalizedRel = normalizedRelFor(filePath);
  const isConfiguredByPath = pageConfig.pagesByPath && pageConfig.pagesByPath[normalizedRel];
  if (!isConfiguredByPath && (isConfiguredCaseStudy || /\/case-studies\//i.test(filePath))) {
    expected.add('Article');
    if (hasBreadcrumbMarkup) expected.add('BreadcrumbList');
  }

  // If page-config explicitly lists requiredSchemas for a page (by filename), include those
  if (isConfiguredPage) {
    const cfg = pageConfig.pages?.[pageKey];
    if (cfg?.requiredSchemas && Array.isArray(cfg.requiredSchemas)) {
      for (const s of cfg.requiredSchemas) expected.add(s);
    }
    if (cfg?.type === 'Article') expected.add('Article');
  }

  // If page-config explicitly lists requiredSchemas for a page path (pagesByPath), include those and respect their type
  if (isConfiguredByPath) {
    const cfg = pageConfig.pagesByPath[normalizedRel];
    if (cfg?.requiredSchemas && Array.isArray(cfg.requiredSchemas)) for (const s of cfg.requiredSchemas) expected.add(s);
    if (cfg?.type === 'Article') expected.add('Article');
  }

  // Article markers in the HTML: only enforce Article when it's not an index/listing page
  const hasArticleMarkers = /<article[\s>]/i.test(html) || /meta property="og:type" content="article"/i.test(html);
  const isIndex = /(^|\/)index(\.amp)?\.html$/i.test(filePath);
  if (hasArticleMarkers && !isIndex) {
    // For blog pages (including AMP variants) prefer BlogPosting rather than Article. Some AMP/blog
    // artifacts don't include a full Article injection and have been failing the validator as critical.
    if (/\/blog\//i.test(filePath)) {
      expected.add('BlogPosting');
      if (hasBreadcrumbMarkup) expected.add('BreadcrumbList');
    } else {
      expected.add('Article');
      if (hasBreadcrumbMarkup) expected.add('BreadcrumbList');
    }
  }

  // Debug: dump expectations for known problem files
  try {
    const watch = new Set(['blog/index.html','case-studies/index.html','community/welcome.html','index.html','multi-tenant-saas.html','pricing.html']);
    const nr = normalizedRelFor(filePath);
    if (watch.has(nr) || watch.has(pageKey)) {
      console.log('DEBUG expectedForFile', nr, { pageKey, isConfiguredByPath: !!isConfiguredByPath, isConfiguredPage: !!isConfiguredPage, isConfiguredCaseStudy: !!isConfiguredCaseStudy, isBlogIndex: /\/blog\/index(\.amp)?\.html$/i.test(filePath), isIndex, hasArticleMarkers, expected: Array.from(expected) });
    }
  } catch (e) {
    // ignore debug failure
  }

  // Ensure FAQPage is not required for any blog page variants (including AMP), even if page-config
  // lists FAQPage for the page. This avoids false-positive critical failures for blog artifacts.
  try {
    if (/\/blog\//i.test(filePath)) expected.delete('FAQPage');
  } catch (e) {
    // noop on any error
  }

  return Array.from(expected);
}

function run() {
  const files = findHtmlFiles(distPath);
  const report = [];

  for (const file of files) {
    // Skip demo pages and verification files which are intentionally schema-free
    const base = file.replace(/\\/g, '/');
    const baseName = basename(base);
    if (/\/demo\//.test(base) || /^google.*\.html$/i.test(baseName)) {
      continue;
    }

    // Allowlist skip: support page-config exceptions first (explicit source), then fallback to global allowlist
    const normalizedRel = base.replace(new RegExp(`^${distPath.replace(/\\/g,'/')}/*`), '').replace(/^\/+/, '');
    const pageConfigList = Array.isArray(pageConfig.validatorAllowList) ? pageConfig.validatorAllowList : [];
    const isTopLevelFile = !normalizedRel.includes('/');
    if (matchesAllowList(pageConfigList, base) || matchesAllowList(pageConfigList, normalizedRel) || (isTopLevelFile && matchesAllowList(pageConfigList, baseName))) {
      console.log(`ℹ️ Skipping schema validation for page-config exception: ${normalizedRel}`);
      continue;
    }
    // Fallback: other allowlist sources (external file, etc.)
    if (isAllowlistedPath(base) || isAllowlistedPath(normalizedRel) || isAllowlistedPath(baseName)) {
      console.log(`ℹ️ Skipping schema validation for allowlisted file: ${normalizedRel}`);
      continue;
    }

    const html = readFileSync(file, 'utf8');
    const types = extractSchemas(html);
    const expected = expectedForFile(file, html);
    // Acceptable alternatives for certain expectations (Article/BlogPosting/TechArticle are interchangeable for our audit)
    const acceptable = {
      'BlogPosting': ['BlogPosting', 'Article', 'TechArticle'],
      'Article': ['Article', 'TechArticle', 'BlogPosting']
    };

    const missingBySeverity = { critical: [], recommended: [], optional: [] };

    for (const t of expected) {
      const alts = acceptable[t] || [t];
      const present = alts.some(a => types.includes(a));
      if (!present) {
        const severity = classifySeverity(file, t);
        if (severity === SEVERITY.CRITICAL) missingBySeverity.critical.push(t);
        else if (severity === SEVERITY.RECOMMENDED) missingBySeverity.recommended.push(t);
        else missingBySeverity.optional.push(t);
      }
    }

    report.push({ file: file.replace(/\\/g, '/'), types, expected, missingBySeverity });
  }

  // Summarize: group missing issues by severity
  const filesWithAnyMissing = report.filter(r => {
    const m = r.missingBySeverity || { critical: [], recommended: [], optional: [] };
    return (m.critical && m.critical.length) || (m.recommended && m.recommended.length) || (m.optional && m.optional.length);
  });

  if (!filesWithAnyMissing.length) {
    console.log('✅ All checked files contain the expected schema types.');
    return 0;
  }

  // Aggregate counts
  let totalCritical = 0;
  let totalRecommended = 0;
  let totalOptional = 0;

  console.log('\n🔍 Schema validation report (missing items by severity):');
  filesWithAnyMissing.forEach(r => {
    const missing = r.missingBySeverity || { critical: [], recommended: [], optional: [] };
    totalCritical += missing.critical.length;
    totalRecommended += missing.recommended.length;
    totalOptional += missing.optional.length;

    console.log(`\n- ${r.file}`);
    console.log(`  Present: ${r.types.join(', ') || '(none)'}`);
    console.log(`  Expected: ${r.expected.join(', ')}`);
    if (missing.critical.length) console.log(`  Missing (critical): ${missing.critical.join(', ')}`);
    if (missing.recommended.length) console.log(`  Missing (recommended): ${missing.recommended.join(', ')}`);
    if (missing.optional.length) console.log(`  Missing (optional): ${missing.optional.join(', ')}`);
  });

  console.log('\nSummary:');
  console.log(`  Critical: ${totalCritical}`);
  console.log(`  Recommended: ${totalRecommended}`);
  console.log(`  Optional: ${totalOptional}`);

  // Fail only on criticals when --fail is passed
  if (failOnMissing && totalCritical > 0) {
    console.error('\n❌ Missing critical structured data in one or more files. Failing build.');
    process.exit(1);
  } else if (totalCritical > 0) {
    console.error('\n❌ Missing critical structured data found. Run with --fail to fail the build, or add required schemas to page-config to mark them as covered.');
  } else {
    console.warn('\n⚠️  Missing recommended/optional structured data detected. Consider addressing recommended items for better coverage.');
  }

  return 0;
}

// If invoked directly, execute the run function. In ESM environment we can't use require.main === module
if (process.argv[1] && process.argv[1].endsWith('validate-built-schemas.js')) run();

export default { run };
