import fs from 'fs';
import path from 'path';

// Use hex byte sequences to avoid this script getting corrupted too
// Each entry: [hex string of corrupted bytes, correct Unicode codepoint]
const hexFixes = [
  // Emojis - hex patterns found in corrupted files
  ['c3b0c5b8c5a1e282ac', 0x1F680],  // rocket
  ['c3b0c5b8e28099c2a1', 0x1F4A1],  // lightbulb
  ['c3b0c5b8e2809dc2a7', 0x1F527],  // wrench
  ['c3b0c5b8e2809de28099', 0x1F512], // lock
  ['c3b0c5b8c592c290', 0x1F310],    // globe
  ['c3a2c5a1c2a1', 0x26A1],          // lightning
  ['c3b0c5b8e28099c2b0', 0x1F4B0],  // money bag
  ['c3b0c5b8e2809ccb86', 0x1F4C8],  // chart up
  ['c3b0c5b8e2809cc2b1', 0x1F4F1],  // mobile
  ['c3b0c5b8e2809cc5a0', 0x1F4CA],  // bar chart
  ['c3b0c5b8c5bdc2af', 0x1F3AF],    // target
  ['c3b0c5b8e2809dc2a5', 0x1F525],  // fire
  ['c3a2c593e280a6', 0x2705],        // checkmark
  // People emojis (c3b0c5b8e28098 prefix)
  ['c3b0c5b8e28098c2a8', 0x1F468],  // man
  ['c3b0c5b8e28098c2a5', 0x1F465],  // busts 
  ['c3b0c5b8e28098c2a4', 0x1F464],  // bust
  ['c3b0c5b8e28099c2bc', 0x1F4BC],  // briefcase
  ['c3b0c5b8e28099c2a8', 0x1F468],  // man alt
  ['c3b0c5b8e28099c2aa', 0x1F4AA],  // muscle
  ['c3b0c5b8c5bde280b0', 0x1F389],  // party
  ['c3b0c5b8e2809cc29d', 0x1F4DD],  // memo
  ['c3b0c5b8e28099c2bb', 0x1F4BB],  // laptop
  ['c3a2c2ade280a0', 0x2B50],        // star
  ['c3b0c5b8e2809de28094', 0x1F517], // link
  ['c3b0c5b8e2809cc2a6', 0x1F4E6],  // package
  ['c3b0c5b8c286', 0x1F3C6],         // trophy
  // Additional emoji patterns
  ['c3b0c5b8e280a0e2809c', 0x1F3C6], // trophy variant (ID)
  ['c3b0c5b8c28fc2a2', 0x1F3E2],    // office building
  ['c3b0c5b8e28099c2a5', 0x1F465],  // busts
  ['c3b0c5b8c28fc2a5', 0x1F3E5],    // hospital
  ['c3b0c5b8c28fc2a6', 0x1F3E6],    // bank
  ['c3b0c5b8c28fc2ad', 0x1F3ED],    // factory
  ['c3b0c5b8e28099c2a4', 0x1F464],  // bust
  ['c3b0c5b8e280a1c2ba', 0x1F4BA],  // seat
  ['c3b0c5b8c5bde280a0', 0x1F6E0],  // hammer wrench
  ['c3b0c5b8e2809cc28b', 0x1F4CB],  // clipboard
  ['c3b0c5b8e2809cc284', 0x1F4C4],  // page
  ['c3b0c5b8c5a7c2a9', 0x1F9E9],    // puzzle
  ['c3b0c5b8c5a1c2a9', 0x1F6A9],    // flag
  ['c3b0c5b8e28099c28e', 0x1F4CE],  // paperclip
  ['c3b0c5b8e28099c28e', 0x1F48E],  // gem
  ['c3b0c5b8e28099c280', 0x1F440],  // eyes
  ['c3b0c5b8e2809cc2ae', 0x1F52E],  // crystal ball
  ['c3b0c5b8c592c29f', 0x1F31F],    // glowing star
  ['c3b0c5b8e280979784', 0x1F5C4],  // file cabinet
  // Complex emojis (multi-codepoint)
  ['c3b0c5b8e28099c2a5', 0x1F465],  // busts in silhouette
  ['c3b0c5b8e28099c2a4', 0x1F464],  // bust
  ['c3b0c5b8e280a1c2b8', 0x1F1F8],  // regional S
  ['c3b0c5b8e280a1c2ba', 0x1F1FA],  // regional U
  ['c3b0c5b8e280a1c2a7', 0x1F1E7],  // regional B
  ['c3b0c5b8e280a1c2aa', 0x1F1EA],  // regional E
  // Punctuation
  ['c3a2e282ace2809c', 0x2014],      // em-dash variant 1
  ['c3a2e282ace2809d', 0x2014],      // em-dash variant 2 (more common)
  ['c3a2e282ace284a2', 0x2019],      // right single quote
  ['c3a2e282acc593', 0x201C],        // left double quote
  ['c3a2e282acc29d', 0x201D],        // right double quote
  ['c3a2e282acc2a6', 0x2026],        // ellipsis
  ['c3a2e282acc2a2', 0x2022],        // bullet
  ['c3a2e282accb9c', 0x2018],        // left single quote
  ['c3a2e28693', 0x2192],            // right arrow
  ['c3a2e28691', 0x2191],            // up arrow  
  ['c3a2e28690', 0x2190],            // left arrow
  ['c3a2e286bb', 0x21BB],            // clockwise arrow
  ['c3a2e2809c', 0x2014],            // em-dash alt
  ['c3a2e2809ac28d', 0x200D],        // zero-width joiner
  ['c3a2cb9c', 0x2018],              // left quote alt
  ['c3a2c2ad', 0x2B50],              // star (actually medium white star)
  ['c3a2c2ade29090', 0x2B50],        // star with suffix
  // Box drawing characters (c3a2e2809d prefix - discovered patterns)
  ['c3a2e2809dc592', 0x250C],        // box top-left ┌
  ['c3a2e2809de282ac', 0x2500],      // box horizontal ─
  ['c3a2e2809dc290', 0x2510],        // box top-right ┐
  ['c3a2e2809de2809a', 0x2502],      // box vertical │
  ['c3a2e2809de2809d', 0x2514],      // box bottom-left └
  ['c3a2e2809dcb9c', 0x2518],        // box bottom-right ┘
  ['c3a2e2809dc593', 0x251C],        // box T-left ├
  ['c3a2e2809dc2ac', 0x252C],        // box T-down ┬
  // Arrows
  ['c3a2e280a0e28099', 0x2192],      // right arrow →
  ['c3a2e280a0e2809c', 0x2194],      // left-right arrow ↔
  ['c3a2e280a0c290', 0x2190],        // left arrow ←
  ['c3a2e280a0c2bb', 0x21BB],        // clockwise arrow ↻
  // More emojis from discovery
  ['c3b0c5b8e2809dc2ac', 0x1F52C],   // microscope 🔬
  ['c3b0c5b8e280bac2a0', 0x1F6E0],   // tools 🛠
  ['c3b0c5b8c2a4e2809d', 0x1F914],   // thinking face 🤔
  ['c3b0c5b8c5a1c2a8', 0x1F6A8],     // police light 🚨
  ['c3b0c5b8c5a1c2ab', 0x1F6AB],     // prohibited 🚫
  ['c3b0c5b8c5a1c2aa', 0x1F6AA],     // door 🚪
  ['c3b0c5b8c5bdc2aa', 0x1F3AA],     // circus 🎪
  ['c3b0c5b8c5bde2809c', 0x1F393],   // graduation cap 🎓
  ['c3b0c5b8e28099c2ad', 0x1F4AD],   // thought balloon 💭
  ['c3b0c5b8c2a7c2aa', 0x1F9EA],     // test tube 🧪
  ['c3b0c5b8e2809dc2ae', 0x1F52E],   // crystal ball 🔮
  ['c3b0c5b8e2809dc28d', 0x1F4CD],   // pin 📍
  ['c3b0c5b8e280a0e280a2', 0x1F195], // NEW button 🆕
  ['c3b0c5b8c290e284a2', 0x1F64F],   // folded hands 🙏
  ['c3b0c5b8c28fe280a0', 0x1F3C6],   // trophy 🏆
  ['c3b0c5b8c2a4c29d', 0x1F91D],     // handshake 🤝
  ['c3b0c5b8e280a0cb9c', 0x1F198],   // SOS button 🆘
  ['c3b0c5b8c290e280ba', 0x1F6D1],   // stop sign 🛑
  ['c3b0c5b8c290c2b3', 0x1F3F3],     // white flag 🏳
  ['c3b0c5b8c28fc692', 0x1F0CF],     // joker 🃏
  ['c3b0c5b8c28fe28094', 0x1F5D3],   // spiral calendar 🗓
  ['c3b0c5b8c5bdc2ae', 0x1F3AE],     // video game 🎮
  ['c3b0c5b8e28099c5bd', 0x1F48E],   // gem 💎
  ['c3b0c5b8c5b8c2a1', 0x1F7E1],     // yellow circle 🟡
  ['c3b0c5b8c5bdc281', 0x1F381],     // gift 🎁
  // Symbols
  ['c3a2c593e2809c', 0x2714],        // check mark ✔
  ['c3a2c593e28094', 0x2717],        // cross mark ✗
  ['c3a2c593c2a8', 0x2728],          // sparkles ✨
  ['c3a2c5a1c2a0', 0x26A0],          // warning ⚠
  ['c3a2c5a1e284a2', 0x2699],        // gear ⚙
  ['c3a2e284a2c2bf', 0x267F],        // wheelchair ♿
  ['c3a2e28093c2bc', 0x25BC],        // down triangle ▼
  ['c3a2c29dc592', 0x274C],          // cross mark ❌
  ['c3a2c29de2809c', 0x2753],        // question mark ❓
  ['c3a2c28fc2b0', 0x23F0],          // alarm clock ⏰
  ['c3a2c28fc2b1', 0x23F1],          // stopwatch ⏱
  ['c3a2e2809ac2b9', 0x20B9],        // indian rupee ₹
  ['c3a2cb86e28099', 0x2211],        // sum ∑
  ['c3a2e282acc28d', 0x200D],        // zero-width joiner
  ['c3a2e282ace28098', 0x2018],      // left single quote '
  ['c3a2e2809ce29098', 0x2518],      // box bottom-right alt
  // Latin-1 accented characters (double-encoded c383c2XX -> 0xXX)
  ['c383c2a0', 0x00E0],              // à
  ['c383c2a1', 0x00E1],              // á
  ['c383c2a3', 0x00E3],              // ã
  ['c383c2a4', 0x00E4],              // ä
  ['c383c2a7', 0x00E7],              // ç
  ['c383c2a8', 0x00E8],              // è
  ['c383c2a9', 0x00E9],              // é
  ['c383c2aa', 0x00EA],              // ê
  ['c383c2ad', 0x00ED],              // í
  ['c383c2b5', 0x00F5],              // õ
  ['c383c2b9', 0x00F9],              // ù
  ['c383c2bc', 0x00FC],              // ü
  // Additional discovered patterns
  ['c3a2e2809dc2b4', 0x2534],        // box T-up ┴
  ['c3a2e280bae280a6', 0x26C5],      // sun behind cloud ⛅
  ['c3a2c5bde2809d', 0x23CE],        // return symbol ⏎
  ['c3a2e284a2e2809a', 0x2642],      // male symbol ♂
  ['c3b0c5b8e2809dc290', 0x1F510],   // locked with key 🔐
  // Multiplication and more Latin-1
  ['c383e28094', 0x00D7],            // multiplication × (D7)
];

