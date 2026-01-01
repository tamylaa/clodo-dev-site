import fs from 'fs';
import path from 'path';

// Check a few key files for schema validity
const files = [
  'public/docs.html',
  'public/quick-start.html',
  'public/cloudflare-framework.html',
  'public/clodo-framework-guide.html',
  'public/framework-comparison.html'
];

console.log('🔍 Validating Schema Markup...\n');

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const schemaMatches = content.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);

    if (schemaMatches) {
      console.log(`📋 ${file}:`);
      schemaMatches.forEach((match, i) => {
        const jsonContent = match.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
        try {
          JSON.parse(jsonContent);
          console.log(`  ✅ Schema ${i + 1}: Valid JSON-LD`);
        } catch (e) {
          console.log(`  ❌ Schema ${i + 1}: Invalid JSON - ${e.message}`);
        }
      });
    }
  } catch (e) {
    console.log(`❌ Error reading ${file}: ${e.message}`);
  }
});

console.log('\n✨ Schema validation complete!');