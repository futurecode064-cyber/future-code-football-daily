// Read-only inspection of existing GitHub Actions secret CANDIDATES. 
// Never output a token, partial token, account name, email, or API response payload.
import {writeFileSync} from 'node:fs';
const project='future-code-football-daily',account='86851bf21d81d8f0972052aff8162149';
const candidates=[
 ['FOOTBALL_STAGING_CF_API_TOKEN',process.env.FOOTBALL_STAGING_CF_API_TOKEN],
 ['FOOTBALL_PAGES_CF_API_TOKEN',process.env.FOOTBALL_PAGES_CF_API_TOKEN],
 ['CLOUDFLARE_API_TOKEN',process.env.CLOUDFLARE_API_TOKEN]
];
const output=process.argv[2]||'football-existing-secret-capabilities.json';
const report={kind:'read-only-existing-cloudflare-secret-lookup',targetProject:project,
  queriedAccount:account,productionModified:false,checkedAt:new Date().toISOString(),
  candidates:[]};
for(const [key,token] of candidates){
 const status={secretName:key,configured:typeof token==='string'&&token.length>=20,
  pagesReadAuthorized:false,httpStatus:null};
 if(status.configured){
  try {
   const url='https://api.cloudflare.com/client/v4/accounts/'+account+'/pages/projects/'+project;
   const r=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},
    redirect:'error',signal:AbortSignal.timeout(18000)});
   status.httpStatus=r.status;
   if(r.ok){
    const body=await r.json();
    status.pagesReadAuthorized=body.success===true&&body.result?.name===project;
   }
  }catch{status.httpStatus='request-failed';}
 }
 report.candidates.push(status);
}
report.existingSecretReadable=report.candidates.some(x=>x.pagesReadAuthorized);
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
