import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,mkdirSync,copyFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {resolve} from 'node:path';import {spawnSync,execFileSync} from 'node:child_process';
test('remote staging setup refuses an existing unowned Worker before any mutation and never emits its test credential',()=>{
 const dir=mkdtempSync(tmpdir()+'/football-guards-');try{
  const token='synthetic-test-only-token-123456789',out=dir+'/report.json';
  writeFileSync(dir+'/mock.mjs',`globalThis.fetch=async(url,o)=>{if(o.method!=='GET')throw Error('Unexpected mutation');const result=url.endsWith('/workers/scripts')?[{id:'future-code-football-engine-staging'}]:url.includes('/d1/database')?[]:{bindings:[]};return Response.json({success:true,result});};`);
  const source=resolve(new URL('../../../scripts/football/stage-cloudflare.mjs',import.meta.url).pathname);
  const fixture=dir+'/repo';mkdirSync(fixture+'/scripts/football',{recursive:true});mkdirSync(fixture+'/config/football',{recursive:true});
  copyFileSync(source,fixture+'/scripts/football/stage-cloudflare.mjs');
  writeFileSync(fixture+'/config/football/project.json',JSON.stringify({currentTask:'infrastructure-migration-only',deployment:{productionCutoverCompleted:false}}));
  for(const args of [['init'],['add','.'],['-c','user.name=Isolated test','-c','user.email=test@example.invalid','commit','-m','fixture'],['update-ref','refs/remotes/origin/main','HEAD']])execFileSync('git',args,{cwd:fixture,stdio:'pipe'});
  const script=fixture+'/scripts/football/stage-cloudflare.mjs';
  const r=spawnSync(process.execPath,['--import',dir+'/mock.mjs',script,out],{encoding:'utf8',env:{...process.env,FOOTBALL_STAGING_CF_API_TOKEN:token,FOOTBALL_STAGING_CF_ACCOUNT_ID:'a'.repeat(32)}});
  assert.equal(r.status,1);assert.match(r.stderr,/refusing overwrite/);assert.ok(!r.stderr.includes(token));
  const report=JSON.parse(readFileSync(out,'utf8'));assert.equal(report.productionModified,false);assert.equal(report.contentActivated,false);assert.equal(report.databaseCreated,undefined);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
