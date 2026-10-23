# Staging deployment and production acceptance

## Verified source state
Authoritative code: futurecode064-cyber/future-code-football-daily, main,
base commit 02103874457602b36c2c08bc07eb23e917d56d0c.
Delivery workflow read directly: AI-Recap-GitHub main /.github/workflows/football-standalone-sync.yml.
It is manual only (no cron/push). It checks production tree hashes, runs tests, mirrors football-daily/
to football-daily-render and triggers the existing Pages Git deployment. Keep it unchanged.
Documentation says project future-code-football-daily uses that delivery branch, output football-daily,
static build exit 0. This account configuration has NOT been verified in the Dashboard this session.
Never rely on older README claims of a 30-minute scheduled mirror.

## Historical authentication blocker (superseded by scoped GitHub-secret access)
Cloudflare Dashboard showed the sign-in screen. No Cloudflare token/account ID is configured in
this execution environment. No Cloudflare plugin was available in discovery. Do not invent D1 IDs,
Worker hostnames, metric values, deployments or authentication status. A secure Google sign-in attempt returned “Unable to sign in. Try again or use your email and password.”
Automated sign-in stopped after the generic failure. Authentication remains unresolved.

## Exact next steps after authentication
1. Inspect account plan/usage and existing Pages project, production branch/source, bindings and secrets
   by name only. Record last production deployment/commit, download configuration and export existing
   databases if any relevant ones exist. Do not touch GOALZONE_ANALYTICS_DB or existing owner secrets.
2. Check that `future-code-football-db-staging` / `future-code-football-engine-staging` do not conflict.
   Create only free staging resources. Wrangler 4.151.3 is pinned with a lockfile; run npm ci, then copy
   services/football-engine/wrangler.jsonc.example to ignored wrangler.jsonc with actual database ID.
   The example's placeholder must never be used in a real deployment.
3. Run Wrangler d1 migrations apply <actual-staging-db> --remote. Configure ADMIN_TOKEN through the
   secret store (32+ random characters, never in Git/chat), ALLOWED_ORIGINS and rate-limit binding.
   Deploy the staging Worker once. Record actual Worker URL and D1 ID in the runtime registry.
4. Use scripts/football/prepare-migration.mjs to package the current source without modifying it.
   It produced 36 existing public JSON resources in 3 batches locally. Regenerate against freshest
   production/source snapshot after any concurrent update. It intentionally excludes source ledgers,
   images, credentials and private research: those stay in their current locations/private backup.
   Import each batch without publishing; expectedGeneration=0, unique retry key per exact batch;
   set baseDraft to previous response version for batches 2+. Verify parity for all 36 resources and
   private source-ledger/archive backup. Never silently “fix” existing editorial content during migration.
5. Run full security, concurrent update, rollback, archive and failure simulations on staging. Profile
   Worker CPU and D1 rows with real snapshots; offload/chunk validation if 10ms Free CPU is exceeded.
   Deduplication migration 0002 and private export/restore tooling are implemented. Verify physical
   storage growth and choose an authorized private full-database backup destination before production.
6. Prepare a separate Pages staging preview of the existing frontend. Bind FOOTBALL_ENGINE service,
   FCD_ENGINE_TOKEN (same as Worker ADMIN_TOKEN), and FCD_ENGINE_ENABLED=true ONLY in staging.
   Existing owner login remains; /editor/engine.html is the new owner console.
7. Loader wiring is prepared for main, odds, evening, news, AI and PNG/video consumers on all brands.
   Run `node scripts/football/prepare-staging.mjs football-daily NEW_EXTERNAL_DIRECTORY ACTUAL_API_ORIGIN`
   to create an isolated enabled copy. Production source remains disabled. Verify complete page-level
   version pinning, saved-data notice/time, optional-resource absence and origin CORS on real staging.
   For private draft layout/download QA, use backup-publication.mjs + prepare-draft-preview.mjs;
   never publish a private draft preview on an unprotected public URL.
8. Staging QA: all five routes, owner login, every existing PNG/frame/filter/video mode, mobile and APK
   WebView, long Burmese names/articles, odd match counts, real downloaded PNG inspection.
9. Test import -> validate -> publish -> evening -> rollback while watching deployment history.
   Require unchanged Pages and Workers deployment IDs for the data-only sequence. Current local tests
   do not establish that live claim. Save a complete backup/restore and final cutover rollback plan.
10. Request final approval ONLY for the concrete production cutover, with QA/backup evidence available.
    Then do one batched frontend release and binding switch, live verify, record registry status.
    A source PR is not a live deployment. Never call the legacy production mirror as a data operation.

## Rollback plan before live cutover
Unbind/disable the engine frontend configuration and restore exact prior Pages deployment/commit;
static JSON remains intact. Do not drop/rename databases, delete archive data, replace login secrets,
or repurpose the analytics DB. Data rollback uses an audited prior validated publication; code rollback
uses the saved known-good deployment. Exercise both on staging before final approval.

## Official technical references checked 2026-10-22
https://developers.cloudflare.com/d1/worker-api/d1-database/
https://developers.cloudflare.com/d1/platform/limits/
https://developers.cloudflare.com/d1/platform/pricing/
https://developers.cloudflare.com/workers/platform/limits/
https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/
https://developers.cloudflare.com/pages/platform/limits/
Free Worker CPU is 10 ms/request, requests 100,000/day. D1 Free limits include 500 MB/database,
5 GB/account and 50 queries per invocation. These are limits, not observed account usage.
Do not represent Workers CI build minutes as runtime CPU or ChatGPT research duration.

