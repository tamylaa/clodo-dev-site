import { readdir, stat, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const cssDir = path.join(root, 'public', 'css');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (e.isFile() && full.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

function convert(content) {
  // rgba(255, 255, 255, 0.1) -> rgb(255 255 255 / 10%)
  return content.replace(/rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01](?:\.\d+)?)\s*\)/gi, (m, r, g, b, a) => {
    const alpha = Math.round(parseFloat(a) * 100);
    return `rgb(${r} ${g} ${b} / ${alpha}%)`;
  });
}

(async () => {
  try {
    // confirm cssDir exists
    const st = await stat(cssDir).catch(() => null);
    if (!st || !st.isDirectory()) {
      console.error('public/css not found at', cssDir);
      process.exit(1);
    }

    const files = await walk(cssDir);
    let changed = 0;
    for (const f of files) {
      const orig = await readFile(f, 'utf8');
      const updated = convert(orig);
      if (orig !== updated) {
        await writeFile(f, updated, 'utf8');
        console.log('Updated', f);
        changed++;
      }
    }

    console.log(`Done. Files updated: ${changed}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
