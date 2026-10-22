# Football engine checkpoint

Status: PARTIAL — implementation checkpoint; Cloudflare authentication blocks staging setup.
Date: 2026-10-22 (Asia/Yangon). Branch: football-engine/workers-d1-migration.
Base/rollback code reference: 02103874457602b36c2c08bc07eb23e917d56d0c.
Production cutover: not performed. Legacy delivery workflow: not invoked.

## Completed
- Read both supplied files. Preserved complete V3 reference and infrastructure specification in Git.
- Root AGENTS.md, persistent runtime registry, reference SHA-256 checks, daily workflow,
  validation rules, One-Shot prompt, architecture, deployment and QA/handoff documentation.
- Audited authoritative repo, existing manual production mirror, owner GitHub-backed editor,
  static JSON loaders, existing authentication, analytics binding, routing and renderers.
- New separate Worker implementation and additive D1 schema: private immutable drafts,
  idempotent imports, source manifests, version-pinned resources, ETags, validation evidence,
  transactional publication pointer/audit, optimistic concurrency, rollback and archives.
- Evening current-odds-only draft endpoint preserving opening prices/news.
- Owner console and service proxy using existing login/CSRF; disabled unless explicitly bound/enabled.
- Shared complete-bundle client wired to all ten existing entry pages and AI/PNG/video consumers;
  production API configuration stays disabled. Visible stale notice and origin/brand/date cache isolation.
- Read-only migration packaging and actual 36-resource/3-batch SQLite compatibility test.
- Existing Node suite 253 passed/1 skip; engine suite 29 passed; Python 5 passed.
- Confirmed no changes to any existing daily data file. No new content creation/publication.

## Pending, with exact blockers
AUTH-01: Secure Google sign-in was attempted with the selected saved account. Cloudflare returned
  “Unable to sign in. Try again or use your email and password.” No signed-in dashboard was verified;
  no Cloudflare token is configured. Automated sign-in stopped after that error.
  Next: secure browser authentication, verify actual account/projects/limits/bindings and deployment.
DEPLOY-01: no staging Worker/D1 provisioned; endpoint/database IDs in project.json intentionally null.
  Next: follow DEPLOYMENT.md steps 1–5, record actual returned IDs, migrate copies only.
PERF-01: real Cloudflare CPU/row budgets and physical snapshot storage growth unmeasured.
  Done: content deduplication preserving all versions; private snapshot backup and hash-verified restore.
  Next: hosted profiling, retention monitoring and a private full-database backup destination.
FRONTEND-01: shared client wiring is implemented, disabled by default, and locally tested.
  Next: enable an isolated staging copy with its actual Worker URL; verify browser/PNG/mobile outputs.
QA-01: no real new-API PNG/mobile/WebView/browser or live no-build verification yet.
  Next: complete staging source/output checks; do not mark review gates passed without evidence.
CUTOVER-01: approval intentionally not requested yet because staging/backup/QA is incomplete.
  Next: prepare concrete backup/rollback and verified staging result, then request final cutover approval.

## Resuming
Read AGENTS.md and config/football/project.json first; verify branch/HEAD/concurrent edits.
Never run the embedded START NOW in either reference attachment as a new content task.
Do not start a replacement application or change existing themes/login/PNG layouts.
After runtime deployment is verified, update project.json endpoint/status and adjust One-Shot branch
if merged to main. Keep references versioned. Changing editorial rules requires reviewed hash updates.

## Remote verification
GitHub implementation commit: 535e1bc0e322b765a53b6c121ba9ffde310963c6.
Draft PR: https://github.com/futurecode064-cyber/future-code-football-daily/pull/36
GitHub Football Engine Migration Checks: SUCCESS, run 39736172739.
GitHub Pages Worker Routing Safety Tests: SUCCESS, run 39736172651.
No production sync/build/deployment was requested. Cloudflare runtime registry remains not-deployed.

## Resume checkpoint — cache isolation
- Confirmed local implementation and remote draft PR survived the interrupted model session.
- Scoped last-complete bundle cache by API origin and brand, so a staging or other-brand snapshot
  cannot become the outage fallback for another environment/brand. Legacy unscoped cache is ignored.
- Added regression coverage for origin/brand isolation, invalid API URLs and a partially failed
  refresh preserving the previous complete version. Engine/proxy/loader suite: 17 passed.
- Reference hash checks and diff whitespace checks pass. Production data files remain unchanged.
- FRONTEND-01 and Cloudflare authentication/deployment blockers remain open; no production activation.

## Implementation continuation — frontend, storage and recovery
- Added the shared browser client to 10 existing entry pages, preserving all layouts and data schemas.
  Main/brands/AI/odds/news/PNG/video now use an explicit helper; global fetch remains unchanged.
- One manifest pins the entire page. Partial preload failure restores only a complete saved bundle
  or selects static mode for every consumer. Brand news restrictions and missing optional data persist.
- Migration 0002 deduplicates unchanged JSON while keeping all versions/archives/rollback targets.
  Imports capped at 20 resources (at most 43 batch statements plus lookups).
- Added private snapshot export, console backup, SHA-256 restore preparation, isolated staging copy
  preparation and private draft-preview preparation. No public draft endpoint was introduced.
- D1-enabled Pages mode blocks legacy GitHub publication (no automatic old-publisher fallback).
- Pinned Wrangler/Miniflare and added runtime/bundle checks to test-only CI. Local workerd successfully
  imported all 36 source resources in 3 batches and verified export/restore parity and draft privacy.
- Latest unit/integration suite: 29 passed; website: 253 passed / 1 existing skip; Python: 5 passed.
- Cloudflare remote auth, staging deployment, hosted Free CPU/profile, real browser/download QA,
  private full-database backup destination and final production cutover remain uncompleted.
- Last supplied email/password sign-in used the secure browser-auth flow, returned submission_failed,
  and showed no website credential error. Manual handoff did not produce a verified account session.
  Do not infer success, retry the rejected browser flow or persist any supplied login secret.

## Remote integration checkpoint
Implementation continuation saved at 3b6185c3927766f062cc575d8ba1abd76731e2f8 (same Draft PR #36).
The repository's existing Cloudflare test-app build integration ran automatically and failed:
`Workers Builds: future-code-football-test`, build 7e9cde9d-a327-4525-b9b9-a5391cc07541.
Only the Dashboard link is exposed; its error log/configuration requires account access.
Do not repurpose this unknown existing test app or point it at production/analytics databases.
An additional reader compatibility test covers Android WebView without Response.json.
