#!/usr/bin/env node
/**
 * SEO Scripts Quick Reference & Common Tasks
 * Copy & paste commands for common SEO maintenance tasks
 */

const TASKS = {
  "Analyze Your Site (5 minutes)": [
    "# Quick audit of entire site",
    "node scripts/seo/pre-deployment-seo-check.mjs --dir public",
    "",
    "# Opens: reports/seo-pre-deployment-check.json"
  ],

  "Fix All SEO Issues (30 minutes)": [
    "# Step 1: Generate/fix all schemas",
    "node scripts/seo/schema-generator.mjs --dir public --generate",
    "",
    "# Step 2: Fix heading hierarchy",
    "node scripts/seo/heading-validator.mjs --dir public --fix",
    "",
    "# Step 3: Add E-E-A-T signals",
    "node scripts/seo/eeat-enhancer.mjs --dir public --fix",
    "",
    "# Step 4: Verify all fixes",
    "node scripts/seo/pre-deployment-seo-check.mjs --dir public"
  ],

  "Check Schemas Only": [
    "node scripts/seo/schema-generator.mjs --dir public",
    "cat reports/schema-audit.json"
  ],

  "Improve Author/Trust Signals": [
    "node scripts/seo/eeat-enhancer.mjs --dir public --fix",
    "cat reports/eeat-audit.json"
  ],

  "Fix Heading Hierarchy": [
    "node scripts/seo/heading-validator.mjs --dir public --fix",
    "cat reports/heading-audit.json"
  ],

  "Optimize Internal Links": [
    "node scripts/seo/internal-link-optimizer.mjs --dir public --analyze",
    "cat reports/internal-links-audit.json"
  ],

  "Pre-Deployment Verification": [
    "# Full check before going live",
    "node scripts/seo/pre-deployment-seo-check.mjs --dir dist --generate-report",
    "echo $?  # 0=pass, 1=needs review"
  ],

  "Generate All Reports": [
    "# Create reports for all 5 checks",
    "for script in schema-generator eeat-enhancer heading-validator internal-link-optimizer; do",
    "  node scripts/seo/${script}.mjs --dir public --output reports/${script}-results.json",
    "done"
  ],

  "View Latest Reports": [
    "# List all reports by modification time",
    "ls -lart reports/",
    "",
    "# View specific report",
    "cat reports/seo-pre-deployment-check.json | jq '.summary'"
  ],

  "CI/CD Integration": [
    "# Add to your deployment script:",
    "if node scripts/seo/pre-deployment-seo-check.mjs --dir dist; then",
    "  echo 'SEO checks passed - safe to deploy'",
    "  npm run deploy",
    "else",
    "  echo 'SEO issues found - fix before deploying'",
    "  exit 1",
    "fi"
  ],

  "Batch Fix Multiple Issues": [
    "# Try fixes on test site first",
    "node scripts/seo/schema-generator.mjs --dir public --generate",
    "npm run build  # Rebuild to verify",
    "node scripts/seo/pre-deployment-seo-check.mjs --dir public"
  ],

  "Troubleshoot Reports": [
    "# Check if reports were generated",
    "ls -la reports/",
    "",
    "# View report summary",
    "cat reports/seo-pre-deployment-check.json | jq '.summary'",
    "",
    "# View all recommendations",
    "cat reports/seo-pre-deployment-check.json | jq '.recommendations'"
  ],

  "Target Score Quick Check": [
    "# Check E-E-A-T average score",
    "cat reports/eeat-audit.json | jq '.avgScore'",
    "",
    "# Check schema coverage",
    "cat reports/schema-audit.json | jq '.valid, .total'",
    "",
    "# Check heading issues",
    "cat reports/heading-audit.json | jq '.errors, .warnings'"
  ],

  "Monitor Site Health Over Time": [
    "# Archive reports with timestamp",
    "mkdir -p reports/history/$(date +%Y%m%d)",
    "cp reports/*.json reports/history/$(date +%Y%m%d)/",
    "",
    "# Run audit",
    "node scripts/seo/pre-deployment-seo-check.mjs --dir public"
  ]
};

// Print usage
console.log(`\n╔════════════════════════════════════════════════════════╗`);
console.log(`║      SEO Scripts - Quick Reference & Common Tasks      ║`);
console.log(`╚════════════════════════════════════════════════════════╝\n`);

console.log(`📌 COMMON TASKS:\n`);

Object.entries(TASKS).forEach(([task, commands], index) => {
  console.log(`${index + 1}. ${task}`);
  console.log(`   ${'─'.repeat(50)}`);
  commands.forEach(cmd => {
    if (cmd === '') {
      console.log('');
    } else if (cmd.startsWith('#')) {
      console.log(`   💬 ${cmd}`);
    } else {
      console.log(`   $ ${cmd}`);
    }
  });
  console.log('');
});

console.log(`\n📚 FOR MORE INFO:\n`);
console.log(`   cat scripts/seo/SEO_SCRIPTS_README.md`);
console.log(`   cat SCRIPTS_IMPLEMENTATION_SUMMARY.md\n`);

console.log(`\n🚀 QUICK START:\n`);
console.log(`   # 1. Audit your site`);
console.log(`   node scripts/seo/pre-deployment-seo-check.mjs --dir public\n`);
console.log(`   # 2. Fix issues`);
console.log(`   node scripts/seo/schema-generator.mjs --dir public --generate`);
console.log(`   node scripts/seo/heading-validator.mjs --dir public --fix`);
console.log(`   node scripts/seo/eeat-enhancer.mjs --dir public --fix\n`);
console.log(`   # 3. Verify`);
console.log(`   node scripts/seo/pre-deployment-seo-check.mjs --dir public\n\n`);
