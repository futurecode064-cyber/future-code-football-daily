import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createClient,dayKey} from '../src/data-loader.mjs';
const now=new Date('2026-10-22T04:00:00Z');
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};};
function server({failPath='',version='v1'}={}){
 const calls=[];
 const fetcher=async input=>{
  const u=new URL(input);calls.push(u);
  if(u.pathname.endsWith('/manifest'))return Response.json({version,publishedAt:'2026-10-22T01:00:00Z'});
  if(u.pathname.endsWith('/resource')){
   const path=u.searchParams.get('path');
   if(path===failPath)return new Response(null,{status:503});
   if(path.includes('/fixtures/')||path.includes('/evening/'))return Response.json({error:'missing'},{status:404});
   return Response.json({reportDate:'2026-10-22',path,matches:[{fixtureId:'unchanged'}]}, {headers:{'X-Football-Version':version}});
  }
  return Response.json({static:true});
 };
 return {calls,fetcher};
}
const args={config:{enabled:true,apiBase:'https://engine.example'},assetRoot:'https://site.example/',pageUrl:'https://site.example/',now};
test('all brands share one complete pinned decision across report, odds, news, AI and exports',async()=>{
 for(const brand of ['main','goal-zone','bw-sport','ykz','ko-thet']){
  const s=server(),c=createClient({...args,brand,fetcher:s.fetcher});
  const urls=['data/today.json','data/odds/2026-10-22.json','data/today.json?ai=1','data/archive/2026-10-21.json','data/odds/evening/2026-10-22.json'];
  const responses=await Promise.all(urls.map(p=>c.fetch(new URL(p,args.assetRoot))));
  assert.equal(s.calls.filter(u=>u.pathname.endsWith('/manifest')).length,1);
  assert.ok(s.calls.every(u=>u.pathname.startsWith('/api/football/')),'no mixed static fetch');
  assert.ok(s.calls.filter(u=>u.pathname.endsWith('/resource')).every(u=>u.searchParams.get('version')==='v1'&&u.searchParams.get('brand')===brand));
  assert.equal(responses.at(-1).status,404);
  for(const r of responses.slice(0,-1))assert.equal(r.headers.get('X-Football-Version'),'v1');
  assert.equal((await c.fetch(new URL('data/news/latest.json',args.assetRoot))).status,['main','goal-zone'].includes(brand)?200:404);
 }
});
test('one failed preload makes the entire page static or restores a complete saved version',async()=>{
 const cache=storage(),good=server(),c=createClient({...args,storage:cache,fetcher:good.fetcher});await c.ready();
 const bad=server({failPath:'data/odds/2026-10-22.json',version:'v2'}),saved=createClient({...args,storage:cache,fetcher:bad.fetcher});
 assert.equal((await saved.fetch(new URL('data/today.json',args.assetRoot))).headers.get('X-Football-Version'),'v1');
 assert.equal((await saved.ready()).stale,true);
 const cold=createClient({...args,fetcher:bad.fetcher});
 for(const r of await Promise.all(['data/today.json','data/odds/2026-10-22.json'].map(p=>cold.fetch(new URL(p,args.assetRoot)))))assert.equal((await r.json()).static,true);
});
test('disabled config makes no API calls and unrelated assets retain native fetching',async()=>{
 const s=server(),c=createClient({...args,config:{enabled:false},fetcher:s.fetcher});
 assert.equal((await c.ready()).stale,false);
 await c.fetch(new URL('data/today.json',args.assetRoot));await c.fetch('https://images.example/logo.png');
 assert.equal(s.calls.length,2);assert.equal(s.calls[0].origin,'https://site.example');assert.equal(s.calls[1].origin,'https://images.example');
});
test('Yangon midnight and dated odds in a subdirectory keep correct paths',async()=>{
 assert.equal(dayKey(new Date('2026-10-21T17:29:59Z')),'2026-10-21');assert.equal(dayKey(new Date('2026-10-21T17:30:00Z')),'2026-10-22');
 const s=server(),c=createClient({...args,assetRoot:'https://site.example/football/',pageUrl:'https://site.example/football/bw-sport/odds.html?date=2026-10-20',brand:'bw-sport',fetcher:s.fetcher});
 assert.equal((await c.fetch('../data/odds/2026-10-20.json')).headers.get('X-Football-Version'),'v1');
 assert.ok(s.calls.some(u=>u.searchParams.get('path')==='data/odds/2026-10-20.json'));
});
test('ten existing pages load disabled config then client before their renderers',()=>{
 for(const folder of ['', 'future-code-journal/','bw-sport/','ykz-family/','ko-thet-family/'])for(const page of ['index.html','odds.html']){
  const html=readFileSync(new URL('../../../football-daily/'+folder+page,import.meta.url),'utf8');
  const config=html.indexOf('football-engine-config.js'),client=html.indexOf('football-data-client.js');
  assert.ok(config>0&&client>config);assert.ok(client<html.indexOf(page==='odds.html'?'odds.js?':'app.js?'));
 }
 assert.match(readFileSync(new URL('../../../football-daily/football-engine-config.js',import.meta.url),'utf8'),/enabled:false/);
});

