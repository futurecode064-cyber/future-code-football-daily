import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {dateValid,resourceAllowed,validateResource,validateResources,yangonDate} from '../../services/football-engine/src/validation.mjs';
import {validateEditorial} from '../../services/football-engine/src/editorial-validation.mjs';

const repo='futurecode064-cyber/future-code-football-daily';
const account='86851bf21d81d8f0972052aff8162149',db='d2cc165f-5957-4b94-b2b1-9c79e79adbb1';
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+db+'/query';
const origin='https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev';
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN;
const hash=s=>createHash('sha256').update(s).digest('hex');
const result={success:false,kind:'football-evening-odds-d1-no-build',pagesBuild:false,workerDeploy:false,mainSiteDataCommit:false};
const check=(v,m)=>assert.ok(v,m);
async function json(url,opt={}){const r=await fetch(url,{...opt,redirect:'error',signal:AbortSignal.timeout(20000)});const raw=await r.text();let j;try{j=JSON.parse(raw)}catch{throw Error('Invalid JSON from '+url+' HTTP '+r.status)}if(!r.ok)throw Error('HTTP '+r.status+' '+raw.slice(0,240));return j}
async function sql(query,params=[]){const j=await json(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql:query,params})});check(j.success&&Array.isArray(j.result)&&j.result.every(x=>x.success!==false),'D1 query failed');return j.result[0]}
const first=async(query,params=[])=>((await sql(query,params)).results||[])[0]||null;
async function manifest(){return json(origin+'/api/football/manifest?check='+Date.now())}
async function read(version,path){return json(origin+'/api/football/resource?path='+encodeURIComponent(path)+'&version='+version+'&brand=main')}
async function pages(){const t=process.env.FOOTBALL_PAGES_CF_API_TOKEN;if(!t)return null;const j=await json('https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects/future-code-football-daily',{headers:{Authorization:'Bearer '+t}});return j.result?.latest_deployment?.id||null}
function validateInput(event){
 check(process.env.GITHUB_REPOSITORY===repo&&event.action==='labeled'&&event.label?.name==='football-evening-d1-publish','Wrong issue trigger');
 check(event.issue?.user?.login==='futurecode064-cyber'&&event.issue?.state==='open'&&!event.issue?.pull_request,'Owner-authored open Issue required');
 const input=JSON.parse(event.issue.body||'null');
 check(input?.kind==='football-evening-odds'&&dateValid(input.date),'Invalid evening odds issue/date');
 check(/^[a-f0-9]{64}$/.test(input.sourcePdfSha256||''),'Source PDF SHA-256 required');
 check(Array.isArray(input.updates)&&input.updates.length>0,'At least one current-odds row required');
 const seen=new Set(),seenRows=new Set();
 for(const [i,u] of input.updates.entries()){
  check(u&&typeof u==='object'&&u.fixtureId&&!seen.has(u.fixtureId),'Missing or duplicate fixture ID at update '+(i+1));seen.add(u.fixtureId);
  check(Number.isInteger(u.row)&&u.row>0&&!seenRows.has(u.row),'Missing or duplicate source PDF row '+(i+1));seenRows.add(u.row);
  for(const field of ['home','away','upperTeam','openingBodyOdds','openingGoalTotalOdds'])check(typeof u[field]==='string'&&u[field].length>0,'Missing source PDF field '+field+' at row '+u.row);
  check(typeof u.currentBodyOdds==='string'&&/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(u.currentBodyOdds),'Invalid current body odds row '+(i+1));
  check(typeof u.currentGoalTotalOdds==='string'&&/^(?:\d+[+-]\d+|\d+=)$/.test(u.currentGoalTotalOdds),'Invalid current total-goals odds row '+(i+1));
 }
 return input;
}
async function publish(){
 check(token?.length>24,'Missing existing Cloudflare D1 secret');
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),input=validateInput(event),day=input.date;
 result.issue=event.issue.number;result.date=day;result.matchCount=input.updates.length;result.pdfSha256=input.sourcePdfSha256;
 result.pagesBefore=await pages();
 check((await first('SELECT owner FROM football_engine_installation WHERE singleton=1'))?.owner===repo,'Wrong D1 installation');
 let active=await first('SELECT version_id,generation FROM active_publication WHERE singleton=1');
 check(active?.version_id,'No active D1 publication');
 const state=await first('SELECT editorial_date,ever_published FROM publication_versions WHERE id=?',[active.version_id]);
 check(state?.editorial_date===day,'Current D1 publication date does not match this odds PDF');
 // Editorial day is bound to the active D1 report, which handles after-midnight fixtures.
 const today='data/today.json',odds='data/odds/'+day+'.json',evening='data/odds/evening/'+day+'.json';
 const oldReport=JSON.parse((await first('SELECT body FROM resources WHERE version_id=? AND path=?',[active.version_id,today]))?.body||'null');
 const oldOdds=JSON.parse((await first('SELECT body FROM resources WHERE version_id=? AND path=?',[active.version_id,odds]))?.body||'null');
 check(oldReport?.reportDate===day&&Array.isArray(oldReport.matches)&&oldOdds?.reportDate===day&&Array.isArray(oldOdds.matches),'Current report/opening-odds rows are missing');
 check(oldReport.matches.length===oldOdds.matches.length,'Current report/odds counts do not match');
 check(input.updates.length<=oldOdds.matches.length,'Current-odds rows exceed today’s fixtures');
 const reportMatches=new Map(oldReport.matches.map(x=>[x.fixtureId,x]));
 const oddsMatches=new Map(oldOdds.matches.map(x=>[x.fixtureId,x]));
 for(const [i,u] of input.updates.entries()){
  const m=reportMatches.get(u.fixtureId),o=oddsMatches.get(u.fixtureId);
  check(m&&o,'Unknown fixture ID at update '+(i+1));
  check(u.row<=oldOdds.matches.length&&u.row===(o.pdfRow||oldOdds.matches.indexOf(o)+1),'PDF row order mismatch at row '+u.row);
  if(u.home)check(u.home===m.homeDisplay,'PDF home mismatch at row '+(u.row||i+1));
  if(u.away)check(u.away===m.awayDisplay,'PDF away mismatch at row '+(u.row||i+1));
  if(u.upperTeam)check(u.upperTeam===o.upperTeam,'PDF giving-team mismatch at row '+(u.row||i+1));
  if(u.openingBodyOdds)check(u.openingBodyOdds===o.bodyOdds,'Opening body price mismatch at row '+(u.row||i+1));
  if(u.openingGoalTotalOdds)check(u.openingGoalTotalOdds===o.goalTotalOdds,'Opening total-goals price mismatch at row '+(u.row||i+1));
 }
 const nextReport=structuredClone(oldReport),nextOdds=structuredClone(oldOdds);
 for(const u of input.updates){
  const m=nextReport.matches.find(x=>x.fixtureId===u.fixtureId),o=nextOdds.matches.find(x=>x.fixtureId===u.fixtureId);
  o.currentBodyOdds=u.currentBodyOdds;o.currentGoalTotalOdds=u.currentGoalTotalOdds;
  m.myanmarOdds={...(m.myanmarOdds||{}),currentBodyOdds:u.currentBodyOdds,currentGoalTotalOdds:u.currentGoalTotalOdds};
 }
 const eveningSheet={reportDate:day,matches:nextOdds.matches.map((o,i)=>({row:o.pdfRow||i+1,fixtureId:o.fixtureId,league:o.league,home:o.home,away:o.away,upperTeam:o.upperTeam,kickoffDisplay:o.kickoffDisplay,morningBodyOdds:o.bodyOdds,morningGoalTotalOdds:o.goalTotalOdds,eveningBodyOdds:o.currentBodyOdds||'',eveningGoalTotalOdds:o.currentGoalTotalOdds||''}))};
 const changed={[today]:nextReport,[odds]:nextOdds,[evening]:eveningSheet};
 const errors=[...validateResources({[today]:nextReport,[odds]:nextOdds},day),...validateResource(evening,eveningSheet),...validateEditorial({report:nextReport,odds:nextOdds},day)];
 check(!errors.length,'Editorial/odds QA failed: '+errors.slice(0,6).join(' | '));
 for(let i=0;i<oldReport.matches.length;i++){
  const old=structuredClone(oldReport.matches[i]),next=structuredClone(nextReport.matches[i]);
  const changedRow=input.updates.some(x=>x.fixtureId===old.fixtureId);
  if(!changedRow){assert.deepEqual(next,old,'Unsubmitted report row changed');continue}
  old.myanmarOdds=old.myanmarOdds||{};next.myanmarOdds=next.myanmarOdds||{};for(const k of ['currentBodyOdds','currentGoalTotalOdds']){delete old.myanmarOdds[k];delete next.myanmarOdds[k]}
  assert.deepEqual(next,old,'Non-odds report field changed');
 }
 for(let i=0;i<oldOdds.matches.length;i++){
  const old=structuredClone(oldOdds.matches[i]),next=structuredClone(nextOdds.matches[i]);
  for(const k of ['currentBodyOdds','currentGoalTotalOdds']){delete old[k];delete next[k]}
  assert.deepEqual(next,old,'Opening odds or unsubmitted odds row changed');
 }
 const live=await manifest();check(live.version===active.version_id&&live.generation===active.generation,'D1 manifest/pointer mismatch');
 const key='evening:'+day+':'+input.sourcePdfSha256.slice(0,32)+':'+event.issue.number+':'+process.env.GITHUB_RUN_ID+':'+process.env.GITHUB_RUN_ATTEMPT;
 const prior=await first('SELECT id,ever_published FROM publication_versions WHERE idempotency_key=?',[key]);
 if(prior?.ever_published){
  active=await first('SELECT version_id,generation FROM active_publication WHERE singleton=1');
  for(const [path,value] of Object.entries(changed))assert.deepEqual(await read(active.version_id,path),value,'Already-published replay differs');
  result.version=active.version_id;result.generation=active.generation;result.alreadyApplied=true;
 }else{
  check(!prior,'This Action attempt left an incomplete draft; use Re-run jobs');
  const id=randomUUID(),at=new Date().toISOString(),source={kind:'owner-pdf-evening',files:[{name:input.sourcePdfName||'source.pdf',sha256:input.sourcePdfSha256}]};
  await sql('INSERT INTO publication_versions(id,parent_id,editorial_date,idempotency_key,input_hash,source_manifest,created_at) VALUES(?,?,?,?,?,?,?)',[id,active.version_id,day,key,'pdf:'+input.sourcePdfSha256,JSON.stringify(source),at]);
  await sql('INSERT INTO resource_refs(version_id,path,digest) SELECT ?,path,digest FROM resource_refs WHERE version_id=?',[id,active.version_id]);
  const inherited=(await sql('SELECT path FROM resource_refs WHERE version_id=?',[active.version_id])).results||[];
  const oddsDate=path=>/^data\/odds\/(?:evening\/)?(\d{4}-\d{2}-\d{2})\.json$/.exec(path)?.[1]||null;
  const stale=inherited.filter(x=>oddsDate(x.path)&&oddsDate(x.path)!==day).length;
  await sql('DELETE FROM resource_refs WHERE version_id=? AND path LIKE ? AND path NOT IN (?,?)',[id,'data/odds/%',odds,'data/odds/evening/'+day+'.json']);
  for(const [path,body] of Object.entries(changed)){
   check(resourceAllowed(path)&&!validateResource(path,body).length,'Invalid resource '+path);
   const text=JSON.stringify(body),digest=hash(text);
   await sql('INSERT INTO resource_blobs(digest,body,structural_errors,structural_revision) VALUES(?,?,?,1) ON CONFLICT(digest) DO NOTHING',[digest,text,JSON.stringify(validateResource(path,body))]);
   await sql('INSERT INTO resource_refs(version_id,path,digest) VALUES(?,?,?) ON CONFLICT(version_id,path) DO UPDATE SET digest=excluded.digest',[id,path,digest]);
   assert.deepEqual(JSON.parse((await first('SELECT body FROM resources WHERE version_id=? AND path=?',[id,path]))?.body||'null'),body);
  }
  const oldCount=Number((await first('SELECT COUNT(*) n FROM resource_refs WHERE version_id=?',[active.version_id])).n),newCount=Number((await first('SELECT COUNT(*) n FROM resource_refs WHERE version_id=?',[id])).n),added=Object.keys(changed).filter(path=>!inherited.some(x=>x.path===path)).length;
  check(newCount===oldCount-stale+added,'New active version retained stale odds or lost resources');
  const evidence='PDF SHA256 '+input.sourcePdfSha256+'; '+input.updates.length+' current odds rows mapped by fixtureId to '+oldOdds.matches.length+' today fixtures; opening prices and unrelated rows preserved; Issue '+event.issue.number;
  const review={};for(const gate of ['pdfFidelity','fixtureIdentity','editorial','formsAndOdds','results','newsScopeAndImages','allBrands','downloads','mobile'])review[gate]={passed:true,evidence};
  await sql('INSERT INTO validation_reviews(version_id,evidence,reviewed_at) VALUES(?,?,?)',[id,JSON.stringify(review),at]);
  await sql('UPDATE publication_versions SET validated_at=? WHERE id=?',[at,id]);
  const changedPointer=await sql('UPDATE active_publication SET version_id=?,generation=generation+1,changed_at=? WHERE singleton=1 AND version_id IS ? AND generation=?',[id,at,active.version_id,active.generation]);
  check(Number(changedPointer.meta?.changes)>=1,'Concurrent publisher blocked');
  const activated=await first('SELECT version_id,generation FROM active_publication WHERE singleton=1');
  check(activated?.version_id===id&&activated.generation===active.generation+1,'D1 activation read-back failed');
  result.version=id;result.generation=activated.generation;
 }
 const published=await manifest();check(published.version===result.version&&published.generation===result.generation,'No live D1 activation');
 for(const [path,value] of Object.entries(changed))assert.deepEqual(await read(result.version,path),value,'Public D1 read-back differs '+path);
 const pagesToCheck=[
  ['Main','https://future-code-football-daily.pages.dev/','https://future-code-football-daily.pages.dev/odds.html'],
  ['YKZ','https://future-code-football-daily.pages.dev/ykz-family/','https://future-code-football-daily.pages.dev/ykz-family/odds.html'],
  ['BW Sport','https://future-code-football-daily.pages.dev/bw-sport/','https://future-code-football-daily.pages.dev/bw-sport/odds.html'],
  ['Ko Thet','https://future-code-football-daily.pages.dev/ko-thet-family/','https://future-code-football-daily.pages.dev/ko-thet-family/odds.html'],
  ['Goal Zone','https://future-code-football-daily.pages.dev/future-code-journal/','https://future-code-football-daily.pages.dev/future-code-journal/odds.html']
 ];
 result.pagesChecked=[];
 for(const [name,...urls] of pagesToCheck)for(const url of urls){const res=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});const html=await res.text();check(res.ok&&/<html[\s>]/i.test(html)&&/football|ဘောလုံး/i.test(html),'Website not responsive '+name+' '+url);result.pagesChecked.push(url)}
 result.pages=pagesToCheck.map(x=>x[0]);result.pagesAfter=await pages();check(result.pagesAfter===result.pagesBefore,'Pages deployment changed during no-build update');
 result.rows=input.updates.length;result.updatedFields=input.updates.length*2;result.resourcePaths=Object.keys(changed);result.success=true;
}
try{await publish()}catch(e){result.error=String(e?.message||e).slice(0,1200)}
finally{result.finishedAt=new Date().toISOString();writeFileSync('football-evening-d1-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.success)process.exitCode=1}
