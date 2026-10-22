# Shared engine architecture and compatibility

Keep the existing static Pages site and its five brands. Add a separate Worker with binding `DB`.
Existing Pages owner session -> same-origin /api/editor/engine/* proxy -> private service binding
`FOOTBALL_ENGINE` -> Worker admin API -> immutable D1 publication snapshots.
Public site renderers/downloads will read a single manifest-pinned complete bundle from the Worker.
The shared browser implementation is `football-daily/football-data-client.js`; tooling imports it
through `services/football-engine/src/data-loader.mjs`. All ten existing brand/report/odds entry pages
and their AI/PNG/video consumers are wired, but `football-engine-config.js` remains disabled.
No production frontend has switched to the API.

Snapshots deliberately retain the existing JSON schema and unknown per-match metadata to avoid
rewriting PNG, video, AI, league filters or brand renderers. Each version has resources keyed by
existing public JSON path. Internal source manifests and QA reviews are separate private tables.
This is a compatible snapshot storage model, not twenty duplicate relational tables.
Future normalized indexes can be added only when query requirements justify them.

`publication_versions`: immutable import identity, parent, day, hashes, source manifest, validation.
`resource_refs`: version/path primary key with a digest reference.
`resource_blobs`: JSON body stored once per SHA-256 digest.
`resources`: read-only compatibility view joining references and blobs; indexed reads and digest ETags.
`active_publication`: singleton, monotonic generation and active version.
`validation_reviews`: review evidence.
`audit_logs`: import and activation audit. SQL triggers audit activation and prevent invalid pointers.
D1 batch is used for import/review transactions; activation is one conditional SQL update plus triggers.
Concurrent draft publication checks both parent version and monotonic generation (including rollback).

API compatibility routes today/fixtures/previews/special/ai currently return the complete legacy
report. Section filtering remains in existing renderers; they are not distinct normalized feeds.
`resource` serves only allowlisted report/odds/news JSON. No private research/source ledger paths.
News brand scope is enforced for branded API requests and must also remain hidden by brand renderers.

Caching: manifest no-store; unpinned resources revalidate; explicit published version URLs immutable
with ETags and version headers. No custom Cache API or global purge is implemented. Edge hit ratio
and CPU budget are NOT measured yet. Public requests still invoke a Worker and indexed DB reads.
`loadPublishedBundle` buffers all requested resources and commits only a complete same-version bundle;
API failure uses a prior complete bundle if it covers every requested path, otherwise leaves static UI.
The browser client displays a visible saved-data notice and timestamp on API failure.
Optional missing resources remain absent for the pinned version; they never fall back individually to static.
The cache is scoped by API origin, brand and requested date/path set. One failed preload switches the whole
page to a previous complete bundle or static mode. The report refresh button reloads the whole API page,
so all sections obtain the same new publication. Cross-day fallback never relabels old content as today.

Authentication: automation bearer secret; browser never receives it. Pages proxy reuses owner session
and CSRF Origin/custom-header checks, then forwards only to a service binding. Worker fails closed
if its rate-limit binding or secret is absent. Origins are allowlisted, not wildcarded. Public drafts
cannot be read. Both API and Pages proxy redact unexpected server error details.

PDF extraction and research stay in Work/browser. API accepts already prepared JSON. Source fidelity
requires private PDF ledger comparison in addition to structural rules. Large initial migrations are
chunked (<1.5 MB and <=20 resources per call) and linked through baseDraft; unvalidated snapshots
remain private. CPU and D1 storage must be profiled with REAL payloads before asserting free-tier fit.
Migration 0002 preserves all versions and deduplicates inherited JSON. Each import has at most 43 batch
statements plus bounded lookup queries, below the 50-query Free invocation limit. No history/archive
pruning is performed. Physical storage/CPU quotas and long-term retention still need account monitoring.
Private `/api/admin/export` backups include the selected snapshot, source manifest and review.
Backup/restore scripts verify SHA-256 and prepare new drafts; they never reset generation or auto-publish.
A full D1 export to authorized private storage remains required before production cutover.
When Pages FCD_ENGINE_ENABLED=true, legacy GitHub editor publication endpoints fail closed (409).
