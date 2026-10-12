# MIGRATION STATUS — Football Daily Standalone Repository

## PRODUCTION MIRROR — END-TO-END VERIFIED (2026-10-12)

**STATUS: COMPLETE.** The user tested the separate Cloudflare Workers site on a real phone and confirmed that football matches appeared and PNG downloads worked. The original Cloudflare Pages project was NOT recreated or disconnected.

- **Canonical repo to edit:** https://github.com/futurecode064-cyber/future-code-football-daily — branch `main`. Approved football match/odds/results updates belong here, only after explicit publication approval.
- **Existing production repo:** `futurecode064-cyber/AI-Recap-GitHub` branch `football-daily-render` (used purely as the original Cloudflare Pages delivery source for this project). Do not edit it directly for new reports.
- **Sync workflow:** `AI-Recap-GitHub/.github/workflows/football-standalone-sync.yml` on its default `main` branch, scheduled approximately every 30 minutes (UTC minutes 11 and 41), plus manual dispatch. Runs skip commits/deployments when the Football tree is unchanged. No football-score internet polling occurs.
- **End-to-end changed-source verification:** Workflow run https://github.com/futurecode064-cyber/AI-Recap-GitHub/actions/runs/38225848925 **success**. New source version `7a70677483773f4d84a370eb1666269c28573670` was mirrored into original Cloudflare Pages branch production commit `5e0179d2000167b52c0de65b227d753c7bf7c54b`. The resulting `football-daily/` tree hash in both repos matches exactly: `0446f1ac6efc82867f9d7542a8a1a80b5db89433`.
- **Public Cloudflare production proven to have received the change:** https://future-code-football-daily.pages.dev/BRAND_SITES.md and https://future-code-football-daily.pages.dev/DAILY_APPROVED_FORMAT.md both now contain the **new standalone repository** as the approved publication source. Original `/` and `/ykz-family/` remain publicly accessible.
- **Original repo unnecessary polling disabled:** 15-minute Scores/H2H and every-three-hour Fixture schedules removed, along with the old automatic rollover's scheduled writes. All remain manual emergency-only. Daily read-only publication audit stays enabled; user-approved 06:00 Yangon research-only task unchanged.
- **Safety:** `.github/football-sync-state.json` on the original production branch records the last synced tree. Any independently changed production subtree triggers a conflict error instead of destructive overwrite. New football source must pass JS tests and Python daily report audit before sync pushes.
- **No new Cloudflare API token required, no additional paid service, no new custom domain, no moving of the `pages.dev` address.** GitHub's cron jobs can run late; production publication is not instantaneous (typically the next scheduled sync). Optional manual workflow dispatch can speed it up.
- **IMPORTANT** This implementation retains the old repository as a delivery mirror because the existing Cloudflare Pages project stays Git-connected to it; the software source of truth and editorial workflow are now independent in the new repository.

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
- **Important:** Changed-source sync and public Cloudflare live delivery were verified end-to-end; see the production mirror verification section above.
- Existing domain/project, new `workers.dev` test site, original APK repositories and brand URLs were not deleted, renamed or disconnected.

## TEST DEPLOYMENT VERIFIED — 2026-10-12 14:52 MMT

- Cloudflare test project name: `future-code-football-test`; deployed as a **Cloudflare Worker with Static Assets**, not a classic Pages project.
- Verified test URL: https://future-code-football-test.futurecode-dubai-86851bf2.workers.dev/
- Verified test routes: `/`, `/odds.html` (Cloudflare canonical redirect may use `/odds`), `/ykz-family/`, and `/ykz-family/odds.html` (may redirect to `/ykz-family/odds`).
- Verified publicly served resources: `/app.js`, `/odds.js`, `/ykz-family/brand.css`, `/ykz-family/brand.js`, `/data/today.json`, `/data/odds/2026-10-12.json`, `/data/archive/2026-10-11.json`.
- YKZ slogan verified as `အတူရှေ့ဆက် YKZ`; CSS verified true red `#e00000`. Screenshot deploy log states `Success! Build completed` and 36 assets uploaded. Warnings about `workers_dev` and `preview_urls` being default-enabled are informational, not failed builds.
- Existing live `https://future-code-football-daily.pages.dev/ykz-family/` still responded with the approved YKZ header/slogan.
- **User-confirmed on real phone:** populated match cards and PNG downloads work on the test Worker. **Verified via Cloudflare production:** changed-source documentation was deployed after the guarded GitHub sync. No repeated sports score polling.
- **PRODUCTION HOST UNCHANGED, MIRROR VERIFIED**: original `future-code-football-daily.pages.dev` remains on its existing Cloudflare Pages deployment, now receiving the latest approved source through the guarded GitHub sync. Do not delete/disconnect/change the original project. The new `workers.dev` site is a working staging URL; no DNS or old project routing was switched.
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
- New repository is now the canonical editable source. Publishing to new repo `main` is mirrored to the legacy Cloudflare Pages production source by the guarded scheduled GitHub Action; updates may be delayed until its next run.
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
