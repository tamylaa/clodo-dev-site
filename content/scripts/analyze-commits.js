#!/usr/bin/env node
import fs from 'fs';
import process from 'process';

function parseArgs(argv){
  const o={};
  for(const a of argv){ if(a.startsWith('--')){ const [k,v]=a.slice(2).split('='); o[k]=v===undefined?true:v; }}
  return o;
}

function monthKey(dateStr){ const d=new Date(dateStr); if(isNaN(d)) return 'unknown'; return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`; }

function tokenizeTitle(title){ return title.toLowerCase().replace(/["'`.,:;()\[\]{}<>]/g,'').split(/\s+/).filter(Boolean); }

function topN(map, n=10){ return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,n); }

function extractType(title){ const m = title.match(/^([a-z]+)(\([^)]+\))?:/i); return m? m[1].toLowerCase() : 'other'; }

function load(inPath){ let raw = fs.readFileSync(inPath,'utf8'); // strip UTF-8 BOM if present
  if(raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw); }

function writeJSON(out, obj){ fs.writeFileSync(out, JSON.stringify(obj,null,2),'utf8'); }

function writeMD(out, md){ fs.writeFileSync(out, md, 'utf8'); }

import path from 'path';

function analyze(commits){
  const byType = {};
  const byMonth = {};
  const byAuthor = {};
  const keywords = {};
  const stop = new Set(['the','and','for','to','with','from','fix','feat','chore','update','add','remove','use','uses','make','improve','fixes']);
  for(const c of commits){ const title = c.title || (c.commitMessage && c.commitMessage.split('\n')[0]) || ''; const type = extractType(title); byType[type] = (byType[type]||0)+1; const mk = monthKey(c.date || c.commitAuthor?.date || c.commit?.author?.date); byMonth[mk] = (byMonth[mk]||0)+1; const author = c.author?.name || c.commitAuthor?.name || (c.commit?.author?.name) || 'unknown'; byAuthor[author] = (byAuthor[author]||0)+1; for(const t of tokenizeTitle(title)){ if(t.length<3) continue; if(stop.has(t)) continue; keywords[t]=(keywords[t]||0)+1; }}
  return { summary: { total: commits.length, topTypes: topN(byType,10), topAuthors: topN(byAuthor,10), topKeywords: topN(keywords,20) }, timeline: Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({month:k,count:v})) };
}

async function main(){ const opts = parseArgs(process.argv.slice(2)); const inPath = opts.in || 'content/release-notes/tamylaa/clodo-framework/commit-history.json'; const outJson = opts['out-json'] || inPath.replace('.json','-insights.json'); const outMd = opts['out-md'] || inPath.replace('.json','-insights.md'); const data = load(inPath); const commits = data.commits || []; const result = analyze(commits);
  fs.mkdirSync(path.dirname(outJson),{recursive:true}); writeJSON(outJson, result);
  const mdLines = [];
  mdLines.push(`# Commit insights — ${path.basename(path.dirname(inPath))}\n`);
  mdLines.push(`Total commits: **${result.summary.total || commits.length}**`);
  mdLines.push('## Top types'); for(const [t,n] of result.summary.topTypes){ mdLines.push(`- **${t}** — ${n}`);} mdLines.push('\n## Top authors'); for(const [a,n] of result.summary.topAuthors){ mdLines.push(`- **${a}** — ${n}`);} mdLines.push('\n## Top keywords'); for(const [k,n] of result.summary.topKeywords){ mdLines.push(`- **${k}** — ${n}`);} mdLines.push('\n## Timeline (monthly)'); for(const row of result.timeline){ mdLines.push(`- **${row.month}** — ${row.count} commits`);}
  writeMD(outMd, mdLines.join('\n'));
  console.log(`Wrote insights: ${outJson} and ${outMd}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });
