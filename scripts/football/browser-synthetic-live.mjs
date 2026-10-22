// Browser QA on a local copy using the SEPARATE synthetic remote QA Worker as data source.
// Never touches production. Real PNG files are downloaded, decoded and dimension-checked.
import {chromium} from 'playwright';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
const siteOrigin=process.env.FOOTBALL_PREVIEW_ORIGIN||'http://localhost:8788';
const out=process.env.FOOTBALL_LIVE_QA_OUTPUT||'football-qa-live-browser';
const expectedDate='2026-10-22';
const expectedFixtures=1;
mkdirSync(out,{recursive:true});
const routes=[
 ['main','/','/odds.html'],['goal-zone','/future-code-journal/','/future-code-journal/odds.html'],
 ['bw-sport','/bw-sport/','/bw-sport/odds.html'],['ykz','/ykz-family/','/ykz-family/odds.html'],
 ['ko-thet','/ko-thet-family/','/ko-thet-family/odds.html']];
const report={kind:'synthetic-public-api-frontend-qa',date:new Date().toISOString(),environment:'qa-smoke-not-production',
 sourceData:'SYNTHETIC NON-EDITORIAL QA — not real match data',productionModified:false,
 routes:[],png:[],videoPreview:null,limitations:[
 'Only one synthetic match: not a substitute for 36 real PDF fixtures or long Burmese content.',
 'Desktop and browser-mobile emulation, not installed Android APK WebView.',
 'Video preview/canvas test only; full WebM download needs explicit playback/recording test.',
 'No production binding or Pages publication was changed.'
 ]};
let browser;
function pngInfo(file){
 const buffer=readFileSync(file);if(buffer.length<32)throw Error('Downloaded PNG unexpectedly short');
 if(buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Bad PNG signature');
 const w=buffer.readUInt32BE(16),h=buffer.readUInt32BE(20);
 if(w<200||h<200)throw Error('PNG dimensions unexpectedly small');
 return {width:w,height:h,bytes:buffer.length};
}
async function checkPage(page,brand,route,viewport,type){
 const row={brand,route,viewport,type,passed:false};const response=await page.goto(siteOrigin+route,{waitUntil:'domcontentloaded',timeout:60000});
 row.http=response?.status();if(row.http!==200)throw Error('HTML status '+row.http);
 const engine=await page.evaluate(async()=>{
  if(!window.FootballData) return {missingEngine:true};
  const state=await window.FootballData.ready();
  const fetched=await window.FootballData.fetch(new URL('data/today.json',document.currentScript?.src||document.baseURI).href);
  const data=await fetched.json().catch(()=>null);
  return {enabled:window.FC_FOOTBALL_ENGINE?.enabled===true,version:state?.version||null,stale:state?.stale,
    fallback:state?.fallback||null,sourceStatus:fetched.status,date:data?.reportDate,count:data?.matches?.length,
    isSynthetic:String(data?.matches?.[0]?.league||'').includes('SYNTHETIC QA')};
 });
 Object.assign(row,engine);
 if(!engine.enabled||!engine.version||engine.stale||engine.fallback||engine.sourceStatus!==200||
  engine.date!==expectedDate||engine.count!==expectedFixtures||!engine.isSynthetic)
   throw Error('Expected pinned synthetic API data, got '+JSON.stringify(engine));
 if(type==='odds'){
  await page.waitForFunction(()=>document.getElementById('oddsCount')?.textContent?.trim()==='1',{timeout:30000});
  row.renderedOdds=await page.locator('#oddsCount').innerText();
 }
 await page.screenshot({path:join(out,brand+'-'+type+'-'+viewport+'.png'),fullPage:false,timeout:30000});
 row.passed=true;return row;
}
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const v of [{label:'desktop',width:1366,height:900},{label:'mobile',width:390,height:844}]){
  for(const [brand,home,odds] of routes){
   for(const [type,path] of [['home',home],['odds',odds]]){
    const page=await browser.newPage({viewport:{width:v.width,height:v.height},acceptDownloads:true});
    try{
     const row=await checkPage(page,brand,path,v.label,type);report.routes.push(row);
     if(type==='odds'&&v.label==='desktop'){
      const output=join(out,brand+'-real-download.png');
      const png={brand,passed:false};
      try{
       const btn=page.locator('#oddsPngPages button').first();
       await btn.waitFor({timeout:25000});await btn.scrollIntoViewIfNeeded();
       const [d]=await Promise.all([page.waitForEvent('download',{timeout:55000}),btn.click()]);
       await d.saveAs(output);
       png.filename=d.suggestedFilename();Object.assign(png,pngInfo(output));png.passed=true;
      }catch(e){png.error=String(e.message||e).slice(0,500);}
      report.png.push(png);
     }
     if(type==='home'&&brand==='main'&&v.label==='desktop'){
      const video={passed:false,kind:'preview-only'};
      try{
       const preview=page.locator('#fcVideoPreview');
       if(await preview.count()){
        await preview.waitFor({timeout:20000});await preview.scrollIntoViewIfNeeded();
        await preview.click({timeout:20000});
        await page.waitForTimeout(800);
        video.canvas=await page.evaluate(()=>{
          const c=document.querySelector('#fcVideoStudio canvas');
          return c?{width:c.width,height:c.height}:null;
        });
        video.passed=Boolean(video.canvas&&video.canvas.width>100&&video.canvas.height>100);
        if(!video.passed)video.error='Preview canvas not rendered';
        await page.locator('#fcVideoStop').click({timeout:5000}).catch(()=>{});
       }else video.error='Preview controls absent';
      }catch(e){video.error=String(e.message||e).slice(0,500);}
      report.videoPreview=video;
     }
    }catch(e){report.routes.push({brand,route:path,viewport:v.label,type,passed:false,error:String(e.message||e).slice(0,500)});}
    finally{await page.close();}
   }
  }
 }
 report.pageCount=report.routes.length;report.passedPages=report.routes.filter(x=>x.passed).length;
 report.passedPng=report.png.filter(x=>x.passed).length;
 report.passed=report.passedPages===20&&report.passedPng===5&&report.videoPreview?.passed===true;
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({pages:report.passedPages+'/'+report.pageCount,
  actualDownloadedPng:report.passedPng+'/'+report.png.length,
  videoPreview:report.videoPreview?.passed||false,success:report.passed}));
 if(!report.passed)process.exitCode=1;
}catch(e){report.error=String(e.message||e).slice(0,700);report.passed=false;
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.error(report.error);process.exitCode=1;
}finally{await browser?.close();}
