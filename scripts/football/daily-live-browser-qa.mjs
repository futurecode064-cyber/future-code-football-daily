#!/usr/bin/env node
// Browser-based evidence, not a substitute for human PNG frame inspection.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const root=(process.env.FOOTBALL_LIVE_ROOT||'https://future-code-football-daily.pages.dev').replace(/\/$/,'');
const out=process.env.FOOTBALL_BROWSER_QA_DIR||'football-daily-live-browser-evidence';
mkdirSync(out,{recursive:true});
const brands=[
 ['Main','/odds.html','#tofSave'],
 ['YKZ','/ykz-family/odds.html','#brandSingleSelected'],
 ['BW','/bw-sport/odds.html','#brandSingleSelected'],
 ['KoThet','/ko-thet-family/odds.html','#brandSingleSelected'],
 ['GoalZone','/future-code-journal/odds.html','#brandSingleSelected'],
 ['KMM','/kmm-sport-hub/odds.html','#brandSingleSelected']
];
const report={date:null,checks:[],failures:[],visualReview:'Screenshots are provided; PNG frame spacing and typography still require visual inspection'};
let browser;
try{
 const live=await fetch(root+'/data/today.json',{signal:AbortSignal.timeout(20000)}).then(async r=>{if(!r.ok)throw Error('LIVE JSON '+r.status);return r.json()});
 report.date=live.reportDate;
 if(!live.published||!live.matches?.length)throw Error('No published LIVE daily fixtures');
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const [brand,path,selector] of brands){
  const result={brand,path,ok:false};report.checks.push(result);
  const context=await browser.newContext({viewport:{width:460,height:850},deviceScaleFactor:1,acceptDownloads:true});
  const page=await context.newPage();
  try{
   await page.goto(root+path,{waitUntil:'domcontentloaded',timeout:45000});
   const button=page.locator(selector);
   await button.waitFor({state:'visible',timeout:45000});
   await page.waitForFunction(sel=>{const b=document.querySelector(sel);return b&&!b.disabled;},selector,{timeout:45000});
   await page.screenshot({path:join(out,brand+'-mobile.png'),animations:'disabled'});
   const [download]=await Promise.all([page.waitForEvent('download',{timeout:90000}),button.click()]);
   const bytes=readFileSync(await download.path());
   if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.length<4000)throw Error('Invalid PNG bytes');
   const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
   if(width<300||height<200)throw Error('Unexpected small export dimensions '+width+'x'+height);
   result.png={filename:download.suggestedFilename(),width,height,bytes:bytes.length};
   result.ok=true;
   console.log('PASS '+brand+' '+width+'x'+height+' '+bytes.length+' bytes');
  }catch(e){result.error=e.message;report.failures.push(brand+': '+e.message);console.error('FAIL '+brand,e.message)}
  finally{await context.close()}
 }
}catch(e){report.failures.push('Browser setup/live daily JSON: '+e.message)}
finally{if(browser)await browser.close();writeFileSync(join(out,'receipt.json'),JSON.stringify(report,null,2)+'\n')}
if(report.failures.length)process.exitCode=1;
