// Isolated browser QA: serves a local staging copy. Never reaches production write endpoints.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const base=process.env.FOOTBALL_PREVIEW_ORIGIN||'http://localhost:8788';
const output=process.env.FOOTBALL_QA_OUTPUT||'football-browser-qa';
mkdirSync(output,{recursive:true});
const routes=[
 ['main','/'],['goal-zone','/future-code-journal/'],['bw-sport','/bw-sport/'],
 ['ykz','/ykz-family/'],['ko-thet','/ko-thet-family/'],
 ['main-odds','/odds.html'],['goal-odds','/future-code-journal/odds.html'],
 ['bw-odds','/bw-sport/odds.html'],['ykz-odds','/ykz-family/odds.html'],
 ['ko-odds','/ko-thet-family/odds.html']
];
const report={kind:'isolated-staging-browser-qa',date:new Date().toISOString(),productionModified:false,
  apiActive:false,expectedFallback:'static',sites:[],limitations:[
  'Only fallback before publication is tested: staging API currently has no validated public data.',
  'PNG/video export interaction, Android APK WebView and physical devices require additional QA.',
  'Screenshots are of temporary local staging copy, not published production.'
 ]};
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const viewport of [{label:'desktop',width:1366,height:900},{label:'mobile',width:390,height:844}]){
  for(const [brand,path] of routes){
   const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
   const row={brand,route:path,viewport:viewport.label,passed:false};
   try {
    const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:45000});
    row.http=response?.status();
    if(row.http!==200)throw Error('Page returned '+row.http);
    const state=await page.evaluate(()=>window.FootballData?.ready?.());
    row.enginePresent=await page.evaluate(()=>!!window.FootballData);
    row.apiFallback=state?.fallback||null;
    row.staticData=await page.evaluate(async()=>{
      const resp=await window.FootballData.fetch('/data/today.json');
      const data=await resp.json();
      return {http:resp.status,matchCount:Array.isArray(data.matches)?data.matches.length:null,
        reportDate:data.reportDate||null};
    });
    row.notice=await page.locator('#footballDataNotice').count();
    row.bodyLength=(await page.locator('body').innerText()).length;
    if(!row.enginePresent||row.apiFallback!=='static'||row.staticData.http!==200||
       row.staticData.matchCount===null||row.bodyLength<100||row.notice!==1) {
       throw Error('Engine fallback/static data assertion failed');
    }
    await page.screenshot({path:join(output,brand+'-'+viewport.label+'.png'),fullPage:false,timeout:30000});
    row.passed=true;
   }catch(error){row.error=String(error.message||error).slice(0,300);}
   report.sites.push(row);
   await page.close();
  }
 }
 report.passed=report.sites.every(x=>x.passed);
 report.checked=report.sites.length;
 report.passedCount=report.sites.filter(x=>x.passed).length;
 writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({checked:report.checked,passed:report.passedCount,failed:report.checked-report.passedCount}));
 if(!report.passed)process.exitCode=1;
}catch(e){
 report.fatal=String(e.message||e);report.passed=false;
 writeFileSync(join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.error(report.fatal);process.exitCode=1;
}finally{await browser?.close();}
