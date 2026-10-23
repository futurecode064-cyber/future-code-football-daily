// Read-only production-safe staging smoke check. Does not import, validate or publish data.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';

const accountId = '86851bf21d81d8f0972052aff8162149';
const worker = 'future-code-football-engine-staging';
const db = 'a4ddc00f-411b-4ee5-ab4a-dfe13486c334';
const origin = 'https://future-code-football-engine-staging.futurecode-dubai-86851bf2.workers.dev';
const allow = 'https://future-code-football-daily.pages.dev';
const token = process.env.FOOTBALL_STAGING_CF_API_TOKEN;
const report = {schemaVersion: 1, kind:'staging-read-only-live-smoke', origin, worker,
  databaseId:db, productionModified:false, publicationChanged:false, checkedAt:new Date().toISOString()};
const pathOut = process.argv[2] || 'football-live-staging-report.json';
function save(){writeFileSync(pathOut, JSON.stringify(report,null,2)+'\n',{mode:0o600});}
async function get(path,headers={}) {
  return fetch(origin+path,{headers,redirect:'error',signal:AbortSignal.timeout(20000)});
}
async function cf(path) {
  assert.ok(token && token.length>20,'Expected GitHub-stored Cloudflare migration secret');
  const response=await fetch('https://api.cloudflare.com/client/v4'+path,{
    headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(20000)});
  const body=await response.json();
  assert.ok(response.ok && body.success, 'Cloudflare read-only metadata request failed HTTP '+response.status);
  return body.result;
}
async function deployedIds(){
  const result=await cf('/accounts/'+accountId+'/workers/scripts/'+worker+'/deployments');
  assert.ok(Array.isArray(result.deployments),'Missing Worker deployments array');
  return result.deployments.map(x=>x.id);
}
try {
  const before=await deployedIds();
  const healthResponse=await get('/api/football/health');
  assert.equal(healthResponse.status,200,'Staging health not healthy');
  const health=await healthResponse.json();
  assert.equal(health.ok,true);assert.equal(health.environment,'staging');
  assert.ok(Number.isInteger(health.generation) && health.generation>=0);
  report.health={ok:health.ok,environment:health.environment,generation:health.generation,
    activePublication:health.version_id!==null};
  const manifestResponse=await get('/api/football/manifest');
  assert.equal(manifestResponse.status,200);
  assert.match(manifestResponse.headers.get('Cache-Control')||'',/no-store/);
  const manifest=await manifestResponse.json();
  assert.equal(manifest.version,health.version_id);
  assert.equal(manifest.generation,health.generation);
  report.manifestConsistent=true;
  for (const privatePath of ['/api/admin/state','/api/admin/history','/api/admin/export']){
    const response=await get(privatePath);
    assert.equal(response.status,401,privatePath+' must require authorization');
  }
  report.privateEndpointsProtected=true;
  const foreign=await get('/api/football/health',{Origin:'https://untrusted.invalid'});
  assert.equal(foreign.status,403,'Unexpected cross-origin permission');
  const permitted=await get('/api/football/health',{Origin:allow});
  assert.equal(permitted.status,200);
  assert.equal(permitted.headers.get('Access-Control-Allow-Origin'),allow);
  report.corsRestricted=true;
  const today=await get('/api/football/today');
  if(health.version_id===null) {
    assert.equal(today.status,503,'An unpublished staging draft must not become public');
    report.unpublishedDraftStillPrivate=true;
  } else {
    assert.equal(today.status,200,'Active staging publication must be readable');
    assert.equal(today.headers.get('X-Football-Version'),health.version_id);
    report.publicPinnedVersionVerified=true;
  }
  const meta=await cf('/accounts/'+accountId+'/d1/database/'+db);
  assert.equal(meta.uuid,db);
  report.d1Metadata={confirmed:true,fileSizeBytes:Number.isFinite(meta.file_size)?meta.file_size:null,
    numTables:Number.isFinite(meta.num_tables)?meta.num_tables:null};
  const after=await deployedIds();
  assert.deepEqual(after,before,'Read-only health/metadata checks must not cause a new deployment');
  report.workerDeploymentIdsUnchanged=true;
  report.success=true;save();console.log('Read-only live staging smoke passed; see artifact for evidence');
}catch(e){
  report.success=false;report.error=String(e.message||e).replaceAll(token||'__none__','[redacted]').slice(0,600);
  save();console.error(report.error);process.exitCode=1;
}
