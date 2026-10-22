// Disposable separate QA Worker/D1 instance. Synthetic fixtures only: never production content.
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=resolve(new URL('../../',import.meta.url).pathname);
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN,account='86851bf21d81d8f0972052aff8162149';
const owner='futurecode064-cyber/future-code-football-daily';
const workerName='future-code-football-engine-qa-smoke';
const dbName='future-code-football-db-qa-smoke';
const secret=randomBytes(32).toString('hex');
const reportPath=resolve(process.argv[2]||'football-qa-smoke-report.json');
const scratch=mkdtempSync(tmpdir()+'/football-qa-live-');
const result={kind:'synthetic-only-remote-data-operation-QA',productionModified:false,realFootballPublished:false,
 workerName,dbName,allFixturesSynthetic:true,smokeValidationIsNotEditorialApproval:true,checks:{}};
const prefix='/accounts/'+account;
function save(){writeFileSync(reportPath,JSON.stringify(result,null,2)+'\n',{mode:0o600});}
function cleanError(e){return String(e.message||e).replaceAll(token||'__absent__','[redacted]').replaceAll(secret,'[redacted]').slice(0,900);}
async function cf(path,method='GET',body){
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,
  headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(30000)});
 const data=await r.json();if(!r.ok||!data.success)throw Error('Cloudflare '+method+' '+path+' HTTP '+r.status+' '+JSON.stringify(data.errors?.map(e=>e.code)||[]));
 return data.result;
}
function wrangler(args){
 try{return execFileSync(process.execPath,[resolve(root,'services/football-engine/node_modules/wrangler/bin/wrangler.js'),...args],
  {cwd:root,encoding:'utf8',env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,
    CI:'true',WRANGLER_SEND_METRICS:'false'},stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024});}
 catch(e){throw Error('Wrangler '+args[0]+' failed: '+cleanError(e.stderr||e.stdout||e.message).slice(-500));}
}
async function endpoint(path,body,extra={}){
 const r=await fetch(result.qaOrigin+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+secret,
  ...(body?{'Content-Type':'application/json','Idempotency-Key':extra.key||'qa-only'}:{})},
  body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});
 const data=await r.json();
 if(!r.ok)throw Error('QA endpoint '+path+' returned HTTP '+r.status+': '+JSON.stringify(data).slice(0,600));
 return data;
}
async function deployments(){const d=await cf(prefix+'/workers/scripts/'+workerName+'/deployments');
 assert.ok(Array.isArray(d.deployments));return d.deployments.map(x=>x.id);}
const day='2026-10-22';
const home='SYNTHETIC QA HOME — NOT A REAL TEAM';
const away='SYNTHETIC QA AWAY — NOT A REAL TEAM';
const bh='စမ်းသပ်အိမ်ရှင် (အမှန်တကယ်ပွဲမဟုတ်ပါ)';
const ba='စမ်းသပ်ဧည့်သည် (အမှန်တကယ်ပွဲမဟုတ်ပါ)';
const league='SYNTHETIC QA LEAGUE — NOT REAL FOOTBALL';
function bundle(){
 const last=Array.from({length:5},(_,i)=>({date:'2026-10-'+String(20-i).padStart(2,'0'),
  competition:'SYNTHETIC QA COMPETITION',opponent:'QA Test Opponent',result:i%2?'D':'W',
  teamGoals:1,opponentGoals:i%2?1:0,status:'STATUS_FULL_TIME',sourceUrl:'https://example.org/synthetic-only'}));
 const fixture={fixtureId:'qa-20261022-001',pdfRow:1,home,away,homeDisplay:bh,awayDisplay:ba,league,
   nightEditorialDate:day,kickoffCalendarDate:day,kickoffYangon:'စမ်းသပ်ပွဲ ည ၇:၀၀',
   fixtureSourceUrl:'https://example.org/synthetic-qa-fixture',
   previewJournalist:{status:'owner_approved_published',scope:'SYNTHETIC AUTOMATED TEST ONLY — no human approval'},
   dailyPreviewText:'ဤစာသားသည် Website Engine ကို စမ်းသပ်ရန် ဖန်တီးထားသော အချက်အလက်အတုဖြစ်ပြီး ဘောလုံးပွဲအမှန်တကယ် မဟုတ်ပါ။ '.repeat(7)+' **စမ်းသပ်အိမ်ရှင် ကို ရွေးချယ်ပါတယ်။**',
   homeLastFive:last,awayLastFive:last,myanmarOdds:{upperTeam:bh,bodyOdds:'1-40',goalTotalOdds:'3='}};
 const report={reportDate:day,published:true,matchDateTimezone:'Asia/Yangon',noFixturesLeagues:[],matches:[fixture],kind:'SYNTHETIC NON-EDITORIAL QA'};
 const odds={reportDate:day,kind:'SYNTHETIC NON-EDITORIAL QA',matches:[{fixtureId:fixture.fixtureId,pdfRow:1,
  home:bh,away:ba,canonicalHome:home,canonicalAway:away,league,upperTeam:bh,bodyOdds:'1-40',goalTotalOdds:'3=',
  currentBodyOdds:'',currentGoalTotalOdds:''}]};
 const resources={'data/today.json':report,['data/odds/'+day+'.json']:odds,'data/news/latest.json':{date:day,items:[]}};
 const hash=createHash('sha256').update(JSON.stringify(resources)).digest('hex');
 return {editorialDate:day,expectedGeneration:0,sourceManifest:{files:[{name:'SYNTHETIC_QA_NOT_REAL_PDF.json',sha256:hash}]},resources};
}
const review=Object.fromEntries(['pdfFidelity','fixtureIdentity','editorial','formsAndOdds','results','newsScopeAndImages','allBrands','downloads','mobile'].map(k=>
 [k,{passed:true,evidence:'SYNTHETIC-only QA harness: '+k+' fixture contract; NOT a real PDF, user approval, image, browser or production content check'}]));
