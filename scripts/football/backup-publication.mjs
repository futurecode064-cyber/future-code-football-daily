// Private snapshot export. This is read-only; it never deploys or publishes.
// The token comes from a secure environment, never from command arguments.
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const [baseArg,out,version]=process.argv.slice(2);
if(!baseArg||!out)throw Error('Usage: FOOTBALL_ENGINE_ADMIN_TOKEN=<secure environment> node scripts/football/backup-publication.mjs API_ORIGIN OUTPUT_JSON [VERSION]');
const base=new URL(baseArg);
if(base.protocol!=='https:'&&!(base.protocol==='http:'&&base.hostname==='localhost'))throw Error('HTTPS API origin required');
if(base.pathname!=='/'||base.search||base.hash||base.username||base.password)throw Error('Use API origin only');
const token=process.env.FOOTBALL_ENGINE_ADMIN_TOKEN;if(!token||token.length<32)throw Error('Secure environment token required');
const url=new URL('/api/admin/export',base);if(version)url.searchParams.set('version',version);
const r=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000),redirect:'error'});
if(!r.ok)throw Error('Private export failed: HTTP '+r.status);
const text=await r.text(),data=JSON.parse(text);
if(data.kind!=='football-publication-backup'||!data.version?.id||!data.resources?.['data/today.json'])throw Error('Invalid export');
writeFileSync(out,text,{flag:'wx',mode:0o600});
writeFileSync(out+'.sha256',createHash('sha256').update(text).digest('hex')+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({saved:true,version:data.version.id,resources:Object.keys(data.resources).length,publicationAttempted:false}));
