import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const schemasDir = join('data','schemas');
const reportPath = join(schemasDir, 'completeness-report.json');

// Always regenerate completeness report to avoid stale data in CI
console.log('Generating completeness report using check-schema-completeness.js');
try {
  execSync('node data/schemas/tools/check-schema-completeness.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to run completeness generator:', e.message);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (e) {
  console.error('Failed to read completeness report:', e.message);
  process.exit(2);
}

// Filter out schemas for non-existent HTML files (skeleton schemas)
const problemFiles = report.details.filter(d => {
  if (!d.missing || d.missing.length === 0 || d.isMinimal) return false;
  
  // Extract the page name from the schema file path
  const pageName = d.file.match(/pages\/(.+?)-article\.json/)?.[1];
  if (!pageName) return true; // Keep non-article files
  
  // Check if corresponding HTML file exists in dist
  const htmlPath = join('dist', `${pageName}.html`);
  const exists = existsSync(htmlPath);
  
  if (!exists) {
    console.log(`ℹ️  Skipping schema validation for skeleton file: ${d.file} (no HTML page yet)`);
  }
  return exists;
});

const missing = problemFiles.length;

if (missing === 0) {
  console.log(`✅ Schema completeness checks passed — ${report.total || 0} files scanned.`);
  process.exit(0);
}

// If enforcement is enabled via env var, fail the script.
const enforce = process.env.SCHEMA_ENFORCE === 'true';

console.warn(`⚠️ Schema completeness issues found: ${missing} files missing important fields.`);
if (!enforce) {
  console.warn('Run with SCHEMA_ENFORCE=true to fail CI when missing fields are present.');
  process.exit(0);
}

// Print top 20 problematic files for diagnostics
if (problemFiles.length > 0) {
  console.log('Top missing or minimal schema files:');
  problemFiles
    .slice(0, 20)
    .forEach(d => console.log(` - ${d.file}: type=${d.type} missing=[${(d.missing||[]).join(', ')}]`));
}

console.error('Failing due to schema completeness enforcement (SCHEMA_ENFORCE=true).');
process.exit(1);
