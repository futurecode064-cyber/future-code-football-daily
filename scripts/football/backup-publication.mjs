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
const url=new URL('/api/admin/export',base);url.searchParams.set('metadata','1');if(version)url.searchParams.set('version',version);
const r=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000),redirect:'error'});
if(!r.ok)throw Error('Private export failed: HTTP '+r.status);
const data=await r.json();
if(!Array.isArray(data.resourceManifest))throw Error('Snapshot metadata unavailable');
data.resources={};
for(const row of data.resourceManifest){const u=new URL('/api/admin/resource',base);u.searchParams.set('version',data.version.id);u.searchParams.set('path',row.path);const part=await fetch(u,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000),redirect:'error'});if(!part.ok||part.headers.get('X-Football-Version')!==data.version.id)throw Error('Incomplete pinned private export');const body=await part.text();if(createHash('sha256').update(body).digest('hex')!==row.digest)throw Error('Private resource digest mismatch');data.resources[row.path]=JSON.parse(body);}
const text=JSON.stringify(data);
if(data.kind!=='football-publication-backup'||!data.version?.id||!data.resources?.['data/today.json'])throw Error('Invalid export');
writeFileSync(out,text,{flag:'wx',mode:0o600});
writeFileSync(out+'.sha256',createHash('sha256').update(text).digest('hex')+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({saved:true,version:data.version.id,resources:Object.keys(data.resources).length,publicationAttempted:false}));
