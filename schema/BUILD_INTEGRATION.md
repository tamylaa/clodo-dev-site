#!/usr/bin/env node

/**
 * BUILD.JS INTEGRATION GUIDE
 * 
 * This file shows how to integrate the data-driven schema system into build.js
 * Copy the relevant code snippets into your build.js file.
 */

// ============================================================================
// STEP 1: Add imports at the top of build.js
// ============================================================================

// Add this import with your other imports:
import { injectSchemasIntoHTML } from './schema/build-integration.js';

// ============================================================================
// STEP 2: During HTML file processing loop
// ============================================================================

// Find the section where build.js processes HTML files
// It should look something like:

/*
function processHTMLFile(filePath, outputPath) {
  let htmlContent = fs.readFileSync(filePath, 'utf8');
  
  // ... existing processing (templates, navigation, etc.) ...
  
  // INSERT THIS CODE BEFORE writing the file:
  // ============================================================
  htmlContent = injectSchemasIntoHTML(
    path.basename(filePath),
    htmlContent
  );
  // ============================================================
  
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
}
*/

// EXAMPLE: How to integrate into existing build loop
// ============================================================================

/*
// In your main build loop (usually in build.js):

const files = glob.sync('templates/**/*.html');

files.forEach(filePath => {
  // 1. Load HTML
  let htmlContent = fs.readFileSync(filePath, 'utf8');
  
  // 2. Load template and apply existing transformations
  // (templates, navigation, navigation, etc.)
  const template = loadTemplate();
  htmlContent = applyTemplate(htmlContent, template);
  
  // 3. INJECT GENERATED SCHEMAS ← NEW
  htmlContent = injectSchemasIntoHTML(
    path.basename(filePath),
    htmlContent
  );
  
  // 4. Apply existing post-processing
  htmlContent = optimizeCSS(htmlContent);
  htmlContent = minifyHTML(htmlContent);
  
  // 5. Write output
  const outputPath = `dist/${path.basename(filePath)}`;
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
});
*/

// ============================================================================
// STEP 3: Add a validation step (optional but recommended)
// ============================================================================

/*
// Add this function to validate schemas during build:

import { validateSchemaConfigs } from './schema/build-integration.js';

function validateSchemasInBuild() {
  const builtFiles = glob.sync('dist/**/*.html')
    .map(f => path.basename(f));
  
  const validation = validateSchemaConfigs(builtFiles);
  
  if (!validation.valid) {
    console.warn('⚠️  Schema configuration warnings:');
    validation.warnings.forEach(w => console.warn(`   - ${w}`));
  }
  
  if (validation.suggestions.length > 0) {
    console.log('💡 Schema configuration suggestions:');
    validation.suggestions.forEach(s => console.log(`   - ${s}`));
  }
  
  console.log(`\n📊 Schema coverage: ${validation.report.totalConfiguredPages} pages configured`);
}

// Call this after build completes:
// validateSchemasInBuild();
*/

// ============================================================================
// STEP 4: Pre-generate schemas for debugging (optional)
// ============================================================================

/*
// Add this to show what schemas are being generated:

import { preGenerateAllSchemas, getConfigurationReport } from './schema/build-integration.js';

function debugSchemaGeneration() {
  console.log('\n========================================');
  console.log('SCHEMA GENERATION DEBUG');
  console.log('========================================\n');
  
  const report = getConfigurationReport();
  console.log(`📊 Configuration Summary:`);
  console.log(`   Blog Posts:    ${report.blogPostsConfigured}`);
  console.log(`   Case Studies:  ${report.caseStudiesConfigured}`);
  console.log(`   Pages:         ${report.pagesConfigured}`);
  console.log(`   Total:         ${report.totalConfiguredPages}\n`);
  
  const schemas = preGenerateAllSchemas();
  console.log(`✅ Schemas pre-generated successfully`);
  console.log(`   Files: ${Object.keys(schemas).length}`);
  console.log(`   Ready for injection into build\n`);
}

// Call at start of build:
// debugSchemaGeneration();
*/

