// Isolated local workerd/D1 test. Never contacts a remote database or publishes to a website.
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),scratch=mkdtempSync(tmpdir()+'/football-workerd-');
const token=randomBytes(32).toString('hex');let mf;
try{
 execFileSync(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'deploy','--dry-run','--config',resolve(root,'wrangler.local.jsonc'),'--outdir',scratch+'/bundle'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:'pipe'});
 mf=new Miniflare(convertV4MiniflareOptions({name:"football-local",rootPath:scratch,modules:true,scriptPath:scratch+'/bundle/worker.js',compatibilityDate:'2026-10-22',
  d1Databases:{DB:'local-only'},bindings:{ENVIRONMENT:'local',ADMIN_TOKEN:token},
  ratelimits:{ADMIN_RATE_LIMITER:{namespace_id:'782104',simple:{limit:100,period:60}}}}));
 const db=await mf.getD1Database('DB');
 for(const name of readdirSync(resolve(root,'migrations')).filter(n=>n.endsWith('.sql')).sort()){
  // D1 exec splits at line boundaries; send each complete schema script as one statement.
  const sql=readFileSync(resolve(root,'migrations',name),'utf8');
  const statements=[];let current='';
  for(const line of sql.split('\n')){
   if(line.trim().startsWith('--'))continue;
   current+=line+'\n';
   if(line.trim().endsWith(';')&&(!current.includes('CREATE TRIGGER')||line.trim()==='END;')){statements.push(db.prepare(current));current='';}
  }
  await db.batch(statements);
 }
 async function call(path,body,key){const r=await mf.dispatchFetch('https://local.test'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined});const value=await r.json();assert.ok(r.ok,JSON.stringify({path,status:r.status,value}));return value;}
 assert.equal((await call('/api/football/health')).environment,'local');
 assert.equal((await mf.dispatchFetch('https://local.test/api/admin/state')).status,401);
 const folder=scratch+'/batches';
 execFileSync(process.execPath,[resolve(root,'../../scripts/football/prepare-migration.mjs'),resolve(root,'../../football-daily'),folder],{stdio:'pipe'});
 let draft,expected={},batches=0;
 for(const name of readdirSync(folder).filter(n=>n.startsWith('batch-')).sort()){
  const b=JSON.parse(readFileSync(folder+'/'+name,'utf8'));if(draft)b.baseDraft=draft;
  Object.assign(expected,b.resources);draft=(await call('/api/admin/import',b,'runtime-batch-'+(++batches))).version;
 }
 const loaded=await call('/api/admin/draft?version='+draft);assert.deepEqual(loaded.resources,expected);
 const exported=await call('/api/admin/export?version='+draft),text=JSON.stringify(exported);
 writeFileSync(scratch+'/backup.json',text,{mode:0o600});writeFileSync(scratch+'/backup.json.sha256',createHash('sha256').update(text).digest('hex'),{mode:0o600});
 execFileSync(process.execPath,[resolve(root,'../../scripts/football/prepare-restore.mjs'),scratch+'/backup.json',scratch+'/restore','0'],{stdio:'pipe'});
 let restored,n=0;
 for(const name of readdirSync(scratch+'/restore').sort()){
  const b=JSON.parse(readFileSync(scratch+'/restore/'+name,'utf8'));if(restored)b.baseDraft=restored;
  restored=(await call('/api/admin/import',b,'runtime-restore-'+(++n))).version;
 }
 assert.deepEqual((await call('/api/admin/draft?version='+restored)).resources,expected);
 assert.equal((await call('/api/admin/state')).version_id,null);
 assert.equal((await mf.dispatchFetch('https://local.test/api/football/today')).status,503);
 console.log(JSON.stringify({runtime:'workerd + local D1',resources:Object.keys(expected).length,batches,draftParity:true,backupRestoreParity:true,unauthorizedBlocked:true,publicDraftHidden:true,productionRequests:0}));
}finally{
 if(mf)await mf.dispose();
 rmSync(scratch,{recursive:true,force:true});
}
