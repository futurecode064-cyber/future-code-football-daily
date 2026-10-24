import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {dateValid,resourceAllowed,validateResource,validateResources,reviewErrors,yangonDate} from '../../services/football-engine/src/validation.mjs';
import {validateEditorial} from '../../services/football-engine/src/editorial-validation.mjs';
const repo='futurecode064-cyber/future-code-football-daily',acct='86851bf21d81d8f0972052aff8162149',db='d2cc165f-5957-4b94-b2b1-9c79e79adbb1';
const query='https://api.cloudflare.com/client/v4/accounts/'+acct+'/d1/database/'+db+'/query',api='https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev';
const hash=b=>createHash('sha256').update(b).digest('hex');
const check=(v,m)=>assert.ok(v,m);
const result={success:false,kind:'football-d1-daily-no-build',pagesBuild:false,workerDeploy:false,githubDataCommit:false};
async function json(url,opt={}){const r=await fetch(url,{...opt,redirect:'error',signal:AbortSignal.timeout(30000)});const raw=await r.text();let j;try{j=JSON.parse(raw)}catch{throw Error('Invalid API JSON '+r.status)}if(!r.ok)throw Error('API '+r.status+': '+JSON.stringify(j.errors||j.error||'error').slice(0,200));return j}
async function sql(q,params=[]){const j=await json(query,{method:'POST',headers:{Authorization:'Bearer '+process.env.FOOTBALL_STAGING_CF_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({sql:q,params})});check(j.success&&j.result?.every(x=>x.success!==false),'D1 query failed');return j.result[0]}
async function one(q,p=[]){return (await sql(q,p)).results?.[0]||null}
async function gh(u){return json(u,{headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,'User-Agent':'future-code-d1-daily','Accept':'application/vnd.github+json'}})}
async function manifest(){return json(api+'/api/football/manifest?check='+Date.now())}
async function read(v,path,brand='main'){return json(api+'/api/football/resource?path='+encodeURIComponent(path)+'&version='+v+'&brand='+brand)}
async function pages(){if(!process.env.FOOTBALL_PAGES_CF_API_TOKEN)return null;const j=await json('https://api.cloudflare.com/client/v4/accounts/'+acct+'/pages/projects/future-code-football-daily',{headers:{Authorization:'Bearer '+process.env.FOOTBALL_PAGES_CF_API_TOKEN}});return j.result?.latest_deployment?.id||null}
function urlOK(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}}
function validateNews(n,date){check(n.date===date&&n.timezone==='Asia/Yangon'&&n.items?.length===10,'News requires 10 items dated today');check(new Set(n.items.map(s=>s.id)).size===10,'Duplicate articles');check(n.items.some(s=>/အမျိုးသမီး|women/i.test((s.title||'')+' '+(s.categoryLabel||''))),'Women sports story missing');for(const [i,s] of n.items.entries()){check(s.title?.length>=20&&s.paragraphs?.length>=4&&s.paragraphs.every(p=>p.length>=40)&&urlOK(s.sourceUrl),'Invalid news story '+i);if(s.image)check((s.image.startsWith('https://')||s.image.startsWith('/data/news/images/'))&&s.imageCredit&&s.imageLicense&&urlOK(s.imageSourceUrl),'Unverified photo '+i)}}
async function payload(event){
 check(process.env.GITHUB_REPOSITORY===repo&&event.action==='labeled'&&event.label?.name==='football-d1-daily-publish','Wrong issue trigger');
 check(event.issue?.user?.login==='futurecode064-cyber'&&event.issue?.state==='open'&&!event.issue?.pull_request,'Repo owner issue required');
 const m=JSON.parse(event.issue.body||'null');
 check(m?.kind==='future-code-football-d1-daily-v1'&&dateValid(m.date)&&['daily','news-only'].includes(m.mode)&&/^[a-f0-9]{64}$/.test(m.sha256||'')&&Number.isInteger(m.parts)&&m.parts>0&&m.parts<=100,'Invalid metadata');
 const chunks=new Map(),pattern=/<!-- future-code-d1-part:([a-f0-9]{64}):(\d+)\/(\d+) -->\s*([A-Za-z0-9+/=\r\n]+)\s*$/;
 for(let page=1;page<=10;page++){const comments=await gh('https://api.github.com/repos/'+repo+'/issues/'+event.issue.number+'/comments?per_page=100&page='+page);for(const c of comments){const t=String(c.body||'').trim().match(pattern);if(!t||t[1]!==m.sha256)continue;check(c.user?.login==='futurecode064-cyber'&&+t[3]===m.parts&&+t[2]>=1&&+t[2]<=m.parts&&!chunks.has(+t[2]),'Untrusted/duplicate comment');chunks.set(+t[2],t[4].replace(/\s/g,''))}if(comments.length<100)break}
 check(chunks.size===m.parts,'Missing parts');
 const zipped=Array.from({length:m.parts},(_,i)=>chunks.get(i+1)).join('');check(zipped.length<11000000,'Oversize package');
 const raw=gunzipSync(Buffer.from(zipped,'base64'),{maxOutputLength:12000000});check(hash(raw)===m.sha256,'SHA mismatch');
 const p=JSON.parse(raw.toString('utf8'));check(p.editorialDate===m.date&&m.date===yangonDate(new Date()),'Wrong Yangon date');return {m,p};
}
async function publish(){
 check(process.env.FOOTBALL_STAGING_CF_API_TOKEN?.length>24&&process.env.GITHUB_TOKEN?.length>24,'Missing existing Secrets');
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),{m,p}=await payload(event),paths=Object.entries(p.resources||{});
 result.issue=event.issue.number;result.date=m.date;result.mode=m.mode;result.changedPaths=paths.map(x=>x[0]);
 check(p.sourceManifest?.files?.length>0&&p.sourceManifest.files.every(x=>x.name&&/^[a-f0-9]{64}$/.test(x.sha256||'')),'Invalid source fingerprint');
 check(paths.length>0&&paths.length<=45&&paths.every(([k,v])=>resourceAllowed(k)&&v&&typeof v==='object'&&JSON.stringify(v).length<500000&&!validateResource(k,v).length),'Invalid D1 resource');
 if(m.mode==='news-only')check(paths.length===1&&paths[0][0]==='data/news/latest.json','News-only isolation failed');else check(p.resources['data/today.json']&&p.resources['data/odds/'+m.date+'.json']&&p.resources['data/news/latest.json'],'Full daily requires today, opening odds and current news');
 check(!reviewErrors(p.review).length,'All nine verified QA receipts required');
 if(p.resources['data/news/latest.json'])validateNews(p.resources['data/news/latest.json'],m.date);
 result.pagesBefore=await pages();
 const owner=await one('SELECT owner FROM football_engine_installation WHERE singleton=1');check(owner?.owner===repo,'Wrong database');
 const state=await one('SELECT version_id,generation FROM active_publication WHERE singleton=1'),live=await manifest();
 check(state?.version_id===live.version&&state.generation===live.generation,'D1 pointer mismatch');
 result.previousVersion=state.version_id;result.previousGeneration=state.generation;
 const key='daily:'+m.date+':'+m.sha256.slice(0,40),previous=await one('SELECT id,ever_published FROM publication_versions WHERE idempotency_key=?',[key]);
 if(previous?.ever_published){for(const [k,v] of paths)assert.deepEqual(await read(state.version_id,k),v,'Stale retry');result.version=state.version_id;result.generation=state.generation;result.alreadyPublished=true}
 else{
  check(!previous,'Incomplete previous import; audit required before retry');
  const get=async(k)=>JSON.parse((await one('SELECT body FROM resources WHERE version_id=? AND path=?',[state.version_id,k]))?.body||'null');
  const report=m.mode==='news-only'?await get('data/today.json'):p.resources['data/today.json'],odds=m.mode==='news-only'?await get('data/odds/'+m.date+'.json'):p.resources['data/odds/'+m.date+'.json'];
  const errors=[...validateResources({'data/today.json':report,['data/odds/'+m.date+'.json']:odds},m.date),...validateEditorial({report,odds},m.date)];
  check(!errors.length,'Editorial/odds checks failed: '+errors.slice(0,4).join(' | '));
  const id=randomUUID(),at=new Date().toISOString();
  await sql('INSERT INTO publication_versions(id,parent_id,editorial_date,idempotency_key,input_hash,source_manifest,created_at) VALUES(?,?,?,?,?,?,?)',[id,state.version_id,m.date,key,m.sha256,JSON.stringify(p.sourceManifest),at]);
  await sql('INSERT INTO resource_refs(version_id,path,digest) SELECT ?,path,digest FROM resource_refs WHERE version_id=?',[id,state.version_id]);
  for(const [path,value] of paths){const body=JSON.stringify(value),digest=hash(body);await sql('INSERT INTO resource_blobs(digest,body,structural_errors,structural_revision) VALUES(?,?,?,1) ON CONFLICT(digest) DO NOTHING',[digest,body,JSON.stringify(validateResource(path,value))]);await sql('INSERT INTO resource_refs(version_id,path,digest) VALUES(?,?,?) ON CONFLICT(version_id,path) DO UPDATE SET digest=excluded.digest',[id,path,digest]);assert.deepEqual(JSON.parse((await one('SELECT body FROM resources WHERE version_id=? AND path=?',[id,path]))?.body||'null'),value)}
  const oldCount=Number((await one('SELECT count(*) n FROM resource_refs WHERE version_id=?',[state.version_id])).n),newCount=Number((await one('SELECT count(*) n FROM resource_refs WHERE version_id=?',[id])).n);
  let added=0;for(const [path] of paths)if(!(await one('SELECT path FROM resource_refs WHERE version_id=? AND path=?',[state.version_id,path])))added++;
  check(newCount===oldCount+added,'Missing inherited archive/report/odds');
  await sql('INSERT INTO validation_reviews(version_id,evidence,reviewed_at) VALUES(?,?,?)',[id,JSON.stringify(p.review),at]);await sql('UPDATE publication_versions SET validated_at=? WHERE id=?',[at,id]);
  const updated=await sql('UPDATE active_publication SET version_id=?,generation=generation+1,changed_at=? WHERE singleton=1 AND version_id IS ? AND generation=?',[id,at,state.version_id,state.generation]);
  check(updated.meta?.changes===1,'Concurrent publisher blocked');result.version=id;result.generation=state.generation+1;
 }
 const now=await manifest();check(now.version===result.version&&now.generation===result.generation,'No live D1 activation');
 for(const [k,v] of paths)assert.deepEqual(await read(result.version,k),v,'Read-back failed '+k);
 const news=await read(result.version,'data/news/latest.json','goal-zone');check(news.date===m.date,'Goal Zone feed stale');result.newsCount=news.items?.length;
 for(const u of ['https://future-code-football-daily.pages.dev/','https://future-code-football-daily.pages.dev/future-code-journal/']){const res=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(20000)});check(res.ok&&/football/i.test(await res.text()),'Site not responsive '+u)}
 result.sites=['Main','Goal Zone'];result.pagesAfter=await pages();check(result.pagesBefore===result.pagesAfter,'Pages deploy unexpectedly changed');result.success=true;
}
try{await publish()}catch(e){result.error=String(e?.message||e).slice(0,1400)}
finally{result.finishedAt=new Date().toISOString();writeFileSync('football-d1-daily-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.success)process.exitCode=1}