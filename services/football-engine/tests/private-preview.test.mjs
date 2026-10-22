import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {createClient}=require('../../../football-daily/football-data-client.js');
const version='a908e488-09bd-4658-a7e9-94ee60701262',root='https://preview.test/';
test('owner draft preview uses pinned small authenticated resources without caching private data',async()=>{
 const requests=[];const c=createClient({assetRoot:root,pageUrl:root+'bw-sport/?fcDraft='+version,brand:'bw-sport',storage:{setItem(){throw Error('Private draft must not be cached');}},fetcher:async(url,init)=>{
  requests.push({url:String(url),init});const path=new URL(url).searchParams.get('path');
  return path==='data/today.json'?Response.json({matches:[{fixtureId:'private'}]},{headers:{'X-Football-Version':version}}):Response.json({error:'Missing'},{status:404});
 }});const state=await c.ready();assert.equal(state.draft,true);assert.equal(state.version,version);assert.ok(requests.every(r=>r.init.credentials==='same-origin'&&r.url.includes('/api/editor/engine/resource')));assert.ok(!requests.some(r=>r.url.includes('news')));assert.equal((await c.fetch(root+'data/news/latest.json')).status,404);assert.equal((await (await c.fetch(root+'data/today.json')).json()).matches[0].fixtureId,'private');
});
test('unauthorized private preview fails closed without a public/static data fallback',async()=>{
 const requests=[];const c=createClient({assetRoot:root,pageUrl:root+'?fcDraft='+version,fetcher:async url=>{requests.push(String(url));return Response.json({error:'Unauthorized'},{status:401});}});
 assert.equal((await c.ready()).error,'Owner draft unavailable');assert.equal((await c.fetch(root+'data/today.json')).status,503);assert.ok(requests.every(u=>u.includes('/api/editor/engine/resource')));
});
test('one wrong version in a private preview prevents a mixed draft',async()=>{
 const c=createClient({assetRoot:root,pageUrl:root+'?fcDraft='+version,fetcher:async()=>Response.json({matches:[]},{headers:{'X-Football-Version':'wrong'}})});
 assert.equal((await c.fetch(root+'data/today.json')).status,503);
});
