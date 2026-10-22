// Read-only production delivery preflight. No Cloudflare Pages API token is required.
// Reuses the EXISTING GitHub source→Cloudflare production branch delivery route.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const repo=resolve(new URL('../../',import.meta.url).pathname);
const output=resolve(process.argv[2]||'football-git-delivery-preflight.json');
const scratch=mkdtempSync(join(tmpdir(),'football-git-prod-'));
const report={kind:'football-existing-git-based-pages-delivery-preflight',
  checkedAt:new Date().toISOString(),method:'git-push-to-existing-pages-linked-production-branch',
  sourceRepo:'futurecode064-cyber/future-code-football-daily',sourceBranch:'main',
  deliveryRepo:'futurecode064-cyber/AI-Recap-GitHub',productionBranch:'football-daily-render',
  cloudflareApiTokenRequiredForExistingCodeMirror:false,
  productionModified:false,cloudflareBuildTriggered:false};
function git(cwd,...args){return execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000}).trim();}
try{
 git(repo,'fetch','--no-tags','--depth=1','origin','main');
 report.mainHead=git(repo,'rev-parse','FETCH_HEAD');
 report.mainFootballTree=git(repo,'rev-parse','FETCH_HEAD:football-daily');
 git(scratch,'init','-q');
 git(scratch,'remote','add','origin','https://github.com/futurecode064-cyber/AI-Recap-GitHub.git');
 git(scratch,'fetch','--quiet','--no-tags','--depth=1','origin','refs/heads/football-daily-render');
 report.productionHead=git(scratch,'rev-parse','FETCH_HEAD');
 report.productionFootballTree=git(scratch,'rev-parse','FETCH_HEAD:football-daily');
 const raw=git(scratch,'show','FETCH_HEAD:.github/football-sync-state.json');
 const marker=JSON.parse(raw);
 if(marker.source_repository!==report.sourceRepo||marker.source_branch!==report.sourceBranch)
  throw Error('Production sync marker points to a different source');
 report.marker={source_commit:marker.source_commit,target_tree:marker.target_tree,
  last_synced_utc:marker.last_synced_utc};
 report.mainVsProdEqual=report.mainFootballTree===report.productionFootballTree;
 report.productionMatchesGuard=marker.target_tree===report.productionFootballTree;
 report.sourceMatchesGuard=marker.source_commit===report.mainHead;
 // No writes; any mismatch is reported rather than reconciled automatically.
 report.existingGitBasedDeliveryConfirmed=report.productionMatchesGuard &&
    report.mainVsProdEqual&&report.sourceMatchesGuard;
 report.success=true;
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({success:true,existingGitBasedDeliveryConfirmed:report.existingGitBasedDeliveryConfirmed,
  mainVsProdEqual:report.mainVsProdEqual,productionMatchesGuard:report.productionMatchesGuard,
  sourceMatchesGuard:report.sourceMatchesGuard,cloudflareApiTokenRequiredForExistingCodeMirror:false,
  productionModified:false,cloudflareBuildTriggered:false}));
}catch(e){report.success=false;report.error=String(e.message||e).slice(0,500);
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.error(report.error);process.exitCode=1;}
finally{rmSync(scratch,{recursive:true,force:true});}
