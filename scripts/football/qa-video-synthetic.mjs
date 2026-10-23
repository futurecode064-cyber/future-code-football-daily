// Main Studio video QA with the actual navigation tab enabled and one synthetic QA odds slide.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const out=process.env.FOOTBALL_VIDEO_QA_OUTPUT||'football-video-qa';
mkdirSync(out,{recursive:true});let browser;
const report={kind:'synthetic-qa-video-preview-and-download',productionModified:false,synthetic:true,
  expectedSource:'future-code-football-engine-qa-smoke',videoPreview:false,videoDownload:false};
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox',
  '--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:900},acceptDownloads:true});
 const res=await page.goto('http://localhost:8788/',{waitUntil:'domcontentloaded',timeout:45000});
 if(res.status()!==200)throw Error('Staging-copy homepage failed');
 await page.locator('.fc-main-studio-tab').click();
 await page.waitForFunction(()=>document.body.dataset.fcMainView==='video',{timeout:10000});
 await page.locator('#fcVideoMode').selectOption('odds');
 await page.locator('#fcVideoPace').selectOption('fast');
 await page.locator('#fcVideoQuality').selectOption('lite');
 await page.waitForFunction(()=>document.getElementById('fcVideoStatus')?.textContent?.includes('ပွဲ ရရှိပါပြီ'),{timeout:30000});
 const visible=await page.locator('#fcVideoPreview').isVisible();
 if(!visible)throw Error('Video tab did not reveal Studio controls');
 await page.locator('#fcVideoPreview').click();
 await page.waitForFunction(()=>document.getElementById('fcVideoStatus')?.textContent?.includes('Video နမူနာ'),{timeout:30000});
 const frame=await page.evaluate(()=>{
  const c=document.getElementById('fcVideoCanvas');
  return {width:c.width,height:c.height,url:c.toDataURL('image/png').slice(0,25)};
 });
 if(frame.width!==720||frame.height!==1280||!frame.url.startsWith('data:image/png'))throw Error('Unexpected video preview canvas');
 report.videoPreview=true;report.canvas={width:frame.width,height:frame.height};
 await page.locator('#fcVideoStudio').screenshot({path:join(out,'video-preview.png'),timeout:30000});
 try {
  const event=page.waitForEvent('download',{timeout:90000});
  await page.locator('#fcVideoDownload').click();
  const file=await event;
  const target=join(out,'synthetic-football-preview-video'+(file.suggestedFilename().endsWith('.mp4')?'.mp4':'.webm'));
  await file.saveAs(target);
  const b=readFileSync(target);
  if(b.length<2000)throw Error('Video file too small');
  const mp4=b.subarray(4,8).toString('ascii')==='ftyp';
  const webm=b.subarray(0,4).toString('hex')==='1a45dfa3';
  if(!mp4&&!webm)throw Error('Video header is neither MP4 nor WebM');
  report.videoDownload=true;report.format=mp4?'mp4':'webm';
  report.filename=file.suggestedFilename();report.bytes=b.length;
 }catch(e){report.videoError=String(e.message||e).slice(0,500);
   report.pageVideoStatus=await page.locator('#fcVideoStatus').innerText().catch(()=>null);
 }
 report.passed=report.videoPreview&&report.videoDownload;
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({preview:report.videoPreview,download:report.videoDownload,success:report.passed}));
 if(!report.passed)process.exitCode=1;
 await page.close();
}catch(e){report.error=String(e.message||e).slice(0,700);report.passed=false;
 writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.error(report.error);process.exitCode=1;
}finally{await browser?.close();}
