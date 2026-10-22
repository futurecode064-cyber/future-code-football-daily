// Cancel only older instances of this disposable owner-preview QA workflow, preventing
// two test runners from rotating the same PREVIEW credentials concurrently.
import assert from 'node:assert/strict';
const repo='futurecode064-cyber/future-code-football-daily',workflow='football-engine-owner-qa.yml';
assert.equal(process.env.GITHUB_REPOSITORY,repo);assert.ok(/^\d+$/.test(process.env.GITHUB_RUN_ID||''));
const headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const url='https://api.github.com/repos/'+repo+'/actions/workflows/'+workflow+'/runs?per_page=30';
const response=await fetch(url,{headers,redirect:'error'});assert.ok(response.ok,'Cannot verify prior owner QA runs');
const data=await response.json(),current=Number(process.env.GITHUB_RUN_ID);
const older=(data.workflow_runs||[]).filter(r=>r.id<current&&r.head_branch==='football-engine/workers-d1-migration'&&r.event==='pull_request'&&['in_progress','queued','waiting'].includes(r.status));
for(const r of older){const result=await fetch('https://api.github.com/repos/'+repo+'/actions/runs/'+r.id+'/cancel',{method:'POST',headers,redirect:'error'});assert.ok([202,409].includes(result.status),'Could not stop superseded owner QA safely');}
for(let n=0;n<24&&older.length;n++){
 let pending=0;for(const r of older){const status=await fetch('https://api.github.com/repos/'+repo+'/actions/runs/'+r.id,{headers,redirect:'error'});assert.ok(status.ok);if((await status.json()).status!=='completed')pending++;}
 if(!pending)break;if(n===23)throw Error('Superseded QA still running; refusing concurrent preview changes');await new Promise(r=>setTimeout(r,2500));
}
console.log(JSON.stringify({supersededOwnerQaCancelled:older.length,productionWorkflowCancelled:false}));
