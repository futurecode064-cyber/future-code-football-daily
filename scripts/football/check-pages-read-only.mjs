// Read-only Pages project visibility and deployment metadata check. Safe output only.
import {writeFileSync} from 'node:fs';
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN;
const account='86851bf21d81d8f0972052aff8162149';
const project='future-code-football-daily';
const dest=process.argv[2]||'football-pages-access-report.json';
const report={kind:'pages-production-readonly-preflight',project,checkedAt:new Date().toISOString(),
  productionModified:false,secretsRead:false,authorizationDetailsExcluded:true};
try{
 if(!token||token.length<32)throw Error('Missing GitHub-stored migration token');
 const u='https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects/'+project;
 const res=await fetch(u,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
  redirect:'error',signal:AbortSignal.timeout(20000)});
 report.httpStatus=res.status;const body=await res.json().catch(()=>({success:false}));
 if(res.ok&&body.success){
  const p=body.result;report.projectReadable=true;
  report.projectName=p.name;report.productionBranch=p.production_branch||null;
  report.primarySubdomain=p.subdomain||null;
  report.sourceProvider=p.source?.type||null;
  report.sourceRepo=p.source?.config?.repo_name||null;
  report.sourceOwner=p.source?.config?.owner||null;
  report.latestDeploymentStatus=p.latest_deployment?.latest_stage?.status||null;
  report.latestDeploymentId=p.latest_deployment?.id||null;
  report.buildConfig={commandPresent:Boolean(p.build_config?.build_command),
   outputDirectory:p.build_config?.destination_dir||null,rootDirectory:p.build_config?.root_dir||null};
  report.writePermissionVerified=false; // GET permission NEVER proves edit/deployment rights.
 }else{
  report.projectReadable=false;
  report.errorType=res.status===403?'Pages project permission not granted':
    res.status===404?'Project unavailable to current token/account':'Cloudflare API unavailable';
 }
 report.success=true;
}catch(e){report.success=false;report.error=String(e.message||e).replaceAll(token||'__none__','[redacted]').slice(0,300);}
writeFileSync(dest,JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({projectReadable:report.projectReadable,httpStatus:report.httpStatus,
 productionModified:false,productionBranch:report.productionBranch||null}));
if(!report.success)process.exitCode=1;
