# Verified acceptance evidence — 2026-10-22

Infrastructure scope only. Existing published content is preserved, not newly researched or published.
Current source/rollback: canonical main `09aca1257a295f1a8b935f30a204b8dc5842e630`.

| Check | Actual evidence / result |
|---|---|
| Full references and daily rules | Hash-verified V3 + infrastructure specification + workflow + validation registry in Git |
| Existing website suite | 254 total: 253 pass, 1 existing skip; Python 5 pass |
| Engine/client/admin/security/backup | Latest local 50 tests; consult final run rather than historical counts |
| Runtime compatibility | Official workerd + local D1; 37 current JSON resources, 8 bounded batches; import/export/restore exact parity; anonymous access denied; private draft hidden |
| Remote synthetic lifecycle | Run 39754490298: import/validate/publish/current odds/rollback; deployment IDs unchanged |
| Hosted real private snapshot | Run 39775311571: 37 resources, 36 fixtures, 20/20 pages, exact JSON parity |
| Owner session -> service binding | Hosted PASS; CSRF rejected, secret stays server-side, legacy publisher blocked |
| Private preview | Hosted anonymous access rejected; no localStorage persistence; failure does not use public/static data |
| Real PNG downloads | Hosted 10/10 files, correct signature/dimensions; representative images inspected visually |
| Synthetic video download | Run 39755484428, actual MP4/WebM container verified |
| Complete real frame/filter/video/photo modes | Extended hosted check prepared; actual outcome tracked in project.json |
| Mobile | Chromium viewport PASS; installed Android APK/WebView not tested |
| Edge caching | Regression verifies immutable public cache hits avoid D1; drafts/manifests/brand-restricted news stay protected |
| Structural receipts | Regression blocks corrupt/unreviewed inherited archives; only server-created digest receipts accepted |
| Active-production guard | Provisioning refuses an existing active owned database before any deploy or secret rotation |
| Production availability | Five public home URLs returned HTML HTTP 200 after reconciliation; production API path still returns old HTML, so API is NOT live |
| SQL backup | Full original staging SQL restored then encrypted; independent owner copy retained; old recovery key rotation required |
| Current API permission | Read-only run 39774079129: Pages project HTTP 403, Worker/D1 analytics available |
| Free CPU budget | Historical mixed sample shows a high tail; optimized candidate measurement required before a passing claim |
| Production cutover/no-build proof | Not performed; isolated data-only no-build test is not production proof |

See PROGRESS.md for runtime IDs, boundaries and remaining gates; CUTOVER_PLAN.md for exact switch/rollback.
No paid plan/card operation, source mirror, main merge or production D1 activation occurred in this continuation.
