// Owner-authorized CODE release only. Never updates publication rows or credentials.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {encryptBackup} from './backup-crypto.mjs';
const account='86851bf21d81d8f0972052aff8162149',worker='future-code-football-engine',projectName='future-code-football-daily';
const workerToken=process.env.FOOTBALL_STAGING_CF_API_TOKEN,pagesToken=process.env.FOOTBALL_PAGES_CF_API_TOKEN;
const root=process.cwd(),temp=mkdtempSync(tmpdir()+'/fc-owner-edit-'),workerPath='/accounts/'+account+'/workers/scripts/'+worker,pagesPath='/accounts/'+account+'/pages/projects/'+projectName;
const report={kind:'owner-corrections-code-release',success:false,dataPublished:false,secretRotated:false};
let oldCode,oldSettings,oldDeployments,newWorker=false,pagesChanged=false;
const check=(v,m)=>assert.ok(v,m);
async function cf(path,{token=workerToken,method='GET',body,raw=false}={}){
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+token,...(body instanceof FormData?{}:body?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(60000)});
 if(raw){check(r.ok,'Worker source backup HTTP '+r.status);return {type:r.headers.get('Content-Type'),bytes:Buffer.from(await r.arrayBuffer())};}
 const j=await r.json();check(r.ok&&j.success,'Cloudflare '+method+' '+path+' HTTP '+r.status+' codes '+JSON.stringify(j.errors?.map(e=>e.code)||[]));return j.result;
}
async function manifest(){const r=await fetch('https://'+worker+'.futurecode-dubai-86851bf2.workers.dev/api/football/manifest?release='+Date.now(),{signal:AbortSignal.timeout(20000)});check(r.ok,'Public manifest unavailable');return r.json();}
function metadata(settings,main){const out={main_module:main,keep_bindings:[...new Set(settings.bindings.map(b=>b.type))]};for(const k of ['compatibility_date','compatibility_flags','limits','logpush','placement','observability','tail_consumers'])if(settings[k]!==undefined)out[k]=settings[k];return out;}
function fingerprint(s){return JSON.stringify(s.bindings.map(b=>({name:b.name,type:b.type,...(b.type==='secret_text'?{}:b)})).sort((a,b)=>a.name.localeCompare(b.name)));}
async function uploadNew(){const form=new FormData();form.append('metadata',new Blob([JSON.stringify(metadata(oldSettings,'worker.mjs'))],{type:'application/json'}));for(const name of ['worker.mjs','validation.mjs','editorial-validation.mjs','corrections.mjs'])form.append(name,new Blob([readFileSync('services/football-engine/src/'+name)],{type:'application/javascript+module'}),name);await cf(workerPath,{method:'PUT',body:form});}
async function restoreWorker(){const prior=oldDeployments?.deployments?.[0]?.versions;check(prior?.length,'Rollback version unavailable');await cf(workerPath+'/deployments',{method:'POST',body:{strategy:'percentage',versions:prior}});}
function git(dir,args){try{return execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000}).trim();}catch{throw Error('Git source checkout failed');}}
try{
 check(workerToken?.length>24&&pagesToken?.length>24&&process.env.FOOTBALL_BACKUP_RECOVERY_KEY?.length>=32,'Existing scoped Worker/Pages/backup Secrets required');
 report.sourceCommit=git(root,['rev-parse','HEAD']);report.manifestBefore=await manifest();
 const pages=await cf(pagesPath,{token:pagesToken}),deployment=pages.canonical_deployment;
 check(deployment?.id&&deployment.environment==='production'&&deployment.latest_stage?.status==='success','Current canonical successful Pages deployment required');
 report.pagesBefore=deployment.id;
 const config=pages.source?.config;check(config?.owner==='futurecode064-cyber'&&config.repo_name==='AI-Recap-GitHub'&&pages.production_branch==='football-daily-render','Unexpected Pages source');
 const liveCommit=deployment.deployment_trigger?.metadata?.commit_hash;check(/^[a-f0-9]{40}$/.test(liveCommit||''),'Live Pages source commit missing');
 report.livePagesSourceCommit=liveCommit;
 const checkout=temp+'/pages';mkdirSync(checkout);git(checkout,['init','-q']);git(checkout,['remote','add','origin','https://github.com/'+config.owner+'/'+config.repo_name+'.git']);git(checkout,['fetch','--quiet','--depth=1','origin',liveCommit]);git(checkout,['checkout','--quiet','--detach','FETCH_HEAD']);
 const out=resolve(checkout,pages.build_config?.destination_dir||'football-daily');check(out.startsWith(checkout+'/'),'Unexpected Pages output path');check(readFileSync(out+'/index.html','utf8').includes('<html'),'Live Pages assets not present');
 for(const name of ['engine.html','engine.js','engine-model.js'])cpSync(root+'/football-daily/editor/'+name,out+'/editor/'+name);
 cpSync(root+'/football-daily/brand-odds-studio.js',out+'/brand-odds-studio.js');
 const changes=git(checkout,['diff','--name-only']).split('\n').filter(Boolean);
 check(changes.length>=1&&changes.length<=4&&changes.includes('football-daily/brand-odds-studio.js')&&changes.every(p=>p==='football-daily/brand-odds-studio.js'||/football-daily\/editor\/engine(?:-model)?\.(?:js|html)$/.test(p)),'Only Burmese league labels and existing owner-editor assets may change');
 report.staticFilesChanged=changes;
 oldSettings=await cf(workerPath+'/settings');check(oldSettings.bindings?.some(b=>b.name==='DB'&&b.id==='d2cc165f-5957-4b94-b2b1-9c79e79adbb1'),'Wrong production D1 binding');check(oldSettings.bindings.some(b=>b.name==='ADMIN_TOKEN'&&b.type==='secret_text'),'Production auth secret absent');
 oldDeployments=await cf(workerPath+'/deployments');check(oldDeployments?.deployments?.[0]?.versions?.length,'Worker rollback version unavailable');report.workerVersionsBefore=oldDeployments.deployments[0].versions;
 oldCode=await cf(workerPath,{raw:true});check(oldCode.type?.includes('multipart/form-data'),'Cannot safely back up module Worker');
 const parsed=await new Response(oldCode.bytes,{headers:{'Content-Type':oldCode.type}}).formData();const moduleNames=[...parsed.keys()].filter(n=>n!=='metadata');check(moduleNames.length>0,'No rollback modules');
 if(!oldSettings.main_module)oldSettings.main_module=oldSettings.entry_point||moduleNames.find(n=>/worker|index/.test(n))||moduleNames[0];
 const backup=Buffer.from(JSON.stringify({settings:oldSettings,type:oldCode.type,source:oldCode.bytes.toString('base64'),deployments:oldDeployments,pagesDeployment:deployment.id}));writeFileSync('football-owner-edit-code-backup.enc.json',JSON.stringify(encryptBackup(backup,process.env.FOOTBALL_BACKUP_RECOVERY_KEY,{keySource:'FOOTBALL_BACKUP_RECOVERY_KEY',source:'owner-corrections-code-release'})),{mode:0o600});report.rollbackSaved=true;
 const beforeFingerprint=fingerprint(oldSettings);const freshPages=await cf(pagesPath,{token:pagesToken});check(freshPages.canonical_deployment?.id===deployment.id,'Concurrent Pages deployment; rebase release');
 check(fingerprint(await cf(workerPath+'/settings'))===beforeFingerprint,'Worker bindings changed concurrently');
 await uploadNew();newWorker=true;
 let ready=false;for(let attempt=0;attempt<8;attempt++){try{const response=await fetch('https://'+worker+'.futurecode-dubai-86851bf2.workers.dev/api/football/health?release='+Date.now(),{signal:AbortSignal.timeout(20000)});const health=await response.json();if(response.ok&&health.ok&&health.capabilities?.includes('owner-corrections-v1')){ready=true;break;}}catch{}if(attempt<7)await new Promise(r=>setTimeout(r,3000));}check(ready,'New edit API health failed after propagation wait');
 check(fingerprint(await cf(workerPath+'/settings'))===beforeFingerprint,'Bindings changed after code upload');report.workerVerified=true;
 check((await cf(pagesPath,{token:pagesToken})).canonical_deployment?.id===deployment.id,'Pages changed concurrently before upload');
 // This is one code deployment, never part of ordinary correction/data publication.
 try{execFileSync(process.execPath,[root+'/services/football-engine/node_modules/wrangler/bin/wrangler.js','pages','deploy',out,'--project-name',projectName,'--branch',pages.production_branch,'--commit-hash',liveCommit,'--commit-message','Burmese league labels and named Special Choice ending support','--commit-dirty=true'],{cwd:root,env:{...process.env,CLOUDFLARE_API_TOKEN:pagesToken,CLOUDFLARE_ACCOUNT_ID:account,WRANGLER_SEND_METRICS:'false',CI:'true'},encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:180000,maxBuffer:2*1024*1024});pagesChanged=true;}catch{throw Error('Pages editor code deployment failed; inspect deployment status');}
 const finalPages=await cf(pagesPath,{token:pagesToken});report.pagesAfter=finalPages.canonical_deployment?.id;check(report.pagesAfter&&report.pagesAfter!==deployment.id,'Pages canonical deployment did not advance');
 const response=await fetch('https://future-code-football-daily.pages.dev/editor/engine.html',{redirect:'manual',signal:AbortSignal.timeout(20000)});check([200,302].includes(response.status),'Owner editor route unavailable');
 report.manifestAfter=await manifest();report.publicationUnchanged=report.manifestBefore.version===report.manifestAfter.version&&report.manifestBefore.generation===report.manifestAfter.generation;
 // A concurrently authorized content publication is preserved and reported, never rolled back.
 report.success=true;
}catch(e){report.error=String(e.message||e).replaceAll(workerToken||'__absent__','[redacted]').replaceAll(pagesToken||'__absent__','[redacted]').slice(0,1000);if(newWorker&&!pagesChanged){try{await restoreWorker();report.workerRolledBack=true;}catch(error){report.workerRollbackFailed=true;report.workerRollbackError=String(error.message).slice(0,300);}}}
finally{report.finishedAt=new Date().toISOString();writeFileSync('football-owner-corrections-release.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));rmSync(temp,{recursive:true,force:true});if(!report.success)process.exitCode=1;}
