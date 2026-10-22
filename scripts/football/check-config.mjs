import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const config=JSON.parse(readFileSync('config/football/project.json','utf8'));
for(const item of config.references){const digest=createHash('sha256').update(readFileSync(item.path)).digest('hex');assert.equal(digest,item.sha256,`Changed reference: ${item.path}. Review and update hash intentionally.`);}
if(config.api.status==='live-verified'){
 assert.equal(config.deployment.productionCutoverCompleted,true);assert.equal(config.deployment.frontendIntegrationEnabled,true);
 assert.equal(config.deployment.cutoverApproval?.source,'explicit-owner-approval');assert.ok(config.deployment.cutoverApproval?.reference&&config.deployment.cutoverApproval?.approvedAt);
 for(const field of ['publicBaseUrl','adminBaseUrl'])assert.ok(config.api[field]?.startsWith('https://'));
 assert.ok(config.api.workerName&&/^[a-f0-9-]{36}$/.test(config.api.databaseId));
 console.log('Persistent reference hashes and recorded live deployment/approval fields verified.');
}else{
 assert.equal(config.currentTask,'infrastructure-migration-only');assert.equal(config.deployment.productionCutoverCompleted,false);
 assert.equal(config.deployment.frontendIntegrationEnabled,false);assert.equal(config.api.publicBaseUrl,null);assert.equal(config.api.adminBaseUrl,null);assert.ok(['not-deployed','private-provisioned'].includes(config.api.status));
 if(config.api.status==='private-provisioned'){assert.equal(config.api.candidate.frontendConnected,false);assert.equal(config.api.candidate.contentActivated,false);assert.equal(config.api.candidate.workerName,'future-code-football-engine');assert.match(config.api.candidate.databaseId,/^[a-f0-9-]{36}$/);assert.equal(config.api.candidate.activeVersion,null);}
 console.log('Persistent configuration and reference hashes verified; production cutover remains disabled.');
}
