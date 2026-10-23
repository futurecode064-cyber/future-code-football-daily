import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../../football-daily/_worker.js',import.meta.url),'utf8');
const origin='https://future-code-football-daily.pages.dev';
const request=(path,opts={})=>new Request(origin+path,opts);
const create=()=>({FCD_MAIN_PASSWORD:'test-password',FCD_SESSION_SECRET:'test-only-012345678901234567890123456789',ASSETS:{fetch:async()=>new Response('asset')}});
const module=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
async function login(w,e){const r=await w.fetch(request('/login'),e),text=await r.text(),csrf=text.match(/name="csrf"[^>]*value="([^"]+)"/)[1],cookie=r.headers.get('Set-Cookie').split(';')[0];const result=await w.fetch(request('/login',{method:'POST',headers:{Origin:origin,Cookie:cookie},body:new URLSearchParams({email:'futurecode064@gmail.com',password:e.FCD_MAIN_PASSWORD,csrf,next:'/editor/'})}),e);return result.headers.get('Set-Cookie').split(';')[0];}
test('new engine endpoints enforce existing owner session and stay disabled without bindings',async()=>{const {default:w}=await module(),e=create();assert.equal((await w.fetch(request('/api/editor/engine/state'),e)).status,401);const Cookie=await login(w,e);assert.equal((await w.fetch(request('/api/editor/engine/state',{headers:{Cookie}}),e)).status,503);assert.equal((await w.fetch(request('/bw-sport/'),e)).status,200);});
test('owner proxy enforces CSRF and forwards secret only through service binding',async()=>{const {default:w}=await module(),e=create(),Cookie=await login(w,e);let captured;e.FCD_ENGINE_ENABLED='true';e.FCD_ENGINE_TOKEN='test-internal-token';e.FOOTBALL_ENGINE={fetch:async r=>{captured=r;return Response.json({version:'test-draft'});}};
const opts={method:'POST',headers:{Cookie,Origin:'https://evil.test','Content-Type':'application/json','X-Football-Editor':'1'},body:'{}'};assert.equal((await w.fetch(request('/api/editor/engine/import',opts),e)).status,403);opts.headers.Origin=origin;opts.headers.Authorization='Bearer attacker-value';const r=await w.fetch(request('/api/editor/engine/import',opts),e);assert.equal(r.status,200);assert.equal(captured.headers.get('Authorization'),'Bearer test-internal-token');assert.equal(captured.headers.get('Cookie'),null);assert.equal(captured.url,'https://football-engine.internal/api/admin/import');assert.ok(!(await r.text()).includes(e.FCD_ENGINE_TOKEN));assert.match(r.headers.get('Cache-Control'),/no-store/);});
test('enabled D1 mode blocks legacy GitHub publication instead of falling back',async()=>{
 const {default:w}=await module(),e=create(),Cookie=await login(w,e);e.FCD_ENGINE_ENABLED='true';
 for(const path of ['/api/editor/save','/api/editor/news/publish']){
  assert.equal((await w.fetch(request(path,{method:'POST',headers:{Cookie,Origin:origin},body:'{}'}),e)).status,409);
 }
 assert.equal((await w.fetch(request('/api/editor/save'),e)).status,401);
});
