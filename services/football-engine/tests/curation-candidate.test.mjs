import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(new URL('../../../',import.meta.url).pathname);
test('source-preserving 36-fixture form correction candidate excludes six noncompetitive games',()=>{
 const temp=mkdtempSync(join(tmpdir(),'fc-qa-'));
 try{
  execFileSync(process.execPath,['scripts/football/curate-reviewed-form-draft.mjs','football-daily',temp],{cwd:root,stdio:'pipe'});
  const out=JSON.parse(readFileSync(join(temp,'today-reviewed-candidate.json'),'utf8'));
  const report=JSON.parse(readFileSync(join(temp,'review-report.json'),'utf8'));
  const original=JSON.parse(readFileSync(join(root,'football-daily/data/archive/2026-10-22.json'),'utf8'));
  assert.equal(report.productionPublishAllowed,false);
  assert.equal(report.removedFriendlyResults,6);
  assert.equal(report.changes.length,5);
  assert.equal(out.matches.length,36);
  assert.deepEqual(out.matches.map(x=>x.fixtureId),original.matches.map(x=>x.fixtureId));
  assert.equal(out.matches[11].homeLastFive[2].opponent,'Górnik Zabrze');
  assert.equal(out.matches[11].homeLastFive[2].opponentGoals,3);
  assert.equal(out.matches[3].homeLastFive[0].teamGoals,6);
  assert.equal(out.matches[0].homeLastFive[4].opponent,'Sparta Prague');
 }finally{rmSync(temp,{recursive:true,force:true});}
});
