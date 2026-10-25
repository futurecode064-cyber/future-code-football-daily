import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readdirSync,readFileSync} from 'node:fs';
import {runScheduledPublication} from '../src/worker.mjs';
class D1 {
 constructor(){this.sql=new DatabaseSync(':memory:');for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())this.sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));}
 prepare(query){const db=this;return {values:[],bind(...args){this.values=args;return this;},async first(){return db.sql.prepare(query).get(...this.values)||null;},async all(){return {results:db.sql.prepare(query).all(...this.values)};},async run(){const r=db.sql.prepare(query).run(...this.values);return {meta:{changes:Number(r.changes)}};}};}
 async batch(ops){this.sql.exec('BEGIN');try{const results=[];for(const op of ops)results.push(await op.run());this.sql.exec('COMMIT');return results;}catch(e){this.sql.exec('ROLLBACK');throw e;}}
}
const now=new Date('2026-10-24T23:30:00Z');
const date='2026-10-25';
function setup({stale=false,validated=true}={}){
 const DB=new D1(),q=DB.sql,old='00000000-0000-4000-8000-000000000001',next='00000000-0000-4000-8000-000000000002';
 const add=q.prepare('INSERT INTO publication_versions(id,parent_id,editorial_date,idempotency_key,input_hash,source_manifest,created_at,validated_at,ever_published) VALUES(?,?,?,?,?,?,?,?,?)');
 add.run(old,null,'2026-10-24','old','h','{"files":[]}',now.toISOString(),now.toISOString(),1);
 add.run(next,old,date,'next','h','{"files":[]}',now.toISOString(),validated?now.toISOString():null,0);
 q.prepare('UPDATE active_publication SET version_id=?,generation=?,changed_at=? WHERE singleton=1').run(old,stale?2:1,now.toISOString());
 const body=JSON.stringify({reportDate:date,published:true,matches:[]});
 q.prepare('INSERT INTO resource_blobs(digest,body) VALUES(?,?)').run('a',body);
 q.prepare('INSERT INTO resource_refs(version_id,path,digest) VALUES(?,?,?)').run(next,'data/today.json','a');
 q.prepare("INSERT INTO scheduled_publications(target_date,version_id,expected_generation,status,created_at) VALUES(?,?,1,'ready',?)").run(date,next,now.toISOString());
 return {DB,old,next};
}
test('nightly publication atomically advances once and leaves immutable report untouched',async()=>{
 const env=setup(),first=await runScheduledPublication(env,now);
 assert.equal(first.status,'published');
 assert.equal((await runScheduledPublication(env,now)).status,'published');
 assert.equal(env.DB.sql.prepare('SELECT generation FROM active_publication').get().generation,2);
 assert.equal(env.DB.sql.prepare("SELECT count(*) AS n FROM audit_logs WHERE action='activate'").get().n,2);
});
test('stale generation and unvalidated drafts fail closed',async()=>{
 for(const change of [{stale:true},{validated:false}]){
  const env=setup(change),result=await runScheduledPublication(env,now);
  assert.equal(result.status,'blocked');
  assert.equal(env.DB.sql.prepare('SELECT version_id FROM active_publication').get().version_id,env.old);
 }
});
test('missing schedule never changes live publication',async()=>{
 const env=setup();env.DB.sql.exec('DELETE FROM scheduled_publications');
 assert.equal((await runScheduledPublication(env,now)).status,'not-ready');
 assert.equal(env.DB.sql.prepare('SELECT version_id FROM active_publication').get().version_id,env.old);
});
