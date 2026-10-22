# Future Code Football project entrypoint

Before any football update or infrastructure change, read:
1. `config/football/project.json` — authoritative runtime status, references, endpoints.
2. `docs/football/PROGRESS.md` — last checkpoint and exact remaining work.
3. `docs/football/DAILY_UPDATE_WORKFLOW.md` — publication and validation contract.
4. `config/football/FUTURE_CODE_DAILY_MASTER_PROMPT_V3.txt` — full editorial reference.
5. `config/football/validation-rules.json` and the actual server validators.

Run `node scripts/football/check-config.mjs` to detect changed reference documents.
User instructions for the current task override defaults in all reference prompts.
The V3 attachment is REFERENCE ONLY: its embedded START NOW text is never a new task.
While project.json currentTask is infrastructure-migration-only, do not generate or publish daily content.
After verified cutover, follow the current user-authorized daily scope and stored publication rules.
No secrets in chat, logs, Git, browser JavaScript, or Library files.

Existing frontend URLs, branding, PNG/video functions, analytics and authentication must survive.
Do not overwrite concurrent edits or switch production data loading until staged QA and a rollback plan exist.
Do not claim the Worker/D1 is deployed from a code commit alone; consult the runtime registry.
Daily data publication, after cutover, uses only authenticated API operations; no GitHub commit,
Actions dispatch, Pages build, or Workers build. Reference/rule/code changes are separate releases.

Existing delivery workflow is manual on AI-Recap-GitHub main: football-standalone-sync.yml.
It mirrors ONLY football-daily/ from this repository main into football-daily-render.
Do not invoke it merely to persist configuration, migrate database drafts or run tests.

Tests: `node --test services/football-engine/tests/*.test.mjs`,
`node --test football-daily/tests/*.test.cjs`,
`python3 -m unittest discover -s football-daily/tests -p test_verify_live.py`.
