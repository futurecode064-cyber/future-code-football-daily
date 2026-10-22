// Read-only authentication bridge. All credentials stay in GitHub Actions secrets.
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const API='https://api.cloudflare.com/client/v4';
export async function verifyCloudflareAccess({token,accountId,fetcher=fetch}){
 if(!token||token.length<20)throw Error('FOOTBALL_STAGING_CF_API_TOKEN is missing or invalid');
 if(!/^[a-f0-9]{32}$/.test(accountId||''))throw Error('Expected Cloudflare account ID is not configured');
 async function get(path){
  const r=await fetcher(API+path,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});
  const b=await r.json().catch(()=>null);
  // Do not echo API response bodies: they can contain account or credential details.
  if(!r.ok||b?.success!==true)throw Error('Cloudflare access check failed (HTTP '+r.status+'). Check token expiry, account scope and Workers/D1 permissions.');
  return b.result;
 }
 const workers=await get('/accounts/'+accountId+'/workers/scripts');
 const databases=await get('/accounts/'+accountId+'/d1/database?per_page=100');
 if(!Array.isArray(workers)||!Array.isArray(databases))throw Error('Unexpected Cloudflare API response');
 return {schemaVersion:1,checkedAt:new Date().toISOString(),authenticated:true,accountId,
  workersReadable:true,d1Readable:true,
  stagingWorkerExists:workers.some(w=>w.id==='future-code-football-engine-staging'),
  stagingDatabaseExists:databases.some(d=>d.name==='future-code-football-db-staging'),
  resourcesModified:false,productionDeploymentAttempted:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const report=await verifyCloudflareAccess({token:process.env.FOOTBALL_STAGING_CF_API_TOKEN,accountId:process.env.FOOTBALL_STAGING_CF_ACCOUNT_ID});
  const out=process.argv[2];if(out)writeFileSync(out,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
  console.log(JSON.stringify(report));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
