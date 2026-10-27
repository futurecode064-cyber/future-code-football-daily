# Future Code Football Daily — One-message publishing contract

**Trigger:** When the owner says `ဒီနေ့အတွက် တင်ပါ` or an equivalent command, start and complete the existing connected-tool daily publishing process. This authorizes the *requested daily publication*, not invented data, unrelated theme changes, or overwriting newer production work. Always use `Asia/Yangon` for editorial day and resolve after-midnight football-night fixtures from verified source dates.

## Runtime discovery is mandatory before every write

- Source: `futurecode064-cyber/future-code-football-daily` (`main`).
- Current Cloudflare Pages production repository: `futurecode064-cyber/AI-Recap-GitHub`, branch `football-daily-render`, output folder `football-daily/`.
- Root: https://future-code-football-daily.pages.dev/
- Read current **head SHA of both branches**, production `football-daily/football-engine-config.js`, and **both** `football-daily/data/today.json` files first. Source/main can lag production. Never overwrite today's production report with an older source report or force-push an entire directory.
- If production `FC_FOOTBALL_ENGINE.enabled` is `false`, live pages read STATIC files from the **production branch**. **D1-only publication is not live publication.** Publish verified targeted static JSON directly to that branch through GitHub, respecting each file's latest blob SHA, and verify live Pages after deployment. If `true`, inspect actual runtime API path and authenticated D1 contract; don't guess or toggle the flag.
- The old October 26 D1 issue publisher is date-hard-coded. Don't reuse it for a new day. Stale migration notes and runbooks never override currently observed runtime architecture.
- If branches or files have concurrent changes, reconcile per-file against latest production; do not reset later work. Keep a recovery point (old production commit SHA).

## Daily production sequence — ONE owner message, no repeated explanation

1. Read this file, `AGENTS.md`, `football-daily/DAILY_APPROVED_FORMAT.md`, `football-daily/PROFESSIONAL_MYANMAR_FOOTBALL_JOURNALIST_MASTER_PROMPT.md`, `football-daily/RESEARCH_STANDARD.md` and `config/football/validation-rules.json`. Retrieve and use today's owner PDF, owner previews, and Special Choice from the current chat/previous accessible files. Latest explicit owner wording has priority; do not require owner to repeat it.
2. Capture current production report, odds, archive and relevant Git blob SHAs. Preserve prior day's published report and verified final results. Search and confirm yesterday's results independently; an Internet prediction is NEVER an FT score.
3. Verify today's intended competitions, kickoff (Myanmar local), exact Burmese club names and match ordering from PDF, club/league crests, last-five W/D/L, standings/points, 1X2 and trustworthy source/date metadata. Never invent missing facts; display blank or keep draft when unverifiable. **CRITICAL LOGO GATE:** logo URLs in JSON alone do not prove PNG success. For every club in today's previews and odds sheet, cache each authentic crest as an available same-origin PNG and update BOTH `football-daily/main-export-logos.js` (teams map) and `football-daily/brand-export-data.js` (teamFiles map) before publishing. Check every URL maps to the correct existing local asset and never substitute a different club's logo.
4. Map owner-provided preview prose and Special Choice texts to exact `fixtureId`; preserve author text, facts, required endings and special-choice count. For missing original analysis, research match-specific professional Burmese commentary; retain provenance rather than generic boilerplate.
5. Keep Myanmar body/goals odds **`မူလ`** and **`ယခု`** distinct. Preserve the source PDF names/prices exactly; owner provided current odds take precedence. Keep Internet predictions clearly distinct from results. Do not silently fill missing market prices with unrelated web odds.
6. Update only the necessary **shared** files: `football-daily/data/today.json`, `football-daily/data/odds/YYYY-MM-DD.json`, `football-daily/data/archive/YYYY-MM-DD.json` and related approved evidence. Six brands use the same data. Do not change their colors, logo identity, PNG export or video functionality without owner request.
7. Preflight: JSON schema, date, all fixture identities, sources, valid score/status, nonduplicated PDF rows and IDs, two teams' details, logos, last 5, standings and 1X2 where available, previews, picks, opening/current prices and yesterday's archive. Run `python football-daily/scripts/daily_guard.py audit` against today's candidate and focused regression checks. Any pre-existing legacy/date-hardcoded test failure must be reported, not hidden. Test real PNG/frame downloads and mobile browsers when tools permit.
8. Publish using runtime-verified writer. For static production, update target files with blob-SHA concurrency checks in `AI-Recap-GitHub:football-daily-render`, read back the commit, and verify the actual Cloudflare Pages version. Synchronize source/main only when safe; **never roll production backwards**.
9. Once published, use connected GitHub to **create an owner issue titled `[FOOTBALL-DAILY-VERIFY] YYYY-MM-DD`** in the source repository. This is the read-only verification trigger for `.github/workflows/football-daily-static-audit.yml`: static prod/live readback, six mobile browser screenshots and real odds PNG download evidence. Alternatively run `node scripts/football/daily-state-audit.mjs` and `node scripts/football/daily-live-browser-qa.mjs` with Playwright available. Preserve the action run URL/receipt. Compare report/date/live-data. Check root plus `/ykz-family/`, `/bw-sport/`, `/ko-thet-family/`, `/future-code-journal/` and `/kmm-sport-hub/`; validate assets and actual PNG browser rendering separately. A real saved-PNG test must confirm team logo PIXEL differences versus a crestless PNG; an image's existence, successful download, or nominal dimensions alone is insufficient. If external Pages is unreachable, state **NOT VERIFIED**; do not substitute GitHub success.
10. Deliver a **receipt**: Yangon date, target SHA, report match count, prior FT results count, odds and previews coverage, Special Choice count, current git-vs-live state and six-site browser/PNG checks. Record failures precisely. No unsupported claims of full live success.

