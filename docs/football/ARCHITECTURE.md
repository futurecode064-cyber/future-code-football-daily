# Shared engine architecture and compatibility

Keep the existing static Pages site and its five brands. Add a separate Worker with binding `DB`.
Existing Pages owner session -> same-origin /api/editor/engine/* proxy -> private service binding
`FOOTBALL_ENGINE` -> Worker admin API -> immutable D1 publication snapshots.
Public site renderers/downloads will read a single manifest-pinned complete bundle from the Worker.
The bundle adapter is implemented in `services/football-engine/src/data-loader.mjs` but NOT wired
into production renderers. No frontend is switched by this branch.

Snapshots deliberately retain the existing JSON schema and unknown per-match metadata to avoid
rewriting PNG, video, AI, league filters or brand renderers. Each version has resources keyed by
existing public JSON path. Internal source manifests and QA reviews are separate private tables.
This is a compatible snapshot storage model, not twenty duplicate relational tables.
Future normalized indexes can be added only when query requirements justify them.

`publication_versions`: immutable import identity, parent, day, hashes, source manifest, validation.
`resources`: version/path primary key; prepared statements; JSON constraint; digest ETags.
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
Caller must display its returned stale timestamp and route all dependent exporters through that bundle.
Those frontend wiring and visible stale state tasks remain pending.

Authentication: automation bearer secret; browser never receives it. Pages proxy reuses owner session
and CSRF Origin/custom-header checks, then forwards only to a service binding. Worker fails closed
if its rate-limit binding or secret is absent. Origins are allowlisted, not wildcarded. Public drafts
cannot be read. Both API and Pages proxy redact unexpected server error details.

PDF extraction and research stay in Work/browser. API accepts already prepared JSON. Source fidelity
requires private PDF ledger comparison in addition to structural rules. Large initial migrations are
chunked (<1.5 MB and <=30 resources per call) and linked through baseDraft; unvalidated snapshots
remain private. CPU and D1 storage must be profiled with REAL payloads before asserting free-tier fit.
Versions currently copy inherited resources: retention/compaction is a remaining production requirement.