// ============================================================================
// COMPLETE BUILD.JS MODIFICATION EXAMPLE
// ============================================================================

/*
// Here's what a modified build.js might look like:

import { injectSchemasIntoHTML } from './schema/build-integration.js';

// ... existing imports and setup ...

async function build() {
  console.log('🔨 Building clodo.dev...\n');
  
  // Get all HTML templates
  const templates = glob.sync('templates/**/*.html');
  
  let processedCount = 0;
  let processedFiles = [];
  
  for (const templatePath of templates) {
    try {
      // Load HTML content
      let htmlContent = fs.readFileSync(templatePath, 'utf8');
      
      // Apply existing transformations
      htmlContent = loadAndApplyTemplate(htmlContent);
      htmlContent = injectNavigation(htmlContent);
      htmlContent = optimizeAssets(htmlContent);
      
      // ← NEW: Inject generated schemas
      const filename = path.basename(templatePath);
      htmlContent = injectSchemasIntoHTML(filename, htmlContent);
      
      // Post-processing
      htmlContent = minifyHTML(htmlContent);
      
      // Write output
      const outputPath = path.join('dist', path.basename(templatePath));
      fs.writeFileSync(outputPath, htmlContent, 'utf8');
      
      processedCount++;
      processedFiles.push(filename);
      
    } catch (error) {
      console.error(`❌ Failed to process ${templatePath}: ${error.message}`);
    }
  }
  
  console.log(`✅ Build complete: ${processedCount} files processed`);
  console.log(`✅ Schemas injected for configured pages`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
*/

// ============================================================================
// KEY POINTS
// ============================================================================

/*
1. LOCATION: Add `injectSchemasIntoHTML()` AFTER all other HTML transforms
   - After templates applied
   - After navigation injected
   - After CSS/images optimized
   - BEFORE minification (optional, works either way)

2. TIMING: Call only on HTML files that need schemas
   - The function checks page-config.json
   - If file isn't configured, it returns original HTML unchanged
   - No harm in calling on all HTML files

3. DEPENDENCIES:
   - data/schemas/page-config.json should exist (legacy `schema/page-config.json` supported)
   - data/schemas/defaults.json should exist (legacy `schema/defaults.json` supported)
   - schema/schema-generator.js must exist
   - blog-data.json must exist (for author data)

4. ERROR HANDLING:
   - injectSchemasIntoHTML() handles missing config gracefully
   - Returns original HTML if no schema found
   - Won't break build if schema generation fails

5. VERIFICATION:
   - After build, open dist/blog/post.html in browser
   - View page source → Search "application/ld+json"
   - Should see 3 schema blocks: Organization, TechArticle, BreadcrumbList

6. DEBUGGING:
   - Run: node schema/cli.js status
   - Run: node schema/cli.js generate
   - Run: node schema/cli.js validate
*/

// ============================================================================
// MINIMAL EXAMPLE (Just the essential code)
// ============================================================================

/*
// Add to top of build.js:
import { injectSchemasIntoHTML } from './schema/build-integration.js';

// Add to HTML processing loop (one line!):
htmlContent = injectSchemasIntoHTML(path.basename(filePath), htmlContent);

// Done! Schemas now auto-generated at build time.
*/

// ============================================================================
// TESTING AFTER INTEGRATION
// ============================================================================

/*
1. Run build:
   npm run build

2. Check if schemas were injected:
   grep -r "application/ld+json" dist/blog/*.html
   
   Should show schemas in all blog posts

3. Validate with Google:
   - Open: https://search.google.com/test/rich-results
   - Upload or paste dist/blog/post.html
   - Should show green checkmarks for schema validation

4. Check CLI reports:
   node schema/cli.js status
   node schema/cli.js validate
   
   Should confirm all 10+ pages are configured

5. Verify no build errors:
   - Check console for "Build complete"
   - Check dist/ has all expected files
   - Check output file sizes are reasonable
*/

export default {}; // This file is for reference only, not meant to be imported
