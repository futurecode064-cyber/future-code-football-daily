# Future Code Football — FCM / APK verified checkpoint (2026-10-31)

## Verified changes, not merely planned
- User supplied six copies of the same Firebase Android client JSON. The source contains six registered package IDs for Firebase project `future-code-football`, sender ID `76526416523`. The JSON was **not committed** to source. Owner placed `FC_GOOGLE_SERVICES_JSON` in both repositories' GitHub Actions secrets.
- Readiness: `https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/41183710493` PASS — six package IDs validated from protected GitHub secret.
- Compiled FCM-preview Android APKs: `https://github.com/futurecode064-cyber/AI-Recap-GitHub/actions/runs/41183825497` (YKZ/BW/Ko Thet/KMM, 4/4 success) and `https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/41183869443` (Goal Zone/BCF, 2/2 success). These are **fresh-install-only CI debug preview APKs**, NOT signed update releases.
- Android 8/9 public Pictures + permission PNG save fix staged in `AI-Recap-GitHub` `feature/football-apk-vnext-20261029`; latest site-only YKZ bridge already shipped to production via `football-daily-render` commit `7c6b5683536f132f8d6c8db65a6be4f6728ba2ad`. Real-device test not verified.
- FCM server code, per-brand channel handling, and dedupe tested on isolated branch `feature/football-bundled-fcm-20261029`. PR #50 unmerged; the legacy static publish bridge PR #19 in AI-Recap-GitHub is unmerged.

## Cloudflare metadata inspected with existing owner-approved scoped GitHub token
Read-only first audit: `https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/41187962989`.
- Production Worker `future-code-football-engine`: deployed `5141e13c-9cbf-435a-826a-98d8667eb38f`; original D1 `d2cc165f-5957-4b94-b2b1-9c79e79adbb1`, `notification_outbox` ABSENT, `FIREBASE_SERVICE_ACCOUNT_JSON` ABSENT.
- Staging Worker `future-code-football-engine-staging`: deployed `2368caef-6519-4a41-9c41-21fdedd4825c` before this update; D1 `a4ddc00f-411b-4ee5-ab4a-dfe13486c334`, `notification_outbox` ABSENT before update.
- `future-code-football-test` is unrelated to this FCM rollout: no DB bindings or secrets. Latest build failed in Cloudflare Dashboard; do not choose as credential target.

## Staging backend actually deployed successfully
- New isolated-staging deployment workflow `.github/workflows/football-fcm-staging-backend.yml` was run: `https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/41188073587`.
- All job steps succeeded: tests, explicit binding/owner/admin-secret preflight, staging D1 migration (including `0005_push_outbox.sql`), Worker code deployment with existing secrets preserved and `--keep-vars`, public staging health and postdeploy outbox presence.
- `FC_PUSH_ENABLED=false` explicitly set in staging; no FCM notifications sent.
- Second Cloudflare **read-only** audit: `https://github.com/futurecode064-cyber/future-code-football-daily/actions/runs/41188170999`.
- After staging deployment: staging Worker deployment `eb47789a-85ac-4c65-93b5-eea89ecd8815`, `notification_outbox` present on staging D1, ADMIN_TOKEN preserved. **Production Worker deployment ID unchanged** `5141e13c-9cbf-435a-826a-98d8667eb38f`; production `notification_outbox` still absent. Production website/APK download links unchanged.

## Critical unresolved release gates
1. Firebase **server** credential `FIREBASE_SERVICE_ACCOUNT_JSON` is *not* among production or staging Worker secrets. The client `google-services.json` does NOT contain a server private key. User must securely generate/provision the private key directly in Cloudflare Worker; never copy it into chat/repo. Do not enable `FC_PUSH_ENABLED=true` without it and targeted device validation.
2. Staging isolated public D1 does not receive live static GitHub publication automatically. Need complete PR #19 static bridge and proper owner-admin bearer token, plus private server credential and a successful physical Android FCM test, BEFORE production activation.
3. Original APK signer / persistent keystore compatibility is not proven for six brands; BCF historical APK variants have conflicting signers. User previously accepted uninstall/reinstall for versions with incompatible signatures. Build separate repeatable release signing key only with owner-provided secure storage and avoid deceptive in-place update claims.
4. Real Android phone Gallery PNG saving, notification permission, foreground/background FCM, APK install/update, and brand-isolation tests still not verified. Do not replace stable website download links with CI debug APKs.
5. Source CI has unrelated Worker build/check failures on development branches. Confirm the exact production deploy path (Cloudflare Pages Git integration) before merging.

## Owner intent / safety invariants
- Exactly two routine notification opportunities per day per brand, after COMPLETE successful publication: morning (fixtures/morning odds/previews/Special Choice/previous results) and afternoon (latest changed odds). Protect from duplicate dispatch via D1 idempotency/outbox. Owner-admin may send separately.
- All six branded APKs must remain distinct. Never silently overwrite legacy builds or publish unsigned/ephemeral-debug updates to real users.
- Work is authorized to continue in staging. Do not switch production site to unvalidated Worker or alter live odds/data while completing push.