## Reproducible local verification (completed 2026-10-22)
From services/football-engine: npm ci; npm run db:local; npm run check:bundle; npm run test:runtime.
The local-only configuration has an all-zero local D1 ID and must never be deployed remotely.
Both schema migrations applied with official Wrangler. The production bundle builds successfully.
The workerd/Miniflare test imported 36 existing resources in 3 batches, compared every JSON value,
exported and restored that snapshot into new private drafts, checked authentication and draft privacy.
No remote account, Pages deployment or production database was used. Local runtime timing does NOT
establish the hosted Free CPU budget. Full live staging acceptance is still required.

Private snapshot backup: supply FOOTBALL_ENGINE_ADMIN_TOKEN through a secure environment and run
`node scripts/football/backup-publication.mjs ACTUAL_API_ORIGIN PRIVATE_OUTPUT_JSON [VERSION]`.
The owner console also downloads a selected snapshot and its SHA-256 sidecar. Keep both private.
Restore preparation: `node scripts/football/prepare-restore.mjs BACKUP_JSON NEW_PRIVATE_DIRECTORY GENERATION`.
Import the generated batches in order with baseDraft links; review/validate/publish separately.
This snapshot backup supplements, and does not replace, a full remote D1 export before cutover.

## Current staging completion and safe release criteria (supersedes old blocker)
Scoped Cloudflare API access was verified through GitHub Secret. Staging Worker/D1 are provisioned,
36 public JSON resources preserved privately, no publication. Additional dedicated QA Worker/D1
demonstrated a full synthetic-only import/publish/evening/rollback and no build during data updates.
See PROGRESS.md for exact passing Action run URLs. Production config remains disabled and unbound.

The staging SQL encrypted backup is in an Actions artifact with 90-day retention. It uses
FOOTBALL_STAGING_CF_API_TOKEN-derived encryption *only until* the owner sets the independent
FOOTBALL_BACKUP_RECOVERY_KEY via GitHub repository Settings > Secrets and variables > Actions.
Never put that secret into chat. Rerun the backup workflow manually via its exact PR label
(football-engine-encrypted-backup), and confirm a restore check and independent keySource.
Retention and independent backup destination must be addressed before any live cutover.

DO NOT treat the synthetic publication evidence as V3 editorial QA, real PNG frame fidelity on all
36 fixtures, or final capacity analysis. Audit supplied 22.pdf and source ledger first;
the current copied data includes a non-competitive friendly in one last-five form.
Any source fix must be reviewed separately without silently changing existing published data.

For production change, require real-source QA, fully backed-up database, secure owner proxy,
live API/browser/PNG/video/WebView QA, CPU and D1 usage budget and explicit final cutover authorization.
Only then should production code/config change in one controlled release with a tested rollback.

## Existing GitHub-based Pages deployment — do not request a new Pages token by default
- The production website is already delivered via `futurecode064-cyber/AI-Recap-GitHub` 
  branch `football-daily-render`, with existing manual workflow
  `.github/workflows/football-standalone-sync.yml` (workflow name:
  `Mirror Verified Football Site to Cloudflare Production`).
- That workflow reads standalone source repo `futurecode064-cyber/future-code-football-daily`
  `main`, verifies full football tree parity and sync-state guard, and pushes updated
  `football-daily/` into `football-daily-render`. Git integration can then trigger
  a Pages build. It DOES NOT use a Cloudflare Pages REST API token.
- GitHub `AI-Recap-GitHub` `.github/football-sync-state.json` on production branch recorded
  source commit `09aca1257a295f1a8b935f30a204b8dc5842e630`, target tree
  `3cd510bc0dcc4eee372e9e7dbccf457915757385`,
  sync time `2026-10-22T09:54:43.697Z` at the time of this read.
- The migration-specific `FOOTBALL_STAGING_CF_API_TOKEN` succeeded for Workers and D1.
  Its HTTP 403 response on Cloudflare Pages project API only proves that **particular**
  token cannot read that particular Pages API endpoint/account; it does not prove that
  the owner has failed to create Pages Edit permission or that the existing Git sync
  workflow is blocked. Do not ask the owner to recreate the token or repeat access setup.
- Before final cutover, run the read-only `football-engine-existing-delivery-check` label
  against PR #36, then confirm exact branch trees and guarded workflow status.
- The migration's initial frontend code change can use the **existing** GitHub production
  sync after source main is merged and all release gates and owner cutover approval pass.
  This first cutover will require one code build, not zero.
- However, the Pages Worker `FOOTBALL_ENGINE` service binding, `FCD_ENGINE_ENABLED`,
  `FCD_ENGINE_TOKEN` and any needed admin session secrets still require **one-time
  Production environment setup**, which Git-based source sync alone does not configure.
  Prefer existing authorized Cloudflare account/browser or verified separate scoped API
  access; do not claim this part is done without checking.
- Normal subsequent validated D1 content updates should not push GitHub commits or
  trigger Pages/Workers Builds; prove only after real production smoke tests.
