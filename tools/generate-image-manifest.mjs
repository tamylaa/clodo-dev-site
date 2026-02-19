import fs from 'fs/promises';
import path from 'path';

const OUT = 'public/images/manifest.json';
const OPT_DIR = 'public/images/optimized';

async function buildManifest(){
  const manifest = {};
  try{
    const dirs = await fs.readdir(OPT_DIR, { withFileTypes: true });
    for(const d of dirs){
      if(!d.isDirectory()) continue;
      const name = d.name;
      const files = await fs.readdir(path.join(OPT_DIR, name));
      const variants = files.map(f => {
        const m = f.match(/-(\d+)\.(webp|png|avif)$/i);
        return m ? { file: `/images/optimized/${name}/${f}`, width: Number(m[1]), type: m[2] } : null;
      }).filter(Boolean).sort((a,b)=>b.width-a.width);
      if(variants.length) manifest[name] = variants;
    }
    await fs.writeFile(OUT, JSON.stringify(manifest, null, 2));
    console.log('Wrote', OUT);
  }catch(err){
    console.error('generate-image-manifest failed', err.message);
    process.exit(1);
  }
}

buildManifest();
