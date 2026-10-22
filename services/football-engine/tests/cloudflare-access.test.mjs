import test from 'node:test';import assert from 'node:assert/strict';
import {verifyCloudflareAccess} from '../../../scripts/football/verify-cloudflare-access.mjs';
const token='synthetic-test-token-not-a-real-credential',accountId='a'.repeat(32);
test('access bridge uses only fixed Cloudflare GET endpoints and returns no credential or unrelated inventory',async()=>{
 const calls=[];
 const r=await verifyCloudflareAccess({token,accountId,fetcher:async(url,options)=>{
  calls.push({url,options});
  return Response.json({success:true,result:url.includes('/d1/')?[{name:'goalzone-analytics'},{name:'future-code-football-db-staging'}]:[{id:'future-code-football-test'}]});
 }});
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c.url.startsWith('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/')&&c.options.method==='GET'&&c.options.redirect==='error'));
 assert.ok(calls.every(c=>c.options.headers.Authorization==='Bearer '+token));
 assert.equal(r.authenticated,true);assert.equal(r.resourcesModified,false);assert.equal(r.stagingWorkerExists,false);assert.equal(r.stagingDatabaseExists,true);
 assert.ok(!JSON.stringify(r).includes(token));assert.ok(!JSON.stringify(r).includes('goalzone-analytics'));
});
test('missing/incorrect credentials and API errors fail closed without echoing API bodies',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return Response.json({success:false,errors:[{message:token}]},{status:403});};
 await assert.rejects(verifyCloudflareAccess({accountId,fetcher}),/missing or invalid/);assert.equal(calls,0);
 await assert.rejects(verifyCloudflareAccess({token,accountId:'wrong',fetcher}),/account ID/);assert.equal(calls,0);
 await assert.rejects(verifyCloudflareAccess({token,accountId,fetcher}),e=>e.message.includes('HTTP 403')&&!e.message.includes(token));
});
