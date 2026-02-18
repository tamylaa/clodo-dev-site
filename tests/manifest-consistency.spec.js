import { describe, it, beforeAll } from 'vitest';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let manifest, filesystem, sitemap, nav;

beforeAll(() => {
  // Load manifest
  manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'pages-manifest.json'), 'utf8'));
  
  // Count entries by type
  filesystem = manifest.filter(e => e.file !== null);
  sitemap = manifest.filter(e => e.inSitemap);
  nav = manifest.filter(e => e.inNav);
});

describe('Pages Manifest Consistency', () => {
  
  it('manifest should exist and be valid JSON', () => {
    assert(manifest, 'Manifest not loaded');
    assert(Array.isArray(manifest), 'Manifest is not an array');
    assert(manifest.length > 0, 'Manifest is empty');
  });

  it('all filesystem pages should be accounted for', () => {
    assert.strictEqual(
      filesystem.length,
      235,
      `Expected 235 filesystem pages, got ${filesystem.length}`
    );
  });

  it('all entries should have required fields', () => {
    for (const entry of manifest) {
      assert(entry.path, `Entry missing path: ${JSON.stringify(entry)}`);
      assert(typeof entry.indexed === 'boolean', `Entry missing indexed boolean: ${entry.path}`);
      assert(typeof entry.inNav === 'boolean', `Entry missing inNav boolean: ${entry.path}`);
      assert(typeof entry.inSitemap === 'boolean', `Entry missing inSitemap boolean: ${entry.path}`);
    }
  });

  it('admin pages should not be indexed', () => {
    const indexedAdmin = manifest.filter(e => e.isAdmin && e.indexed);
    assert.strictEqual(
      indexedAdmin.length,
      0,
      `Found ${indexedAdmin.length} admin pages that are marked as indexed: ${indexedAdmin.map(e => e.path).join(', ')}`
    );
  });

  it('experiment pages should not be indexed', () => {
    const indexedExperiments = manifest.filter(e => e.isExperiment && e.indexed);
    assert.strictEqual(
      indexedExperiments.length,
      0,
      `Found ${indexedExperiments.length} experiment pages that are marked as indexed`
    );
  });

  it('all sitemap entries should have corresponding filesystem entry', () => {
    const orphaned = sitemap.filter(e => !e.file);
    assert.strictEqual(
      orphaned.length,
      2, // /blog/ and /case-studies/
      `Found ${orphaned.length} sitemap entries with no files (expected 2 - /blog/ and /case-studies/): ${orphaned.map(e => e.path).join(', ')}`
    );
  });

  it('all nav entries should either have files or be external/anchor links', () => {
    const orphaned = nav.filter(e => !e.file && !e.path.startsWith('http') && !e.path.includes('#'));
    assert.strictEqual(
      orphaned.length,
      0,
      `Found ${orphaned.length} internal nav entries with no files: ${orphaned.map(e => e.path).join(', ')}`
    );
  });

  it('indexed pages should match sitemap count', () => {
    const indexed = manifest.filter(e => e.indexed && e.file);
    const sitemapCount = sitemap.filter(e => e.file).length;
    assert.strictEqual(
      indexed.length,
      sitemapCount,
      `Indexed count (${indexed.length}) doesn't match sitemap (${sitemapCount})`
    );
  });

  it('no pages should be duplicated', () => {
    const paths = manifest.map(e => e.path);
    const unique = new Set(paths);
    assert.strictEqual(
      paths.length,
      unique.size,
      `Found ${paths.length - unique.size} duplicate entries`
    );
  });

  it('paths should be consistently formatted', () => {
    const badPaths = manifest.filter(e => {
      const path = e.path;
      // Must start with /
      if (!path.startsWith('/')) return true;
      // Must not have .html
      if (path.includes('.html')) return true;
      // Must not end with / except root
      if (path !== '/' && path.endsWith('/')) return true;
      return false;
    });
    assert.strictEqual(
      badPaths.length,
      0,
      `Found ${badPaths.length} pages with inconsistent path format: ${badPaths.map(e => e.path).join(', ')}`
    );
  });

  it('all i18n pages should have locale set', () => {
    const i18n = manifest.filter(e => e.isI18n);
    const noLocale = i18n.filter(e => !e.locale || e.locale === 'en');
    assert.strictEqual(
      noLocale.length,
      0,
      `Found ${noLocale.length} i18n pages without proper locale: ${noLocale.map(e => e.path).join(', ')}`
    );
  });

  it('should report statistics', () => {
    console.log('\n📊 Manifest Statistics:');
    console.log(`   Total entries: ${manifest.length}`);
    console.log(`   Filesystem pages: ${filesystem.length}`);
    console.log(`   In sitemap: ${sitemap.length} (${((sitemap.length / filesystem.length) * 100).toFixed(1)}%)`);
    console.log(`   In nav: ${nav.length} (${((nav.length / filesystem.length) * 100).toFixed(1)}%)`);
    console.log(`   Admin pages: ${manifest.filter(e => e.isAdmin).length}`);
    console.log(`   Experiment pages: ${manifest.filter(e => e.isExperiment).length}`);
    console.log(`   I18n pages: ${manifest.filter(e => e.isI18n).length}`);
    
    const notIndexedPages = manifest.filter(e => e.file && !e.indexed && !e.isAdmin && !e.isExperiment);
    console.log(`   Not indexed (public pages): ${notIndexedPages.length}`);
  });

});
