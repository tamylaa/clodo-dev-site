'use strict';
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

function sleep(ms){return new Promise(r=>setTimeout(r, ms));}

async function runTest({apiKey, url, location}){
  const params = new URLSearchParams({
    url,
    location,
    f: 'json',
  });
  if(apiKey) params.append('k', apiKey);
  const submitUrl = `https://www.webpagetest.org/runtest.php?${params.toString()}`;
  const res = await fetch(submitUrl);
  const json = await res.json();
  if(!json.data || !json.data.testId) throw new Error('WPT submit failed: '+JSON.stringify(json));
  const testId = json.data.testId;
  console.log(`Submitted test ${testId} for ${url} @ ${location}`);
  // Poll status
  let status = null;
  let attempts = 0;
  while(attempts < 60){
    await sleep(5000);
    const statusRes = await fetch(`https://www.webpagetest.org/testStatus.php?test=${testId}&f=json`);
    const statusJson = await statusRes.json();
    status = statusJson.statusText;
    console.log(`Status: ${status} (${statusJson.data ? statusJson.data.statusCode : '?'})`);
    if(statusJson.data && statusJson.data.statusCode === 200) break;
    attempts++;
  }
  // Download results
  const resultRes = await fetch(`https://www.webpagetest.org/jsonResult.php?test=${testId}`);
  const resultJson = await resultRes.json();
  return {testId, result: resultJson};
}

async function main(){
  const argv = require('minimist')(process.argv.slice(2));
  const apiKey = argv.apiKey || process.env.WPT_API_KEY;
  const urls = (argv.urls || '').split(',').map(s=>s.trim()).filter(Boolean);
  const locations = (argv.locations || 'Dulles:Chrome,ec2-us-west-2:Chrome,ec2-eu-west-2:Chrome,ec2-ap-southeast-1:Chrome').split(',').map(s=>s.trim()).filter(Boolean);
  if(urls.length===0){
    console.error('No urls provided. Use --urls https://site/page');
    process.exit(1);
  }
  const outDir = path.join(process.cwd(),'data','benchmarks','cloud-vs-edge');
  fs.mkdirSync(outDir,{recursive:true});
  for(const url of urls){
    for(const loc of locations){
      try{
        const {testId, result} = await runTest({apiKey, url, location: loc});
        const file = path.join(outDir, `${encodeURIComponent(url)}__${loc.replace(/[:/]/g,'_')}__${testId}.json`);
        fs.writeFileSync(file, JSON.stringify(result,null,2));
        console.log('Saved result to', file);
      }catch(e){
        console.error('Test failed for', url, loc, e.message);
      }
    }
  }
}

main().catch(e=>{console.error(e); process.exit(1);});