// Convert hex patterns to actual string pairs at runtime
const fixes = hexFixes.map(([hex, codepoint]) => [
  Buffer.from(hex, 'hex').toString('utf8'),
  String.fromCodePoint(codepoint)
]);

let filesFixed = 0;
let patternsFixed = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  for (const [bad, good] of fixes) {
    while (content.includes(bad)) {
      content = content.replace(bad, good);
      patternsFixed++;
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    console.log('Fixed:', path.relative('.', filePath));
  }
}

// Discover unknown corruption patterns
function discoverPatterns(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const buf = Buffer.from(content, 'utf8');
  const hex = buf.toString('hex');
  
  // Look for c3a2 and c3b0 sequences (common corruption prefixes)
  const patterns = new Set();
  
  // c3a2 patterns (punctuation/symbols)
  const c3a2Matches = hex.matchAll(/c3a2[0-9a-f]{8,16}/gi);
  for (const m of c3a2Matches) {
    patterns.add(m[0].slice(0, 16));
  }
  
  // c3b0 patterns (emojis)  
  const c3b0Matches = hex.matchAll(/c3b0c5b8[0-9a-f]{8,16}/gi);
  for (const m of c3b0Matches) {
    patterns.add(m[0].slice(0, 20));
  }
  
  return patterns;
}

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'dist-astro'].includes(entry.name)) {
      walkDir(fullPath);
    } else if (/\.(html|js|mjs|css|md)$/.test(entry.name)) {
      processFile(fullPath);
    }
  }
}

// Discover walker for discovery mode
function discoverWalk(dir, allPatterns) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'dist-astro'].includes(entry.name)) {
      discoverWalk(fullPath, allPatterns);
    } else if (/\.html$/.test(entry.name)) {
      for (const p of discoverPatterns(fullPath)) {
        allPatterns.add(p);
      }
    }
  }
}

// Discovery mode - find unknown patterns
if (process.argv[2] === '--discover') {
  console.log('=== Discovering unknown patterns ===\n');
  const allPatterns = new Set();
  discoverWalk('public', allPatterns);
  console.log('Unknown hex patterns found:');
  for (const p of allPatterns) {
    const known = hexFixes.some(([hex]) => p.startsWith(hex) || hex.startsWith(p));
    if (!known) {
      console.log(' ', p, '->', Buffer.from(p, 'hex').toString('utf8'));
    }
  }
} else {
  console.log('=== Fixing double-encoded UTF-8 ===\n');
  walkDir('.');
  console.log('\nFiles fixed:', filesFixed);
  console.log('Patterns fixed:', patternsFixed);
}