try {
 assert.ok(token&&token.length>=32,'Cloudflare token must be stored in GitHub Secret');
 const config=JSON.parse(readFileSync(root+'/config/football/project.json','utf8'));
 assert.equal(config.deployment.productionCutoverCompleted,false);assert.equal(config.api.publicBaseUrl,null);
 const scripts=await cf(prefix+'/workers/scripts'),dbs=await cf(prefix+'/d1/database?per_page=100');
 const existingWorker=scripts.find(w=>w.id===workerName);
 const existingDb=dbs.find(d=>d.name===dbName);
 if(Boolean(existingWorker)!==Boolean(existingDb))throw Error('Incomplete QA resources; inspect and repair without guessing');
 let d=existingDb;
 if(existingWorker){
  const settings=await cf(prefix+'/workers/scripts/'+workerName+'/settings');
  assert.ok(settings.bindings?.some(b=>b.name==='FOOTBALL_ENGINE_MANAGED_BY'&&b.text===owner+'/QA-SMOKE-ONLY'),
   'QA Worker not owned by this test; refuse overwrite');
  const check=await cf(prefix+'/d1/database/'+d.uuid+'/query','POST',{sql:'SELECT owner FROM football_engine_installation WHERE singleton=1'});
  assert.equal(check[0]?.results?.[0]?.owner,owner+'/QA-SMOKE-ONLY','QA DB not owned by test');
  result.resumedExistingQa=true;
 }else{
  d=await cf(prefix+'/d1/database','POST',{name:dbName,primary_location_hint:'apac'});
  assert.match(d.uuid,/^[a-f0-9-]{36}$/);
  result.databaseCreated=true;result.databaseId=d.uuid;save();
  await cf(prefix+'/d1/database/'+d.uuid+'/query','POST',{sql:'CREATE TABLE football_engine_installation(singleton INTEGER PRIMARY KEY CHECK(singleton=1),owner TEXT NOT NULL)'});
  await cf(prefix+'/d1/database/'+d.uuid+'/query','POST',{sql:'INSERT INTO football_engine_installation(singleton,owner) VALUES(1,?)',params:[owner+'/QA-SMOKE-ONLY']});
 }
 result.databaseId=d.uuid;save();
 const sub=await cf(prefix+'/workers/subdomain');assert.match(sub.subdomain,/^[a-z0-9-]+$/);
 result.qaOrigin='https://'+workerName+'.'+sub.subdomain+'.workers.dev';
 const configPath=scratch+'/qa-wrangler.json';
 const wc=JSON.parse(readFileSync(root+'/services/football-engine/wrangler.jsonc.example','utf8'));
 wc.name=workerName;wc.main=root+'/services/football-engine/src/worker.mjs';wc.account_id=account;
 wc.d1_databases[0].database_name=dbName;wc.d1_databases[0].database_id=d.uuid;
 wc.d1_databases[0].migrations_dir=root+'/services/football-engine/migrations';
 wc.vars.ENVIRONMENT='qa';wc.vars.ALLOWED_ORIGINS='https://future-code-football-daily.pages.dev,http://localhost:8788';
 wc.vars.FOOTBALL_ENGINE_MANAGED_BY=owner+'/QA-SMOKE-ONLY';
 writeFileSync(configPath,JSON.stringify(wc),{mode:0o600});
 wrangler(['d1','migrations','apply','DB','--remote','--config',configPath]);
 wrangler(['deploy','--config',configPath]);
 await cf(prefix+'/workers/scripts/'+workerName+'/secrets','PUT',{name:'ADMIN_TOKEN',text:secret,type:'secret_text'});
 await cf(prefix+'/workers/scripts/'+workerName+'/subdomain','POST',{enabled:true,previews_enabled:false});
 let health=null;
 for(let i=0;i<6;i++){
  try{health=await endpoint('/api/football/health');if(health.ok&&health.environment==='qa')break;}catch{}
  await new Promise(r=>setTimeout(r,2500));
 }
 assert.equal(health?.environment,'qa');
 assert.ok(health.generation===0||health.generation===1,'Refuse to overwrite unexpected QA state');
 const ids=await deployments();
 const unauthorized=await fetch(result.qaOrigin+'/api/admin/state');
 assert.equal(unauthorized.status,401);result.checks.ownerAuthDenied=true;
 const draft=bundle();
 let first;
 if(health.generation===0){
  first=(await endpoint('/api/admin/import',draft,{key:'synthetic-import-original-verified-v2'})).version;
  const v=(await endpoint('/api/admin/validate',{version:first,review},{key:'synthetic-validate-original-v2'}));
  assert.equal(v.valid,true);result.checks.syntheticOnlyValidation=true;
  const firstPub=await endpoint('/api/admin/publish',{version:first,expectedGeneration:0},{key:'synthetic-publish-original-v2'});
  assert.equal(firstPub.generation,1);
 }else{
  first=health.version_id;
  assert.ok(first,'Existing QA generation must have an active published version');
  result.checks.resumedPriorFirstPublish=true;
 }
 const mf=await endpoint('/api/football/manifest');
 assert.equal(mf.version,first);
 const res=await fetch(result.qaOrigin+'/api/football/today?version='+first);
 assert.equal(res.status,200);assert.equal(res.headers.get('X-Football-Version'),first);
 const body=await res.json();assert.equal(body.matches.length,1);
 assert.match(body.matches[0].league,/SYNTHETIC QA/);
 const etag=res.headers.get('ETag');
 const conditional=await fetch(result.qaOrigin+'/api/football/today?version='+first,{headers:{'If-None-Match':etag}});
 assert.equal(conditional.status,304);result.checks.versionPinnedAndEtag=true;
 const edited=await endpoint('/api/admin/update-odds',{expectedGeneration:1,sourceManifest:draft.sourceManifest,
  updates:[{fixtureId:'qa-20261022-001',currentBodyOdds:'1-30'}]},{key:'synthetic-evening-update'});
 const night=(await endpoint('/api/admin/draft?version='+edited.version)).resources;
 assert.equal(night['data/odds/'+day+'.json'].matches[0].bodyOdds,'1-40');
 assert.equal(night['data/odds/'+day+'.json'].matches[0].currentBodyOdds,'1-30');
 await endpoint('/api/admin/validate',{version:edited.version,review},{key:'synthetic-validate-evening'});
 const secondPub=await endpoint('/api/admin/publish',{version:edited.version,expectedGeneration:1},{key:'synthetic-publish-evening'});
 assert.equal(secondPub.generation,2);result.checks.eveningOddsPreservesOpening=true;
 const rollback=await endpoint('/api/admin/rollback',{version:first,expectedGeneration:2},{key:'synthetic-rollback'});
 assert.equal(rollback.generation,3);const mfAfter=await endpoint('/api/football/manifest');
 assert.equal(mfAfter.version,first);result.checks.rollbackRestoresOriginal=true;
 const brandBlock=await fetch(result.qaOrigin+'/api/football/news?brand=bw-sport');
 assert.equal(brandBlock.status,404);result.checks.brandNewsRestriction=true;
 assert.deepEqual(await deployments(),ids);result.checks.noBuildDuringDataUpdates=true;
 result.checks.privateApiUnauthenticatedBlocked=true;
 result.finalVersion=first;result.finalGeneration=3;result.qaPublishedSynthetic=true;
 result.realFootballPublished=false;result.success=true;result.completedAt=new Date().toISOString();save();
 console.log(JSON.stringify({success:true,qaOrigin:result.qaOrigin,synthetic:true,
   noBuildDuringDataUpdates:true,importValidatePublishEveningRollback:true,productionModified:false}));
}catch(e){result.success=false;result.error=cleanError(e);save();console.error(result.error);process.exitCode=1;}
finally{rmSync(scratch,{recursive:true,force:true});}
