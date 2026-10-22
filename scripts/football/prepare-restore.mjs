// Verify an export and prepare NEW private drafts. Never activates a version or rewinds generation.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resourceAllowed} from '../../services/football-engine/src/validation.mjs';
const [file,out,generationArg]=process.argv.slice(2),generation=Number(generationArg);
if(!file||!out||!generationArg||!Number.isSafeInteger(generation)||generation<0)throw Error('Usage: node scripts/football/prepare-restore.mjs BACKUP_JSON NEW_OUTPUT_DIRECTORY EXPECTED_GENERATION');
const text=readFileSync(file,'utf8'),digest=createHash('sha256').update(text).digest('hex');
if(readFileSync(file+'.sha256','utf8').trim()!==digest)throw Error('Backup SHA-256 mismatch');
const b=JSON.parse(text);if(b.schemaVersion!==1||b.kind!=='football-publication-backup'||!b.version?.editorial_date||!b.resources?.['data/today.json'])throw Error('Unsupported backup');
for(const [path,value] of Object.entries(b.resources))if(!resourceAllowed(path)||!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid backup resource');
mkdirSync(out,{mode:0o700});let resources={},size=0,index=0;
function flush(){if(!Object.keys(resources).length)return;const batch={editorialDate:b.version.editorial_date,expectedGeneration:generation,sourceManifest:{kind:'verified-backup-restore',files:[{name:'publication-backup.json',sha256:digest}],originalVersion:b.version.id},resources};writeFileSync(out+'/batch-'+String(++index).padStart(3,'0')+'.json',JSON.stringify(batch),{mode:0o600,flag:'wx'});resources={};size=0;}
for(const [path,value] of Object.entries(b.resources)){const bytes=Buffer.byteLength(JSON.stringify(value));if(bytes>1100000)throw Error('Single resource exceeds import budget');if(size+bytes>1100000||Object.keys(resources).length>=20)flush();resources[path]=value;size+=bytes;}flush();
console.log(JSON.stringify({batches:index,resources:Object.keys(b.resources).length,expectedGeneration:generation,publicationAttempted:false,next:'Import in order, linking each baseDraft; validate and review before publishing'}));
