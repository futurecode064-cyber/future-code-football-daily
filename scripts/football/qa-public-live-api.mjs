// READ-ONLY production browser acceptance: 5 brands x home/odds x desktop/mobile,
// 10 real downloadable PNG files, one manifest-pinned D1 publication; no content writes or builds.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
const base='https://future-code-football-daily.pages.dev';
const origin='https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev';
const expectedVersion='4d6398bc-8e52-452f-b956-4516d75831be';
const source=JSON.parse(readFileSync('football-daily/data/today.json','utf8'));
const root=resolve(process.argv[2]||'football-live-api-qa');
const report={kind:'public-production-browser-live-d1-acceptance',startedAt:new Date().toISOString(),
 sourceDate:source.reportDate,sourceMatches:source.matches.length,expectedVersion,pages:[],downloads:[],readOnly:true};
mkdirSync(root,{recursive:true});let browser;
const pageToken=process.env.FOOTBALL_PAGES_CF_API_TOKEN;
async function pagesDeployment(){
 if(!pageToken)return null;
 const url='https://api.cloudflare.com/client/v4/accounts/86851bf21d81d8f0972052aff8162149/pages/projects/future-code-football-daily';
 const res=await fetch(url,{headers:{Authorization:'Bearer '+pageToken},signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw Error('Read-only Pages project GET HTTP '+res.status);
 const data=await res.json();assert.equal(data.success,true);return data.result.latest_deployment?.id;
}
function png(file){
 const b=readFileSync(file);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const width=b.readUInt32BE(16),height=b.readUInt32BE(20);assert(width>250&&height>250);
 return {width,height,bytes:b.length};
}
async function saveDownload(page,locator,name){
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:100000}),locator.click()]);
 const out=join(root,name+'.png');await download.saveAs(out);
 report.downloads.push({name,...png(out)});
}
try{
 assert.equal(source.reportDate,'2026-10-23');
 assert.equal(source.matches.length,13);
 report.beforeDeploymentId=await pagesDeployment();
 const manifestResponse=await fetch(origin+'/api/football/manifest',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 assert.equal(manifestResponse.status,200);const manifest=await manifestResponse.json();
 assert.equal(manifest.version,expectedVersion);assert.equal(manifest.generation,1);
 report.liveManifest={version:manifest.version,generation:manifest.generation};
 const req=await fetch(origin+'/api/football/resource?path=data/today.json&version='+expectedVersion+'&brand=main',{signal:AbortSignal.timeout(15000)});
 assert.equal(req.status,200);assert.equal(req.headers.get('X-Football-Version'),expectedVersion);
 assert.deepEqual(await req.json(),source);
 report.directApiParity=true;
 const cf=await fetch(base+'/football-engine-config.js?qa='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});
 assert.equal(cf.status,200);const config=await cf.text();
 assert(config.includes('enabled:true')&&config.includes(origin),'Production config not enabled');
 report.activeClientConfig=true;
 browser=await chromium.launch({headless:true,executablePath:process.env.FOOTBALL_QA_CHROME||undefined,args:['--no-sandbox']});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1366,height:900}});
 const page=await context.newPage();
 const brands=[['main','/'],['goal-zone','/future-code-journal/'],['bw-sport','/bw-sport/'],['ykz','/ykz-family/'],['ko-thet','/ko-thet-family/']];
 for(const size of [{name:'desktop',width:1366,height:900},{name:'phone',width:390,height:844}]){
  await page.setViewportSize({width:size.width,height:size.height});
  for(const [brand,slug] of brands)for(const kind of ['home','odds']){
   const url=base+slug+(kind==='odds'?'odds.html':'')+'?fc-public-qa='+Date.now();
   const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   assert.equal(res.status(),200,brand+' '+kind+' HTTP');
   await page.waitForFunction(()=>window.FC_FOOTBALL_ENGINE?.enabled===true&&Boolean(window.FootballData),null,{timeout:30000});
   const data=await page.evaluate(async()=>{
    const state=await window.FootballData.ready();
    const script=document.querySelector('script[src*="football-data-client.js"]');
    const root=new URL('.',script.src);
    const res=await window.FootballData.fetch(new URL('data/today.json',root));
    return {status:res.status,version:state.version,stale:state.stale||false,fallback:state.fallback,
     report:await res.json(),config:window.FC_FOOTBALL_ENGINE};
   });
   assert.equal(data.status,200);
   assert.equal(data.version,expectedVersion,brand+' '+kind+' version mismatch');
   assert(!data.stale&&!data.fallback,brand+' '+kind+' uses stale fallback');
   assert.deepEqual(data.report,source,brand+' '+kind+' source mismatch');
   const countSelector=kind==='odds'?'#oddsCount':'#matchCount';
   await page.waitForFunction(([selector,n])=>document.querySelector(selector)?.textContent?.trim()===String(n),[countSelector,13],{timeout:30000});
   report.pages.push({brand,type:kind,viewport:size.name,status:res.status,version:data.version,sourceMatches:13,pass:true});
   if(size.name==='desktop'){
    if(kind==='odds')await saveDownload(page,page.locator('#oddsPngPages button').first(),brand+'-odds');
    else await saveDownload(page,page.locator('.match-download').first(),brand+'-preview');
   }
  }
 }
 report.ownerLoginAvailable=(await fetch(base+'/login',{redirect:'manual',signal:AbortSignal.timeout(12000)})).status===200;
 const unauthorized=await fetch(base+'/api/editor/engine/state',{redirect:'manual',signal:AbortSignal.timeout(12000)});
 assert.equal(unauthorized.status,401,'Owner API must require login');
 assert.equal(report.pages.length,20);assert.equal(report.downloads.length,10);
 report.afterDeploymentId=await pagesDeployment();
 assert.equal(report.beforeDeploymentId,report.afterDeploymentId,'Read-only QA unexpectedly coincided with Pages deployment change');
 report.success=true;
}catch(error){report.success=false;report.error=String(error?.message||error).slice(0,700);}
finally{await browser?.close();report.finishedAt=new Date().toISOString();writeFileSync(join(root,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({success:report.success,pages:report.pages.length,downloadedPng:report.downloads.length,before:report.beforeDeploymentId,after:report.afterDeploymentId,liveManifest:report.liveManifest,error:report.error}));if(!report.success)process.exitCode=1;}
