// Export the managed STAGING D1 database, encrypt the whole SQL dump before uploading an artifact.
// No production DB access, no plaintext logs, no public publication, no Worker code deployment.
import {mkdtempSync,readFileSync,writeFileSync,rmSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {encryptBackup,decryptBackup} from './backup-crypto.mjs';

const repo=resolve(new URL('../../',import.meta.url).pathname);
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN;
const independent=process.env.FOOTBALL_BACKUP_RECOVERY_KEY;
const backupKey=independent||token;
const accountId='86851bf21d81d8f0972052aff8162149';
const dbId='a4ddc00f-411b-4ee5-ab4a-dfe13486c334';
const dbName='future-code-football-db-staging';
const output=resolve(process.argv[2]||'football-staging-encrypted-backup.json');
const reportPath=resolve(process.argv[3]||'football-staging-backup-report.json');
const scratch=mkdtempSync(tmpdir()+'/football-backup-');
const report={kind:'staging-d1-encrypted-backup',stagingOnly:true,productionModified:false,
  databaseName:dbName,encrypted:false,restoreVerified:false};
function save(){writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});}
try {
 assert.ok(token&&token.length>=32,'Repository staging token secret required');
 assert.ok(backupKey&&backupKey.length>=32,'Recovery secret needs at least 32 characters');
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/d1/database/'+dbId,{
  headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(20000)});
 const meta=await response.json();assert.ok(response.ok&&meta.success,'D1 metadata read failed');
 assert.equal(meta.result.uuid,dbId);assert.equal(meta.result.name,dbName,'D1 name differs; refuse export');
 const config={name:'future-code-football-engine-staging',compatibility_date:'2026-10-22',
  main:resolve(repo,'services/football-engine/src/worker.mjs'),account_id:accountId,
  d1_databases:[{binding:'DB',database_name:dbName,database_id:dbId}]};
 const configPath=resolve(scratch,'wrangler.json');
 writeFileSync(configPath,JSON.stringify(config),{mode:0o600});
 const sqlPath=resolve(scratch,'staging.sql');
 execFileSync(process.execPath,[resolve(repo,'services/football-engine/node_modules/wrangler/bin/wrangler.js'),
  'd1','export','DB','--remote','--config',configPath,'--output',sqlPath,'--skip-confirmation'],{
  cwd:repo,encoding:'utf8',env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:accountId,
   WRANGLER_SEND_METRICS:'false',CI:'true'},stdio:['ignore','pipe','pipe'],maxBuffer:1024*1024});
 const input=readFileSync(sqlPath);assert.ok(input.length>10000,'Export too small');
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(input.toString('utf8'));
  const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  const count=db.prepare('SELECT count(*) AS n FROM resource_blobs').get().n;
  const active=db.prepare('SELECT version_id,generation FROM active_publication WHERE singleton=1').get();
  assert.ok(tables.length>=6&&count>=30,'Export missing required staging resources');
  assert.equal(active.generation,0,'Unexpected active staging publication; pause backup acceptance');
  assert.equal(active.version_id,null,'Unexpected staged public content');
  report.tables=tables.length;report.uniqueResources=Number(count);report.noActivePublication=true;
 }finally{db.close();}
 const encrypted=encryptBackup(input,backupKey,{keySource:independent?'FOOTBALL_BACKUP_RECOVERY_KEY':'FOOTBALL_STAGING_CF_API_TOKEN',
    source:dbName});
 assert.deepEqual(decryptBackup(encrypted,backupKey),input);
 writeFileSync(output,JSON.stringify(encrypted)+'\n',{mode:0o600});
 report.encrypted=true;report.restoreVerified=true;report.encryptedBytes=statSync(output).size;
 report.sqlBytes=input.length;report.sqlSha256=encrypted.sqlSha256;
 report.keySource=encrypted.keySource;
 report.recoveryCaution=independent?'Independent secret required to decrypt later':'Recovery depends on retention of the current Cloudflare migration token secret; replace with an independent recovery key before production';
 report.completedAt=new Date().toISOString();save();
 console.log(JSON.stringify({encrypted:true,restoreVerified:true,sqlBytes:report.sqlBytes,
  backupKeySource:report.keySource,productionModified:false}));
}catch(error){report.error=String(error.message||error).replaceAll(token||'__no_token__','[redacted]').replaceAll(independent||'__no_independent__','[redacted]').slice(0,600);save();console.error(report.error);process.exitCode=1;}
finally{rmSync(scratch,{recursive:true,force:true});}
