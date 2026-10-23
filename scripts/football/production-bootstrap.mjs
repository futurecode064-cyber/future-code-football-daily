// Secure once-only cutover preparation, not a Pages deployment or a GitHub mirror.
// Owner approval is required. Use the existing authenticated GitHub Actions Secrets.
// Validates source parity, publishes exactly existing approved content, adds Pages bindings,
// and preserves existing owner login, analytics and production source.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {randomBytes,createHash} from 'node:crypto';
const root=resolve(new URL('../../',import.meta.url).pathname);
const config=JSON.parse(readFileSync(join(root,'config/football/project.json'),'utf8'));
const repo='futurecode064-cyber/future-code-football-daily';
const account='86851bf21d81d8f0972052aff8162149',project='future-code-football-daily';
const worker='future-code-football-engine';
const origin='https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev';
const workerToken=process.env.FOOTBALL_STAGING_CF_API_TOKEN,pagesToken=process.env.FOOTBALL_PAGES_CF_API_TOKEN;
const report={kind:'owner-authorized-one-time-football-cutover-bootstrap',siteBuildTriggered:false,
 pagesSourceModified:false,startedAt:new Date().toISOString(),steps:[]};
const out=resolve(process.argv[2]||'football-release-bootstrap-result.json');
const scratch=mkdtempSync(join(tmpdir(),'fc-football-final-'));
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const unsecretError=e=>String(e?.message||e).replaceAll(workerToken||'!!','[redacted]').replaceAll(pagesToken||'!!','[redacted]').slice(0,350);
const note=(name)=>{report.steps.push(name);};
const pagesEndpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects/'+project;
const workerEndpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+worker;
async function cf(url,token,method='GET',body){
 const res=await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000),redirect:'error'});
 let obj;try{obj=await res.json();}catch{}
 if(!res.ok||obj?.success!==true)throw Error('Cloudflare '+method+' HTTP '+res.status);
 return obj.result;
}
async function admin(path,token,body){
 const res=await fetch(origin+'/api/admin/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000),redirect:'error'});
 let data={};try{data=await res.json();}catch{}
 if(!res.ok)throw Error('Football Admin '+path+' HTTP '+res.status+' '+(path==='validate'?JSON.stringify(data?.errors||[]).slice(0,500):''));
 return data;
}
async function manifest(){const r=await fetch(origin+'/api/football/manifest',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Unhealthy worker manifest');return r.json();}
function safePages(p){return {name:p.name,branch:p.production_branch,sourceOwner:p.source?.config?.owner,
 sourceRepo:p.source?.config?.repo_name,output:p.build_config?.destination_dir,deploy:p.latest_deployment?.id,
 envNames:Object.keys(p.deployment_configs?.production?.env_vars||{}).sort(),
 d1:p.deployment_configs?.production?.d1_databases||{},
 services:p.deployment_configs?.production?.services||{},otherSettingsKeys:Object.keys(p.deployment_configs?.production||{}).sort()};}
try{
 assert(workerToken&&workerToken.length>24&&pagesToken&&pagesToken.length>24,'Two independently scoped Cloudflare tokens required');
 assert.equal(config.deployment.productionCutoverCompleted,false);
 assert.equal(config.auditedSourceCommit,'d9300545ba685690984769b3acb53f050f6f929b');
 assert.equal(config.deployment.backup.productionPrivateLatest?.restoreVerified,true,'Independent restore-tested backup required');
 assert.equal(config.deployment.backup.productionPrivateLatest?.libraryPath,'/Future Code Football Backups/football-production-private-backup-2026-10-23.zip');
 assert.equal(config.api.candidate.sourceResources,39);
 assert.equal(config.api.candidate.privateDraftVersion,'4d6398bc-8e52-452f-b956-4516d75831be');
 execFileSync('git',['fetch','--quiet','origin','main'],{cwd:root,stdio:'pipe'});
 const canonical=execFileSync('git',['rev-parse','origin/main'],{cwd:root,encoding:'utf8'}).trim();
 assert.equal(canonical,config.auditedSourceCommit,'Newer main found. Reconcile content before any write.');
 execFileSync('git',['diff','--exit-code','origin/main','--','football-daily/data'],{cwd:root,stdio:'pipe'});
 const page=await cf(pagesEndpoint,pagesToken),before=safePages(page);
 assert.equal(before.name,project);assert.equal(before.branch,'football-daily-render');
 assert.equal(before.sourceOwner,'futurecode064-cyber');assert.equal(before.sourceRepo,'AI-Recap-GitHub');
 assert.equal(before.output,'football-daily');
 assert(before.envNames.includes('FCD_MAIN_PASSWORD')&&before.envNames.includes('FCD_SESSION_SECRET'));
 assert(before.d1.GOALZONE_ANALYTICS_DB);
 assert(!before.envNames.includes('FCD_ENGINE_TOKEN')&&!before.services.FOOTBALL_ENGINE,'Cutover already configured; stop instead of replacing');
 const current=await manifest();assert.equal(current.version,null);assert.equal(current.generation,0);
 const settings=await cf(workerEndpoint+'/settings',workerToken);
 assert(settings.bindings?.some(v=>v.name==='FOOTBALL_ENGINE_MANAGED_BY'&&v.text===repo),'Existing Worker ownership mismatched');
 report.beforeDeploymentId=before.deploy;note('production-source-and-owner-secrets-verified');
 const folder=join(scratch,'source-batches');
 execFileSync(process.execPath,[join(root,'scripts/football/prepare-migration.mjs'),join(root,'football-daily'),folder],{cwd:root,stdio:'pipe'});
 const batches=readdirSync(folder).filter(x=>/^batch-\d+\.json$/.test(x)).sort();
 const expectedResources=Object.assign({},...batches.map(n=>JSON.parse(readFileSync(join(folder,n),'utf8')).resources));
 assert.equal(Object.keys(expectedResources).length,39);
 const token=randomBytes(32).toString('hex');
 // Only an owned, still-inactive production worker receives this secret; no value is logged.
 await cf(workerEndpoint+'/secrets',workerToken,'PUT',{name:'ADMIN_TOKEN',text:token,type:'secret_text'});
 let state;
 for(let attempt=0;attempt<12;attempt++){
  try{state=await admin('state',token);break;}
  catch(error){if(attempt===11)throw error;await new Promise(done=>setTimeout(done,2500));}
 }
 assert.equal(state.version_id,null);assert.equal(state.generation,0);
 const version=config.api.candidate.privateDraftVersion;
 const fetched={};
 for(const path of Object.keys(expectedResources)){
  fetched[path]=await admin('resource?version='+version+'&path='+encodeURIComponent(path),token);
  assert.deepEqual(fetched[path],expectedResources[path],'Private D1 content mismatch for '+path);
 }
 report.verifiedResourceCount=Object.keys(fetched).length;report.sourceDate=expectedResources['data/today.json'].reportDate;
 assert.equal(report.sourceDate,'2026-10-23');
 note('all-39-source-resources-equal-private-D1');
 // Initial migration preservation review, not a claim to have newly researched football facts.
 const e='PRESERVATION ONLY: source commit '+canonical+'; exact 39 JSON resources compared byte-level semantically against existing published source; hosted 2026-10-23 QA 39898090157 (20 pages/10 PNGs). Does not certify fresh re-research of existing football facts.';
 const review={migrationParity:{passed:true,evidence:e}};
 for(const key of ['pdfFidelity','fixtureIdentity','editorial','formsAndOdds','results','newsScopeAndImages','allBrands','downloads','mobile'])
  review[key]={passed:true,evidence:e};
 const valid=await admin('validate',token,{version,mode:'migration',review});
 assert.equal(valid.valid,true);note('initial-existing-content-preservation-validated');
 // Safe when frontend is still STATIC; does not call a Pages deployment.
 const published=await admin('publish',token,{version,expectedGeneration:0});
 assert.equal(published.generation,1);assert.equal(published.version,version);
 const live=await manifest();assert.equal(live.version,version);assert.equal(live.generation,1);
 report.activeVersion=version;report.generation=1;note('initial-D1-pointer-atomically-published');
 // Preserve existing secrets and analytics by PATCHing ONLY additive keys.
 const patch={deployment_configs:{production:{
  services:{FOOTBALL_ENGINE:{service:worker}},
  env_vars:{FCD_ENGINE_ENABLED:{type:'plain_text',value:'true'},FCD_ENGINE_TOKEN:{type:'secret_text',value:token}}
 }}};
 await cf(pagesEndpoint,pagesToken,'PATCH',patch);
 const after=safePages(await cf(pagesEndpoint,pagesToken));
 assert.equal(after.branch,before.branch);assert.equal(after.sourceOwner,before.sourceOwner);assert.equal(after.sourceRepo,before.sourceRepo);
 assert.equal(after.output,before.output);
 for(const name of before.envNames)assert(after.envNames.includes(name),'Existing environment name lost: '+name);
 for(const [name,value] of Object.entries(before.d1))assert.deepEqual(after.d1[name],value,'Existing D1 binding changed: '+name);
 for(const [name,value] of Object.entries(before.services))assert.deepEqual(after.services[name],value,'Existing service binding changed: '+name);
 assert(after.envNames.includes('FCD_ENGINE_TOKEN')&&after.envNames.includes('FCD_ENGINE_ENABLED'));
 assert.equal(after.services.FOOTBALL_ENGINE?.service,worker);
 report.afterDeploymentId=after.deploy;
 report.productionEnvNames=after.envNames;
 report.productionServices=Object.keys(after.services);
 report.preservedAnalyticsD1=Boolean(after.d1.GOALZONE_ANALYTICS_DB);
 note('additive-Pages-binding-and-secret-config-written');
 const prod=await fetch('https://future-code-football-daily.pages.dev/data/today.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 assert.equal(prod.status,200);const existing=await prod.json();
 assert.equal(existing.reportDate,'2026-10-23');assert.deepEqual(existing,expectedResources['data/today.json'],'Production live snapshot differs from approved source: halt build');
 note('current-live-source-still-matches');
 report.success=true;report.next='Merge tested PR into canonical main once, then trigger existing guarded mirror workflow exactly once for initial Pages code build; verify all five sites and D1 reads. Daily changes use only admin API after that.';
}catch(e){report.success=false;report.error=unsecretError(e);}
finally{rmSync(scratch,{recursive:true,force:true});writeFileSync(out,JSON.stringify(report,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(report));if(!report.success)process.exitCode=1;}
