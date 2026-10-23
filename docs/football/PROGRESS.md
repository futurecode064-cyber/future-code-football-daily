## 2026-10-23 verified reconciliation checkpoint (not live production)

- Canonical main d9300545ba685690984769b3acb53f050f6f929b (23 October report and odds, 22 October archived results, PNG team crests) was merged without source data loss; source QA now targets the 22 October archive. Candidate b8bdc7fba53ef3eea80029214324af08b133cfb7.
- Hosted owner/private snapshot QA run 39898090157 SUCCESS: 39 exact resources, 20/20 pages, 10/10 actual downloaded PNGs, all download modes, owner login, service proxy, CSRF, draft privacy, and no deployment on imported source data.
- Unconnected production-private D1 preparation run 39898312293 SUCCESS: 39-resource private draft 4d6398bc-8e52-452f-b956-4516d75831be, generation 0, no active publication, 8 batches. Complete 3,087,690-byte encrypted SQL exported and restore-tested. GitHub artifact 12477578130 expires 2026-11-06. Private independent copy: ChatGPT Library /Future Code Football Backups/football-production-private-backup-2026-10-23.zip. Decryption key stored only in FOOTBALL_BACKUP_RECOVERY_KEY GitHub Secret.
- Exact source tests passed: Actions 39897820124 and 39897820141. No canonical main or Pages production build was triggered by this migration branch.
- RELEASE BLOCKERS: Pages production FOOTBALL_ENGINE binding/FCD_ENGINE_ENABLED/FCD_ENGINE_TOKEN absent; Pages Write not verified (read GET 200 only); Free-tier runtime capacity not fully verified; no main/Pages cutover or real D1 publication. Do not merge draft PR or run legacy production mirror before the final cutover gates. Initial code release needs one guarded build; routine daily data updates use D1 only.

# Future Code Football migration checkpoint

Status: PARTIAL — hosted infrastructure/owner/frontend QA passes; production website cutover is not performed.
Date: 2026-10-22, Asia/Yangon. Checkpoint branch: `football-engine/workers-d1-migration`.
Draft PR: https://github.com/futurecode064-cyber/future-code-football-daily/pull/36

## Current scope and concurrency reconciliation
- Infrastructure migration only. Full V3 is an editorial reference, never a command to create new daily content.
- Canonical main advanced in another Chat to `09aca1257a295f1a8b935f30a204b8dc5842e630`:
  its already-published 36-fixture evening prices and new evening resource are preserved exactly here.
- Current source public snapshot: 37 JSON resources; read-only migration packaging now makes 8 batches
  with a 400 KB target. No new previews, odds or news were generated or published in this continuation.
- The previous local three-file staging-registry edits were superseded by the other Chat's explicit
  production-versus-staging registry. They were preserved in the old checkout and were not overwritten.
- Source data equals latest canonical main byte-for-byte. Production source mirror was not invoked.

## Implementation saved in Git
- Complete V3 and infrastructure requirements, immutable reference hashes, AGENTS.md, persistent registry,
  Daily Update Workflow, validation rules and Burmese One-Shot prompt. A fresh Work reads the checkpoint
  branch explicitly; it must verify actual Git heads/runtime status and independently available credentials.
- Separate lightweight Worker + additive D1 schema, immutable private drafts, source ledger/manifest,
  stable IDs, idempotency, optimistic concurrency, atomic activation/audit, history, archives and rollback.
- Full V3 editorial validation for NEW content; initial unchanged migration has an explicit preservation
  review mode. Known legacy friendly-form warnings are documented in CURATION_QA_2026_10_22.md;
  no existing football facts were silently rewritten or newly certified as researched.
- All ten existing report/odds pages and AI/news/PNG/video consumers use one complete pinned bundle.
  Partial failure uses a complete saved publication or whole-page legacy fallback with a visible notice.
- Owner admin: source/PDF hash + private ledger, fixture/odds/previews/forms/special/results/AI/news sections,
  search/league filters, row editing, exact coverage, before/after comparison, bounded draft imports,
  validation, history, usage, backup and rollback. PDF extraction remains in Work/browser, not edge CPU.
- Current-price editing preserves opening prices and aligns report/table fields. Existing owner session
  and CSRF guard protect the service proxy. Enabling D1 mode blocks legacy GitHub publishers.
- Owner-only `?fcDraft=VERSION` previews use all five existing renderers, never persistent browser cache.
  An anonymous/failed draft request fails closed; it never quietly displays another public/static version.
- Immutable published API resources use edge + browser caches. Manifest and owner endpoints remain no-store.
- Free CPU optimizations: smaller imports, no recursive canonical copy for new requests (legacy retry
  hashes still accepted), streamed raw owner snapshots, cached server structural checks per content digest,
  and current-report/odds-only loads for editorial validation and current-odds updates.
  Migration 0003 is additive; missing structural receipts block validation until safe reimport.