## State labels

- `DRAFT` — incomplete or unsourced.
- `READY` — complete verified package; publication not yet committed.
- `GITHUB UPDATED` — named production commit read back; live deployment **not yet proven**.
- `LIVE VERIFIED` — Cloudflare live JSON matches production date/identity and all six site routes load; PNG visual tests reported separately.
- `BLOCKED` — name the exact missing source, permission, failed test, deployment or verification step; don't ask for information already supplied.

No paid APIs, no card-required service, no unrequested cron jobs. A GitHub Action cannot autonomously generate original verified Burmese reporting without real data/AI providers. **The one-message trigger is handled by ChatGPT using connected tools**, with preflight and readback; it is not a claim that a background assistant persists between chats.

## Main-only user Frame Studio (approved 2026-10-27)

- Preserve `football-daily/main-frame-editor.js` loaded **only** from root `football-daily/odds.html`; five branded odds pages must stay unchanged.
- Allow locally saved custom frame images (JPG/PNG/WEBP), user-set names/colors/top and bottom artwork proportions, edits/hiding/restoring stock frame choices, and Frame ZIP based on the live in-memory `designs` list. `main-odds-dom-frame.js` supports custom `design[4].image` while preserving original built-in banner assets.
- League and each fixture's home/away Burmese display names may be overridden **only in the temporary cloned PNG DOM**. Never modify published team identity, league IDs, the real on-screen odds table, actual price data or shared `data/odds` JSON. `FutureCodeFrameEditor.exportNames(date)` provides the current date-scoped overrides.
- Presets, uploads and export-only names are stored in the visiting browser's IndexedDB, not globally on the website, with JSON backup/import for device transfer. Do not claim public/server-side ownership, privacy across users, or multi-device sync. A globally shared, owner-only manager requires authentication and persistent backend storage.
- Validate a real 2160-wide custom PNG, local persistence across reload, stock frame hide/restore, export-only text fidelity, and no UI leakage into brand mirrors. The production QA workflow is `.github/workflows/main-frame-editor-live-qa.yml` on `AI-Recap-GitHub:football-daily-render`.
