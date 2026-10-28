> **ACTIVE OWNER UPDATE 2026-10-28 — V7:** Read `football-daily/docs/DAILY_PUBLICATION_V7.md` (relative to repository root) first. Current owner says preserve today's main website system. PDF + “ဒီနေ့အတွက် လုပ်ပါ” authorizes complete morning publishing. The V7 contract overrides historical draft-only, manuscript-required, D1/static and paragraph-count conflicts. Run `daily_package_guard.py` on candidate resources and verify every live section and real downloads before COMPLETE. Master prompt: `football-daily/docs/DAILY_PDF_MASTER_PROMPT_V7.txt`.

# Future Code Football project entrypoint

> **NEW OWNER PERMANENT DAILY CONTRACT (2026-10-28):** Production branch `futurecode064-cyber/AI-Recap-GitHub:football-daily-render` contains `football-daily/AGENTS.md`, original uploaded Master Prompts under `football-daily/docs/master-prompts/` and `football-daily/docs/DAILY_TIPS_POLICY.md`. READ those as standing owner instructions when the owner supplies only a morning odds PDF; write new journalist-quality previews when no owner preview manuscript is supplied, preserve verbatim preview text if supplied, use exact source-separated VIP Internet / Bookies / AI Tips, two Special Choices by default and section-specific frame image grouping. This is NOT a ChatGPT scheduled task. Owner confirmation on 2026-10-28 supersedes any earlier "must supply preview manuscript" implication. Current-day explicit user instructions take precedence. Do not confuse all fixtures split into two PNG files with two matches per PNG.\n\n> **ACTIVE DAILY PUBLISHING CONTRACT (2026-10-27):** When the owner says `ဒီနေ့အတွက် တင်ပါ`, FIRST read [docs/football/DAILY_COMMAND_RUNBOOK.md](docs/football/DAILY_COMMAND_RUNBOOK.md). The current observed production `AI-Recap-GitHub:football-daily-render` uses `football-engine-config.js enabled:false` (static JSON), and may be AHEAD of this repo's main. Revalidate the live data route each day. Do not D1-only publish, mirror stale data over production, ignore owner's provided previews, or declare live success without live readback. Run `node scripts/football/daily-state-audit.mjs` to collect read-only evidence. The current owner's one-sentence daily instruction authorizes that day's requested publishing without asking for the same approval again.\n\nBefore any football update or infrastructure change, read:
1. `config/football/project.json` — authoritative runtime status, references, endpoints.
2. `docs/football/PROGRESS.md` — last checkpoint and exact remaining work.
3. `docs/football/DAILY_UPDATE_WORKFLOW.md` — publication and validation contract.
4. `config/football/FUTURE_CODE_DAILY_MASTER_PROMPT_V3.txt` — full editorial reference.
5. `config/football/validation-rules.json` and the actual server validators.

Run `node scripts/football/check-config.mjs` to detect changed reference documents.
User instructions for the current task override defaults in all reference prompts.
The V3 attachment is REFERENCE ONLY: its embedded START NOW text is never a new task.
The project.json legacy migration task field is historical; observe actual production branch, runtime config and fresh owner's explicit request per the daily runbook.
After verified cutover, follow the current user-authorized daily scope and stored publication rules.
No secrets in chat, logs, Git, browser JavaScript, or Library files.

Existing frontend URLs, branding, PNG/video functions, analytics and authentication must survive.
Do not overwrite concurrent edits or switch production data loading until staged QA and a rollback plan exist.
Do not claim the Worker/D1 is deployed from a code commit alone; consult the runtime registry.
Publish data through the CURRENT VERIFIED live writer. When production reader is disabled, edit production static JSON at the latest file SHA, then check Cloudflare Pages live; D1-only updates are insufficient. Reference/rule/code changes are separate releases.

Existing delivery workflow is manual on AI-Recap-GitHub main: football-standalone-sync.yml.
It mirrors ONLY football-daily/ from this repository main into football-daily-render.
Do not invoke it merely to persist configuration, migrate database drafts or run tests.

Tests: `node --test services/football-engine/tests/*.test.mjs`,
`node --test football-daily/tests/*.test.cjs`,
`python3 -m unittest discover -s football-daily/tests -p test_verify_live.py`.