## Verified remote resources
Original staging: `future-code-football-engine-staging` / `future-code-football-db-staging`.
D1 ID: `a4ddc00f-411b-4ee5-ab4a-dfe13486c334`.
Origin: https://future-code-football-engine-staging.futurecode-dubai-86851bf2.workers.dev
Run 39746102616 deployed/imported 36 original resources privately; generation 0, no active publication.
Read-only verification run 39750290153: private endpoints reject anonymous access, physical D1 2,596,864 bytes.

Isolated QA backend: `future-code-football-engine-qa-smoke` / `future-code-football-db-qa-smoke`.
D1 ID: `86a9ed8a-deb4-46a1-80c5-e744d2b47aa5`.
Synthetic-only full import/validate/publish/evening/rollback/no-build proof: run 39754490298.
Synthetic real video container download: run 39755484428.
No synthetic fixture was written to the production website or original staging snapshot.

Hosted owner frontend: `future-code-football-owner-preview`, using the existing Pages handler as a
TEST static-assets Worker only. The production frontend remains the existing Cloudflare Pages app.
Run https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/39775311571 — SUCCESS.
Candidate commit `81ea35c4123f25fa1dea71edd84ae972673eb686`:
- Additive migrations and current backend code deployed only in disposable QA.
- 37 unchanged public JSON resources imported into private draft `f455d5f4-8b8f-42b0-9802-f3e571ddf84e`.
- Owner login -> service binding -> D1, CSRF rejection, legacy publisher block: PASS.
- 20/20 report/odds pages (5 brands × 2 page types × desktop/mobile viewport): PASS, exact pinned source.
- 10/10 actual downloaded PNGs (5 preview + 5 odds) have valid signatures/dimensions; representative outputs
  visually inspected for Burmese article text, branding, logos and separate opening/current prices.
- Anonymous/private API draft access: rejected. No real snapshot publication or production change.
- Deployment IDs unchanged during imports and browser reads.
- A later extended attempt stopped at page 20 because the owner read limiter shared the write budget.
  Dedicated bounded owner-read rate limits and small pinned private resources now replace repeated
  full-history draft responses; re-run extended all-frame/split/filter/real-video/photo checks.
- This mobile viewport test is not an installed physical Android APK/WebView test.

## Backup and recovery
Run 39756965147 — encrypted full original staging SQL backup with independent GitHub recovery secret:
SQL 2,476,646 bytes; SHA-256 d0bbb0fec1ea4aa1cf1539bc53626f53804ff119f8ab2d72d281181e35582f7d.
AES-256-GCM/HKDF encryption occurs before public-repo artifact upload; SQL restore and tamper tests pass.
An encrypted owner copy `football-staging-db.enc.json` is saved independently of the 90-day Actions artifact.
No password, raw token, recovery key or decrypted SQL was copied to Git or owner file storage.
The other Chat previously displayed the chosen recovery key; replace it privately before production use.
Retain older keys privately until older backups are no longer needed. Never publish their values.

## Actual access and runtime findings
Read-only run 39774079129: active GitHub token; Workers and D1 analytics readable.
Target Pages project GET: HTTP 403. Only one account visible to this credential; no readable matching project.
Token policy details and subscription/plan metadata: HTTP 403. This does not dispute the owner's prior
Pages Edit configuration; it describes the exact credential currently usable by this execution path.
Existing source -> AI-Recap-GitHub -> Pages Git sync is working, but it cannot set the required service
binding and Pages secret/environment values by itself. Do not request another password or retry failed login.
Historical mixed-workload CPU sample had a high tail; candidate-specific profiling after optimization is
pending. Candidate 81ea35 had raw CPU quantiles 28003/46829 over 36 requests; this is NOT a passing Free-limit
gate. Normal owner clients now use small pinned raw resources instead of complete historical responses;
reprofile the new implementation. Never present CPU as wall time or infer a paid-plan subscription.

## Remaining release gates
| ID | Remaining action |
|---|---|
| ACCESS-PAGES | Make the already-authorized Pages project/binding configuration accessible through the existing secret or owner account; verify actual current configuration before additive writes. |
| PERF-FREE | Record candidate-specific CPU, request/row/storage metrics; optimize further if needed. Account billing metadata is not readable; no paid upgrade/card operation is authorized. |
| QA-MODES | Finish all existing PNG frame/split/filter/video/photo checks on the unchanged real private snapshot. Physical APK/WebView remains separately untested. |
| RECOVERY-KEY | Rotate the previously chat-displayed recovery key privately; restore-test and save a fresh encrypted backup before activation. |
| CUTOVER | Follow CUTOVER_PLAN.md after the above technical evidence exists and the owner's final approval. No main merge/mirror/binding switch/data activation has occurred. |

