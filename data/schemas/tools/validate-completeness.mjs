import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const schemasDir = join('data','schemas');
const reportPath = join(schemasDir, 'completeness-report.json');

// Ensure completeness report exists (run generator if necessary)
if (!existsSync(reportPath)) {
  console.log('Completeness report not found — generating using check-schema-completeness.js');
  try {
    execSync('node data/schemas/tools/check-schema-completeness.js', { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to run completeness generator:', e.message);
    process.exit(2);
  }
}

let report;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (e) {
  console.error('Failed to read completeness report:', e.message);
  process.exit(2);
}

const missing = report.missingImportant || 0;

if (missing === 0) {
  console.log(`✅ Schema completeness checks passed — ${report.total || 0} files scanned, ${report.missingImportant || 0} files missing important fields.`);
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
if (report.details && Array.isArray(report.details)) {
  console.log('Top missing or minimal schema files:');
  report.details
    .filter(d => d.isMinimal || (d.missing && d.missing.length>0))
    .slice(0, 20)
    .forEach(d => console.log(` - ${d.file}: type=${d.type} missing=[${(d.missing||[]).join(', ')}]`));
}

console.error('Failing due to schema completeness enforcement (SCHEMA_ENFORCE=true).');
process.exit(1);
