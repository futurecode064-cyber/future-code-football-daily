# MIGRATION STATUS — Football Daily Standalone Repository
Updated: 2026-10-12 (Asia/Yangon)

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

## NEXT: NO-DOWNTIME CLOUDFLARE VALIDATION
1. In your current Cloudflare account, go to **Workers & Pages → Create application → Pages → Connect to Git** and select `futurecode064-cyber/future-code-football-daily`.
2. Create a separate temporary project, for example `future-code-football-test` (not the existing production project name). Production branch: `main`; framework: `None`; build command blank; build output directory: `football-daily`; root directory: blank (repository root).
3. Visit and validate the new preview project's root `/`, `/odds.html`, `/ykz-family/`, `/ykz-family/odds.html`, `/data/today.json`, `/data/odds/2026-10-12.json`, original/brand image download buttons, mobile layout and date selectors.
4. Only after verifying all endpoints, choose a safe migration strategy for the existing URL: either keep original Pages project and set up a tested cross-repo sync using deliberately scoped permissions, or migrate an owned custom domain through a controlled DNS switch while preserving the original pages.dev deployment. An existing Cloudflare Pages project's Git repository may not be changeable in place; do not assume this control exists.
5. Once the live host is demonstrably powered from the new repository, change the 06:00 preparation/publish operational instructions to use `future-code-football-daily:main`, preserving the user-approved **manual approval before publish** rule.
6. Only then stop unwanted preview deployments on the old Pages project or narrow its branch build controls, if desired.

## SECURITY AND FUTURE ACCOUNTS
- Keep backups with GitHub account recovery and at least one other authorized collaborator/owner where supported. Store any access credentials only in private password manager/Secrets, never in README or public GitHub files.
- User-approved formatting: `football-daily/DAILY_APPROVED_FORMAT.md`; brands: `football-daily/BRAND_SITES.md`.
- 06:00 Myanmar-time research task is **data preparation only**. No repeated live-score polling, and publication is only on explicit user instruction.
