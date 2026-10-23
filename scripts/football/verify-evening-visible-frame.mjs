// Actual rendered table prices + main Frame preview on five published brands.
// Read-only Chromium check: not merely FootballData.fetch parity.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
const original=JSON.parse(event.issue.body);
const version='35c9423d-01e0-4770-a244-800b76f9dc1b';
const root='football-evening-visible-qa';mkdirSync(root,{recursive:true});
const base='https://future-code-football-daily.pages.dev';
const brands=[['Main','/'],['Goal Zone','/future-code-journal/'],['BW Sport','/bw-sport/'],['YKZ','/ykz-family/'],['Ko Thet','/ko-thet-family/']];
const report={kind:'visible-2026-10-23-evening-data-five-brand-ui-and-frame',sourcePdf:original.sourcePdfSha256,expectedVersion:version,checks:[],frame:{},pagesBuilds:0,readOnly:true};
let browser;
try{
 assert.equal(original.date,'2026-10-23');assert.equal(original.updates.length,13);
 browser=await chromium.launch({headless:true,executablePath:process.env.FOOTBALL_QA_CHROME||undefined,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1366,height:900}});
 const page=await ctx.newPage();
 for(const viewport of [{name:'desktop',width:1366,height:900},{name:'mobile',width:390,height:844}]){
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  for(const [brand,path] of brands){
   const url=base+path+'odds.html?visible=20261023-'+Date.now();
   const r=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   assert.equal(r.status(),200,'Odd page not public for '+brand);
   await page.waitForFunction((v)=>{
    const rows=[...document.querySelectorAll('#oddsList .odds-table tbody tr')];
    const cells=[...document.querySelectorAll('#oddsList .odds-table tbody td.odds-current')];
    return document.getElementById('oddsCount')?.textContent?.trim()==='13' && rows.length===13 && cells.length===26 && cells.every(x=>x.textContent.trim().length>0);
   },null,{timeout:40000});
   const visible=await page.evaluate(()=>({
    version:null,
    rows:[...document.querySelectorAll('#oddsList .odds-table tbody tr')].map(x=>({
      teams:x.querySelector('td.team-pair')?.textContent||'',
      prices:[...x.querySelectorAll('td.odds-current')].map(t=>t.textContent.trim()),
      opening:[...x.querySelectorAll('td.odds-original')].map(t=>t.textContent.trim())
    }))
   }));
   const state=await page.evaluate(async()=>window.FootballData.ready());
   assert.equal(state.version,version,brand+' outdated D1 version');
   assert(!state.fallback&&!state.stale,brand+' stale static fallback');
   for(const row of original.updates){
    const match=visible.rows.filter(v=>v.teams.includes(row.home)&&v.teams.includes(row.away));
    assert.equal(match.length,1,brand+' missing visible teams row '+row.row);
    assert.deepEqual(match[0].prices,[row.currentBodyOdds,row.currentGoalTotalOdds],brand+' BLANK/incorrect visible current prices '+row.row);
    assert.deepEqual(match[0].opening,[row.openingBodyOdds,row.openingGoalTotalOdds],brand+' original changed '+row.row);
   }
   report.checks.push({brand,viewport:viewport.name,visibleRows:13,visibleCurrentCells:26,allCurrentPricesCorrect:true,originalPricesPreserved:true,version});
   if(brand==='Main'&&viewport.name==='desktop'){
    await page.locator('#tofPreview').click();
    await page.locator('#tofOutput img').first().waitFor({state:'visible',timeout:110000});
    const img=page.locator('#tofOutput img').first();
    const p=await img.evaluate(async e=>{
      const res=await fetch(e.src);const body=new Uint8Array(await res.arrayBuffer());
      const format=Array.from(body.slice(0,8)).map(n=>n.toString(16).padStart(2,'0')).join('');
      return {bytes:body.length,format,src:e.src};
    });
    assert.equal(p.format,'89504e470d0a1a0a');assert(p.bytes>10000);
    await img.screenshot({path:root+'/main-evening-Best-Your-Choice-frame.png',timeout:120000});
    report.frame={generated:true,pngBytes:p.bytes,file:root+'/main-evening-Best-Your-Choice-frame.png',dataSource:version};
    await page.locator('#oddsList .odds-table').first().screenshot({path:root+'/main-visible-table.png',timeout:30000});
   }
  }
 }
 assert.equal(report.checks.length,10);assert.equal(report.frame.generated,true);
 report.success=true;
}catch(error){report.success=false;report.error=String(error?.message||error).slice(0,850);}
finally{await browser?.close();writeFileSync(root+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({success:report.success,brandViewportChecks:report.checks.length,frame:report.frame,error:report.error,builds:0}));if(!report.success)process.exitCode=1;}
