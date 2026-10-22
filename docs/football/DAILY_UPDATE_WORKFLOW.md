# Persistent daily workflow

## Current operational state
The new Worker/D1 API has NOT been deployed or connected to the five sites.
Until `config/football/project.json` says `live-verified`, do not attempt a new API
publication, invent an endpoint, or silently fall back to the legacy GitHub publisher.
The current infrastructure task does not authorize creating today's football content.

## Resume in a new ChatGPT Work
Open the repository and the checkpoint branch in `project.json`; read `AGENTS.md`
and all referenced rules. A new Work does not automatically retain credentials or
previous chat state. GitHub authorization and secure Cloudflare authentication must
be available independently. No repeat upload of the master prompt is required once
these files are reachable. The PDF and One-Shot prompt are the daily inputs.
Check latest branch HEAD and deployment state every time; do not trust this prose
instead of the actual registry, API manifest, account dashboard and live sites.

## After production cutover is verified
1. Read current user overrides: date, scope, source PDF, keep/refresh news, Special Choice count.
2. Compute original input SHA-256. Extract every PDF page in Work/browser, not in the Worker.
   Persist the private source ledger with row order, printed names, odds and source hashes.
3. Read `/api/admin/state` and record generation. Read the active draft/export for comparison.
   Read the published manifest and previous editorial night's results. Never invent unavailable facts.
4. Prepare structured resources in the EXISTING JSON schema. Preserve unknown fields, existing
   archive results and news unless explicitly changing them. Use canonical fixture IDs and PDF row IDs.
5. POST `/api/admin/import` with `expectedGeneration`, `editorialDate`, `sourceManifest`,
   `resources`, and a stable `Idempotency-Key`. This creates an immutable private version.
   Omitted resources inherit the active snapshot. Import retries must reuse the same key and body.
   Multiple source batches use `baseDraft` from the previous response; final version inherits all batches.
6. Fetch `/api/admin/draft?version=...` and private `/api/admin/export?version=...`. Use
   `backup-publication.mjs` then `prepare-draft-preview.mjs` to render an isolated copy of the selected
   snapshot with the existing five-brand renderers. Keep the preview local or verified owner-only;
   never host a private draft publicly. Compare all five brands, actual PNG/video downloads and mobile.
   Live staging/browser/download QA is still pending; local JSON parity is not download QA.
7. POST `/api/admin/validate` with version and evidence for every required review gate.
   Structural/editorial server validation and human/source evidence are complementary.
   Never fill passed flags until that review actually happened. Migration mode is for an unchanged
   initial legacy snapshot only, before any active version exists; it is not a daily bypass.
8. Only after all gates pass, POST `/api/admin/publish` with version and expectedGeneration.
   The single active pointer and audit entry change atomically. Conflict 409 means reload/rebase;
   never force an old draft over newer published data.
9. Fetch uncached manifest; fetch resources with its explicit version; verify all sites and downloads.
   Compare Cloudflare Pages/Worker deployment IDs before/after: neither should change for content writes.
   Report precise counts/pending items, versions and actual verified results. Never label partial as complete.
10. Save a database export and published manifest to authorized private storage. Keep input/source audit
    private. A production backup destination and retention policy must be configured before cutover.

## Evening odds
POST `/api/admin/update-odds` with expectedGeneration, sourceManifest and an updates array:
`[{"fixtureId":"stable-id","currentBodyOdds":"source-verbatim","currentGoalTotalOdds":"source-verbatim"}]`.
Only current-odds fields are accepted. Opening odds and news are inherited unchanged.
It returns a DRAFT, then follows the same validate/publish/live verification gates.
Missing current prices remain blank. Never copy opening prices into current prices.

## Rollback
POST `/api/admin/rollback` with a previously published version and the current generation.
History remains; generation increases. Refresh clients from the new manifest. A stale old client
must not overwrite a subsequent rollback. Code rollback is separate from data rollback.

## No-build rule
After activation, routine PDF import, validation, publication, evening odds and rollback
must not call GitHub, dispatch Actions, commit source, upload a Pages project, or deploy a Worker.
The Worker source contains no GitHub client or publishing workflow calls. Cloudflare runtime
requests/database rows still consume their own quotas; zero build is not zero runtime usage.
