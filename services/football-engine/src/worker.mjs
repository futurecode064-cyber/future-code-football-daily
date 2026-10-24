import {resourceAllowed,dateValid,yangonDate,validateResource,validateResources,reviewErrors} from './validation.mjs';
import {validateEditorial} from './editorial-validation.mjs';
import {mergeCorrection,newlyIntroduced} from './corrections.mjs';
const enc=new TextEncoder(), MAX_BODY=1500000;
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),b=>b.toString(16).padStart(2,'0')).join('');
class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(s,m)=>{throw new ApiError(s,m);};
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
async function bodyJson(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'application/json required');
 if(Number(request.headers.get('content-length'))>MAX_BODY)fail(413,'Payload too large');
 const reader=request.body?.getReader();if(!reader)fail(400,'JSON body required');let size=0;const chunks=[];
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BODY){await reader.cancel();fail(413,'Payload too large');}chunks.push(value);}
 const buffer=new Uint8Array(size);let i=0;for(const c of chunks){buffer.set(c,i);i+=c.length;}try{return JSON.parse(new TextDecoder().decode(buffer));}catch{fail(400,'Invalid JSON');}
}
async function authorize(request,env){
 const token=env.ADMIN_TOKEN;if(!token||token.length<32)fail(503,'Owner credential not configured');
 if(!env.ADMIN_RATE_LIMITER)fail(503,'Admin rate limiter not configured');
 const limiter=request.method==='GET'&&env.ADMIN_READ_RATE_LIMITER?env.ADMIN_READ_RATE_LIMITER:env.ADMIN_RATE_LIMITER;
 const limited=await limiter.limit({key:request.headers.get('CF-Connecting-IP')||'service'});if(!limited.success)fail(429,'Rate limited');
 const actual=await sha(request.headers.get('Authorization')||''),expected=await sha('Bearer '+token);
 let diff=0;for(let i=0;i<actual.length;i++)diff|=actual.charCodeAt(i)^expected.charCodeAt(i);if(diff)fail(401,'Unauthorized');
}
const statement=(db,sql,...args)=>db.prepare(sql).bind(...args);
async function active(db){return db.prepare('SELECT version_id,generation,changed_at FROM active_publication WHERE singleton=1').first();}
async function resourcesFor(db,id,paths){const rows=await statement(db,'SELECT path,body FROM resources WHERE version_id=?'+(paths?' AND path IN ('+paths.map(()=>'?').join(',')+')':''),id,...(paths||[])).all();return Object.fromEntries(rows.results.map(x=>[x.path,JSON.parse(x.body)]));}
async function snapshotResponse(db,id,metadata){
 // Stream already validated raw JSON without parsing and stringifying every
 // historical article again. Each D1 row stays below its own string-size limit.
 const rows=await statement(db,'SELECT path,body FROM resources WHERE version_id=?',id).all();
 const parts=[JSON.stringify(metadata).slice(0,-1)+',"resources":{',...rows.results.map((r,i)=>(i?',':'')+JSON.stringify(r.path)+':'+r.body),'}}'];
 let index=0;const stream=new ReadableStream({pull(controller){if(index===parts.length)controller.close();else controller.enqueue(enc.encode(parts[index++]));}});
 return new Response(stream,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
async function versionFor(db,id){const v=await statement(db,'SELECT * FROM publication_versions WHERE id=?',id).first();if(!v)fail(404,'Version not found');return v;}
async function importDraft(request,env,b){
 const db=env.DB,a=await active(db);
 if(!Number.isInteger(b.expectedGeneration))fail(400,'expectedGeneration required');
 if(!dateValid(b.editorialDate)||!b.resources||typeof b.resources!=='object'||Array.isArray(b.resources))fail(400,'Date/resources required');
 let entries=Object.entries(b.resources);if(entries.length<1||entries.length>20)fail(400,'Import 1–20 resources per request');
 if(!b.correction&&(!b.sourceManifest||typeof b.sourceManifest!=='object'||!Array.isArray(b.sourceManifest.files)||!b.sourceManifest.files.length||b.sourceManifest.files.some(f=>!f.name||!/^[a-f0-9]{64}$/.test(f.sha256||''))))fail(400,'Source filenames and SHA-256 hashes required');
 const key=request.headers.get('Idempotency-Key');if(!key||key.length>160)fail(400,'Idempotency-Key required');
 const inputHash='json-v2:'+await sha(JSON.stringify(b));
 const prior=await statement(db,'SELECT id,input_hash FROM publication_versions WHERE idempotency_key=?',key).first();
 if(prior){if(prior.input_hash!==inputHash&&prior.input_hash!==await sha(JSON.stringify(canonical(b))))fail(409,'Idempotency key reused with different input');return json({version:prior.id,generation:a.generation,reused:true});}
 let sourceManifest=b.sourceManifest;
 if(b.correction){
  if(b.baseDraft)fail(400,'Corrections cannot inherit a draft; edit the published base instead');
  const c=b.correction;
  if(!a.version_id||typeof c.baseVersion!=='string'||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>1000)fail(400,'Correction baseVersion and reason required');
  const base=await versionFor(db,c.baseVersion),current=await versionFor(db,a.version_id);
  if(!base.ever_published||base.editorial_date!==current.editorial_date||b.editorialDate!==current.editorial_date)fail(409,'Correction must target the same published editorial date');
  const paths=entries.map(([p])=>p);
  if(paths.some(p=>!resourceAllowed(p)))fail(400,'Disallowed correction resource');
  const old=await resourcesFor(db,base.id,paths),live=await resourcesFor(db,current.id,paths),changes=[];
  try{entries=entries.map(([p,value])=>{
   if(!old[p]||!live[p])fail(400,'Corrections edit existing resources only: '+p);
   const merged=mergeCorrection(old[p],value,live[p],p,changes);
   return [p,merged];
  }).filter(([p,value])=>JSON.stringify(value)!==JSON.stringify(live[p]));}catch(e){if(e instanceof ApiError)throw e;fail(409,e.message);}
  if(!entries.length)fail(400,'No changes to publish');
  sourceManifest={files:[{name:'owner-correction.json',sha256:await sha(JSON.stringify(entries))}],ownerEditV1:{baseVersion:base.id,parentVersion:current.id,reason:c.reason.trim(),changes,originalSourceFiles:JSON.parse(base.source_manifest).files||[]}};
 }else{
  if(sourceManifest?.ownerEditV1)fail(400,'Reserved correction metadata');
  if(b.expectedGeneration!==a.generation)fail(409,'Publication changed; reload before importing');
 }
 let inherit=a.version_id;
 if(b.baseDraft){const base=await versionFor(db,b.baseDraft);if(base.parent_id!==a.version_id||base.ever_published||base.validated_at)fail(409,'Base draft is no longer editable');inherit=base.id;}
 for(const [p,v] of entries){if(!resourceAllowed(p))fail(400,'Disallowed resource: '+p);if(!v||typeof v!=='object'||Array.isArray(v))fail(400,'Resource must be JSON object');}
 // Inherit omitted archives/news/opening odds. Drafts are immutable after creation.
 const id=crypto.randomUUID(),now=new Date().toISOString();
 const ops=[statement(db,'INSERT INTO publication_versions(id,parent_id,editorial_date,idempotency_key,input_hash,source_manifest,created_at) VALUES(?,?,?,?,?,?,?)',id,a.version_id,b.editorialDate,key,inputHash,JSON.stringify(sourceManifest),now)];
 if(inherit)ops.push(statement(db,'INSERT INTO resource_refs(version_id,path,digest) SELECT ?,path,digest FROM resource_refs WHERE version_id=?',id,inherit));
 for(const [p,v] of entries){const text=JSON.stringify(v);const digest=await sha(text);ops.push(statement(db,'INSERT INTO resource_blobs(digest,body,structural_errors,structural_revision) VALUES(?,?,?,1) ON CONFLICT(digest) DO UPDATE SET structural_errors=excluded.structural_errors,structural_revision=1 WHERE resource_blobs.structural_revision<1',digest,text,JSON.stringify(validateResource(p,v))));ops.push(statement(db,'INSERT INTO resource_refs(version_id,path,digest) VALUES(?,?,?) ON CONFLICT(version_id,path) DO UPDATE SET digest=excluded.digest',id,p,digest));}
 ops.push(statement(db,'INSERT INTO audit_logs(action,version_id,created_at,detail) VALUES(?,?,?,?)','import',id,now,JSON.stringify({sourceHash:inputHash})));
 try{await db.batch(ops);}catch(e){const race=await statement(db,'SELECT id,input_hash FROM publication_versions WHERE idempotency_key=?',key).first();if(race?.input_hash===inputHash)return json({version:race.id,reused:true});throw e;}
 return json({version:id,parent:a.version_id,generation:a.generation},201);
}
async function updateOdds(request,env,b){
 const a=await active(env.DB);if(!a.version_id)fail(409,'Opening publication required');
 if(b.expectedGeneration!==a.generation)fail(409,'Publication changed; reload before odds update');
 const v=await versionFor(env.DB,a.version_id),day=v.editorial_date,r=await resourcesFor(env.DB,a.version_id,['data/today.json',`data/odds/${day}.json`]);
 const sheet=r[`data/odds/${day}.json`],report=r['data/today.json'];
 if(!sheet||!report||!Array.isArray(b.updates)||!b.updates.length)fail(400,'Current odds rows required');
 const seen=new Set();
 for(const row of b.updates){
  if(!row?.fixtureId||seen.has(row.fixtureId)||Object.keys(row).some(k=>!['fixtureId','currentBodyOdds','currentGoalTotalOdds'].includes(k)))fail(400,'Only unique current-odds fields may be updated');seen.add(row.fixtureId);
  const o=sheet.matches.find(m=>m.fixtureId===row.fixtureId);if(!o)fail(400,'Unknown fixture ID');
  const m=report.matches.find(m=>m.fixtureId===row.fixtureId);if(!m)fail(400,'Report/odds mapping mismatch');
  for(const key of ['currentBodyOdds','currentGoalTotalOdds'])if(Object.hasOwn(row,key)){
   if(typeof row[key]!=='string'||row[key].length>40)fail(400,'Odds must be source-verbatim strings');o[key]=row[key];
   m.myanmarOdds={...m.myanmarOdds,[key]:row[key]};
  }
 }
 const evening={reportDate:day,matches:sheet.matches.map((o,i)=>({row:o.pdfRow||i+1,fixtureId:o.fixtureId,league:o.league,home:o.home,away:o.away,upperTeam:o.upperTeam,kickoffDisplay:o.kickoffDisplay,morningBodyOdds:o.bodyOdds,morningGoalTotalOdds:o.goalTotalOdds,eveningBodyOdds:o.currentBodyOdds||'',eveningGoalTotalOdds:o.currentGoalTotalOdds||''}))};
 return importDraft(request,env,{editorialDate:day,expectedGeneration:b.expectedGeneration,sourceManifest:b.sourceManifest,resources:{'data/today.json':report,[`data/odds/${day}.json`]:sheet,[`data/odds/evening/${day}.json`]:evening}});
}

async function autoSchedule(env,v){
 const target=yangonDate(new Date(),1);
 if(v.editorial_date!==target||v.ever_published)return null;
 const a=await active(env.DB);
 if(v.parent_id!==a.version_id)return {status:'blocked',reason:'stale-parent'};
 await statement(env.DB,`INSERT INTO scheduled_publications (target_date,version_id,expected_generation,status,created_at,detail)
 VALUES(?,?,?,'ready',?,'{}')
 ON CONFLICT(target_date) DO UPDATE SET version_id=excluded.version_id,expected_generation=excluded.expected_generation,
 status='ready',created_at=excluded.created_at,processed_at=NULL,detail='{}'
 WHERE scheduled_publications.status IN ('ready','blocked','cancelled')`,
 target,v.id,a.generation,new Date().toISOString()).run();
 const row=await statement(env.DB,'SELECT target_date,version_id,expected_generation,status FROM scheduled_publications WHERE target_date=?',target).first();
 return row?.version_id===v.id?row:{status:'blocked',reason:'already-published'};
}
export async function runScheduledPublication(env,now=new Date()){
 const date=yangonDate(now),row=await statement(env.DB,'SELECT * FROM scheduled_publications WHERE target_date=?',date).first();
 if(!row||row.status!=='ready')return {date,status:row?.status||'not-ready'};
 const current=await active(env.DB),version=await versionFor(env.DB,row.version_id);
 const report=(await resourcesFor(env.DB,version.id,['data/today.json']))['data/today.json'];
 const safe=version.validated_at&&version.editorial_date===date&&!version.ever_published&&
  version.parent_id===current.version_id&&current.generation===row.expected_generation&&
  report?.published===true&&report.reportDate===date;
 if(!safe){
  await statement(env.DB,"UPDATE scheduled_publications SET status='blocked',processed_at=?,detail=? WHERE target_date=? AND status='ready'",
   now.toISOString(),JSON.stringify({reason:'stale-or-unvalidated'}),date).run();
  return {date,status:'blocked',reason:'stale-or-unvalidated'};
 }
 const changed=await statement(env.DB,`UPDATE active_publication SET version_id=?,generation=generation+1,changed_at=?
 WHERE singleton=1 AND generation=? AND version_id IS ? AND EXISTS
 (SELECT 1 FROM scheduled_publications WHERE target_date=? AND version_id=? AND status='ready' AND expected_generation=?)`,
 version.id,now.toISOString(),row.expected_generation,version.parent_id,date,version.id,row.expected_generation).run();
 if(changed.meta?.changes!==1)return {date,status:'conflict'};
 await statement(env.DB,"UPDATE scheduled_publications SET status='published',processed_at=?,detail=? WHERE target_date=? AND version_id=? AND status='ready'",
  now.toISOString(),JSON.stringify({mode:'automatic',generation:row.expected_generation+1}),date,version.id).run();
 return {date,status:'published',version:version.id,generation:row.expected_generation+1};
}
async function validateCorrection(env,v,edit){
 if(edit.parentVersion!==v.parent_id)fail(400,'Invalid correction parent');
 const changed=await statement(env.DB,'SELECT n.path FROM resource_refs n LEFT JOIN resource_refs p ON p.version_id=? AND p.path=n.path WHERE n.version_id=? AND (p.digest IS NULL OR p.digest<>n.digest)',v.parent_id,v.id).all();
 const paths=changed.results.map(x=>x.path),needed=[...new Set([...paths,'data/today.json',`data/odds/${v.editorial_date}.json`])];
 const before=await resourcesFor(env.DB,v.parent_id,needed),after=await resourcesFor(env.DB,v.id,needed),errors=[];
 for(const path of paths){
  if(!before[path])errors.push('Correction cannot add a resource: '+path);
  errors.push(...validateResource(path,after[path]));
  for(const row of after[path]?.matches||[])if(Object.hasOwn(row,'dailyPreviewText')&&(typeof row.dailyPreviewText!=='string'||!row.dailyPreviewText.trim()||row.dailyPreviewText.length>20000))errors.push(path+': preview text must contain 1–20000 characters');
 }
 const check=r=>[...validateResources({'data/today.json':r['data/today.json'],[`data/odds/${v.editorial_date}.json`]:r[`data/odds/${v.editorial_date}.json`]},v.editorial_date),...validateEditorial({report:r['data/today.json'],odds:r[`data/odds/${v.editorial_date}.json`]},v.editorial_date,{correction:true})];
 errors.push(...newlyIntroduced(check(before),check(after)));
 if(!paths.length)errors.push('Correction is empty');
 if(errors.length)return json({valid:false,mode:'correction',errors},422);
 const evidence={mode:'owner-correction',reason:edit.reason,baseVersion:edit.baseVersion,parentVersion:v.parent_id,changedPaths:paths,changedFields:edit.changes,checks:'Changed resource structure and newly introduced report/odds errors checked. Unchanged inherited data preserved; this is not a new independent source-fact review.'};
 const now=new Date().toISOString();await env.DB.batch([
 statement(env.DB,'INSERT INTO validation_reviews(version_id,evidence,reviewed_at) VALUES(?,?,?) ON CONFLICT(version_id) DO UPDATE SET evidence=excluded.evidence,reviewed_at=excluded.reviewed_at',v.id,JSON.stringify(evidence),now),
 statement(env.DB,'UPDATE publication_versions SET validated_at=? WHERE id=?',now,v.id)
 ]);return json({valid:true,mode:'correction',version:v.id,changedPaths:paths,changedFields:edit.changes});
}
async function validateDraft(env,b){
 const candidate=await versionFor(env.DB,b.version),edit=JSON.parse(candidate.source_manifest).ownerEditV1;
 if(edit)return validateCorrection(env,candidate,edit);
 const v=await versionFor(env.DB,b.version),r=await resourcesFor(env.DB,v.id,['data/today.json',`data/odds/${v.editorial_date}.json`]);
 const receipts=await statement(env.DB,'SELECT rr.path,rb.structural_errors,rb.structural_revision FROM resource_refs rr JOIN resource_blobs rb ON rb.digest=rr.digest WHERE rr.version_id=?',v.id).all();
 const errors=validateResources(r,v.editorial_date,{migration:b.mode==='migration'});
 for(const row of receipts.results){if(row.structural_revision!==1||!row.structural_errors)errors.push('Reimport resource for current structural checks: '+row.path);else errors.push(...JSON.parse(row.structural_errors));}
 if(b.mode!=='migration')errors.push(...validateEditorial({report:r['data/today.json'],odds:r[`data/odds/${v.editorial_date}.json`]},v.editorial_date));
 if(b.mode==='migration'&&b.review?.migrationParity?.passed!==true)errors.push('Migration requires byte/content parity review');
 errors.push(...reviewErrors(b.review));
 // Once initial migration is active, migration mode cannot bypass editorial validation.
 const a=await active(env.DB);if(b.mode==='migration'&&a.version_id)errors.push('Migration validation allowed only before initial activation');
 if(errors.length)return json({valid:false,errors},422);
 const now=new Date().toISOString();await env.DB.batch([
 statement(env.DB,'INSERT INTO validation_reviews(version_id,evidence,reviewed_at) VALUES(?,?,?) ON CONFLICT(version_id) DO UPDATE SET evidence=excluded.evidence,reviewed_at=excluded.reviewed_at',v.id,JSON.stringify(b.review),now),
 statement(env.DB,'UPDATE publication_versions SET validated_at=? WHERE id=?',now,v.id)
 ]);const scheduled=await autoSchedule(env,v);return json({valid:true,version:v.id,scheduled});
}
async function activate(env,b,rollback=false){
 let v=await versionFor(env.DB,b.version);const state=await active(env.DB);if(!rollback&&v.id===state.version_id)return json({version:v.id,generation:state.generation,reused:true});if(!v.validated_at&&JSON.parse(v.source_manifest).ownerEditV1&&!rollback){const checked=await validateDraft(env,{version:v.id});if(!checked.ok)return checked;v=await versionFor(env.DB,v.id);}if(!v.validated_at)fail(422,'Version has not passed validation');
 if(rollback&&!v.ever_published)fail(422,'Rollback target must have been published');
 if(!Number.isInteger(b.expectedGeneration))fail(400,'expectedGeneration required');
 // Monotonic generation prevents lost writes and ABA races after rollbacks.
 const result=await statement(env.DB,'UPDATE active_publication SET version_id=?,generation=generation+1,changed_at=? WHERE singleton=1 AND generation=?'+(rollback?'':' AND version_id IS ?'),v.id,new Date().toISOString(),b.expectedGeneration,...(rollback?[]:[v.parent_id])).run();
 if(!(result.meta?.changes>=1))fail(409,'Publication changed; reload and rebase draft');
 return json({version:v.id,generation:b.expectedGeneration+1,rollback});
}
async function publicGet(request,env,url,ctx){
 const path=url.pathname;
 if(path==='/api/football/health'){const a=await active(env.DB);return json({ok:true,capabilities:['owner-corrections-v1'],environment:env.ENVIRONMENT||'unset',...a});}
 if(path==='/api/football/manifest'){const a=await active(env.DB);return json({schemaVersion:1,version:a.version_id,generation:a.generation,publishedAt:a.changed_at,timezone:'Asia/Yangon',cacheMaxAgeSeconds:0});}
 let resource=url.searchParams.get('path');
 const day=url.searchParams.get('date')||yangonDate();if(!dateValid(day))fail(400,'Invalid date');
 const aliases={today:'data/today.json',yesterday:`data/archive/${yangonDate(new Date(),-1)}.json`,odds:`data/odds/${day}.json`,news:'data/news/latest.json',results:`data/archive/${day}.json`,fixtures:'data/today.json',previews:'data/today.json',special:'data/today.json',ai:'data/today.json'};
 const name=path.split('/').pop();if(name!=='resource'){resource=aliases[name];if(!resource)fail(404,'Unknown endpoint');}
 if(!resourceAllowed(resource))fail(400,'Disallowed resource');
 if(resource.includes('/news/')&&!['main','goal-zone'].includes(url.searchParams.get('brand')||'main'))fail(404,'News not enabled for this brand');
 const pinned=url.searchParams.get('version');
 if(pinned&&!/^[a-f0-9-]{36}$/.test(pinned))fail(404,'Published version not found');
 // Only immutable, previously published resources enter the edge cache. Manifests,
 // owner drafts and unpinned reads always reach their authoritative state.
 const cache=globalThis.caches?.default;
 let cacheKey;
 if(pinned&&cache){
  const key=new URL('/__football_published_cache__',url.origin);key.searchParams.set('environment',env.ENVIRONMENT||'unset');key.searchParams.set('version',pinned);key.searchParams.set('path',resource);cacheKey=new Request(key);
  const hit=await cache.match(cacheKey).catch(()=>null);
  if(hit){if(request.headers.get('If-None-Match')===hit.headers.get('ETag'))return new Response(null,{status:304,headers:hit.headers});return new Response(request.method==='HEAD'?null:hit.body,hit);}
 }
 const a=await active(env.DB);if(!a.version_id)fail(503,'No validated publication active');
 const id=pinned||a.version_id;
 const v=await versionFor(env.DB,id);if(!v.ever_published)fail(404,'Published version not found');
 const row=await statement(env.DB,'SELECT body,digest FROM resources WHERE version_id=? AND path=?',id,resource).first();if(!row)fail(404,'Resource not found in publication');
 const tag='"'+row.digest+'"';const headers={'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','ETag':tag,'X-Football-Version':id,'Cache-Control':url.searchParams.has('version')?'public, max-age=31536000, immutable':'no-cache'};
 if(request.headers.get('If-None-Match')===tag)return new Response(null,{status:304,headers});
 const response=new Response(request.method==='HEAD'?null:row.body,{headers});
 if(cacheKey&&request.method==='GET'){const save=cache.put(cacheKey,response.clone()).catch(()=>{});if(ctx?.waitUntil)ctx.waitUntil(save);else await save;}
 return response;
}
export default {async scheduled(event,env,ctx){const job=runScheduledPublication(env,new Date(event.scheduledTime||Date.now()));if(ctx?.waitUntil)ctx.waitUntil(job);else await job;},async fetch(request,env,ctx){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 const allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
 let response;try{
  if(origin&&!allowed.includes(origin))fail(403,'Origin not allowed');
  if(request.method==='OPTIONS')response=new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization, Idempotency-Key','Access-Control-Max-Age':'600'}});
  else if(!env.DB?.prepare)fail(503,'Database binding not configured');
  else if(url.pathname.startsWith('/api/admin/')){
   await authorize(request,env);const name=url.pathname.slice('/api/admin/'.length);
   if(request.method==='GET'&&name==='state')response=json(await active(env.DB));
   else if(request.method==='GET'&&name==='resource'){
    const id=url.searchParams.get('version'),path=url.searchParams.get('path');if(!resourceAllowed(path))fail(400,'Disallowed resource');
    await versionFor(env.DB,id);const row=await statement(env.DB,'SELECT body FROM resources WHERE version_id=? AND path=?',id,path).first();if(!row)fail(404,'Resource absent from draft');
    response=new Response(row.body,{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Football-Version':id,'X-Content-Type-Options':'nosniff'}});
   }
   else if(request.method==='GET'&&name==='draft'){const v=await versionFor(env.DB,url.searchParams.get('version'));response=url.searchParams.get('metadata')==='1'?json({version:v,resourceManifest:(await statement(env.DB,'SELECT path,digest FROM resource_refs WHERE version_id=?',v.id).all()).results}):await snapshotResponse(env.DB,v.id,{version:v});}
   else if(request.method==='GET'&&name==='export'){
    const a=await active(env.DB),id=url.searchParams.get('version')||a.version_id;if(!id)fail(409,'No publication to export');
    const v=await versionFor(env.DB,id),review=await statement(env.DB,'SELECT evidence,reviewed_at FROM validation_reviews WHERE version_id=?',id).first();
    const metadata={schemaVersion:1,kind:'football-publication-backup',exportedAt:new Date().toISOString(),active:a,version:v,review};
    response=url.searchParams.get('metadata')==='1'?json({...metadata,resourceManifest:(await statement(env.DB,'SELECT path,digest FROM resource_refs WHERE version_id=?',id).all()).results}):await snapshotResponse(env.DB,id,metadata);
   }
   else if(request.method==='GET'&&name==='schedule')response=json((await env.DB.prepare('SELECT target_date,version_id,expected_generation,status,created_at,processed_at,detail FROM scheduled_publications ORDER BY target_date DESC LIMIT 14').all()).results);
   else if(request.method==='GET'&&name==='history')response=json((await env.DB.prepare('SELECT id,editorial_date,created_at,validated_at,ever_published FROM publication_versions ORDER BY created_at DESC LIMIT 50').all()).results);
   else if(request.method==='GET'&&name==='usage'){
    const storage=await env.DB.prepare('SELECT (SELECT count(*) FROM publication_versions) AS versions,(SELECT count(*) FROM resource_refs) AS resourceReferences,(SELECT count(*) FROM resource_blobs) AS uniqueResources,(SELECT coalesce(sum(length(CAST(body AS BLOB))),0) FROM resource_blobs) AS uniqueJsonBytes').first();
    response=json({storage,storageNote:'JSON payload bytes only; physical D1 size, CPU and row quotas require account analytics',cloudflareMetrics:null,reason:'Account analytics require separate Cloudflare authorization',dashboard:'https://dash.cloudflare.com/'});
   }
   else if(request.method==='POST'&&['import','validate','publish','rollback','update-odds'].includes(name)){
    const b=await bodyJson(request);response=name==='import'?await importDraft(request,env,b):name==='update-odds'?await updateOdds(request,env,b):name==='validate'?await validateDraft(env,b):await activate(env,b,name==='rollback');
   }else fail(405,'Unsupported admin endpoint/method');
  }else if(url.pathname.startsWith('/api/football/')&&['GET','HEAD'].includes(request.method))response=await publicGet(request,env,url,ctx);
  else fail(404,'Unknown endpoint');
 }catch(e){response=json({error:e instanceof ApiError?e.message:'Service unavailable'},e instanceof ApiError?e.status:503);}
 if(origin&&allowed.includes(origin)){
  response=new Response(response.body,response);response.headers.set('Access-Control-Allow-Origin',origin);response.headers.set('Vary','Origin');response.headers.set('Access-Control-Expose-Headers','ETag, X-Football-Version');
 }return response;
}};
