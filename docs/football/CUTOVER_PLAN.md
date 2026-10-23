# Concrete production release plan

Current state: PREPARATION ONLY. No production cutover is authorized or claimed.
Source rollback: canonical main `09aca1257a295f1a8b935f30a204b8dc5842e630`.
Read the latest GitHub heads and production deployment before executing; refuse a stale lease.

## Scope
Keep the existing Pages project `future-code-football-daily`, existing five URLs, themes,
login/session secrets, APK links, analytics D1 binding, image assets and download renderers.
Add one separate lightweight API Worker and one football D1 database. No entire-frontend migration.
Use existing source schemas and copy the freshest published JSON unchanged. The 22 October
36-match evening update on main is included in this branch; none of its prices are overwritten.
The V3 prompt remains a reference. This release does not commission new articles, news or prices.

## Preconditions and prepared evidence
- Latest engine and existing-site CI must pass for the exact candidate commit.
- Source `football-daily/data` must equal canonical main, byte for byte. Repackage after concurrent updates.
- Isolated hosted owner-session -> service binding -> D1 and five-brand private-draft/download QA must pass.
- Validate actual Free CPU and D1 row/storage measurements for the candidate, not historical averages.
- Capture current Pages deployment ID, deployment environment, binding/secret NAMES, build/source config,
  delivery commit/tree and source sync marker. Preserve existing env values by in-place additive setup.
- Confirm encrypted full SQL backup restores, has an independent key generated privately, and a durable copy.
  The 09:38Z staging backup is recoverable and encrypted, but its key was previously seen in chat;
  rotate the key in GitHub Secrets privately and create a fresh backup before using it for production.
- Initial unchanged-source migration is preservation QA. Known legacy editorial warnings are documented
  separately. Do not invent a new PDF verification, alter old results or silently rewrite legacy content
  merely to complete an infrastructure migration. New daily content must pass the full V3 validators.
- Actual installed Android APK/WebView testing is distinct from Chromium mobile emulation.
- Owner's final cutover approval is required by the supplied SHARED_ENGINE_REQUIREMENTS.txt §14.

## One controlled initial release after approval
1. Provision only the free, conflict-checked `future-code-football-engine` Worker and
   `future-code-football-db` D1. Refuse an existing unowned resource; never repurpose analytics D1.
2. Apply additive migrations 0001–0003. Copy the latest source JSON to private immutable drafts,
   in batches no larger than 400 KB/20 resources. Keep archives, source manifest and opening prices.
3. Generate one independent 32-byte admin token inside the secure release runner. Store it only as
   Worker ADMIN_TOKEN and Pages FCD_ENGINE_TOKEN. Never print/upload it or add it to source/browser JS.
   Existing owner FCD_MAIN_PASSWORD and FCD_SESSION_SECRET remain unchanged.
4. Verify complete JSON parity, private draft security and complete private source/download review.
   Initial migration validation may preserve legacy content unchanged; record precise preservation
   evidence instead of pretending to have newly verified every legacy football fact.
5. Export, encrypt and restore-test the complete production D1 before activation. Retain an encrypted
   offsite copy and its decryption instructions. A plaintext public Actions artifact is forbidden.
6. Add Pages service binding FOOTBALL_ENGINE -> the new Worker. Add FCD_ENGINE_ENABLED=true and the
   shared service credential to the correct PRODUCTION environment, retaining every existing binding.
   The currently available GitHub token receives Pages API HTTP 403; source sync alone cannot do this.
7. Enable the shared client config with the actual API origin; merge the tested source with a lease.
   Use the existing guarded AI-Recap-GitHub `football-standalone-sync.yml` once for this code release.
   This is the initial infrastructure build; routine content publishing never uses this path.
8. Atomically activate the verified initial D1 version, then verify exact manifest/generation and
   all ten report/odds routes, news scope, real PNG/video outputs, login, APK and analytics behavior.
   If the release lacks a valid active publication, the shared reader keeps the old static fallback
   with its visible stale notice; never claim that fallback proves successful API activation.
9. Verify import -> validate -> publish -> current-odds -> rollback with authorized test data on
   isolated resources. On production verify safe reads and exact deployed bytes; do not create fake
   daily content to demonstrate a write. Record unchanged deployment IDs for subsequent authorized
   real data updates. Update project.json to live-verified only after actual production checks pass.

## Rollback
Restore the exact saved Pages deployment (or prior delivery commit through the guarded workflow).
Disable frontend API config and FCD_ENGINE_ENABLED; retain the old static data. Keep original owner
secrets and GOALZONE_ANALYTICS_DB untouched. No DB/table/archive deletion is part of rollback.
D1 content rollback selects a previously published, validated version with the current generation;
it does not rebuild code. History and generation remain monotonic. Save the failed-release evidence.

## Current access finding
Read-only run 39774079129 on 2026-10-22 confirms the GitHub-stored token is active, Workers/D1 metrics
are accessible, but the target Pages project GET and token-policy details return HTTP 403.
Only one account was visible to this credential. This does not dispute the owner's prior Pages Edit
setup; it describes the credential currently available to this execution path. Reuse existing access
where possible. Do not ask for passwords/tokens in chat or restart the previously failed cloud login.
