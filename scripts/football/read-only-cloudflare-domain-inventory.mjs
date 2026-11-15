// Read-only Cloudflare Pages/domain inventory. Credentials are injected via GitHub Actions.
// Never prints or stores API tokens, request headers, or Cloudflare account/member profiles.
import { writeFileSync } from 'node:fs';
const accountId = '86851bf21d81d8f0972052aff8162149';
const possibleTokens = [
  ['FOOTBALL_PAGES_CF_API_TOKEN', process.env.FOOTBALL_PAGES_CF_API_TOKEN],
  ['FOOTBALL_STAGING_CF_API_TOKEN', process.env.FOOTBALL_STAGING_CF_API_TOKEN]
].filter(([name,token])=>Boolean(token) && token.length >= 20);
const report={checkedAt:new Date().toISOString(),readOnly:true,productionModified:false,
  credentialsPresent:possibleTokens.map(x=>x[0]),
  pages:{verified:false,status:'not-checked',domains:[]},zones:{readable:false,status:'not-checked',items:[]},
  conclusion:'access-not-verified'};
const API='https://api.cloudflare.com/client/v4';
async function get(path,token){
  try {
    const r=await fetch(API+path,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},
      redirect:'error',signal:AbortSignal.timeout(15000)});
    if(!r.ok)return {status:r.status,ok:false};
    const obj=await r.json().catch(()=>null);
    return {status:r.status,ok:obj?.success===true,data:obj?.success===true?obj.result:null};
  } catch {return {status:'connection-error',ok:false};}
}
for(const [name,token] of possibleTokens){
  if(!report.pages.verified){
    const p=await get('/accounts/'+accountId+'/pages/projects/future-code-football-daily',token);
    if(p.ok&&p.data?.name==='future-code-football-daily'){
      report.pages={verified:true,status:p.status,via:name,
        project:p.data.name,productionBranch:p.data.production_branch,
        domains:(p.data.domains||[]).filter(x=>typeof x==='string').slice(0,60)};
    }else report.pages.status=p.status;
  }
  if(!report.zones.readable){
    const z=await get('/zones?account.id='+accountId+'&per_page=50',token);
    if(z.ok&&Array.isArray(z.data)){
      report.zones={readable:true,status:z.status,via:name,items:[]};
      for(const zone of z.data){
        const row={name:zone.name,status:zone.status,type:zone.type};
        if(zone.id) {
          const s=await get('/zones/'+zone.id+'/settings/http3',token);
          row.http3=s.ok?s.data?.value||'unknown':('not-readable-http-'+s.status);
        }
        report.zones.items.push(row);
      }
    }else report.zones.status=z.status;
  }
}
report.conclusion=report.zones.readable?'zones-readable':(report.pages.verified?'pages-only-no-zone-list':'cloudflare-access-unavailable');
writeFileSync('cloudflare-domain-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log('Pages verified:',report.pages.verified,'linked domains:',report.pages.domains.length);
console.log('Cloudflare zone list readable:',report.zones.readable,'zone count:',report.zones.items.length);
console.log('Final status:',report.conclusion);
console.log('No infrastructure modifications performed.');
