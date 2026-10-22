# QA checkpoint — 2026-10-22, Asia/Yangon

Source base: 02103874457602b36c2c08bc07eb23e917d56d0c. No daily content generated/published.

| Check | Actual result |
|---|---|
| Existing website Node suite | 254 total: 253 passed, 1 existing skip, 0 failed |
| Engine/loader/owner proxy suite | 15 passed, 0 failed |
| Python live-checker tests | 5 passed |
| Owner/login/routing regression after proxy change | 13 passed |
| Persistent reference hashes | verified by scripts/football/check-config.mjs |
| Existing public JSON migration | 36 resources, 3 batches; all JSON values equal after SQLite import |
| Current report/odds/files | git diff --exit-code football-daily/data clean |
| Draft visibility | unpublished snapshots rejected by public API |
| Atomic activation & concurrency | conditional version/generation + SQL audit trigger verified locally |
| Duplicate/retry imports | same key/body reuses draft; conflicting body rejected |
| Evening prices | opening and news unchanged; absent current prices blank |
| API outage | complete saved bundle or existing static UI; mixed-version response rejected |
| Owner/CSRF/secret handling | existing session required; secret forwarded only in service binding |
| Server validation | existing owner editorial rules retained; explicit source/download QA evidence required |
| Free CPU/D1/edge usage | NOT measured in Cloudflare |
| Worker/D1 deployment | NOT attempted; account authentication missing |
| Five-site live API integration | NOT implemented/activated yet |
| Actual downloaded PNG/mobile/APK WebView with new API | NOT tested |
| Live no-build publication/history verification | NOT tested |
| Production backup/restore automation & retention | NOT configured |

The initial SQLite migration is a read-only-source compatibility test, not verification that
existing football facts are correct. Legacy pending editorial flags were preserved unchanged.
The new code does not fix or republish the existing daily report.
The API has no GitHub/network publisher calls. This establishes separation in implementation;
it does not prove real production deployment history until staging/account tests run.