test('older Android WebView without static Response.json can read pinned publications',async()=>{
 const NativeResponse=globalThis.Response;
 try{
  globalThis.Response=class extends NativeResponse {static json=undefined;};
  const fetcher=async input=>{
   const u=new URL(input);
   if(u.pathname.endsWith('/manifest'))return NativeResponse.json({version:'webview-version'});
   if(u.searchParams.get('path')!=='data/today.json')return new NativeResponse(null,{status:404});
   return NativeResponse.json({reportDate:'2026-10-22',matches:[]},{headers:{'X-Football-Version':'webview-version'}});
  };
  const c=createClient({...args,fetcher});
  assert.equal((await c.fetch(new URL('data/today.json',args.assetRoot))).headers.get('X-Football-Version'),'webview-version');
  assert.equal((await c.fetch(new URL('data/odds/evening/2026-10-22.json',args.assetRoot))).status,404);
 }finally{globalThis.Response=NativeResponse;}
});

test('editorial rollover follows the active D1 report rather than Yangon midnight',async()=>{
 const called=[];
 const server=async input=>{
  const u=new URL(input);
  if(u.pathname.endsWith('/manifest'))return Response.json({version:'v-midnight'});
  if(u.pathname.endsWith('/resource')){
   const path=u.searchParams.get('path');called.push(path);
   if(path.includes('/fixtures/')||path.includes('/evening/'))return Response.json({error:'missing'},{status:404});
   return Response.json({reportDate:'2026-10-24',matches:[]},{headers:{'X-Football-Version':'v-midnight'}});
  }
  throw Error('Unexpected static request');
 };
 const c=createClient({...args,now:new Date('2026-10-24T18:00:00Z'),fetcher:server});
 assert.equal(c.currentDate(),'2026-10-25');
 await c.ready();
 assert.equal(c.currentDate(),'2026-10-24');
 assert.equal(c.currentVersion(),'v-midnight');
 assert(called.includes('data/archive/2026-10-23.json'));
 assert(called.includes('data/odds/2026-10-24.json'));
 assert(!called.includes('data/archive/2026-10-24.json'));
 assert.equal((await c.fetch(new URL('data/archive/2026-10-23.json',args.assetRoot))).status,200);
});

test('the public client never starts timed, focus or visibility manifest polling',()=>{
 const clientSource=readFileSync(new URL('../../../football-daily/football-data-client.js',import.meta.url),'utf8');
 assert.match(clientSource,/root\.FootballData=Object\.freeze\(client\);client\.ready\(\);/);
 assert.doesNotMatch(clientSource,/setInterval\s*\(/);
 assert.doesNotMatch(clientSource,/addEventListener\(['"]focus['"]/);
 assert.doesNotMatch(clientSource,/visibilitychange/);
 assert.doesNotMatch(clientSource,/45000|600000/);
});
