import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const config=JSON.parse(readFileSync('config/football/project.json','utf8'));
for(const item of config.references){const digest=createHash('sha256').update(readFileSync(item.path)).digest('hex');assert.equal(digest,item.sha256,`Changed reference: ${item.path}. Review and update hash intentionally.`);}
assert.equal(config.currentTask,'infrastructure-migration-only');assert.equal(config.deployment.productionCutoverCompleted,false);
assert.equal(config.api.publicBaseUrl,null);assert.equal(config.api.status,'not-deployed');
console.log('Persistent configuration and reference hashes verified; production cutover remains disabled.');
