# Future Code Football push: safe release gate (2026-10-29)

## Exact behavior
- One morning notice per brand/day only when published fixtures, morning odds, all eligible previews, two Special Choices, and the previous day's verified finished scores are in the active D1 publication.
- One afternoon notice per brand/day only when the evening odds are in the active D1 publication.
- The exact Burmese copy is in src/push.mjs.
- Seven topics: main, goal_zone, ykz, bw, ko_thet, kmm, bcf.
- Unique D1 outbox key (brand, editorial_date, kind) blocks repeated dispatch on corrections or repeated publishing. FCM itself cannot guarantee exactly-once device delivery.
- Failed/ambiguous dispatch is recorded, never retried automatically to avoid potentially duplicate notifications.
- Draft imports do not trigger push; only successful activation and scheduled publication do.

## Current status and environment
- This is a staging branch only. Live website, APK links, and original builds are unchanged.
- Worker push is disabled by default. Explicit FC_PUSH_ENABLED=true and private Worker FIREBASE_SERVICE_ACCOUNT_JSON are required, after applying the additive migration 0005_push_outbox.sql.
- Firebase service account secrets MUST NOT be committed to source.
- Android FCM is isolated in android-journal/fcm and has no effect on legacy Python/SDK builds.
- Build vars required: FC_FIREBASE_APP_ID, FC_FIREBASE_API_KEY, FC_FIREBASE_PROJECT_ID, FC_FIREBASE_SENDER_ID, and FC_TOPIC.
- Android FCM requires Google Play services for reliable receipt.
- Browser website push needs separate Firebase Web configuration, permission, service workers and subscriber registration. None are live in this change; backend topic sends alone do not deliver browser push.
- Current football-daily/football-engine-config.js has enabled:false. Verify active production Cloudflare path before enabling any worker.

## Protect existing installed APKs
An in-place update requires matching applicationId, the SAME signing certificate (or recognized signing lineage) and a higher versionCode. Users still must approve installation for website-hosted APKs.
- Goal Zone v1.0.1: mm.futurecode.sportsjournal, versionCode 2, signer SHA256 98:40:70:44:29:5D:BA:61:39:0B:F3:8C:45:2A:A2:D8:DC:8B:CF:C7:39:02:61:68:0B:BC:CB:F3:0D:6A:66:A4
- BCF-Journal-v1.0.0.apk signer SHA256 20:97:D2:33:18:CA:06:68:63:18:BE:87:56:90:30:5B:01:EF:CC:02:0C:47:9B:33:FD:02:9C:BE:45:A7:91:F4
- BCF_Bet_City_Family_v1.0.0.apk signer SHA256 34:1F:9D:E7:5D:3D:6E:09:77:69:96:82:18:A7:B6:14:7D:49:C1:DA:51:79:2D:13:3A:D7:CB:2C:BD:09:F3:53
- The two observed BCF signers are NOT interchangeable. Do not overwrite either old version without determining which one subscribers installed.
- YKZ/BW/Ko Thet/KMM use separate original builds, some debug-signed. Never replace their functionality using the Goal Zone wrapper.
- Release MUST fail rather than generating a new signing key if the matching protected owner key is unavailable. Keep existing download links until verified.
- No users are upgraded and no release APKs have been built from this feature branch.

## QA and rollout
1. Inspect active production and apply D1 migration to staging first.
2. Test push gating with node --test services/football-engine/tests/push.test.mjs and inspect GitHub Actions staging build output.
3. Verify FCM project configuration/Android Package IDs and actual permission on Android 13+. Test foreground and background on physical devices.
4. Verify subscribers do not get another brand's topic.
5. Check old-signature fingerprints, upgrade in place, gallery saving, navigation, app-update prompts, usage stats, and existing functionality.
6. Integrate website browser push service workers only after browser opt-in UX and security validation.
7. Publish APKs and enable production notifications only after all preceding gates pass.

## 2026-10-29 implementation and hard blocker checkpoint
- Authenticated `GET /api/admin/push-status`, `POST /api/admin/push-now` (D1 published snapshot) and `POST /api/admin/push-static` (actual legacy GitHub static publication) are implemented on PR #50. Owner token and rate limiting are mandatory; protected D1 outbox deduplicates seven brand topic sends (morning/afternoon).
- Owner-only manual UI: `football-daily/admin/notifications.html` (not deployed). Reads latest static published resources and submits to authenticated `push-static`. Never stores the token.
- Actual legacy static publish pipeline bridge PR #19 in `futurecode064-cyber/AI-Recap-GitHub`: workflow trigger on football-daily-render data changes, forwards current source JSON and commit ID via `FC_WORKER_ADMIN_TOKEN`. Bridge tests passed on GitHub Actions 40826283962; production not merged, because credentials/worker are not ready.
- Preview APKs linked in the live download pages are **NOT configured for FCM**. They must not be advertised as immediately notification-capable. The GitHub Actions checks at 2026-10-29 06:00 UTC still show Firebase app/client config absent, and Firebase connector isn't available to this chat.
- New protected 4-brand and Goal Zone/BCF build logic requires individual Firebase App IDs/API keys per Android package; a persistent protected owner signing keystore for release signing; and complete FCM credentials before any new APK release. Ordinary pushes may still compile test/debug APK artifacts, but must never publish them as functional push releases.
- Required Worker secret: `FIREBASE_SERVICE_ACCOUNT_JSON`; Worker flag `FC_PUSH_ENABLED=true`; D1 migration `0005_push_outbox.sql`; Worker admin token `ADMIN_TOKEN`; GitHub Actions secret `FC_WORKER_ADMIN_TOKEN` must match. Required Android CI secrets: `FC_FIREBASE_PROJECT_ID`, `FC_FIREBASE_SENDER_ID`, and `FC_FIREBASE_APP_ID_{GOAL_ZONE,YKZ,BW,KO_THET,KMM,BCF}` plus `FC_FIREBASE_API_KEY_{...}`, `FC_APK_RELEASE_KEYSTORE_B64`, `FC_APK_RELEASE_STOREPASS`, `FC_APK_RELEASE_ALIAS`, `FC_APK_RELEASE_KEYPASS`.
- **NO LIVE PUSH has been delivered/verified. NO production APK was rebuilt with real Firebase credentials.** Do not overwrite public downloads or enable automated publication until a real registered Android subscriber receives a confirmed test notification and latest published data is validated. The existing static production site currently keeps its `FC_FOOTBALL_ENGINE.enabled=false` legacy route, so the static bridge is required.
