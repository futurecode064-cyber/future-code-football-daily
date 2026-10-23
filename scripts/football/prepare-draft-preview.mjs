// Local/owner-only renderer QA from a private snapshot export. Never publishes a draft.
import {cpSync,mkdirSync,readFileSync,writeFileSync,readdirSync,statSync,unlinkSync,realpathSync} from 'node:fs';
import {resolve,join,relative,dirname} from 'node:path';import {createHash} from 'node:crypto';
import {resourceAllowed} from '../../services/football-engine/src/validation.mjs';
const [sourceArg,backupArg,outArg]=process.argv.slice(2);
if(!sourceArg||!backupArg||!outArg)throw Error('Usage: node scripts/football/prepare-draft-preview.mjs SOURCE_ROOT PRIVATE_BACKUP_JSON NEW_PRIVATE_OUTPUT_DIRECTORY');
const source=realpathSync(sourceArg),out=resolve(outArg),text=readFileSync(backupArg,'utf8');
if(out===source||out.startsWith(source+'/'))throw Error('Output must be outside production source');
if(createHash('sha256').update(text).digest('hex')!==readFileSync(backupArg+'.sha256','utf8').trim())throw Error('Backup hash mismatch');
const b=JSON.parse(text);if(b.kind!=='football-publication-backup'||!b.version?.id||!b.resources?.['data/today.json'])throw Error('Invalid private snapshot');
for(const [path,value] of Object.entries(b.resources))if(!resourceAllowed(path)||!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid public resource');
mkdirSync(out,{mode:0o700});cpSync(source,out,{recursive:true});
function clear(dir){for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())clear(p);else if(resourceAllowed(relative(out,p).replaceAll('\\','/')))unlinkSync(p);}}
clear(join(out,'data'));
for(const [path,value] of Object.entries(b.resources)){const p=join(out,path);mkdirSync(dirname(p),{recursive:true,mode:0o700});writeFileSync(p,JSON.stringify(value),{mode:0o600});}
writeFileSync(join(out,'football-engine-config.js'),'window.FC_FOOTBALL_ENGINE=Object.freeze({enabled:false});\n');
writeFileSync(join(out,'DRAFT_PREVIEW_ONLY.txt'),'PRIVATE DRAFT QA ONLY. Do not host publicly. Version: '+b.version.id+'\n',{mode:0o600});
console.log(JSON.stringify({prepared:true,version:b.version.id,resources:Object.keys(b.resources).length,productionChanged:false,publicationAttempted:false,access:'local or verified owner-only preview; never public hosting'}));
