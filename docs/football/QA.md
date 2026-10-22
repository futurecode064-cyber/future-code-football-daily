# QA checkpoint — 2026-10-22, Asia/Yangon

Source base: 02103874457602b36c2c08bc07eb23e917d56d0c. No daily content generated/published.

| Check | Actual result |
|---|---|
| Existing website Node suite | 254 total: 253 passed, 1 existing skip, 0 failed |
| Engine/client/owner proxy/backup suite | 29 passed, 0 failed |
| Python live-checker tests | 5 passed |
| Owner/login/routing regression after proxy change | 13 passed |
| Persistent reference hashes | verified by scripts/football/check-config.mjs |
| Existing public JSON migration | 36 resources, 3 batches; JSON-value parity after SQLite and actual local workerd/D1 import + export/restore |
| Current report/odds/files | git diff --exit-code football-daily/data clean |
| Draft visibility | unpublished snapshots rejected by public API |
| Atomic activation & concurrency | conditional version/generation + SQL audit trigger verified locally |
| Duplicate/retry imports | same key/body reuses draft; conflicting body rejected |
| Evening prices | opening and news unchanged; absent current prices blank |
| API outage | complete saved bundle or existing static UI; mixed-version response rejected |
| Owner/CSRF/secret handling | existing session required; secret forwarded only in service binding |
| Server validation | existing owner editorial rules retained; explicit source/download QA evidence required |
| Free CPU/D1/edge usage | NOT measured in Cloudflare |
| Worker/D1 deployment | Remote engine not deployed; local migrations/package/runtime verified. Secure Google failed; email/password secure submission did not complete |
| Five-site live API integration | Client wiring implemented and unit-tested; remote staging/production activation pending |
| Actual downloaded PNG/mobile/APK WebView with new API | NOT tested |
| Live no-build publication/history verification | NOT tested |
| Private snapshot backup/restore | Export + SHA-256 restore tools and local 36-resource recovery verified |
| Production full-DB backup destination & retention monitoring | NOT configured |
| Android WebView compatibility | Reader works without static Response.json; actual APK/device QA pending |
| Official package/schema checks | Wrangler dry-run bundle and both local D1 migrations pass |

The initial SQLite migration is a read-only-source compatibility test, not verification that
existing football facts are correct. Legacy pending editorial flags were preserved unchanged.
The new code does not fix or republish the existing daily report.
The API has no GitHub/network publisher calls. This establishes separation in implementation;
it does not prove real production deployment history until staging/account tests run.

Remote CI on implementation commit 535e1bc0e322b765a53b6c121ba9ffde310963c6:
- Football Engine Migration Checks: success, https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/39736172739
- Pages Worker Routing Safety Tests: success, https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/39736172651

Continuation checkpoint: frontend wiring, deduplication, private backup/restore and local-runtime
coverage are saved in the migration branch. Production data, source reference bytes and existing
site themes remain unchanged. The new API config remains disabled.

GitHub commit 3b6185c3927766f062cc575d8ba1abd76731e2f8 triggered the repository's existing
Cloudflare integration check `Workers Builds: future-code-football-test`; that external build failed.
Its check exposes only a Dashboard build link, not the underlying error log. No new engine deployment
is inferred from it, and the unknown Cloudflare build configuration has not been overwritten.
The separate GitHub engine and routing checks for that commit are tracked in runs 39741650327
and 39741650297; consult their actual latest status rather than assuming success.
