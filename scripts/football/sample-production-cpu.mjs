// Read-only Workers Free CPU snapshot for exact public production QA window.
// Never calls a write endpoint, changes API content or triggers a Pages build.
const token=process.env.FOOTBALL_STAGING_CF_API_TOKEN;
if(!token||token.length<24)throw Error('Scoped Cloudflare Workers metrics token required');
const start='2026-10-23T04:39:45.688Z',end='2026-10-23T04:40:20.178Z';
const vars={accountTag:'86851bf21d81d8f0972052aff8162149',datetimeStart:start,datetimeEnd:end,scriptName:'future-code-football-engine'};
const query='query($accountTag:string,$datetimeStart:string,$datetimeEnd:string,$scriptName:string){viewer{accounts(filter:{accountTag:$accountTag}){workersInvocationsAdaptive(limit:100,filter:{scriptName:$scriptName,datetime_geq:$datetimeStart,datetime_leq:$datetimeEnd}){sum{requests errors subrequests} quantiles{cpuTimeP50 cpuTimeP99} dimensions{status}}}}}';
const res=await fetch('https://api.cloudflare.com/client/v4/graphql',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query,variables:vars}),signal:AbortSignal.timeout(20000)});
const data=await res.json();
const groups=data?.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive||[];
const clean=groups.map(g=>({status:g.dimensions?.status,requests:g.sum?.requests,errors:g.sum?.errors,medianCpuMs:g.quantiles?.cpuTimeP50/1000,p99CpuMs:g.quantiles?.cpuTimeP99/1000}));
const report={kind:'real-production-public-read-only-free-cpu-sample',window:{start,end},productionModified:false,requests:clean,available:res.ok&&!data.errors,freeCpuLimitMs:10,planConfirmed:false,conclusion:'Read-only exact QA-window sample; p99 can include cold starts and is not long-term capacity guarantee.'};
if(data.errors)report.graphqlErrors=data.errors.map(x=>x.extensions?.code||'unavailable');
await import('node:fs').then(fs=>fs.writeFileSync('football-production-runtime-sample.json',JSON.stringify(report,null,2)+'\n'));
console.log(JSON.stringify(report));if(!report.available)process.exitCode=1;
