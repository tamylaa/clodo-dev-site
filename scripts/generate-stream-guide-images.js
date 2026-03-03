#!/usr/bin/env node
/**
 * generate-stream-guide-images.js
 * Generates placeholder images for the Cloudflare Stream Complete Guide
 * using sharp. Produces PNG + WebP at 1x and 2x (retina) sizes.
 *
 * Usage: node scripts/generate-stream-guide-images.js
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEO_DIR = path.join(__dirname, '..', 'public', 'images', 'seo');
const OPT_DIR = path.join(SEO_DIR, 'optimized');

// Ensure directories exist
[SEO_DIR, OPT_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── Image Definitions ───────────────────────────────────────────────────────
const IMAGES = [
  {
    name: 'hero-cloudflare-stream-guide',
    width: 1200,
    height: 630,
    retina: [2400, 1260],
    bg: '#0f172a',
    accent: '#7c3aed',
    title: 'Cloudflare Stream',
    subtitle: 'Complete Developer Guide',
    icon: '🎬',
    type: 'hero',
  },
  {
    name: 'architecture-cloudflare-stream-pipeline',
    width: 1200,
    height: 675,
    retina: [2400, 1350],
    bg: '#ffffff',
    accent: '#7c3aed',
    title: 'Video Pipeline Architecture',
    subtitle: 'Upload → Encode → CDN → Player',
    icon: '🏗️',
    type: 'architecture',
    svg: true,
  },
  {
    name: 'comparison-codec-bandwidth',
    width: 1200,
    height: 675,
    retina: [2400, 1350],
    bg: '#0d1117',
    accent: '#a855f7',
    title: 'Codec Bandwidth Comparison',
    subtitle: 'H.264 vs VP9 vs AV1',
    icon: '📊',
    type: 'chart',
  },
  {
    name: 'chart-pricing-comparison',
    width: 1200,
    height: 675,
    retina: [2400, 1350],
    bg: '#ffffff',
    accent: '#7c3aed',
    title: 'Pricing Comparison',
    subtitle: 'Stream vs Mux vs Bunny vs AWS',
    icon: '💰',
    type: 'chart',
  },
  {
    name: 'architecture-stream-integration',
    width: 1200,
    height: 675,
    retina: [2400, 1350],
    bg: '#f8fafc',
    accent: '#7c3aed',
    title: 'Stream Integration Map',
    subtitle: 'Workers · R2 · Access · Pages · KV · D1',
    icon: '🔗',
    type: 'architecture',
  },
  {
    name: 'architecture-clodo-stream-fullstack',
    width: 1200,
    height: 675,
    retina: [2400, 1350],
    bg: '#f0f9ff',
    accent: '#7c3aed',
    title: 'Clodo + Stream Full-Stack',
    subtitle: 'Frontend · Workers API · R2/D1 Storage',
    icon: '🏛️',
    type: 'architecture',
  },
];

// ─── SVG Template ────────────────────────────────────────────────────────────
function createSvg(img, w, h) {
  const isDark = img.bg === '#0d1117' || img.bg === '#0f172a';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const subColor = isDark ? '#94a3b8' : '#6b7280';
  const borderColor = isDark ? '#334155' : '#e5e7eb';
  const scale = w / img.width; // for retina scaling

  // Grid pattern
  const gridSize = 40 * scale;
  const gridOpacity = isDark ? 0.08 : 0.05;

  // Type badge
  const badgeLabels = {
    hero: 'HERO IMAGE',
    architecture: 'ARCHITECTURE DIAGRAM',
    chart: 'DATA VISUALIZATION',
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${img.bg}"/>
      <stop offset="100%" stop-color="${img.accent}" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${img.accent}"/>
      <stop offset="100%" stop-color="${img.accent}" stop-opacity="0.7"/>
    </linearGradient>
    <pattern id="grid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">
      <path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="${textColor}" stroke-opacity="${gridOpacity}" stroke-width="${scale}"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>

  <!-- Border -->
  <rect x="${2 * scale}" y="${2 * scale}" width="${w - 4 * scale}" height="${h - 4 * scale}" rx="${16 * scale}" fill="none" stroke="${borderColor}" stroke-width="${2 * scale}"/>

  <!-- Accent bar -->
  <rect x="0" y="${h - 6 * scale}" width="${w}" height="${6 * scale}" fill="url(#accent)"/>

  <!-- Type badge -->
  <rect x="${40 * scale}" y="${40 * scale}" width="${220 * scale}" height="${32 * scale}" rx="${16 * scale}" fill="${img.accent}" fill-opacity="0.2"/>
  <text x="${150 * scale}" y="${62 * scale}" font-family="system-ui, -apple-system, sans-serif" font-size="${12 * scale}" font-weight="700" fill="${img.accent}" text-anchor="middle" letter-spacing="${2 * scale}">${badgeLabels[img.type] || 'IMAGE'}</text>

  <!-- Icon -->
  <text x="${w / 2}" y="${h / 2 - 30 * scale}" font-size="${64 * scale}" text-anchor="middle" dominant-baseline="central">${img.icon}</text>

  <!-- Title -->
  <text x="${w / 2}" y="${h / 2 + 40 * scale}" font-family="system-ui, -apple-system, sans-serif" font-size="${36 * scale}" font-weight="800" fill="${textColor}" text-anchor="middle">${img.title}</text>

  <!-- Subtitle -->
  <text x="${w / 2}" y="${h / 2 + 80 * scale}" font-family="system-ui, -apple-system, sans-serif" font-size="${20 * scale}" font-weight="400" fill="${subColor}" text-anchor="middle">${img.subtitle}</text>

  <!-- Size label -->
  <text x="${w - 40 * scale}" y="${h - 24 * scale}" font-family="monospace" font-size="${13 * scale}" fill="${subColor}" text-anchor="end" opacity="0.6">${w}×${h} · ${img.name}</text>

  <!-- Clodo watermark -->
  <text x="${40 * scale}" y="${h - 24 * scale}" font-family="system-ui, -apple-system, sans-serif" font-size="${14 * scale}" font-weight="600" fill="${img.accent}" opacity="0.5">clodo.dev</text>
</svg>`;
}

// ─── Generate all images ─────────────────────────────────────────────────────
async function generateAll() {
  console.log('🎬 Generating Cloudflare Stream Guide placeholder images...\n');

  for (const img of IMAGES) {
    const baseName = `${img.name}-${img.width}x${img.height}`;
    const retinaName = `${img.name}-${img.retina[0]}x${img.retina[1]}`;

    // 1. Generate SVG source (for architecture diagrams)
    if (img.svg) {
      const svgPath = path.join(SEO_DIR, `${img.name}.svg`);
      const svgContent = createSvg(img, img.width, img.height);
      fs.writeFileSync(svgPath, svgContent);
      console.log(`  ✅ ${img.name}.svg (source)`);
    }

    // 2. Standard PNG (source)
    const sourcePng = path.join(SEO_DIR, `${baseName}.png`);
    const svgBuf = Buffer.from(createSvg(img, img.width, img.height));
    await sharp(svgBuf).png({ quality: 90, compressionLevel: 6 }).toFile(sourcePng);
    console.log(`  ✅ ${baseName}.png (source)`);

    // 3. Optimized standard PNG
    const optPng = path.join(OPT_DIR, `${baseName}.png`);
    await sharp(svgBuf).png({ quality: 85, compressionLevel: 9 }).toFile(optPng);
    console.log(`  ✅ optimized/${baseName}.png`);

    // 4. Optimized standard WebP
    const optWebp = path.join(OPT_DIR, `${baseName}.webp`);
    await sharp(svgBuf).webp({ quality: 82 }).toFile(optWebp);
    console.log(`  ✅ optimized/${baseName}.webp`);

    // 5. Retina PNG
    const retinaSvg = Buffer.from(createSvg(img, img.retina[0], img.retina[1]));
    const retPng = path.join(OPT_DIR, `${retinaName}.png`);
    await sharp(retinaSvg).png({ quality: 85, compressionLevel: 9 }).toFile(retPng);
    console.log(`  ✅ optimized/${retinaName}.png`);

    // 6. Retina WebP
    const retWebp = path.join(OPT_DIR, `${retinaName}.webp`);
    await sharp(retinaSvg).webp({ quality: 82 }).toFile(retWebp);
    console.log(`  ✅ optimized/${retinaName}.webp`);

    console.log('');
  }

  // Summary
  const srcFiles = fs.readdirSync(SEO_DIR).filter(f => f.includes('stream'));
  const optFiles = fs.readdirSync(OPT_DIR).filter(f => f.includes('stream') || f.includes('codec') || f.includes('pricing') || f.includes('integration') || f.includes('fullstack') || f.includes('pipeline'));
  console.log(`\n📦 Summary:`);
  console.log(`   Source images: ${srcFiles.length} files in images/seo/`);
  console.log(`   Optimized:    ${optFiles.length} files in images/seo/optimized/`);
  console.log(`   Total:        ${srcFiles.length + optFiles.length} image files generated`);
}

generateAll().catch(err => {
  console.error('❌ Image generation failed:', err);
  process.exit(1);
});
