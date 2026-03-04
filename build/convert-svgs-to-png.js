import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVG files to convert
const svgs = [
  'architecture-cloudflare-stream-pipeline',
  'comparison-codec-bandwidth',
  'chart-pricing-comparison',
  'architecture-stream-integration',
  'architecture-clodo-stream-fullstack'
];

// Target dimensions [width, height]
const dimensions = [
  { width: 1200, height: 630, suffix: '-1200x630' },
  { width: 800, height: 420, suffix: '-800x420' },
  { width: 400, height: 210, suffix: '-400x210' }
];

const baseDir = path.join(__dirname, '..', 'public', 'images', 'guides', 'cloudflare-stream');
const outputDir = baseDir;

console.log('SVG to PNG Converter');
console.log('===================\n');

// Using Sharp library to convert SVGs to PNGs
async function convertSVGs() {
  try {
    // Try to use sharp if available
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (e) {
      console.log('Sharp not installed. Installing sharp...\n');
      execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      sharp = (await import('sharp')).default;
    }

    for (const svg of svgs) {
      const svgPath = path.join(baseDir, `${svg}.svg`);
      
      if (!fs.existsSync(svgPath)) {
        console.log(`⚠️  ${svg}.svg not found, skipping...`);
        continue;
      }

      console.log(`📸 Converting ${svg}...`);

      for (const dim of dimensions) {
        const outputName = `${svg}${dim.suffix}.png`;
        const outputPath = path.join(outputDir, outputName);

        try {
          await sharp(svgPath)
            .resize(dim.width, dim.height, {
              fit: 'contain',
              background: { r: 248, g: 250, b: 252, alpha: 1 } // Tailwind slate-50
            })
            .png({ quality: 80 })
            .toFile(outputPath);

          console.log(`  ✓ ${outputName} (${dim.width}x${dim.height})`);
        } catch (err) {
          console.error(`  ✗ Failed to create ${outputName}: ${err.message}`);
        }
      }
      console.log();
    }

    console.log('✅ All PNG conversions complete!\n');
    
    // List all generated files
    console.log('Generated PNG files:');
    const files = fs.readdirSync(outputDir);
    const pngFiles = files.filter(f => f.endsWith('.png')).sort();
    pngFiles.forEach(f => {
      const fullPath = path.join(outputDir, f);
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  • ${f} (${sizeKB}KB)`);
    });

  } catch (err) {
    console.error('Error during conversion:', err);
    process.exit(1);
  }
}

// Run conversions
convertSVGs().catch(err => {
  console.error(err);
  process.exit(1);
});
