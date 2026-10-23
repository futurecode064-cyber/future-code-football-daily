import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker from '../src/worker.mjs';
import {validateResources,yangonDate} from '../src/validation.mjs';
class D1 {
 constructor(){this.sql=new DatabaseSync(':memory:');for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())this.sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));}
 prepare(query){const db=this;return {args:[],bind(...args){this.args=args;return this;},async first(){return db.sql.prepare(query).get(...this.args)||null;},async all(){return {results:db.sql.prepare(query).all(...this.args)};},async run(){const result=db.sql.prepare(query).run(...this.args);return {meta:{changes:Number(result.changes)}};}};}
 async batch(ops){this.sql.exec('BEGIN');try{const result=[];for(const op of ops)result.push(await op.run());this.sql.exec('COMMIT');return result;}catch(e){this.sql.exec('ROLLBACK');throw e;}}
}
const token='test-token-for-isolated-tests-only-123456789';
const origin='https://future-code-football-daily.pages.dev';
const env=()=>({DB:new D1(),ADMIN_TOKEN:token,ADMIN_RATE_LIMITER:{limit:async()=>({success:true})},ALLOWED_ORIGINS:origin,ENVIRONMENT:'test'});
const review=Object.fromEntries(['pdfFidelity','fixtureIdentity','editorial','formsAndOdds','results','newsScopeAndImages','allBrands','downloads','mobile'].map(k=>[k,{passed:true,evidence:'Isolated synthetic fixture test; not production QA'}]));
const day='2026-10-22';
function resources(){const m={fixtureId:'match-1',home:'Home',away:'Away',homeDisplay:'အိမ်',awayDisplay:'ဧည့်',league:'Test League',kickoffYangon:'ည ၇ နာရီ',fixtureSourceUrl:'https://example.org/fixture',previewJournalist:{status:'owner_approved_published'},myanmarOdds:{upperTeam:'အိမ်',bodyOdds:'1-40',goalTotalOdds:'3='},dailyPreviewText:'ဘောလုံးစမ်းသပ်စာမူဖြစ်ပါသည်။'.repeat(20)+' **အိမ် ကို ရွေးချယ်ပါတယ်။**',homeLastFive:Array(5).fill({result:'W',sourceUrl:'https://example.org/form'}),awayLastFive:Array(5).fill({result:'D',sourceUrl:'https://example.org/form'}),nightEditorialDate:day,kickoffCalendarDate:day};return {'data/today.json':{reportDate:day,published:true,matchDateTimezone:'Asia/Yangon',noFixturesLeagues:[],matches:[m]},[`data/odds/${day}.json`]:{reportDate:day,matches:[{fixtureId:m.fixtureId,pdfRow:1,home:m.homeDisplay,away:m.awayDisplay,canonicalHome:m.home,canonicalAway:m.away,league:m.league,upperTeam:m.homeDisplay,kickoffDisplay:'22 Oct 19:00',bodyOdds:'1-40',goalTotalOdds:'3=',currentBodyOdds:'',currentGoalTotalOdds:''}]},'data/news/latest.json':{date:'2026-10-21',items:[]}};}
const bundle=(generation=0)=>({editorialDate:day,expectedGeneration:generation,sourceManifest:{files:[{name:'synthetic-test.json',sha256:'a'.repeat(64)}]},resources:resources()});
async function call(e,path,{body,auth=true,key='key-1',headers={},method}={}){return worker.fetch(new Request('https://engine.example'+path,{method:method||(body?'POST':'GET'),headers:{...(auth?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json','Idempotency-Key':key}:{}),...headers},body:body?JSON.stringify(body):undefined}),e);}
async function draft(e,b=bundle(),key='key-1'){const r=await call(e,'/api/admin/import',{body:b,key});assert.equal(r.status,201,await r.clone().text());return (await r.json()).version;}
async function validate(e,id){const r=await call(e,'/api/admin/validate',{body:{version:id,review}});assert.equal(r.status,200,await r.clone().text());}
async function publish(e,id,generation=0){return call(e,'/api/admin/publish',{body:{version:id,expectedGeneration:generation}});}
test('schema, immutable draft, validation, atomic activation, same version and conditional GET',async()=>{const e=env(),id=await draft(e);assert.equal((await call(e,'/api/football/today')).status,503);assert.equal((await call(e,`/api/football/today?version=${id}`)).status,503);assert.equal((await publish(e,id)).status,422);await validate(e,id);assert.equal((await publish(e,id)).status,200);const manifest=await (await call(e,'/api/football/manifest')).json();assert.equal(manifest.version,id);for(const p of ['data/today.json',`data/odds/${day}.json`]){const r=await call(e,`/api/football/resource?path=${p}&version=${id}`);assert.equal(r.headers.get('X-Football-Version'),id);assert.equal(r.status,200);assert.equal((await call(e,`/api/football/resource?path=${p}&version=${id}`,{headers:{'If-None-Match':r.headers.get('ETag')}})).status,304);}assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM audit_logs WHERE action=\'activate\'').get().n,1);});
test('idempotent imports survive publication retries and reject changed payload',async()=>{const e=env(),b=bundle(),id=await draft(e,b);assert.equal((await (await call(e,'/api/admin/import',{body:b})).json()).version,id);await validate(e,id);await publish(e,id);assert.equal((await (await call(e,'/api/admin/import',{body:b})).json()).version,id);b.resources['data/today.json'].matches[0].home='wrong';assert.equal((await call(e,'/api/admin/import',{body:b})).status,409);});
test('two drafts cannot overwrite a newer publication; ABA rollback generations remain monotonic',async()=>{const e=env(),a=await draft(e),b=await draft(e,bundle(),'key-2');await validate(e,a);await validate(e,b);await publish(e,a);assert.equal((await publish(e,b)).status,409);const c=await draft(e,bundle(1),'key-3');await validate(e,c);await publish(e,c,1);const roll=await call(e,'/api/admin/rollback',{body:{version:a,expectedGeneration:2}});assert.equal(roll.status,200);assert.equal((await roll.json()).generation,3);assert.equal((await publish(e,b,0)).status,409);assert.equal((await call(e,'/api/admin/rollback',{body:{version:b,expectedGeneration:3}})).status,422);});
test('partial imports inherit news and archives; chunked initial migration retains earlier draft resources',async()=>{const e=env(),first=bundle();first.resources['data/archive/2026-10-21.json']={reportDate:'2026-10-21',published:true,matches:[]};const a=await draft(e,first);const second=bundle();second.baseDraft=a;second.resources={'data/archive/2026-10-20.json':{reportDate:'2026-10-20',matches:[]}};const b=await draft(e,second,'chunk-2');await validate(e,b);await publish(e,b);const next=bundle(1);delete next.resources['data/news/latest.json'];const c=await draft(e,next,'next');await validate(e,c);await publish(e,c,1);for(const path of ['data/archive/2026-10-20.json','data/archive/2026-10-21.json','data/news/latest.json'])assert.equal((await call(e,'/api/football/resource?path='+path)).status,200);});
test('wrong PDF mapping, order, dates and incomplete manual QA block publication',async()=>{const e=env(),b=bundle();b.resources[`data/odds/${day}.json`].matches[0].canonicalHome='WRONG';const id=await draft(e,b);assert.equal((await call(e,'/api/admin/validate',{body:{version:id,review}})).status,422);assert.equal((await publish(e,id)).status,422);const good=await draft(e,bundle(),'good');assert.equal((await call(e,'/api/admin/validate',{body:{version:good,review:{}}})).status,422);const r=resources();r[`data/odds/${day}.json`].matches[0].pdfRow=2;assert.ok(validateResources(r,day).length);});
test('unauthorized, CSRF, wrong method, missing secret and rate limiter fail closed',async()=>{const e=env();assert.equal((await call(e,'/api/admin/state',{auth:false})).status,401);assert.equal((await call(e,'/api/admin/import',{body:bundle(),headers:{Origin:'https://evil.test'}})).status,403);assert.equal((await call(e,'/api/admin/import')).status,405);delete e.ADMIN_TOKEN;assert.equal((await call(e,'/api/admin/state')).status,503);e.ADMIN_TOKEN=token;delete e.ADMIN_RATE_LIMITER;assert.equal((await call(e,'/api/admin/state')).status,503);e.ADMIN_RATE_LIMITER={limit:async()=>({success:false})};assert.equal((await call(e,'/api/admin/state')).status,429);});
test('private source ledgers cannot leak; unvalidated drafts stay private after initial publication',async()=>{const e=env(),id=await draft(e);await validate(e,id);await publish(e,id);const hidden=await draft(e,bundle(1),'hidden');assert.equal((await call(e,`/api/football/today?version=${hidden}`,{auth:false})).status,404);assert.equal((await call(e,'/api/football/resource?path=data/research/private.json',{auth:false})).status,400);assert.equal((await call(e,'/api/football/news?brand=bw-sport',{auth:false})).status,404);});
test('transaction rolls back pointer AND audit on trigger failure',async()=>{const e=env(),id=await draft(e);await assert.rejects(e.DB.batch([e.DB.prepare('UPDATE active_publication SET version_id=?,generation=generation+1 WHERE singleton=1').bind(id)]));assert.equal((await e.DB.prepare('SELECT version_id FROM active_publication').first()).version_id,null);assert.equal((await e.DB.prepare('SELECT count(*) n FROM audit_logs WHERE action=\'activate\'').first()).n,0);});
test('Yangon midnight conversion, malformed JSON and oversized bodies',async()=>{assert.equal(yangonDate(new Date('2026-10-21T17:29:59Z')),'2026-10-21');assert.equal(yangonDate(new Date('2026-10-21T17:30:00Z')),'2026-10-22');const e=env();assert.equal((await call(e,'/api/admin/import',{body:{padding:'x'.repeat(1500001)}})).status,413);const response=await worker.fetch(new Request('https://engine.example/api/admin/import',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'broken json'}),e);assert.equal(response.status,400);});
test('evening update cannot change opening odds or news; missing current price remains blank',async()=>{const e=env(),id=await draft(e);await validate(e,id);await publish(e,id);const b={expectedGeneration:1,sourceManifest:bundle().sourceManifest,updates:[{fixtureId:'match-1',currentBodyOdds:'1-30'}]};const response=await call(e,'/api/admin/update-odds',{body:b,key:'evening'});assert.equal(response.status,201,await response.clone().text());const next=(await response.json()).version;const state=await (await call(e,'/api/admin/draft?version='+next)).json(),o=state.resources[`data/odds/${day}.json`].matches[0];assert.equal(o.bodyOdds,'1-40');assert.equal(o.goalTotalOdds,'3=');assert.equal(o.currentBodyOdds,'1-30');assert.equal(o.currentGoalTotalOdds,'');assert.equal(state.resources[`data/odds/evening/${day}.json`].matches[0].kickoffDisplay,'22 Oct 19:00');assert.deepEqual(state.resources['data/news/latest.json'],resources()['data/news/latest.json']);b.updates[0].bodyOdds='WRONG';assert.equal((await call(e,'/api/admin/update-odds',{body:b,key:'bad-odds'})).status,400);});
test('existing repository data migrates across batches without changing any JSON value or exposing a draft',async()=>{const {mkdtempSync,readdirSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');const {resolve}=await import('node:path');const root=resolve(new URL('../../../',import.meta.url).pathname),folder=mkdtempSync(tmpdir()+'/fc-migration-');try{execFileSync(process.execPath,[root+'/scripts/football/prepare-migration.mjs',root+'/football-daily',folder]);const e=env();let version,count=0;const expected={};for(const file of readdirSync(folder).filter(x=>x.startsWith('batch-')).sort()){const b=JSON.parse(readFileSync(folder+'/'+file,'utf8'));if(version)b.baseDraft=version;Object.assign(expected,b.resources);version=await draft(e,b,'real-batch-'+(++count));}const loaded=await (await call(e,'/api/admin/draft?version='+version)).json();assert.deepEqual(loaded.resources,expected);assert.ok(Object.keys(expected).length>=30);assert.deepEqual(validateResources(loaded.resources,loaded.version.editorial_date,{migration:true}),[]);assert.equal((await call(e,'/api/football/today',{auth:false})).status,503);assert.equal((await e.DB.prepare('SELECT version_id FROM active_publication').first()).version_id,null);}finally{rmSync(folder,{recursive:true,force:true});}});

test('unchanged archives and reports share content blobs across immutable versions',async()=>{
 const e=env(),a=await draft(e);await validate(e,a);await publish(e,a);
 const before=e.DB.sql.prepare('SELECT count(*) n FROM resource_blobs').get().n;
 const b=await draft(e,bundle(1),'same-resources');
 assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM resource_blobs').get().n,before);
 const loaded=await (await call(e,'/api/admin/draft?version='+b)).json();
 assert.deepEqual(loaded.resources,resources());
 const update={expectedGeneration:1,sourceManifest:bundle().sourceManifest,updates:[{fixtureId:'match-1',currentBodyOdds:'1-20'}]};
 assert.equal((await call(e,'/api/admin/update-odds',{body:update,key:'dedup-update'})).status,201);
 assert.equal(e.DB.sql.prepare('SELECT count(*) n FROM resource_blobs').get().n,before+3);
 assert.deepEqual(await (await call(e,'/api/football/today?version='+a)).json(),resources()['data/today.json']);
});
test('private backup export retains source and review, and never becomes a public endpoint',async()=>{
 const e=env(),id=await draft(e);await validate(e,id);await publish(e,id);
 assert.equal((await call(e,'/api/admin/export',{auth:false})).status,401);
 assert.equal((await call(e,'/api/football/export',{auth:false})).status,404);
 const r=await call(e,'/api/admin/export'),b=await r.json();
 assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal(b.kind,'football-publication-backup');
 assert.equal(b.version.id,id);assert.equal(b.active.generation,1);assert.deepEqual(b.resources,resources());
 assert.deepEqual(JSON.parse(b.version.source_manifest),bundle().sourceManifest);
 assert.deepEqual(JSON.parse(b.review.evidence),review);
});
test('deduplication migration preserves a populated legacy database and resource bytes',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../migrations/0001_snapshots.sql',import.meta.url),'utf8'));
 db.prepare('INSERT INTO publication_versions(id,editorial_date,idempotency_key,input_hash,source_manifest,created_at) VALUES(?,?,?,?,?,?)').run('old',day,'old-key','hash','{}','date');
 const body='{"matches": [], "reportDate": "2026-10-22"}';
 db.prepare('INSERT INTO resources(version_id,path,body,digest) VALUES(?,?,?,?)').run('old','data/today.json',body,'same-digest');
 db.exec(readFileSync(new URL('../migrations/0002_deduplicate_resources.sql',import.meta.url),'utf8'));
 assert.equal(db.prepare('SELECT body FROM resources WHERE version_id=?').get('old').body,body);
 assert.equal(db.prepare('SELECT count(*) n FROM resource_refs').get().n,1);db.close();
});

test('immutable public edge cache avoids D1 reads while drafts, manifests and brand restrictions stay private',async()=>{
 const old=globalThis.caches,items=new Map();globalThis.caches={default:{async match(k){return items.get(k.url)?.clone();},async put(k,r){items.set(k.url,r.clone());}}};
 try{
  const e=env(),id=await draft(e);const url='/api/football/resource?path=data/today.json&version='+id;
  assert.equal((await call(e,url,{auth:false})).status,503);assert.equal(items.size,0);
  await validate(e,id);await publish(e,id);
  const r=await call(e,url,{auth:false});assert.equal(r.status,200);assert.equal(items.size,1);
  const normal=e.DB.prepare;e.DB.prepare=()=>{throw Error('Cache hit must avoid database');};
  const hit=await call(e,url,{auth:false});assert.equal(hit.status,200);assert.deepEqual(await hit.json(),resources()['data/today.json']);
  assert.equal((await call(e,url,{auth:false,headers:{'If-None-Match':r.headers.get('ETag')}})).status,304);
  const head=await call(e,url,{auth:false,method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal((await call(e,'/api/football/manifest',{auth:false})).status,503);
  e.DB.prepare=normal;
  await call(e,'/api/football/resource?path=data/news/latest.json&version='+id+'&brand=main',{auth:false});
  assert.equal((await call(e,'/api/football/resource?path=data/news/latest.json&version='+id+'&brand=bw-sport',{auth:false})).status,404);
 }finally{if(old===undefined)delete globalThis.caches;else globalThis.caches=old;}
});

test('server structural receipts block bad inherited archives without re-parsing full historical bodies',async()=>{
 const e=env(),b=bundle();b.resources['data/archive/2026-10-21.json']={reportDate:'2026-10-20',matches:[]};const id=await draft(e,b);
 const result=await call(e,'/api/admin/validate',{body:{version:id,review}});assert.equal(result.status,422);assert.match((await result.json()).errors.join(' '),/path\/date mismatch/);
 const fixed=bundle();fixed.resources['data/archive/2026-10-21.json']={reportDate:'2026-10-21',matches:[]};const good=await draft(e,fixed,'fixed');await validate(e,good);await publish(e,good);
 e.DB.sql.prepare('UPDATE resource_blobs SET structural_revision=0 WHERE digest IN (SELECT digest FROM resource_refs WHERE version_id=? AND path=?)').run(good,'data/archive/2026-10-21.json');
 const next=await draft(e,bundle(1),'next-receipt');const missing=await call(e,'/api/admin/validate',{body:{version:next,review}});assert.equal(missing.status,422);assert.match((await missing.json()).errors.join(' '),/Reimport resource/);
});

test('small private metadata/resource exports retain exact immutable bytes and reject anonymous requests',async()=>{
 const e=env(),id=await draft(e);const path='/api/admin/resource?version='+id+'&path=data/today.json';assert.equal((await call(e,path,{auth:false})).status,401);
 const meta=await (await call(e,'/api/admin/export?version='+id+'&metadata=1')).json();assert.equal(meta.resources,undefined);assert.equal(meta.resourceManifest.length,3);
 const r=await call(e,path);assert.equal(r.status,200);assert.equal(r.headers.get('X-Football-Version'),id);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.deepEqual(await r.json(),resources()['data/today.json']);
 assert.equal((await call(e,'/api/admin/resource?version='+id+'&path=data/research/private.json')).status,400);
});
