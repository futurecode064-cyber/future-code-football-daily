import test from 'node:test';import assert from 'node:assert/strict';import {loadPublishedBundle} from '../src/data-loader.mjs';
const store=()=>{const data=new Map();return {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};};
const fetcher=async url=>new URL(url).pathname.endsWith('manifest')?Response.json({version:'v1',publishedAt:'2026-10-22T01:00:00Z'}):Response.json({matches:[]},{headers:{'X-Football-Version':'v1'}});
test('bundle commits only after every requested resource has the same version; failure preserves complete saved bundle',async()=>{const storage=store(),args={apiBase:'https://engine.example',paths:['data/today.json','data/odds/2026-10-22.json'],storage};const one=await loadPublishedBundle({...args,fetcher});assert.equal(one.version,'v1');assert.equal(one.stale,false);const fallback=await loadPublishedBundle({...args,fetcher:async()=>{throw Error('offline');}});assert.equal(fallback.version,'v1');assert.equal(fallback.stale,true);assert.equal(Object.keys(fallback.resources).length,2);});
test('a mixed version never replaces existing UI; saved data for another date cannot be used',async()=>{const storage=store(),args={apiBase:'https://engine.example',paths:['data/today.json'],storage};const bad=async url=>new URL(url).pathname.endsWith('manifest')?Response.json({version:'v2'}):Response.json({},{headers:{'X-Football-Version':'v1'}});assert.equal((await loadPublishedBundle({...args,fetcher:bad})).fallback,'static');await loadPublishedBundle({...args,fetcher});assert.equal((await loadPublishedBundle({...args,paths:['data/odds/2026-10-23.json'],fetcher:bad})).fallback,'static');});

test('offline fallback is isolated by API origin and brand',async()=>{
 const storage=store(),args={apiBase:'https://staging.example',brand:'main',paths:['data/today.json'],storage};
 await loadPublishedBundle({...args,fetcher});
 const offline=async()=>{throw Error('offline');};
 for(const overrides of [{apiBase:'https://production.example'},{brand:'bw-sport'},{apiBase:'http://staging.example'},{apiBase:'invalid'}]){
  assert.equal((await loadPublishedBundle({...args,...overrides,fetcher:offline})).fallback,'static');
 }
 assert.equal((await loadPublishedBundle({...args,apiBase:'https://staging.example/',fetcher:offline})).version,'v1');
});
test('a partial failed refresh preserves the previous complete publication',async()=>{
 const storage=store(),args={apiBase:'https://engine.example',paths:['data/today.json','data/odds/2026-10-22.json'],storage};
 await loadPublishedBundle({...args,fetcher});
 const partial=async url=>{
  const parsed=new URL(url);
  if(parsed.pathname.endsWith('manifest'))return Response.json({version:'v2'});
  if(parsed.searchParams.get('path').includes('odds'))return new Response(null,{status:503});
  return Response.json({matches:[{fixtureId:'new'}]},{headers:{'X-Football-Version':'v2'}});
 };
 const result=await loadPublishedBundle({...args,fetcher:partial});
 assert.equal(result.version,'v1');assert.equal(result.stale,true);
 assert.deepEqual(result.resources['data/today.json'],{matches:[]});
});
