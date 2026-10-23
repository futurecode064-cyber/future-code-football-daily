// Exercise the existing renderers on the authenticated, unchanged real private snapshot.
import {readFileSync} from 'node:fs';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
export async function checkDownloadModes(page,{origin,version,expected,out}){
 const result={frames:[],split:null,leagueFilter:null,video:[],newsPhotos:null};
 const query='?fcDraft='+version+'&date='+expected['data/today.json'].reportDate;
 await page.setViewportSize({width:1366,height:900});await page.goto(origin+'/odds.html'+query,{waitUntil:'domcontentloaded'});
 await page.locator('#tofDesign option').last().waitFor({state:'attached'});
 await page.waitForFunction(n=>Number(document.getElementById('oddsCount')?.textContent)===n&&typeof loadedSheet!=='undefined'&&loadedSheet?.matches?.length===n,expected['data/odds/'+expected['data/today.json'].reportDate+'.json'].matches.length,{timeout:60000});
 const options=await page.locator('#tofDesign option').evaluateAll(xs=>xs.map(o=>({value:o.value,label:o.textContent})));
 async function preview(n){await page.locator('#tofPreview').click();try{await page.waitForFunction(n=>{const b=document.getElementById('tofPreview'),imgs=[...document.querySelectorAll('#tofOutput img')];return !b.disabled&&imgs.length===n&&imgs.every(im=>im.complete&&im.naturalWidth>200&&im.naturalHeight>200);},n,{timeout:60000});}catch(e){const state=await page.evaluate(()=>({buttonDisabled:document.getElementById('tofPreview')?.disabled,status:document.getElementById('tofStatus')?.textContent,images:[...document.querySelectorAll('#tofOutput img')].map(x=>({complete:x.complete,width:x.naturalWidth,height:x.naturalHeight}))}));throw Error('Odds frame '+(result.currentFrame||'unknown')+' preview timed out: '+JSON.stringify(state));}return page.locator('#tofOutput img').evaluateAll(xs=>xs.map(im=>({width:im.naturalWidth,height:im.naturalHeight})));}
 for(const option of options){result.currentFrame=option.value;await page.locator('#tofDesign').selectOption(option.value);await page.locator('#tofSplit').selectOption('all');result.frames.push({...option,images:await preview(1)});}
 assert.equal(result.frames.length,16,'Expected all 15 existing frames plus no-frame colour mode');
 await page.locator('#tofSplit').selectOption('two');result.split={images:await preview(2)};
 const [zip]=await Promise.all([page.waitForEvent('download',{timeout:90000}),page.locator('#tofSave').click()]);const zipPath=join(out,'real-two-part-odds.zip');await zip.saveAs(zipPath);
 result.split.zip=JSON.parse(execFileSync('python3',['-c',"import zipfile,struct,json,sys;z=zipfile.ZipFile(sys.argv[1]);a=[]\nfor n in z.namelist():\n b=z.read(n);assert b[:8]==bytes.fromhex('89504e470d0a1a0a');w,h=struct.unpack('>II',b[16:24]);a.append(dict(name=n,width=w,height=h))\nassert len(a)==2;print(json.dumps(a))",zipPath],{encoding:'utf8'}));
 await page.locator('#tofSplit').selectOption('league');await page.locator('#tofLeagueNone').click();await page.locator('#tofLeagueChoices input').first().check();result.leagueFilter={images:await preview(1)};
 await page.goto(origin+'/'+query,{waitUntil:'domcontentloaded'});await page.locator('.fc-main-news-tab').click();
 const newsCount=expected['data/news/latest.json']?.items?.length||0;
 await page.waitForFunction(n=>document.querySelectorAll('#fcNewsGrid .fc-news-card').length===n,newsCount,{timeout:30000});
 const images=page.locator('#fcNewsGrid img.fc-news-image');for(let i=0;i<await images.count();i++)await images.nth(i).scrollIntoViewIfNeeded();
 await page.waitForFunction(n=>{const imgs=[...document.querySelectorAll('#fcNewsGrid img.fc-news-image')];return imgs.length===n&&imgs.every(im=>im.complete&&im.naturalWidth>0);},newsCount,{timeout:45000});
 result.newsPhotos={expected:newsCount,loaded:await images.count()};
 await page.locator('.fc-main-studio-tab').click();await page.locator('#fcVideoQuality').selectOption('lite');await page.locator('#fcVideoPace').selectOption('fast');
 for(const mode of ['results','previews','odds']){
  await page.locator('#fcVideoMode').selectOption(mode);await page.waitForFunction(()=>document.getElementById('fcVideoMatches')?.querySelectorAll('input').length>0&&!document.getElementById('fcVideoPreview').disabled,{timeout:30000});
  const count=await page.locator('#fcVideoMatches input').count();
  await page.locator('#fcVideoMatches input').evaluateAll(xs=>xs.forEach((x,i)=>{if(i){x.checked=false;x.dispatchEvent(new Event('change',{bubbles:true}));}}));
  await page.locator('#fcVideoPreview').click();await page.waitForFunction(()=>document.getElementById('fcVideoStatus')?.textContent?.includes('Video နမူနာ'),{timeout:45000});
  const canvas=await page.locator('#fcVideoCanvas').evaluate(c=>({width:c.width,height:c.height}));assert.equal(canvas.width,720);assert.equal(canvas.height,1280);result.video.push({mode,availableMatches:count,preview:canvas});
  if(mode==='odds'){
   const [file]=await Promise.all([page.waitForEvent('download',{timeout:90000}),page.locator('#fcVideoDownload').click()]);const path=join(out,'real-source-one-match-video'+(file.suggestedFilename().endsWith('.mp4')?'.mp4':'.webm'));await file.saveAs(path);const b=readFileSync(path);assert.ok(b.length>2000);assert.ok(b.subarray(4,8).toString()==='ftyp'||b.subarray(0,4).toString('hex')==='1a45dfa3');result.videoDownload={bytes:b.length,filename:file.suggestedFilename()};
  }
 }
 result.success=true;return result;
}
