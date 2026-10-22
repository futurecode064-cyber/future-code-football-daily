// Prepare an isolated copy of the existing site. Does not deploy or change production configuration.
import {cpSync,mkdirSync,writeFileSync,realpathSync} from 'node:fs';import {resolve} from 'node:path';
const [sourceArg,outArg,apiArg]=process.argv.slice(2);
if(!sourceArg||!outArg||!apiArg)throw Error('Usage: node scripts/football/prepare-staging.mjs SOURCE_ROOT NEW_OUTPUT_DIRECTORY ACTUAL_API_ORIGIN');
const source=realpathSync(sourceArg),out=resolve(outArg),api=new URL(apiArg);
if(out===source||out.startsWith(source+'/'))throw Error('Staging output must be outside production source');
if(api.protocol!=='https:'&&!(api.protocol==='http:'&&api.hostname==='localhost'))throw Error('HTTPS API required');
if(api.pathname!=='/'||api.search||api.hash||api.username||api.password)throw Error('API origin only');
mkdirSync(out,{mode:0o700});cpSync(source,out,{recursive:true});
writeFileSync(out+'/football-engine-config.js','window.FC_FOOTBALL_ENGINE=Object.freeze('+JSON.stringify({enabled:true,apiBase:api.origin,timeoutMs:10000})+');\n');
console.log(JSON.stringify({prepared:true,apiOrigin:api.origin,productionSourceChanged:false,deploymentAttempted:false}));
