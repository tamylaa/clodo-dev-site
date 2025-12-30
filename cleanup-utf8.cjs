// UTF-8 Cleanup Script - fixes BOM and double-encoded characters
// Run with: node cleanup-utf8.cjs

const fs = require('fs');
const path = require('path');

let fixed = 0;
let totalPatterns = 0;

// Use hex byte sequences to detect corruption (works regardless of encoding)
function hasCorruption(buf) {
  const str = buf.toString('latin1');
  // Check for BOM or double-encoded patterns
  return (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) ||
         str.includes('\xC3\xB0\xC5\xB8') ||  // emoji corruption prefix
         str.includes('\xC3\xA2\xE2\x82\xAC'); // punctuation corruption
}

function fixContent(buf) {
  let changed = false;
  
  // Remove BOM
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    buf = buf.slice(3);
    changed = true;
  }
  
  let content = buf.toString('utf8');
  const orig = content;
  
  // Double-encoded emoji patterns (corrupted string -> codepoint)
  const emojiFixesHex = [
    ['\xC3\xB0\xC5\xB8\xC5\xA1\xE2\x82\xAC', 0x1F680], // rocket
    ['\xC3\xB0\xC5\xB8\xE2\x80\x99\xC2\xA1', 0x1F4A1], // lightbulb
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9D\xC2\xA7', 0x1F527], // wrench
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9D\xE2\x80\x99', 0x1F512], // lock
    ['\xC3\xB0\xC5\xB8\xC5\x92\xC2\x90', 0x1F310], // globe
    ['\xC3\xA2\xC5\xA1\xC2\xA1', 0x26A1], // lightning
    ['\xC3\xB0\xC5\xB8\xE2\x80\x99\xC2\xB0', 0x1F4B0], // money bag
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9C\xCB\x86', 0x1F4C8], // chart
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9C\xC2\xB1', 0x1F4F1], // mobile
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9C\xC5\xA0', 0x1F4CA], // bar chart
    ['\xC3\xB0\xC5\xB8\xC5\xBD\xC2\xAF', 0x1F3AF], // target
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9D\xC2\xA5', 0x1F525], // fire
    ['\xC3\xA2\xC5\x93\xE2\x80\xA6', 0x2705], // check mark
    ['\xC3\xB0\xC5\xB8\xE2\x80\x99\xC2\xAA', 0x1F4AA], // flexed biceps
    ['\xC3\xB0\xC5\xB8\xC5\xBD\xE2\x80\xB0', 0x1F389], // party popper
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9C\xC2\x9D', 0x1F4DD], // memo
    ['\xC3\xB0\xC5\xB8\xE2\x80\x99\xC2\xBB', 0x1F4BB], // laptop
    ['\xC3\xA2\xC2\xAD\xE2\x80\xA0', 0x2B50], // star
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9D\xE2\x80\x94', 0x1F517], // link
    ['\xC3\xB0\xC5\xB8\xE2\x80\x9C\xC2\xA6', 0x1F4E6], // package
    ['\xC3\xB0\xC5\xB8\xC2\x86', 0x1F3C6], // trophy
  ];
  
  // Fix emojis
  for (const [bad, codepoint] of emojiFixesHex) {
    const good = String.fromCodePoint(codepoint);
    while (content.includes(bad)) {
      content = content.replace(bad, good);
      totalPatterns++;
    }
  }
  
  // Double-encoded punctuation (more reliable text patterns)
  const punctFixes = [
    ['\xC3\xA2\xE2\x82\xAC\xE2\x80\x9C', '\u2014'], // em-dash
    ['\xC3\xA2\xE2\x82\xAC\xE2\x80\x93', '\u2013'], // en-dash
    ['\xC3\xA2\xE2\x82\xAC\xE2\x84\xA2', '\u2019'], // right single quote
    ['\xC3\xA2\xE2\x82\xAC\xCB\x9C', '\u2018'], // left single quote
    ['\xC3\xA2\xE2\x82\xAC\xC5\x93', '\u201C'], // left double quote
    ['\xC3\xA2\xE2\x82\xAC\xC2\x9D', '\u201D'], // right double quote
    ['\xC3\xA2\xE2\x82\xAC\xC2\xA6', '\u2026'], // ellipsis
    ['\xC3\xA2\xE2\x82\xAC\xC2\xA2', '\u2022'], // bullet
  ];
  
  for (const [bad, good] of punctFixes) {
    while (content.includes(bad)) {
      content = content.replace(bad, good);
      totalPatterns++;
    }
  }
  
  return { content, changed: changed || content !== orig };
}

function processDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist', 'dist-astro'].includes(entry.name)) {
        processDir(full);
      }
    } else if (/\.(html|js|mjs|css|md)$/.test(entry.name)) {
      try {
        const buf = fs.readFileSync(full);
        
        if (hasCorruption(buf)) {
          const result = fixContent(buf);
          if (result.changed) {
            fs.writeFileSync(full, result.content, 'utf8');
            fixed++;
            console.log('Fixed:', path.relative('.', full));
          }
        }
      } catch (e) {
        // Skip unreadable files
      }
    }
  }
}

console.log('=== UTF-8 Cleanup ===\n');
processDir('.');
console.log('\nFiles fixed:', fixed);
console.log('Patterns replaced:', totalPatterns);
console.log('\nDone! You can delete this script: del cleanup-utf8.cjs');
