// One-off infrastructure setup. Fixed STAGING resources only. No content activation or production writes.
import {mkdtempSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';import {DatabaseSync} from 'node:sqlite';import {encryptBackup,decryptBackup} from './backup-crypto.mjs';import {randomBytes,createHash} from 'node:crypto';import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const target=process.env.FOOTBALL_ENGINE_SETUP_TARGET||'staging';
if(!['staging','production-private'].includes(target))throw Error('Unsupported fixed setup target');
const productionPrivate=target==='production-private';
const owner='futurecode064-cyber/future-code-football-daily',workerName=productionPrivate?'future-code-football-engine':'future-code-football-engine-staging',dbName=productionPrivate?'future-code-football-db':'future-code-football-db-staging';
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN,accountId=process.env.FOOTBALL_STAGING_CF_ACCOUNT_ID;
const adminToken=randomBytes(32).toString('hex'),scratch=mkdtempSync(tmpdir()+'/football-staging-');
const report={schemaVersion:1,environment:target,workerName,databaseName:dbName,startedAt:new Date().toISOString(),productionModified:false,contentActivated:false,productionWebsiteModified:false,productionNamespaceProvisioned:productionPrivate};
const out=resolve(process.argv[2]||'football-staging-report.json');
const save=()=>writeFileSync(out,JSON.stringify(report,null,2)+'\n',{mode:0o600});
function redact(text){return String(text).replaceAll(token||'__absent__','[redacted]').replaceAll(adminToken,'[redacted]').replaceAll(process.env.FOOTBALL_BACKUP_RECOVERY_KEY||'__no_recovery__','[redacted]');}
async function api(path,options={}){
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method:options.method||'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:options.body===undefined?undefined:JSON.stringify(options.body),redirect:'error',signal:AbortSignal.timeout(30000)});
 const data=await r.json().catch(()=>null);
 if(!r.ok||data?.success!==true)throw Error('Cloudflare API '+(options.method||'GET')+' '+path+' failed: HTTP '+r.status+' codes '+JSON.stringify(data?.errors?.map(e=>e.code)||[]));
 return data.result;
}
function wrangler(args){
 try{return execFileSync(process.execPath,[resolve(root,'services/football-engine/node_modules/wrangler/bin/wrangler.js'),...args],{cwd:root,encoding:'utf8',env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:accountId,WRANGLER_SEND_METRICS:'false',CI:'true'},stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024});}
 catch(error){throw Error('Wrangler '+args[0]+' failed: '+redact(error.stderr||error.stdout||error.message).slice(-3500));}
}
async function engine(path,body,key){
 const r=await fetch(report.apiOrigin+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+adminToken,'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});
 const value=await r.json();if(!r.ok)throw Error('Staging API '+path+' failed: HTTP '+r.status+' '+JSON.stringify(value));return value;
}
const prefix='/accounts/'+accountId;
try{
 if(productionPrivate&&(!process.env.FOOTBALL_BACKUP_RECOVERY_KEY||process.env.FOOTBALL_BACKUP_RECOVERY_KEY.length<32))throw Error('Independent GitHub recovery secret required before private production setup');
 if(!token||token.length<20||!/^[a-f0-9]{32}$/.test(accountId||''))throw Error('Migration-scoped GitHub secret/account configuration required');
 const state=JSON.parse(readFileSync(resolve(root,'config/football/project.json'),'utf8'));
 assert.equal(state.deployment.productionCutoverCompleted,false);assert.equal(state.currentTask,'infrastructure-migration-only');
 // Verify fresh source parity against canonical main before copying any data.
 execFileSync('git',['diff','--exit-code','origin/main','--','football-daily/data'],{cwd:root,stdio:'pipe'});
 const scripts=await api(prefix+'/workers/scripts'),databases=await api(prefix+'/d1/database?per_page=100');
 const existingWorker=scripts.find(w=>w.id===workerName),existingDb=databases.find(d=>d.name===dbName);
 if(existingWorker){
  const settings=await api(prefix+'/workers/scripts/'+workerName+'/settings');
  if(!settings.bindings?.some(b=>b.name==='FOOTBALL_ENGINE_MANAGED_BY'&&b.text===owner))throw Error('Existing staging Worker is not marked as owned by this migration; refusing overwrite');
 }
 let database=existingDb;
 if(database){
  const checked=await api(prefix+'/d1/database/'+database.uuid+'/query',{method:'POST',body:{sql:'SELECT owner FROM football_engine_installation WHERE singleton=1'}});
  if(checked[0]?.results?.[0]?.owner!==owner)throw Error('Existing staging D1 is not owned by this migration; refusing adoption');
  const table=await api(prefix+'/d1/database/'+database.uuid+'/query',{method:'POST',body:{sql:"SELECT name FROM sqlite_master WHERE type='table' AND name='active_publication'"}});
  if(table[0]?.results?.length){const a=await api(prefix+'/d1/database/'+database.uuid+'/query',{method:'POST',body:{sql:'SELECT version_id,generation FROM active_publication WHERE singleton=1'}});if(a[0]?.results?.[0]?.version_id!==null||a[0]?.results?.[0]?.generation!==0)throw Error('Active publication exists; refusing Worker deployment or secret rotation');}
 }else{
  database=await api(prefix+'/d1/database',{method:'POST',body:{name:dbName,primary_location_hint:'apac'}});
  report.databaseCreated=true;report.databaseId=database.uuid;save();
  await api(prefix+'/d1/database/'+database.uuid+'/query',{method:'POST',body:{sql:'CREATE TABLE football_engine_installation(singleton INTEGER PRIMARY KEY CHECK(singleton=1),owner TEXT NOT NULL)'}});
  await api(prefix+'/d1/database/'+database.uuid+'/query',{method:'POST',body:{sql:'INSERT INTO football_engine_installation(singleton,owner) VALUES(1,?)',params:[owner]}});
 }
 if(!/^[a-f0-9-]{36}$/.test(database.uuid||''))throw Error('Invalid returned D1 identifier');
 report.databaseId=database.uuid;
 const accountSubdomain=await api(prefix+'/workers/subdomain');
 if(!/^[a-z0-9-]+$/.test(accountSubdomain.subdomain||''))throw Error('Account workers.dev subdomain is not available');
 report.apiOrigin='https://'+workerName+'.'+accountSubdomain.subdomain+'.workers.dev';
 const config=JSON.parse(readFileSync(resolve(root,'services/football-engine/wrangler.jsonc.example'),'utf8'));
 config.name=workerName;config.main=resolve(root,'services/football-engine/src/worker.mjs');config.account_id=accountId;config.vars.ENVIRONMENT=productionPrivate?'production':'staging';config.d1_databases[0].database_name=dbName;
 config.d1_databases[0].database_id=database.uuid;config.d1_databases[0].migrations_dir=resolve(root,'services/football-engine/migrations');
 config.vars.FOOTBALL_ENGINE_MANAGED_BY=owner;
 config.vars.ALLOWED_ORIGINS=[state.sites.main.replace(/\/$/,''),'http://localhost:8788'].join(',');
 const configPath=scratch+'/wrangler.json';writeFileSync(configPath,JSON.stringify(config));
 wrangler(['d1','migrations','apply','DB','--remote','--config',configPath]);report.migrationsApplied=true;save();
 wrangler(['deploy','--config',configPath]);report.workerDeployed=true;save();
 // Fresh random staging-only secret stays inside this runner and the staging Worker secret store.
 // A later one-off staging run rotates only this managed staging secret before operations.
 await api(prefix+'/workers/scripts/'+workerName+'/secrets',{method:'PUT',body:{name:'ADMIN_TOKEN',text:adminToken,type:'secret_text'}});
 await api(prefix+'/workers/scripts/'+workerName+'/subdomain',{method:'POST',body:{enabled:true,previews_enabled:false}});
 let healthy=false;
 for(let attempt=0;attempt<6;attempt++){
  try{const health=await engine('/api/football/health');if(health.ok&&health.environment===(productionPrivate?'production':'staging')){healthy=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,3000));
 }
 if(!healthy)throw Error('Staging health did not become ready');report.healthVerified=true;
 const a=await engine('/api/admin/state');
 if(a.version_id!==null||a.generation!==0)throw Error('Staging already has an active publication; refusing initial migration');
 const deploymentIds=async()=>{const d=await api(prefix+'/workers/scripts/'+workerName+'/deployments');return d.deployments.map(x=>x.id);};
 const before=await deploymentIds();
 const folder=scratch+'/batches';execFileSync(process.execPath,[resolve(root,'scripts/football/prepare-migration.mjs'),resolve(root,'football-daily'),folder],{stdio:'pipe'});
 let version,expected={},batchCount=0;
 const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();report.sourceCommit=sha;
 for(const file of readdirSync(folder).filter(n=>n.startsWith('batch-')).sort()){
  const b=JSON.parse(readFileSync(folder+'/'+file,'utf8'));if(version)b.baseDraft=version;
  Object.assign(expected,b.resources);version=(await engine('/api/admin/import',b,'staging-migration:'+sha+':'+(++batchCount))).version;
 }
 const metadata=await engine('/api/admin/export?metadata=1&version='+version);const contents={};for(const entry of metadata.resourceManifest)contents[entry.path]=await engine('/api/admin/resource?version='+version+'&path='+encodeURIComponent(entry.path));const snapshot={...metadata,resources:contents};assert.deepEqual(snapshot.resources,expected);
 report.privateDraftVersion=version;report.resources=Object.keys(expected).length;report.batches=batchCount;report.allJsonValuesEqual=true;
 const exported=snapshot;assert.deepEqual(exported.resources,expected);report.snapshotExportParity=true;
 assert.equal((await fetch(report.apiOrigin+'/api/admin/state',{signal:AbortSignal.timeout(20000)})).status,401);report.unauthorizedBlocked=true;
 assert.equal((await fetch(report.apiOrigin+'/api/football/today',{signal:AbortSignal.timeout(20000)})).status,503);report.draftPrivate=true;
 assert.equal((await engine('/api/admin/state')).version_id,null);assert.deepEqual(await deploymentIds(),before);report.noDeploymentDuringImports=true;
 report.storage=await engine('/api/admin/usage');
 const sqlFile=scratch+'/staging-backup.sql';wrangler(['d1','export','DB','--remote','--config',configPath,'--output',sqlFile]);
 const backup=readFileSync(sqlFile);report.fullDatabaseExport={verified:true,bytes:backup.length,sha256:createHash('sha256').update(backup).digest('hex'),retained:false,note:'Verified in ephemeral runner only; private durable backup destination still pending'};
 if(productionPrivate){
  const recovery=process.env.FOOTBALL_BACKUP_RECOVERY_KEY;
  const check=new DatabaseSync(':memory:');try{check.exec(backup.toString('utf8'));const a=check.prepare('SELECT version_id,generation FROM active_publication WHERE singleton=1').get();assert.equal(a.version_id,null);assert.equal(a.generation,0);assert.ok(check.prepare('SELECT count(*) n FROM resource_blobs').get().n>=Object.keys(expected).length);}finally{check.close();}
  const encrypted=encryptBackup(backup,recovery,{keySource:'FOOTBALL_BACKUP_RECOVERY_KEY',source:dbName});assert.deepEqual(decryptBackup(encrypted,recovery),backup);
  const encryptedPath=resolve(process.argv[3]||'football-production-private-db.enc.json');writeFileSync(encryptedPath,JSON.stringify(encrypted)+'\n',{mode:0o600});report.fullDatabaseExport={...report.fullDatabaseExport,retained:true,encrypted:true,restoreVerified:true,keySource:'FOOTBALL_BACKUP_RECOVERY_KEY',note:'Encrypted private production preparation only. Key rotation and durable owner copy required before activation.'};
 }
 report.completedAt=new Date().toISOString();report.success=true;save();console.log(JSON.stringify(report));
}catch(error){report.success=false;report.error=redact(error.message);save();console.error(report.error);process.exitCode=1;}
finally{rmSync(scratch,{recursive:true,force:true});}
