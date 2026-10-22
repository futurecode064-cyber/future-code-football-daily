// Hosted owner-session + service-binding acceptance on isolated QA resources only.
// Imports the CURRENT unchanged public snapshot as PRIVATE drafts; never publishes it.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdtempSync,cpSync,rmSync,readdirSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';import {randomBytes,createHmac} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(new URL('../../',import.meta.url).pathname),out=resolve(process.argv[2]||'football-owner-hosted-qa');
mkdirSync(out,{recursive:true});const scratch=mkdtempSync(tmpdir()+'/football-owner-preview-');
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN,account='86851bf21d81d8f0972052aff8162149';
const owner='futurecode064-cyber/future-code-football-daily',worker='future-code-football-owner-preview',backend='future-code-football-engine-qa-smoke';
const admin=createHmac('sha256',token||'missing').update('future-code/QA-SMOKE-ONLY/owner-service-token/v1').digest('hex');
const password=randomBytes(32).toString('hex'),session=randomBytes(32).toString('hex');let browser;
const report={kind:'hosted-owner-service-and-unchanged-real-snapshot-QA',productionModified:false,newDailyContentCreated:false,realContentPublished:false,checks:{},pages:[],png:[],limitations:['Browser Android emulation is not an installed APK device test.','Existing editorial facts preserved, not newly researched or corrected.','Preview login credentials are temporary QA credentials; production credentials unchanged.']};
function redact(e){let s=String(e?.message||e);for(const v of [token,admin,password,session])if(v)s=s.replaceAll(v,'[redacted]');return s.slice(0,900);}
async function cf(path,method='GET',body){const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});const b=await r.json();if(!r.ok||!b.success)throw Error('Cloudflare '+method+' '+path+' HTTP '+r.status+' codes '+JSON.stringify(b.errors?.map(e=>e.code)||[]));return b.result;}
function wrangler(args){try{return execFileSync(process.execPath,[root+'/services/football-engine/node_modules/wrangler/bin/wrangler.js',...args],{cwd:root,env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true',WRANGLER_SEND_METRICS:'false'},encoding:'utf8',stdio:'pipe',maxBuffer:10*1024*1024});}catch(e){throw Error('Wrangler '+args[0]+' '+redact(e.stderr||e.stdout||e).slice(-600));}}
async function engine(name,body,key){const r=await fetch(report.backendOrigin+'/api/admin/'+name,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+admin,'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const b=await r.json();assert.ok(r.ok,'Private QA API '+name+' returned '+r.status);return b;}
async function ids(name){const d=await cf('/workers/scripts/'+name+'/deployments');return d.deployments.map(x=>x.id);}
function png(file){const b=readFileSync(file);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');const width=b.readUInt32BE(16),height=b.readUInt32BE(20);assert.ok(width>=200&&height>=200);return {width,height,bytes:b.length};}
async function savedPng(page,button,name){const [d]=await Promise.all([page.waitForEvent('download',{timeout:90000}),button.click()]);const file=join(out,name+'.png');await d.saveAs(file);report.png.push({name,...png(file)});}
try{
 assert.ok(token&&token.length>=32,'GitHub-stored scoped Cloudflare token required');
 const config=JSON.parse(readFileSync(root+'/config/football/project.json','utf8'));assert.equal(config.deployment.productionCutoverCompleted,false);
 execFileSync('git',['diff','--exit-code','origin/main','--','football-daily/data'],{cwd:root,stdio:'pipe'});
 const settings=await cf('/workers/scripts/'+backend+'/settings');assert.ok(settings.bindings?.some(b=>b.name==='FOOTBALL_ENGINE_MANAGED_BY'&&b.text===owner+'/QA-SMOKE-ONLY'),'Unowned QA backend; refusing changes');
 const db=settings.bindings.find(b=>b.type==='d1'&&b.name==='DB');assert.ok(db?.id,'Missing QA D1');
 const marker=await cf('/d1/database/'+db.id+'/query','POST',{sql:'SELECT owner FROM football_engine_installation WHERE singleton=1'});assert.equal(marker[0]?.results?.[0]?.owner,owner+'/QA-SMOKE-ONLY');
 const scripts=await cf('/workers/scripts');if(scripts.some(s=>s.id===worker)){const s=await cf('/workers/scripts/'+worker+'/settings');assert.ok(s.bindings?.some(b=>b.name==='FOOTBALL_ENGINE_MANAGED_BY'&&b.text===owner+'/OWNER-PREVIEW-ONLY'),'Unowned frontend; refusing overwrite');}
 const sub=await cf('/workers/subdomain');assert.match(sub.subdomain,/^[a-z0-9-]+$/);
 report.origin='https://'+worker+'.'+sub.subdomain+'.workers.dev';report.backendOrigin='https://'+backend+'.'+sub.subdomain+'.workers.dev';
 // Coordinate only the disposable QA backend and this preview service secret; never original staging/production.
 await cf('/workers/scripts/'+backend+'/secrets','PUT',{name:'ADMIN_TOKEN',type:'secret_text',text:admin});
 let state;for(let n=0;n<12;n++){try{state=await engine('state');break;}catch(e){if(n===11)throw e;await new Promise(r=>setTimeout(r,2500));}}assert.ok(state.version_id&&state.generation>=1,'Synthetic QA publication required');
 const beforeBackend=await ids(backend),folder=scratch+'/batches';
 execFileSync(process.execPath,[root+'/scripts/football/prepare-migration.mjs',root+'/football-daily',folder],{stdio:'pipe'});
 let version,expected={},batch=0;const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 for(const f of readdirSync(folder).filter(n=>n.startsWith('batch-')).sort()){const b=JSON.parse(readFileSync(folder+'/'+f));b.expectedGeneration=state.generation;if(version)b.baseDraft=version;Object.assign(expected,b.resources);version=(await engine('import',b,'owner-real-parity:'+commit+':'+(++batch))).version;}
 assert.deepEqual((await engine('draft?version='+version)).resources,expected);assert.deepEqual(await engine('state'),state);
 report.draftVersion=version;report.sourceCommit=commit;report.sourceResources=Object.keys(expected).length;report.sourceFixtures=expected['data/today.json'].matches.length;report.checks.allJsonValuesEqual=true;
 const privateRead=await fetch(report.backendOrigin+'/api/football/resource?path=data/today.json&version='+version);assert.equal(privateRead.status,404);report.checks.privateDraftNotPublic=true;
 const assets=scratch+'/site';cpSync(root+'/football-daily',assets,{recursive:true});
 for(const p of ['_worker.js','_routes.json','tests','data/editorial','data/research'])rmSync(assets+'/'+p,{recursive:true,force:true});
 writeFileSync(assets+'/.assetsignore','.*\n!/.well-known\n');
 // Public normal page remains synthetic QA; private real snapshot only through authenticated fcDraft.
 writeFileSync(assets+'/football-engine-config.js','window.FC_FOOTBALL_ENGINE=Object.freeze({enabled:false});\n');
 const wc={name:worker,main:root+'/football-daily/_worker.js',compatibility_date:'2026-10-22',account_id:account,workers_dev:true,
  assets:{directory:assets,binding:'ASSETS',run_worker_first:['/api/*','/editor/*','/login','/login/*','/logout','/logout/*','/future-code-journal/*']},
  services:[{binding:'FOOTBALL_ENGINE',service:backend}],vars:{FCD_ENGINE_ENABLED:'true',FOOTBALL_ENGINE_MANAGED_BY:owner+'/OWNER-PREVIEW-ONLY'}};
 writeFileSync(scratch+'/wrangler.json',JSON.stringify(wc));wrangler(['deploy','--config',scratch+'/wrangler.json']);
 for(const [name,text] of [['FCD_MAIN_PASSWORD',password],['FCD_SESSION_SECRET',session],['FCD_ENGINE_TOKEN',admin]])await cf('/workers/scripts/'+worker+'/secrets','PUT',{name,type:'secret_text',text});
 await cf('/workers/scripts/'+worker+'/subdomain','POST',{enabled:true,previews_enabled:false});
 const beforeFrontend=await ids(worker);
 let live=false;for(let n=0;n<8;n++){const r=await fetch(report.origin+'/api/editor/engine/state');if(r.status===401){live=true;break;}await new Promise(r=>setTimeout(r,2500));}assert.ok(live,'Owner preview not ready');
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1366,height:900}}),page=await context.newPage();
 await page.goto(report.origin+'/login?next=/editor/engine.html',{waitUntil:'domcontentloaded'});
 await page.locator('#email').fill('futurecode064@gmail.com');await page.locator('#password').fill(password);await page.locator('button[type=submit]').click();
 await page.waitForURL('**/editor/engine.html');await page.waitForFunction(()=>!document.getElementById('status').textContent.includes('စနစ်စစ်နေသည်'));
 const check=await page.evaluate(async()=>{const r=await fetch('/api/editor/engine/state');return {status:r.status,state:await r.json()};});assert.equal(check.status,200);assert.equal(check.state.generation,state.generation);report.checks.existingOwnerSessionServiceProxy=true;
 assert.equal((await context.request.post(report.origin+'/api/editor/engine/import',{headers:{Origin:'https://foreign.invalid','X-Football-Editor':'1'},data:{}})).status(),403);report.checks.ownerCsrfRejected=true;
 assert.equal((await context.request.post(report.origin+'/api/editor/save',{headers:{Origin:report.origin},data:{}})).status(),409);report.checks.legacyGithubPublisherBlocked=true;
 await page.locator('#version').fill(version);await page.locator('#draft').click();await page.waitForFunction(v=>document.getElementById('result').textContent.includes(v),version);
 await page.locator('nav button[data-section=fixtures]').click();assert.match(await page.locator('#rowCount').innerText(),new RegExp(report.sourceFixtures+' / '+report.sourceFixtures));report.checks.adminRealRowsLoaded=true;
 const routes=[['main','/'],['goal-zone','/future-code-journal/'],['bw-sport','/bw-sport/'],['ykz','/ykz-family/'],['ko-thet','/ko-thet-family/']];
 for(const size of [{label:'desktop',width:1366,height:900},{label:'android-browser',width:390,height:844}]){
  await page.setViewportSize(size);
  for(const [brand,path] of routes)for(const type of ['home','odds']){
   const suffix=type==='odds'?'odds.html':'',url=report.origin+path+suffix+'?fcDraft='+version+'&date='+expected['data/today.json'].reportDate;
   const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(res.status(),200);
   const actual=await page.evaluate(async()=>{const s=await window.FootballData.ready();const root=new URL('.',document.querySelector('script[src*="football-data-client.js"]').src);const r=await window.FootballData.fetch(new URL('data/today.json',root));return {draft:s.draft,version:s.version,error:s.error,report:await r.json()};});
   assert.equal(actual.draft,true);assert.equal(actual.version,version);assert.deepEqual(actual.report,expected['data/today.json']);
   if(type==='odds')await page.waitForFunction(n=>document.getElementById('oddsCount')?.textContent?.trim()===String(n),report.sourceFixtures,{timeout:30000});
   else await page.waitForFunction(n=>document.getElementById('matchCount')?.textContent?.trim()===String(n),report.sourceFixtures,{timeout:30000});
   report.pages.push({brand,type,viewport:size.label,pinnedVersion:version,fixtures:report.sourceFixtures,passed:true});
   if(size.label==='desktop'){
    await page.screenshot({path:join(out,brand+'-'+type+'.png'),fullPage:false});
    if(type==='odds')await savedPng(page,page.locator('#oddsPngPages button').first(),brand+'-odds-download');
    else await savedPng(page,page.locator('.match-download').first(),brand+'-preview-download');
   }
  }
 }
 report.checks.realSnapshotPages=report.pages.length===20;report.checks.realPngDownloads=report.png.length===10;
 // A logged-out browser must never see the private real snapshot via the new draft preview.
 const anon=await browser.newContext();const ap=await anon.newPage();await ap.goto(report.origin+'/?fcDraft='+version);
 const denied=await ap.evaluate(async()=>{const s=await window.FootballData.ready(),r=await window.FootballData.fetch('/data/today.json');return {error:s.error,status:r.status};});assert.equal(denied.status,503);report.checks.anonymousDraftPreviewDenied=true;await anon.close();
 assert.deepEqual(await engine('state'),state);assert.deepEqual(await ids(backend),beforeBackend);assert.deepEqual(await ids(worker),beforeFrontend);report.checks.noDeployDuringPrivateImportsOrBrowserReads=true;
 report.checks.noRealPublication=true;report.success=true;
}catch(e){report.error=redact(e);report.success=false;process.exitCode=1;}
finally{await browser?.close();rmSync(scratch,{recursive:true,force:true});writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({success:report.success,pages:report.pages.length,png:report.png.length,checks:report.checks,error:report.error,productionModified:false}));}