Supplied requirements §14 says: “Major Production Cutover ကို ကျွန်တော့် Final Approval ရယူပြီးမှ ဆောင်ရွက်ပါ။”
Development, testing and non-destructive preparation remain authorized. Final approval is for the
concrete production switch; do not ask prematurely or infer it from a generic request to continue.

## Unconnected production namespace prepared
Run 39776885571 — SUCCESS. Worker `future-code-football-engine`, D1 `future-code-football-db`
(ID `d2cc165f-5957-4b94-b2b1-9c79e79adbb1`). Origin:
https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev
37 unchanged resources in 8 private batches; draft fd3e1a02-adca-4417-a757-57d9716157f2.
Generation 0, no active publication, public data denied, no Pages binding/client switch.
Full SQL 2,531,786 bytes, restored then encrypted before artifact upload.
This is non-destructive preparation, NOT production website cutover.
Refresh this unconnected namespace to the final tested code before any approved activation.

## 23 October continuation
- Existing secret capability check 39880247811 again confirms Pages HTTP 403; no alternate Pages
  secret is configured. Owner authorization is present, but does not itself change the remote token.
- Hosted attempt 2 of 39778405187 passes all 37 private resource values, draft privacy, owner session,
  CSRF, blocked legacy publisher and real admin rows. Browser draft then fails because the Pages
  proxy stripped X-Football-Version. The proxy now forwards that header only; regression coverage
  verifies JSON/version preservation and forbids upstream cookie forwarding. Eleven focused tests pass.
- The earlier resource 405 disappeared on retry; deployment/secret propagation remains a readiness
  concern. No production release or data activation occurred.
- Encrypted inactive production SQL backup artifact 12424692706 now also has an independent owner
  copy: football-production-private-db.enc.json. No plaintext SQL or recovery key was saved.
- Owner was given the direct GitHub Secrets path and the existing supported alternate secret name
  FOOTBALL_PAGES_CF_API_TOKEN. Do not request password/login retries or repeat all prior setup.
- Hosted fixed-header candidate 39880604568 now passes the pinned resource checks, then times out
  waiting for the old source day's page count after the calendar changed to 23 October. Owner draft
  previews now anchor the shared report renderer and resource bundle to their explicit draft date;
  public date behavior stays unchanged. A midnight regression test covers previous-night resources.
- Full existing frontend suite after the header fix: 255 tests, 254 pass, one existing skip, zero failures.
  Local workerd/D1 parity, private resource backup/restore and unauthorized access checks also pass.

## Verified continuation after owner login — 23 October
- Existing Pages owner session is signed in; legacy editor state fetch separately reports unsupported redirect mode. No credentials were read or persisted.
- Fresh secret capability check 39886506800: existing FOOTBALL_PAGES_CF_API_TOKEN is configured, target Pages GET HTTP 200. This removes the prior read-access blocker; it does not prove write permission. No token recreation requested.
- Hosted exact candidate 87c51ce6057499ce636cc87569dfc5a8c9e51c01, run 39884977183: SUCCESS; 51 engine tests, 20 five-brand report/odds pages, 10 PNG downloads, all existing download modes, private resource parity, owner session/service binding, CSRF and legacy-publisher blocking. Production unchanged; no real publication.
- Runtime preflight now targets that run's exact 01:36:56.384Z–01:38:55.344Z window rather than the historical baseline. Actual candidate CPU/row results remain pending until the new read-only preflight returns.
- Today's attached 23(1).pdf contains 13 rows. Daily preparation is requested by the current owner, but no unconnected API activation or legacy publish is inferred from that request. Keep source names/opening odds and leave current prices blank.

- Pages metadata/preflight 39887007499 and 39887011613 pass: current deployment dcac042c-bc41-4804-859f-4c9ddc3559ff; source AI-Recap-GitHub/football-daily-render, production env names FCD_MAIN_PASSWORD/FCD_SESSION_SECRET, analytics binding GOALZONE_ANALYTICS_DB, no existing service binding. Preserve them all.
- The hosted report artifact was downloaded and confirms all 16 frame/colour selections, two-part odds, league filter, all three video previews, an actual MP4, and 10/10 news photos. Exact runtime window from report.json is 01:37:04.573Z–01:38:55.150Z; registry corrected to that boundary.
- New required CI exposed two existing test-harness defects: navigation VM lacked browser-standard URLSearchParams; ciphertext corruption could randomly replace an A with A. Added the standard global and flipped a decoded ciphertext bit deterministically. Seven focused navigation tests and all three backup crypto tests now pass locally. No assertion removed and no production runtime code changed.
