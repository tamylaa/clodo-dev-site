#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = process.argv[2] || 'dist';
const exts = new Set(['.html','.css','.js','.json','.map','.svg','.txt','.xml','.wasm']);

function walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for(const e of entries){
    const full = path.join(dir, e.name);
    if(e.isDirectory()){
      walk(full);
    } else if(e.isFile()){
      const ext = path.extname(e.name).toLowerCase();
      if(exts.has(ext)) compress(full);
    }
  }
}

function compress(file){
  try{
    const data = fs.readFileSync(file);
    // Brotli
    try{
      const br = zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
      fs.writeFileSync(file + '.br', br);
      console.log('BR', file, br.length);
    }catch(e){ console.error('BR ERR',file,e.message); }
    // Gzip
    try{
      const gz = zlib.gzipSync(data, { level: 9 });
      fs.writeFileSync(file + '.gz', gz);
      console.log('GZ', file, gz.length);
    }catch(e){ console.error('GZ ERR',file,e.message); }
  }catch(e){ console.error('READ ERR',file,e.message); }
}

if(!fs.existsSync(root)){
  console.error('Path not found:', root);
  process.exit(1);
}

console.log('Precompressing assets in', root);
walk(root);
console.log('Precompress complete');
