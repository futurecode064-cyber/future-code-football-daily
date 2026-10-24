# Future Code Football — daily no-build delivery

**Source data → owner-labelled GitHub Issue → GitHub Actions (existing Cloudflare secret) → immutable Workers D1 version → Main + Goal Zone.**

This is **not** `/editor/engine.html`, `git push football-daily/data`, Wrangler deploy, Cloudflare Pages build, or scheduled polling. It reuses the already installed `FOOTBALL_STAGING_CF_API_TOKEN` scoped to D1. Never paste that token into chat or issues. Production D1 binding and public reader remain unchanged.

## One-time installation

Merge the workflow and two helper scripts into default `main`, after test review. This one-time repository change MAY trigger one Pages Git build depending on Cloudflare configuration. No **daily** issue run changes site files or performs a build. Ensure existing Cloudflare Pages build watch rules exclude `.github/**` and `scripts/football/**` for future workflow-maintenance commits. The workflow runs only on the default branch because GitHub requires it for issue events.

## Each day — ONE-SHOT after collecting and validating data

1. Prepare **source-verbatim** date-scoped JSON package: `editorialDate` (Asia/Yangon), `sourceManifest.files` (actual filenames and SHA-256), `resources` (at least today report and today's odds for `daily`, OR `data/news/latest.json` for `news-only`), `review` (all nine source-backed QA gates). Do not invent verification evidence. A report already published via D1 remains untouched on `news-only` mode. Preserve the previous day final-score archive and existing active resources. For news, require exactly ten independently sourced, complete articles including women's sports; use licensed original/labelled archival photos.
2. Run `node scripts/football/prepare-daily-issue.mjs PACKAGE.json daily|news-only ISSUE_DIR` locally or have ChatGPT prepare the exact issue and comments. This generates one Issue body and numbered comments, with a checked **SHA-256** of the full JSON payload. For large data, the generator automatically splits it into comments; no Git source commit is needed.
3. Using authenticated GitHub, create the issue as repo owner (`futurecode064-cyber`), paste generated `issue-body.json` content into body, create **all** numbered comments in order, then apply `football-d1-daily-publish` as the **last step**. Adding that label triggers the workflow automatically; never label before uploading all comments.
4. GitHub Actions reads source JSON via `GITHUB_TOKEN`, verifies owner-authorship, every part, checksum, today in Yangon, structural schema and source-backed QA evidence; compares the live D1 active generation; creates a new immutable version containing **only supplied resource changes** and inherits all others, and changes the live pointer via a conditional generation update. A repeated identical package is idempotent; a stale or competing update is rejected without overwriting it.
5. The job performs read-back checks from Workers API and loads Main + Goal Zone HTML, confirms pinned content and unchanged Pages deployment ID (if Pages token is available); download `football-d1-daily-publish-receipt` from the workflow run. **A success receipt is required to claim Live Published.**

## Operational guardrails

- Never use the hard-coded `football-evening-d1-issue.yml` (October 23 / 13 rows) for new days.
- Never push daily content JSON to `main` or rebuild Pages for daily data.
- Do not claim automatic public browser-visual verification: this job checks HTTP + D1 parity, not screenshot-based or PNG download tests. The existing read-only browser/PNG QA workflows can be run separately when needed.
- If QA fails after activation, **do not retry** or create another version blindly; inspect receipt, public D1 state, and (if needed) use the existing audited rollback process.
- To revise the same day, generate an amended package with a different SHA and create a new owner-authored issue. Reload actual D1 generation before attempting the new publication.
- Editor login is independent and not used for this workflow. No TinyFish wallet is required.