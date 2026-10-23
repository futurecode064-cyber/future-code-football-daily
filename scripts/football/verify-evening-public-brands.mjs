// Read-only live/browser post-publication check: five existing brands, both pages,
// mobile + desktop, original vs evening prices, and actual odds PNG downloads.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
const request=JSON.parse(event.issue.body);
const host='https://future-code-football-daily.pages.dev';
const expected='710b0d54-d5ec-4c2d-a298-3db2660e2461';
const routes=[['Main','/'],['Goal Zone','/future-code-journal/'],['BW Sport','/bw-sport/'],['YKZ','/ykz-family/'],['Ko Thet','/ko-thet-family/']];
const dir='football-evening-5brand-qa';mkdirSync(dir,{recursive:true});
const report={sourceDate:request.date,version:expected,pages:[],png:[],readOnly:true,noPagesBuild:true};
let browser;
try{
 assert.equal(request.updates.length,13);assert.equal(request.date,'2026-10-23');
 const engine=await fetch('https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev/api/football/manifest',{cache:'no-store'});
 assert.equal(engine.status,200);const current=await engine.json();
 assert.equal(current.version,expected);assert.equal(current.generation,2);
 browser=await chromium.launch({headless:true,executablePath:process.env.FOOTBALL_QA_CHROME||undefined,args:['--no-sandbox']});
 const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 for(const size of [{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844}]){
  await page.setViewportSize({width:size.width,height:size.height});
  for(const [brand,path] of routes)for(const kind of ['home','odds']){
   const uri=host+path+(kind==='odds'?'odds.html':'')+'?evening-qa='+Date.now();
   const resp=await page.goto(uri,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(resp.status(),200,brand+' HTTP');
   await page.waitForFunction(()=>window.FC_FOOTBALL_ENGINE?.enabled===true&&Boolean(window.FootballData),{timeout:25000});
   const data=await page.evaluate(async()=>{
    const root=new URL('.',document.querySelector('script[src*="football-data-client.js"]').src);
    const ready=await window.FootballData.ready();
    const [today,odds]=await Promise.all([
      window.FootballData.fetch(new URL('data/today.json',root)),
      window.FootballData.fetch(new URL('data/odds/2026-10-23.json',root))]);
    return {ready:{version:ready.version,fallback:ready.fallback,stale:ready.stale},todayStatus:today.status,oddsStatus:odds.status,
      report:await today.json(),sheet:await odds.json()};
   });
   assert.equal(data.ready.version,expected,brand+' D1 version');
   assert(!data.ready.fallback&&!data.ready.stale,brand+' static fallback');
   assert.equal(data.todayStatus,200);assert.equal(data.oddsStatus,200);
   assert.equal(data.report.matches.length,13);assert.equal(data.sheet.matches.length,13);
   for(let i=0;i<13;i++){
    const m=data.report.matches[i],o=data.sheet.matches[i],u=request.updates[i];
    assert.equal(m.fixtureId,u.fixtureId);assert.equal(o.fixtureId,u.fixtureId);
    assert.equal(o.bodyOdds,u.openingBodyOdds);assert.equal(o.goalTotalOdds,u.openingGoalTotalOdds);
    assert.equal(o.currentBodyOdds,u.currentBodyOdds);assert.equal(o.currentGoalTotalOdds,u.currentGoalTotalOdds);
    assert.equal(m.myanmarOdds.currentBodyOdds,u.currentBodyOdds);
    assert.equal(m.myanmarOdds.currentGoalTotalOdds,u.currentGoalTotalOdds);
   }
   const selector=kind==='odds'?'#oddsCount':'#matchCount';
   await page.waitForFunction((s)=>document.querySelector(s)?.textContent?.trim()==='13',selector,{timeout:35000});
   report.pages.push({brand,kind,viewport:size.name,version:expected,rows:13,passed:true});
   if(size.name==='desktop'&&kind==='odds'){
    const [download]=await Promise.all([page.waitForEvent('download',{timeout:100000}),page.locator('#oddsPngPages button').first().click()]);
    const filename=join(dir,brand.toLowerCase().replaceAll(' ','-')+'-evening.png');
    await download.saveAs(filename);
    const bytes=readFileSync(filename);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert(bytes.readUInt32BE(16)>200&&bytes.readUInt32BE(20)>200);
    report.png.push({brand,bytes:statSync(filename).size,passed:true});
   }
  }
 }
 assert.equal(report.pages.length,20);assert.equal(report.png.length,5);
 report.success=true;
}catch(e){report.success=false;report.error=String(e?.message||e).slice(0,700);}
finally{await browser?.close();writeFileSync(join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({success:report.success,pages:report.pages.length,downloads:report.png.length,version:report.version,error:report.error}));if(!report.success)process.exitCode=1;}
