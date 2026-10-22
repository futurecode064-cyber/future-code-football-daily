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
- Extended all-frame/split/filter/real-video/photo QA is prepared; consult current registry for actual result.
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
pending. Raw values must not be presented as wall time, paid-plan status or a passing Free-limit gate.

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
