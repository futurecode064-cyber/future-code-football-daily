// Read-only migration packaging. Writes only the explicitly supplied external output directory.
import {readFileSync,readdirSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';import {createHash} from 'node:crypto';
import {resourceAllowed} from '../../services/football-engine/src/validation.mjs';
const [rootArg,outArg]=process.argv.slice(2);if(!rootArg||!outArg)throw Error('Usage: node scripts/football/prepare-migration.mjs SOURCE_ROOT OUTPUT_DIRECTORY');
const root=resolve(rootArg),out=resolve(outArg);if(out.startsWith(root+'/')||out===root)throw Error('Output must be outside production source');
const files=[];function walk(dir){for(const n of readdirSync(dir)){const p=join(dir,n);if(statSync(p).isDirectory())walk(p);else if(resourceAllowed(relative(root,p).replaceAll('\\','/')))files.push(p);}}walk(join(root,'data'));
const report=JSON.parse(readFileSync(join(root,'data/today.json'),'utf8'));
const manifest=files.map(p=>({name:relative(root,p),sha256:createHash('sha256').update(readFileSync(p)).digest('hex')}));
mkdirSync(out,{recursive:true});let resources={},size=0,index=0;
function flush(){if(!Object.keys(resources).length)return;writeFileSync(join(out,`batch-${String(++index).padStart(3,'0')}.json`),JSON.stringify({editorialDate:report.reportDate,expectedGeneration:0,sourceManifest:{kind:'existing-data-migration',files:manifest},resources}));resources={};size=0;}
for(const p of files.sort()){const data=JSON.parse(readFileSync(p,'utf8')),bytes=Buffer.byteLength(JSON.stringify(data));if(size+bytes>1100000||Object.keys(resources).length>=25)flush();resources[relative(root,p).replaceAll('\\','/')]=data;size+=bytes;}flush();
writeFileSync(join(out,'manifest.json'),JSON.stringify({editorialDate:report.reportDate,files:manifest,batches:index,publicationAttempted:false},null,2));console.log(JSON.stringify({files:files.length,batches:index,publicationAttempted:false}));
