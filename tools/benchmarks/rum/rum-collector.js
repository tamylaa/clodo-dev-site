#!/usr/bin/env node
// Simple HTTP collector for RUM beacons (development only)
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 9988;
const outDir = path.resolve(process.cwd(),'data','benchmarks','cloud-vs-edge');
fs.mkdirSync(outDir, { recursive:true });

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/__rum-collector'){
    let body = '';
    for await (const chunk of req) body += chunk;
    const time = Date.now();
    const file = path.join(outDir, `rum-event-${time}.json`);
    try { fs.writeFileSync(file, body); } catch(e) { console.error(e); }

    res.writeHead(204);
    return res.end();
  }
  res.writeHead(200, {'Content-Type':'text/plain'});
  res.end('RUM collector - ok');
});

server.listen(PORT, ()=>console.log('RUM collector listening on', PORT));

process.on('SIGINT', ()=>{ server.close(()=>process.exit(0)); });
