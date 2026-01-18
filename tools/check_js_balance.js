import fs from 'fs';
function check(p){
  const s = fs.readFileSync(p,'utf8');
  let stack = [];
  let inStr = null;
  let esc = false;
  for(let i=0;i<s.length;i++){
    const c = s[i];
    if(esc){ esc = false; continue; }
    if(inStr){
      if(c === '\\'){ esc = true; continue; }
      if(c === inStr){ inStr = null; continue; }
      // handle template expression inside backtick
      if(inStr === '`' && c === '$' && s[i+1] === '{'){ stack.push('${'); i++; continue; }
      if(inStr === '`' && c === '}' && stack[stack.length-1] === '${'){ stack.pop(); continue; }
      continue;
    }
    if(c === "'" || c === '"' || c === '`'){ inStr = c; continue; }
    if(c === '(' || c === '[' || c === '{') stack.push(c);
    if(c === ')'){ if(stack.pop() !== '(') { console.log(p,'MISMATCH ) at',i); return; } }
    if(c === ']'){ if(stack.pop() !== '[') { console.log(p,'MISMATCH ] at',i); return; } }
    if(c === '}'){ const top = stack.pop(); if(top !== '{' && top !== '${'){ console.log(p,'MISMATCH } at',i,'top',top); return; } }
  }
  if(inStr) console.log(p,'UNCLOSED STRING',inStr);
  if(stack.length) console.log(p,'UNCLOSED STACK',stack.slice(-10)); else console.log(p,'OK');
}
['dist/js/config/features.6602ca4f.js','dist/js/main.cec586c3.js','dist/js/defer-css.71cd8d8a.js','dist/js/analytics.6fd54ea4.js'].forEach(check);
