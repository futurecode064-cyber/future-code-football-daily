import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';import {resolve} from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
test('restore preparation verifies hashes, preserves all resources and never publishes',()=>{
 const dir=mkdtempSync(tmpdir()+'/football-restore-');try{
  const resources={'data/today.json':{reportDate:'2026-10-22',matches:[]}};
  for(let i=1;i<=24;i++)resources['data/archive/2026-09-'+String(i).padStart(2,'0')+'.json']={reportDate:'2026-09-'+String(i).padStart(2,'0'),matches:[]};
  const text=JSON.stringify({schemaVersion:1,kind:'football-publication-backup',version:{id:'prior',editorial_date:'2026-10-22'},resources});
  writeFileSync(dir+'/backup.json',text);writeFileSync(dir+'/backup.json.sha256',createHash('sha256').update(text).digest('hex'));
  const script=resolve(new URL('../../../scripts/football/prepare-restore.mjs',import.meta.url).pathname);
  const result=JSON.parse(execFileSync(process.execPath,[script,dir+'/backup.json',dir+'/restored','7'],{encoding:'utf8'}));
  assert.equal(result.publicationAttempted,false);assert.equal(result.batches,2);
  const restored={};for(const f of readdirSync(dir+'/restored')){const b=JSON.parse(readFileSync(dir+'/restored/'+f,'utf8'));assert.equal(b.expectedGeneration,7);assert.ok(Object.keys(b.resources).length<=20);Object.assign(restored,b.resources);}
  assert.deepEqual(restored,resources);writeFileSync(dir+'/backup.json',text+' ');
  assert.throws(()=>execFileSync(process.execPath,[script,dir+'/backup.json',dir+'/bad','7'],{stdio:'pipe'}),/Command failed/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('private draft preview removes inherited static JSON absent from selected snapshot without changing source',()=>{
 const dir=mkdtempSync(tmpdir()+'/football-preview-');try{
  const source=dir+'/source';mkdirSync(source+'/data/archive',{recursive:true});
  writeFileSync(source+'/index.html','<!doctype html><body>Existing brand design</body>');
  const original='{"reportDate":"2026-10-21","matches":[]}';writeFileSync(source+'/data/today.json',original);
  writeFileSync(source+'/data/archive/2026-10-20.json',original);
  const resources={'data/today.json':{reportDate:'2026-10-22',matches:[]}},text=JSON.stringify({schemaVersion:1,kind:'football-publication-backup',version:{id:'private-draft'},resources});
  writeFileSync(dir+'/snapshot.json',text);writeFileSync(dir+'/snapshot.json.sha256',createHash('sha256').update(text).digest('hex'));
  const script=resolve(new URL('../../../scripts/football/prepare-draft-preview.mjs',import.meta.url).pathname);
  const result=JSON.parse(execFileSync(process.execPath,[script,source,dir+'/snapshot.json',dir+'/preview'],{encoding:'utf8'}));
  assert.equal(result.publicationAttempted,false);assert.equal(readFileSync(source+'/data/today.json','utf8'),original);
  assert.deepEqual(readdirSync(dir+'/preview/data/archive'),[]);
  assert.deepEqual(JSON.parse(readFileSync(dir+'/preview/data/today.json','utf8')),resources['data/today.json']);
  assert.match(readFileSync(dir+'/preview/DRAFT_PREVIEW_ONLY.txt','utf8'),/PRIVATE DRAFT QA ONLY/);
  assert.throws(()=>execFileSync(process.execPath,[script,source,dir+'/snapshot.json',source+'/nested'],{stdio:'pipe'}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
