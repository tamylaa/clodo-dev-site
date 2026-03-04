#!/usr/bin/env node
const http=require('http');
const {URL}=require('url');
const page='http://localhost:8001/cloudflare-stream-complete-guide';
http.get(page,res=>{
  let chunks=[];
  res.on('data',c=>chunks.push(c));
  res.on('end',async ()=>{
    const html=Buffer.concat(chunks).toString('utf8');
    const title=(html.match(/<title[^>]*>([^<]*)<\/title>/i)||[])[1]||'';
    const metaDesc=(html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)||[])[1]||'';
    const h1=(html.match(/<h1[^>]*>([^<]*)<\/h1>/i)||[])[1]||'';
    const canonical=(html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)||[])[1]||'';
    const robots=(html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i)||[])[1]||'';
    const ld=!!html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i);
    const imgMatches=html.match(/<img[^>]+src=["']([^"']+)["']/ig)||[];
    const images=imgMatches.map(s=>(s.match(/src=["']([^"']+)["']/i)||[])[1]);

    console.log('TITLE len='+title.length, title);
    console.log('META_DESC len='+metaDesc.length, metaDesc);
    console.log('H1 present='+!!h1, h1);
    console.log('CANONICAL', canonical||'missing');
    console.log('ROBOTS', robots||'none');
    console.log('JSON-LD present='+ld);
    console.log('IMAGES count='+images.length);

    for(const im of images.slice(0,5)){
      await new Promise(res2=>{
        try{
          const imgUrl=new URL(im, page);
          const mod = imgUrl.protocol==='https:'?require('https'):require('http');
          mod.get(imgUrl.href, r=>{
            let ch=[];
            r.on('data',c=>ch.push(c));
            r.on('end',()=>{ const buf=Buffer.concat(ch); console.log('IMG',im,'status',r.statusCode,'type',r.headers['content-type'],'size',buf.length); res2(); });
          }).on('error',e=>{ console.log('IMGERR',im,e.message); res2(); });
        }catch(e){ console.log('IMGPARSEERR',im,e.message); res2(); }
      });
    }
    console.log('DONE');
  });
}).on('error',e=>{ console.error('PAGE ERR',e.message); process.exit(2); });
