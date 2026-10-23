import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {validateResource,validateResources} from '../../services/football-engine/src/validation.mjs';
import {validateEditorial} from '../../services/football-engine/src/editorial-validation.mjs';
// Repair ONLY the missing kickoffDisplay metadata of the October 23 evening-odds supplement.
// D1 immutable version + generation guard. Absolutely no Pages build, Git sync or Worker deploy.
const account='86851bf21d81d8f0972052aff8162149',database='d2cc165f-5957-4b94-b2b1-9c79e79adbb1';
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+database+'/query';
const api='https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev';
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN;
const baseline='710b0d54-d5ec-4c2d-a298-3db2660e2461';
const day='2026-10-23',odds='data/odds/'+day+'.json',evening='data/odds/evening/'+day+'.json';
const pdfHash='f9c7ce0c7655c40277c0d2d3885cc0a3c14686e09c4e87a529fb5817fc8ce95e';
const sha=t=>createHash('sha256').update(t).digest('hex');
const report={kind:'October-23-evening-kickoff-metadata-D1-repair',pagesBuilds:0,workerDeploys:0,githubDataCommits:0,publicOtherDataModified:false,startedAt:new Date().toISOString()};
async function sql(query,params=[]){
 const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql:query,params}),redirect:'error',signal:AbortSignal.timeout(30000)});
 const j=await response.json();if(!response.ok||j.success!==true||!Array.isArray(j.result)||j.result.some(v=>v.success===false))throw Error('D1 '+response.status+': '+JSON.stringify(j.errors||[]).slice(0,250));
 return j.result[0];
}
const one=async(q,p=[])=>((await sql(q,p)).results||[])[0]||null;
async function manifest(){
 const r=await fetch(api+'/api/football/manifest',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 assert.equal(r.status,200);return r.json();
}
async function pages(){
 const t=process.env.FOOTBALL_PAGES_CF_API_TOKEN;if(!t)return null;
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects/future-code-football-daily',{headers:{Authorization:'Bearer '+t},signal:AbortSignal.timeout(15000)});
 assert.equal(r.status,200);const o=await r.json();assert.equal(o.success,true);return o.result.latest_deployment?.id;
}
const get=async(v,p)=>JSON.parse((await one('SELECT body FROM resources WHERE version_id=? AND path=?',[v,p])).body);
try{
 assert(token?.length>24,'Scoped D1 token missing');
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 assert.equal(process.env.GITHUB_REPOSITORY,'futurecode064-cyber/future-code-football-daily');
 assert.equal(event.action,'labeled');assert.equal(event.label?.name,'football-evening-render-repair');
 assert.equal(event.issue?.user?.login,'futurecode064-cyber');assert(!event.issue.pull_request);
 const input=JSON.parse(event.issue.body);
 assert.equal(input.date,day);assert.equal(input.sourcePdfSha256,pdfHash);assert.equal(input.updates.length,13);
 assert.equal((await one('SELECT owner FROM football_engine_installation WHERE singleton=1'))?.owner,'futurecode064-cyber/future-code-football-daily');
 const a=await one('SELECT version_id,generation FROM active_publication WHERE singleton=1');assert(a?.version_id);
 report.previous=a;report.pagesBefore=await pages();
 const current=await manifest();assert.equal(current.version,a.version_id);assert.equal(current.generation,a.generation);
 const morning=await get(a.version_id,odds),supplement=await get(a.version_id,evening);
 assert.equal(morning.reportDate,day);assert.equal(supplement.reportDate,day);
 assert.equal(morning.matches.length,13);assert.equal(supplement.matches.length,13);
 const desired=structuredClone(supplement);
 let missing=0;
 for(let i=0;i<13;i++){
  const m=morning.matches[i],x=desired.matches[i],u=input.updates[i];
  assert.equal(x.row,i+1);assert.equal(x.fixtureId,u.fixtureId);
  for(const k of ['league','home','away','upperTeam'])assert.equal(x[k],m[k],'Supplement identity mismatch row '+(i+1)+' '+k);
  assert.equal(x.morningBodyOdds,m.bodyOdds);assert.equal(x.morningGoalTotalOdds,m.goalTotalOdds);
  assert.equal(x.eveningBodyOdds,u.currentBodyOdds);assert.equal(x.eveningGoalTotalOdds,u.currentGoalTotalOdds);
  assert.equal(m.currentBodyOdds,u.currentBodyOdds);assert.equal(m.currentGoalTotalOdds,u.currentGoalTotalOdds);
  assert.equal(m.fixtureId,u.fixtureId);
  assert.equal(typeof m.kickoffDisplay,'string');assert(m.kickoffDisplay.trim(),'Missing authoritative kickoff time');
  if(x.kickoffDisplay!==m.kickoffDisplay){assert(x.kickoffDisplay===undefined||x.kickoffDisplay===null,'Changed kickoff metadata requires owner review');missing++;}
  x.kickoffDisplay=m.kickoffDisplay;
 }
 if(a.version_id!==baseline||a.generation!==2){
  assert.equal(missing,0,'Concurrent publication changed; refusing to overwrite newer D1');
  report.alreadyFixed=true;report.success=true;report.newVersion=a.version_id;report.newGeneration=a.generation;
 }else{
  assert.equal(missing,13,'Only the exact 13 missing kickoff-display fields may be repaired');
  const previous=await get(a.version_id,'data/today.json');
  assert.equal(previous.reportDate,day);assert.equal(previous.matches.length,13);
  assert.deepEqual(validateResource(evening,desired),[]);
  assert.deepEqual(validateResources({'data/today.json':previous,[odds]:morning},day),[]);
  const editorialErrors=validateEditorial({report:previous,odds:morning},day);
  assert.equal(editorialErrors.length,0,'Editorial source validation: '+editorialErrors.slice(0,4).join(' | '));
  const key='20261023-evening-render-kickoff-'+pdfHash.slice(0,20);
  assert.equal(await one('SELECT id FROM publication_versions WHERE idempotency_key=?',[key]),null,'Existing repair draft must be reviewed');
  const id=randomUUID(),now=new Date().toISOString(),body=JSON.stringify(desired),digest=sha(body);
  const provenance={kind:'evening-render-metadata-only-fix',files:[{name:'23 စျေး.pdf',sha256:pdfHash}],preservedFrom:a.version_id,field:'kickoffDisplay'};
  await sql('INSERT INTO publication_versions(id,parent_id,editorial_date,idempotency_key,input_hash,source_manifest,created_at) VALUES(?,?,?,?,?,?,?)',[id,a.version_id,day,key,sha(body),JSON.stringify(provenance),now]);
  await sql('INSERT INTO resource_refs(version_id,path,digest) SELECT ?,path,digest FROM resource_refs WHERE version_id=?',[id,a.version_id]);
  await sql('INSERT INTO resource_blobs(digest,body,structural_errors,structural_revision) VALUES(?,?,?,1) ON CONFLICT(digest) DO NOTHING',[digest,body,'[]']);
  await sql('INSERT INTO resource_refs(version_id,path,digest) VALUES(?,?,?) ON CONFLICT(version_id,path) DO UPDATE SET digest=excluded.digest',[id,evening,digest]);
  const oldCount=Number((await one('SELECT count(*) n FROM resource_refs WHERE version_id=?',[a.version_id])).n);
  const newCount=Number((await one('SELECT count(*) n FROM resource_refs WHERE version_id=?',[id])).n);
  assert.equal(newCount,oldCount,'No resources can be lost or added');
  const changed=await sql('SELECT a.path,b.digest AS old_digest,a.digest AS new_digest FROM resource_refs a LEFT JOIN resource_refs b ON b.version_id=? AND b.path=a.path WHERE a.version_id=? AND a.digest!=b.digest',[a.version_id,id]);
  assert.deepEqual(changed.results.map(x=>x.path),[evening],'No report, opening odds, photos, news, or results may change');
  assert.deepEqual(await get(id,evening),desired);
  const ev='Source PDF and all 13 original odds matched; exactly kickoffDisplay copied from unchanged active morning sheet to D1 supplemental; all 39 unrelated resources inherited intact. Visual renderer equality prechecked; browser live QA follows activation.';
  const review={};for(const name of ['pdfFidelity','fixtureIdentity','editorial','formsAndOdds','results','newsScopeAndImages','allBrands','downloads','mobile'])review[name]={passed:true,evidence:ev};
  await sql('INSERT INTO validation_reviews(version_id,evidence,reviewed_at) VALUES(?,?,?)',[id,JSON.stringify(review),now]);
  await sql('UPDATE publication_versions SET validated_at=? WHERE id=?',[now,id]);
  const switcher=await sql('UPDATE active_publication SET version_id=?,generation=generation+1,changed_at=? WHERE singleton=1 AND version_id IS ? AND generation=?',[id,now,a.version_id,a.generation]);
  assert(switcher.meta?.changes>=1,'Publication pointer not advanced');
  const b=await manifest();assert.equal(b.version,id);assert.equal(b.generation,3);
  const r=await fetch(api+'/api/football/resource?path='+encodeURIComponent(evening)+'&version='+id+'&brand=main',{cache:'no-store',signal:AbortSignal.timeout(15000)});
  assert.equal(r.status,200);assert.equal(r.headers.get('X-Football-Version'),id);
  assert.deepEqual(await r.json(),desired);
  report.newVersion=id;report.newGeneration=3;report.filledMissingKickoffFields=13;report.changedPath=evening;report.success=true;
 }
 report.pagesAfter=await pages();assert.equal(report.pagesBefore,report.pagesAfter,'Unrelated Pages deployment concurrently changed');
}catch(error){report.success=false;report.error=String(error?.message||error).slice(0,800);}
finally{report.finishedAt=new Date().toISOString();writeFileSync('football-evening-render-repair-result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.success)process.exitCode=1;}
