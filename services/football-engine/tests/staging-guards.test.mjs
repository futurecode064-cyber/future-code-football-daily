import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync,copyFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {resolve} from 'node:path';import {spawnSync,execFileSync} from 'node:child_process';
test('remote staging setup refuses an existing unowned Worker before any mutation and never emits its test credential',()=>{
 const dir=mkdtempSync(tmpdir()+'/football-guards-');try{
  const token='synthetic-test-only-token-123456789',out=dir+'/report.json';
  writeFileSync(dir+'/mock.mjs',`globalThis.fetch=async(url,o)=>{if(o.method!=='GET')throw Error('Unexpected mutation');const result=url.endsWith('/workers/scripts')?[{id:'future-code-football-engine-staging'}]:url.includes('/d1/database')?[]:{bindings:[]};return Response.json({success:true,result});};`);
  const source=resolve(new URL('../../../scripts/football/stage-cloudflare.mjs',import.meta.url).pathname);
  const fixture=dir+'/repo';mkdirSync(fixture+'/scripts/football',{recursive:true});mkdirSync(fixture+'/config/football',{recursive:true});
  copyFileSync(source,fixture+'/scripts/football/stage-cloudflare.mjs');copyFileSync(resolve(new URL('../../../scripts/football/backup-crypto.mjs',import.meta.url).pathname),fixture+'/scripts/football/backup-crypto.mjs');
  writeFileSync(fixture+'/config/football/project.json',JSON.stringify({currentTask:'infrastructure-migration-only',deployment:{productionCutoverCompleted:false}}));
  for(const args of [['init'],['add','.'],['-c','user.name=Isolated test','-c','user.email=test@example.invalid','commit','-m','fixture'],['update-ref','refs/remotes/origin/main','HEAD']])execFileSync('git',args,{cwd:fixture,stdio:'pipe'});
  const script=fixture+'/scripts/football/stage-cloudflare.mjs';
  const r=spawnSync(process.execPath,['--import',dir+'/mock.mjs',script,out],{encoding:'utf8',env:{...process.env,FOOTBALL_STAGING_CF_API_TOKEN:token,FOOTBALL_STAGING_CF_ACCOUNT_ID:'a'.repeat(32)}});
  assert.equal(r.status,1);assert.match(r.stderr,/refusing overwrite/);assert.ok(!r.stderr.includes(token));
  const report=JSON.parse(readFileSync(out,'utf8'));assert.equal(report.productionModified,false);assert.equal(report.contentActivated,false);assert.equal(report.databaseCreated,undefined);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('private production setup refuses an already active owned database before deploy or secret rotation',()=>{
 const dir=mkdtempSync(tmpdir()+'/football-prod-guard-');try{
  const owner='futurecode064-cyber/future-code-football-daily',token='synthetic-test-only-token-123456789',out=dir+'/report.json';
  const fixture=dir+'/repo';mkdirSync(fixture+'/scripts/football',{recursive:true});mkdirSync(fixture+'/config/football',{recursive:true});
  for(const f of ['stage-cloudflare.mjs','backup-crypto.mjs'])copyFileSync(resolve(new URL('../../../scripts/football/'+f,import.meta.url).pathname),fixture+'/scripts/football/'+f);
  writeFileSync(fixture+'/config/football/project.json',JSON.stringify({currentTask:'infrastructure-migration-only',deployment:{productionCutoverCompleted:false}}));
  for(const args of [['init'],['add','.'],['-c','user.name=Isolated test','-c','user.email=test@example.invalid','commit','-m','fixture'],['update-ref','refs/remotes/origin/main','HEAD']])execFileSync('git',args,{cwd:fixture,stdio:'pipe'});
  writeFileSync(dir+'/mock.mjs',`globalThis.fetch=async(url,o)=>{let result;if(url.endsWith('/workers/scripts'))result=[{id:'future-code-football-engine'}];else if(url.includes('/settings'))result={bindings:[{name:'FOOTBALL_ENGINE_MANAGED_BY',text:${JSON.stringify(owner)}}]};else if(url.endsWith('/query')){const b=JSON.parse(o.body);if(!b.sql.startsWith('SELECT'))throw Error('Unexpected database mutation');result=[{results:b.sql.includes('SELECT owner')?[{owner:${JSON.stringify(owner)}}]:b.sql.includes('sqlite_master')?[{name:'active_publication'}]:[{version_id:'active-publication',generation:1}]}];}else if(url.includes('/d1/database'))result=[{name:'future-code-football-db',uuid:'b'.repeat(36)}];else throw Error('Unexpected mutation');return Response.json({success:true,result});};`);
  const r=spawnSync(process.execPath,['--import',dir+'/mock.mjs',fixture+'/scripts/football/stage-cloudflare.mjs',out],{encoding:'utf8',env:{...process.env,FOOTBALL_STAGING_CF_API_TOKEN:token,FOOTBALL_STAGING_CF_ACCOUNT_ID:'a'.repeat(32),FOOTBALL_ENGINE_SETUP_TARGET:'production-private',FOOTBALL_BACKUP_RECOVERY_KEY:'synthetic-recovery-12345678901234567890'}});
  assert.equal(r.status,1);assert.match(r.stderr,/Active publication exists; refusing Worker deployment or secret rotation/);assert.ok(!r.stderr.includes(token));const report=JSON.parse(readFileSync(out));assert.equal(report.workerDeployed,undefined);assert.equal(report.contentActivated,false);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
