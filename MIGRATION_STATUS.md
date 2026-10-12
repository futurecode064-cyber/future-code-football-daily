# MIGRATION STATUS — Football Daily Standalone Repository
Updated: 2026-10-12 (Asia/Yangon)

## VERIFIED REPOSITORY-TO-PRODUCTION BRIDGE — 2026-10-12

- **Authoritative editable source:** `futurecode064-cyber/future-code-football-daily` branch `main`.
- **Existing Cloudflare Pages host retained:** `future-code-football-daily.pages.dev`. It stays connected to the original repository `futurecode064-cyber/AI-Recap-GitHub`, branch `football-daily-render`.
- **Guarded GitHub synchronization:** `.github/workflows/football-standalone-sync.yml` installed on the **default branch** `main` of the original repository. It runs at UTC minute 11 and 41 (roughly every 30 minutes), with manual `workflow_dispatch` available.
- This is **GitHub repository content synchronization only**; it does not scrape soccer sites or re-check live match scores. When the Football source tree has no changes, it performs **no commit, no redeploy**.
- The first parity run of the installed bridge was successful (no changes needed). The old production branch contains a safety marker `.github/football-sync-state.json` recording the verified existing `football-daily/` Git tree SHA. If a change was made directly to the old production branch by another process, the sync **aborts rather than overwriting that work**.
- New-repo updates are staged only under `football-daily/`, verified byte-for-byte via Git tree SHA, tested with Node/Python and `daily_guard.py audit`, then published by a single old-repo commit. Cloudflare's existing Git integration should deploy this commit automatically. GitHub schedule timings can be delayed by the GitHub platform; this is not an immediate webhook.
- The old repo's **15-minute score/H2H polling**, **3-hour fixture polling**, and **automatic old-branch rollover** have had their schedules disabled on `main` (2026-10-12). Their manual dispatch option is preserved as a fallback only; using a legacy manual workflow may cause a guard conflict that must be reconciled before the next sync. The separate daily read-only publication audit remains scheduled.
- User-approved 06:00 Yangon preparation remains research/draft-only; **user must explicitly approve GitHub publication** to the new authoritative repository. Daily sports results are not polled repeatedly.
- **Important:** At this point, the guarded bridge has been installed and passed its initial parity run; a changed-source publish and matching Cloudflare live deployment still need to be verified. Do not describe the end-to-end cutover as verified until that check passes.
- Existing domain/project, new `workers.dev` test site, original APK repositories and brand URLs were not deleted, renamed or disconnected.

## TEST DEPLOYMENT VERIFIED — 2026-10-12 14:52 MMT

- Cloudflare test project name: `future-code-football-test`; deployed as a **Cloudflare Worker with Static Assets**, not a classic Pages project.
- Verified test URL: https://future-code-football-test.futurecode-dubai-86851bf2.workers.dev/
- Verified test routes: `/`, `/odds.html` (Cloudflare canonical redirect may use `/odds`), `/ykz-family/`, and `/ykz-family/odds.html` (may redirect to `/ykz-family/odds`).
- Verified publicly served resources: `/app.js`, `/odds.js`, `/ykz-family/brand.css`, `/ykz-family/brand.js`, `/data/today.json`, `/data/odds/2026-10-12.json`, `/data/archive/2026-10-11.json`.
- YKZ slogan verified as `အတူရှေ့ဆက် YKZ`; CSS verified true red `#e00000`. Screenshot deploy log states `Success! Build completed` and 36 assets uploaded. Warnings about `workers_dev` and `preview_urls` being default-enabled are informational, not failed builds.
- Existing live `https://future-code-football-daily.pages.dev/ykz-family/` still responded with the approved YKZ header/slogan.
- **Not yet verified**: match-card JS data hydration on a real browser session, score refresh behavior, mobile layout, image downloads/PNG exports, and the Git-triggered deployment for later commits.
- **PRODUCTION NOT MIGRATED**: original `future-code-football-daily.pages.dev` still uses the original Cloudflare Pages deployment. Do not delete/disconnect/change the original project. The new `workers.dev` site is a working staging URL; no DNS or old project routing was switched.
- For future updates, do not publish the same football report to two independent Git sources unless explicitly implementing tested synchronization; daily 06:00 preparation remains draft-only and requires explicit user approval before GitHub publishing.

## VERIFIED COMPLETED
- New repository: https://github.com/futurecode064-cyber/future-code-football-daily
- Default branch: `main`
- Copied all 39 source files from `AI-Recap-GitHub` branch `football-standalone-ready`, including 37 football project files, the GitHub Actions workflow and the staged README.
- SHA comparison: all original 39 files matched the newly-created destination 39 files; no missing or extra files at initial migration. Uploaded YKZ logo `football-daily/ykz-family/assets/logo.webp` was verified byte-for-byte at SHA `10924cd92ea315e721a617d2ca63fb7541582e3a`.
- Initial migration commit on the new repository: `11c792eb49d1e0e27a85c8830b1df2fa14f4f2a1`.
- GitHub Actions `Football Daily Website Tests`: PASS; run https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/38220254083.
- Nothing has been removed from the original repository; no Cloudflare Pages production source or DNS was altered.

## CURRENT LIVE PRODUCTION — DO NOT ASSUME CUTOVER
- Original Cloudflare Pages project: `future-code-football-daily`.
- Site: https://future-code-football-daily.pages.dev/
- YKZ brand: https://future-code-football-daily.pages.dev/ykz-family/
- Original production git source remains `futurecode064-cyber/AI-Recap-GitHub`, branch `football-daily-render`.
- New repository is a standalone, verified copy, **NOT YET** the source automatically deployed to that existing production Pages project. Publishing to new repo `main` alone will **not** update the current live site until hosting is connected or a proven synchronization path is established.
- Preserve the original source and deployment. Do not delete, transfer/rename the original Pages project, or disconnect its Git integration to try to connect this new repo; this can break the existing pages.dev hostname.

## NEXT: SAFE NO-DOWNTIME PRODUCTION CUTOVER
1. Test Worker already exists; **do not create a second staging project** unless there is an intentional reason to switch hosting technology. Verify the existing Worker is Git-connected to `futurecode064-cyber/future-code-football-daily:main`.
2. Keep the current successful `future-code-football-test` Workers static-assets test deployment. Expected configured asset output: `football-daily/`; confirm its Git Build settings rather than recreating it.
3. Core test domain routes and JSON were already checked as described above. Do remaining real-browser UI checks: populated cards, odds, PNG downloads, mobile layout and date navigation.
4. Only after verifying all endpoints, choose a safe migration strategy for the existing URL: either keep original Pages project and set up a tested cross-repo sync using deliberately scoped permissions, or migrate an owned custom domain through a controlled DNS switch while preserving the original pages.dev deployment. An existing Cloudflare Pages project's Git repository may not be changeable in place; do not assume this control exists.
5. Once the live host is demonstrably powered from the new repository, change the 06:00 preparation/publish operational instructions to use `future-code-football-daily:main`, preserving the user-approved **manual approval before publish** rule.
6. Only then stop unwanted preview deployments on the old Pages project or narrow its branch build controls, if desired.

## SECURITY AND FUTURE ACCOUNTS
- Keep backups with GitHub account recovery and at least one other authorized collaborator/owner where supported. Store any access credentials only in private password manager/Secrets, never in README or public GitHub files.
- User-approved formatting: `football-daily/DAILY_APPROVED_FORMAT.md`; brands: `football-daily/BRAND_SITES.md`.
- 06:00 Myanmar-time research task is **data preparation only**. No repeated live-score polling, and publication is only on explicit user instruction.
