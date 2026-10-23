// Probe only the Pages Write permission through the smallest no-op project PATCH.
// Never send existing secret text, binding maps or the source configuration in a PATCH.
// This action requires explicit release authorization and does not enable the API.
import {writeFileSync} from 'node:fs';
const account='86851bf21d81d8f0972052aff8162149';
const project='future-code-football-daily';
const token=process.env.FOOTBALL_PAGES_CF_API_TOKEN;
if(!token||token.length<20)throw Error('FOOTBALL_PAGES_CF_API_TOKEN not configured');
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects/'+project;
const report={kind:'pages-write-no-op-probe',productionActivated:false,sourceChanged:false,checkedAt:new Date().toISOString()};
async function cf(method,body){
 const response=await fetch(endpoint,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(20000)});
 let data={};try{data=await response.json();}catch{}
 return {httpStatus:response.status,ok:response.ok&&data.success===true,result:data.result};
}
function shape(o){
 return {name:o?.name,productionBranch:o?.production_branch,deployId:o?.latest_deployment?.id,
  sourceOwner:o?.source?.config?.owner,sourceRepo:o?.source?.config?.repo_name,
  envNames:Object.keys(o?.deployment_configs?.production?.env_vars||{}).sort(),
  serviceBindings:o?.deployment_configs?.production?.services||{},
  d1Bindings:o?.deployment_configs?.production?.d1_databases||{}};
}
try{
 const b=await cf('GET');report.getStatus=b.httpStatus;
 if(!b.ok||b.result?.name!==project)throw Error('Pages project GET failed or wrong project');
 const before=shape(b.result);if(before.sourceOwner!=='futurecode064-cyber'||before.sourceRepo!=='AI-Recap-GitHub'||before.productionBranch!=='football-daily-render')throw Error('Unexpected Pages production source');
 if(before.envNames.includes('FCD_ENGINE_TOKEN')||before.serviceBindings.FOOTBALL_ENGINE)throw Error('Pages already configured; refuse no-op release probe');
 if(!before.envNames.includes('FCD_MAIN_PASSWORD')||!before.envNames.includes('FCD_SESSION_SECRET')||!before.d1Bindings.GOALZONE_ANALYTICS_DB)throw Error('Existing owner/analytics secrets or binding missing');
 // Same project name is the only PATCH field, no source, deployment or binding data.
 const patch=await cf('PATCH',{name:project});report.patchStatus=patch.httpStatus;report.writeAllowed=patch.ok;
 if(!patch.ok)throw Error('Pages Write not authorized; HTTP '+patch.httpStatus);
 const a=await cf('GET');report.afterStatus=a.httpStatus;
 if(!a.ok)throw Error('Pages GET after no-op PATCH failed');
 const after=shape(a.result);report.unchanged=JSON.stringify(before)===JSON.stringify(after);
 report.beforeDeploymentId=before.deployId;report.afterDeploymentId=after.deployId;
 report.preservedNames=after.envNames;report.preservedD1=Object.keys(after.d1Bindings);
 if(!report.unchanged)throw Error('No-op project PATCH changed effective settings; stop cutover and inspect');
 report.success=true;
}catch(e){report.success=false;report.error=String(e?.message||e).slice(0,220);}
const out=process.argv[2]||'football-pages-write-probe.json';
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.success)process.exitCode=1;
