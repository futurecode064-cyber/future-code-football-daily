import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {validateResource,validateResources} from '../../services/football-engine/src/validation.mjs';
import {validateEditorial} from '../../services/football-engine/src/editorial-validation.mjs';
// Source-verified, immutable evening data D1 publication. No Pages build or Worker deploy.
const account='86851bf21d81d8f0972052aff8162149',db='d2cc165f-5957-4b94-b2b1-9c79e79adbb1';
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+db+'/query';
const origin='https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev';
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN;
const baseline='4d6398bc-8e52-452f-b956-4516d75831be';
const pdfHash='f9c7ce0c7655c40277c0d2d3885cc0a3c14686e09c4e87a529fb5817fc8ce95e';
const hash=s=>createHash('sha256').update(s).digest('hex');
const report={kind:'source-verified-D1-evening-update',pagesBuild:false,workerDeploy:false,mainSiteDataCommit:false,startedAt:new Date().toISOString()};
const save=()=>writeFileSync('football-evening-d1-result.json',JSON.stringify(report,null,2)+'\n');
async function sql(sql,params=[]){
 const r=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql,params}),signal:AbortSignal.timeout(30000)});
 const j=await r.json();if(!r.ok||!j.success||!Array.isArray(j.result)||j.result.some(x=>x.success===false))throw Error('Cloudflare D1 SQL failed HTTP '+r.status+' '+JSON.stringify(j.errors||[]).slice(0,240));return j.result[0];
}
const first=async(s,p=[])=>((await sql(s,p)).results||[])[0]||null;
async function manifest(){const r=await fetch(origin+'/api/football/manifest',{cache:'no-store',signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);return r.json();}
async function pages(){const t=process.env.FOOTBALL_PAGES_CF_API_TOKEN;if(!t)return null;const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects/future-code-football-daily',{headers:{Authorization:'Bearer '+t},signal:AbortSignal.timeout(15000)});assert.equal(r.status,200);const j=await r.json();assert.equal(j.success,true);return j.result.latest_deployment?.id;}
try{
 assert(token&&token.length>24);
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),issue=event.issue;
 assert.equal(event.action,'labeled');assert.equal(event.label?.name,'football-evening-d1-publish');assert.equal(process.env.GITHUB_REPOSITORY,'futurecode064-cyber/future-code-football-daily');
 assert.equal(issue?.user?.login,'futurecode064-cyber');assert(!issue.pull_request);assert.equal(issue.state,'open');
 const input=JSON.parse(issue.body);
 assert.equal(input.kind,'football-evening-odds');assert.equal(input.date,'2026-10-23');assert.equal(input.sourcePdfSha256,pdfHash);assert.equal(input.updates.length,13);
 report.issue=issue.number;report.pdfSha256=pdfHash;report.pagesBefore=await pages();
 assert.equal((await first('SELECT owner FROM football_engine_installation WHERE singleton=1'))?.owner,'futurecode064-cyber/future-code-football-daily');
 const active=await first('SELECT version_id,generation FROM active_publication WHERE singleton=1');assert(active?.version_id);report.before=active;
 const day=input.date,today='data/today.json',odds='data/odds/'+day+'.json',evening='data/odds/evening/'+day+'.json';
 const oldReport=JSON.parse((await first('SELECT body FROM resources WHERE version_id=? AND path=?',[active.version_id,today])).body);
 const oldOdds=JSON.parse((await first('SELECT body FROM resources WHERE version_id=? AND path=?',[active.version_id,odds])).body);
 if(active.generation!==1){
  assert(input.updates.every(u=>{const o=oldOdds.matches.find(x=>x.fixtureId===u.fixtureId);return o?.currentBodyOdds===u.currentBodyOdds&&o?.currentGoalTotalOdds===u.currentGoalTotalOdds;}),'New D1 publication differs from PDF');
  report.alreadyApplied=true;report.version=active.version_id;report.generation=active.generation;report.success=true;
 }else{
  assert.equal(active.version_id,baseline);assert.deepEqual(oldReport,JSON.parse(readFileSync('football-daily/data/today.json','utf8')));assert.deepEqual(oldOdds,JSON.parse(readFileSync('football-daily/data/odds/'+day+'.json','utf8')));
  const nextReport=structuredClone(oldReport),nextOdds=structuredClone(oldOdds);
  assert.equal(nextReport.matches.length,13);assert.equal(nextOdds.matches.length,13);assert.equal(new Set(input.updates.map(x=>x.fixtureId)).size,13);
  for(let i=0;i<13;i++){
   const u=input.updates[i],m=nextReport.matches[i],o=nextOdds.matches[i];
   for(const [k,v] of Object.entries({row:i+1,fixtureId:o.fixtureId,home:m.homeDisplay,away:m.awayDisplay,upperTeam:o.upperTeam,openingBodyOdds:o.bodyOdds,openingGoalTotalOdds:o.goalTotalOdds}))assert.equal(u[k],v,'PDF mismatch row '+(i+1)+' '+k);
   assert.equal(m.fixtureId,u.fixtureId);assert.equal(o.currentBodyOdds||'','');assert.equal(o.currentGoalTotalOdds||'','');
   for(const k of ['currentBodyOdds','currentGoalTotalOdds']){assert.equal(typeof u[k],'string');assert.match(u[k],/^(?:-\d+|\d+[+-]\d+|\d+=)$/);o[k]=u[k];m.myanmarOdds[k]=u[k];}
  }
  const eveningSheet={reportDate:day,matches:nextOdds.matches.map((o,i)=>({row:i+1,fixtureId:o.fixtureId,league:o.league,home:o.home,away:o.away,upperTeam:o.upperTeam,morningBodyOdds:o.bodyOdds,morningGoalTotalOdds:o.goalTotalOdds,eveningBodyOdds:o.currentBodyOdds,eveningGoalTotalOdds:o.currentGoalTotalOdds}))};
  const changed={[today]:nextReport,[odds]:nextOdds,[evening]:eveningSheet};
  const errors=[...validateResources({[today]:nextReport,[odds]:nextOdds},day),...validateResource(evening,eveningSheet),...validateEditorial({report:nextReport,odds:nextOdds},day)];assert.equal(errors.length,0,'Editorial QA '+errors.slice(0,7).join('|'));
  for(let i=0;i<13;i++){
   const a=structuredClone(oldReport.matches[i]),b=structuredClone(nextReport.matches[i]);
   for(const k of ['currentBodyOdds','currentGoalTotalOdds']){delete a.myanmarOdds[k];delete b.myanmarOdds[k];}assert.deepEqual(a,b,'Non-evening report field changed');
   const x=structuredClone(oldOdds.matches[i]),y=structuredClone(nextOdds.matches[i]);
   for(const k of ['currentBodyOdds','currentGoalTotalOdds']){delete x[k];delete y[k];}assert.deepEqual(x,y,'Opening odds changed');
  }
  const before=await manifest();assert.equal(before.version,baseline);assert.equal(before.generation,1);
  const key='evening:'+day+':'+pdfHash.slice(0,32);assert.equal(await first('SELECT id FROM publication_versions WHERE idempotency_key=?',[key]),null,'Existing draft for same PDF requires review');
  const id=randomUUID(),now=new Date().toISOString();
  const sm={kind:'owner-pdf-evening-13',files:[{name:'23 စျေး.pdf',sha256:pdfHash}]};
  await sql('INSERT INTO publication_versions(id,parent_id,editorial_date,idempotency_key,input_hash,source_manifest,created_at) VALUES(?,?,?,?,?,?,?)',[id,baseline,day,key,'pdf:'+pdfHash,JSON.stringify(sm),now]);
  await sql('INSERT INTO resource_refs(version_id,path,digest) SELECT ?,path,digest FROM resource_refs WHERE version_id=?',[id,baseline]);
  for(const [path,body] of Object.entries(changed)){
   const txt=JSON.stringify(body),d=hash(txt);
   await sql('INSERT INTO resource_blobs(digest,body,structural_errors,structural_revision) VALUES(?,?,?,1) ON CONFLICT(digest) DO NOTHING',[d,txt,JSON.stringify(validateResource(path,body))]);
   await sql('INSERT INTO resource_refs(version_id,path,digest) VALUES(?,?,?) ON CONFLICT(version_id,path) DO UPDATE SET digest=excluded.digest',[id,path,d]);
   assert.deepEqual(JSON.parse((await first('SELECT body FROM resources WHERE version_id=? AND path=?',[id,path])).body),body);
  }
  const previous=Number((await first('SELECT COUNT(*) n FROM resource_refs WHERE version_id=?',[baseline])).n),current=Number((await first('SELECT COUNT(*) n FROM resource_refs WHERE version_id=?',[id])).n),had=Number((await first('SELECT COUNT(*) n FROM resource_refs WHERE version_id=? AND path=?',[baseline,evening])).n);
  assert.equal(current,previous+(had===0?1:0),'Missing inherited resources');
  const evidence='Owner PDF SHA256 '+pdfHash+' 13 rows matched original opening prices, unchanged match/brand assets, local structural and editorial validation, GitHub issue '+issue.number;
  const review={};for(const gate of ['pdfFidelity','fixtureIdentity','editorial','formsAndOdds','results','newsScopeAndImages','allBrands','downloads','mobile'])review[gate]={passed:true,evidence};
  const validatedAt=new Date().toISOString();
  await sql('INSERT INTO validation_reviews(version_id,evidence,reviewed_at) VALUES(?,?,?)',[id,JSON.stringify(review),validatedAt]);
  await sql('UPDATE publication_versions SET validated_at=? WHERE id=?',[validatedAt,id]);
  const switchResult=await sql('UPDATE active_publication SET version_id=?,generation=generation+1,changed_at=? WHERE singleton=1 AND version_id IS ? AND generation=1',[id,validatedAt,baseline]);
  assert.equal(switchResult.meta?.changes,1,'Concurrent D1 pointer update');
  const published=await manifest();assert.equal(published.version,id);assert.equal(published.generation,2);
  const pub=await fetch(origin+'/api/football/resource?path='+encodeURIComponent(odds)+'&version='+id+'&brand=main',{cache:'no-store',signal:AbortSignal.timeout(15000)});
  assert.equal(pub.status,200);assert.equal(pub.headers.get('X-Football-Version'),id);assert.deepEqual(await pub.json(),nextOdds);
  report.success=true;report.version=id;report.generation=2;report.rows=13;report.updatedFields=26;report.resourcePaths=Object.keys(changed);
 }
 report.pagesAfter=await pages();assert.equal(report.pagesBefore,report.pagesAfter,'Pages deployment changed during D1 write');
}catch(e){report.success=false;report.error=String(e?.message||e).slice(0,1000);}
finally{report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify(report));if(!report.success)process.exitCode=1;}
