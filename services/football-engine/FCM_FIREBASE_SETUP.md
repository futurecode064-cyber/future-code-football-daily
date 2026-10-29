# Firebase FCM setup and APK signing gate — 2026-10-29

This source branch is **NOT deployed**. Production flag FC_PUSH_ENABLED must remain absent/false until the steps below pass.

## Firebase Console setup (account owner)
1. Open https://console.firebase.google.com/ and select an existing Firebase project or create one called Future Code Football (display name is optional).
2. In Project settings > Your apps > Add app, register each existing Android application **with its original package name**. At least: mm.futurecode.sportsjournal (Goal Zone); mm.futurecode.betcityfamily (BCF); com.futurecode.ykzsoccertips (YKZ); com.futurecode.kmmsporthub (KMM). Verify BW and Ko Thet package IDs from their signed APKs before registering. Do NOT invent IDs or use the Goal Zone package for another brand.
3. In Project settings, collect each application's Firebase App ID, Android API key, Project ID, and Messaging Sender ID. Client config values can be supplied to protected CI build settings; NEVER put the service account private key in APK source.
4. Confirm Firebase Cloud Messaging API (HTTP v1) is enabled. In Project settings > Service accounts, generate a service-account key **only if necessary**; securely store JSON as Cloudflare Worker secret FIREBASE_SERVICE_ACCOUNT_JSON. The private key MUST NEVER be shared in chat or GitHub.
5. On staging Worker, apply services/football-engine/migrations/0005_push_outbox.sql to the correct D1 database. Verify audit table exists and earlier snapshots/data are unchanged.
6. Configure FC_PUSH_ENABLED=true only on a staging Worker, register two test subscribers from two brands, publish test data, and confirm exactly one morning/afternoon notice per brand. After final verification enable production with operator approval.

## Build config (no Firebase private key inside app)
Android staging Gradle module android-journal/fcm:
- FC_FIREBASE_APP_ID
- FC_FIREBASE_API_KEY
- FC_FIREBASE_PROJECT_ID
- FC_FIREBASE_SENDER_ID
- -PFC_TOPIC=fc_football_goal_zone (different for every brand)
- -PFC_VERSION_CODE=3 and -PFC_VERSION_NAME=1.0.2 for Goal Zone staging only

Configure secure environment variables for CI (client config is not a service-account credential, but avoid storing owner details in the repository). Current Android variant source supports Goal Zone; other apps require their own code adaptation before release. Legacy android-journal/build.py still compiles the old non-FCM app.

## Web sites
The server defines seven brand topics, but public web browser notification opt-in, service workers, and VAPID keys are not deployed. Do not claim that website/browser notifications work until the browser opt-in and token registration are implemented/tested.

## Original signing certificate audit (actual APK binaries)
The identifiers below are SHA-256 certificate fingerprints, not the APK file hash:
- Goal Zone v1.0.1 / mm.futurecode.sportsjournal / versionCode 2: 98407044295DBA61390BF38C452AA2D8DC8BCFC7390261680BBCCBF30D6A66A4
- YKZ Soccer Tips v1.1.0 / com.futurecode.ykzsoccertips / versionCode 2: 98324B19C40426E41162282A5C06255CD57666FBDFFF1D2803729C17A2B2C1B3 (certificate subject Android Debug — verify whether matching keystore was retained)
- BW Sport Journal v1.0.0 signer: 63888A7D0D7565ED1046C01A5637F3071BA29A56D59D1CF75FF0BD4A32E7E660
- BCF-Journal-v1.0.0.apk signer: 2097D23318CA06686318BE875690305B01EFCC020C479B33FD029CBE45A791F4
- BCF_Bet_City_Family_v1.0.0.apk signer: 341F9DE75D3D6E097769968218A7B6147D49C1DA51792D133AD7CB2CBD09F353
- Ko Thet v1.0.1 and KMM v1.0.0 not independently binary-verified in this check.
- **Critical:** two BCF v1.0.0 binaries have different signers. Do not replace either distribution with one update APK; identify which version/channel existing users installed.

For every existing installation, require same package name, higher versionCode and same signer/recognized signing lineage. Running GitHub Actions debug signing without the original keystore will produce a new incompatible certificate.

## QA before merge or release
- Staging Worker tests pass (push.test.mjs including 14 messages across 7 brands and dedupe on repeat publish).
- Android staging compile succeeds and the generated APK's package/FCM service are verified. Debug CI APK is **not an in-place update**.
- Real device test Android 13+ notification permission, background, closed app, deep link navigation, gallery saving, app update checks.
- Test devices without Google Play Services: FCM is not guaranteed there.
- Every brand's original signing key verified. Never overwrite existing APK links or publish new APKs without matching key.
- Existing Cloudflare Pages site may be using legacy static JSON instead of Worker/D1; verify actual active publication path before routing notifications.
