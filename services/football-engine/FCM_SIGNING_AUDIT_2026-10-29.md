# Football APK update signing + Firebase preflight — 2026-10-29

**Mode:** Read-only audit and protection changes are staged on PR #50. No old APK release, website, signing secret, or Firebase production configuration was changed.

## Published APK identity and signer certificate
Inspected the actual public APK downloads with Android SDK 35 aapt/apksigner in GitHub Actions run 40804726390, on 2026-10-29. Signatures all verified.

| Brand | Package | VersionCode | VersionName | APK signing certificate SHA-256 |
|---|---|---:|---|---|
| Goal Zone | mm.futurecode.sportsjournal | 2 | 1.0.1 | 98407044295dba61390bf38c452aa2d8dc8bcfc7390261680bbccbf30d6a66a4 |
| YKZ | com.futurecode.ykzsoccertips | 2 | 1.1.0 | 98324b19c40426e41162282a5c06255cd57666fbdfff1d2803729c17a2b2c1b3 |
| BW Sport | com.futurecode.bwsportjournal | 1 | 1.0.0 | 63888a7d0d7565ed1046c01a5637f3071ba29a56d59d1cf75ff0bd4a32e7e660 |
| Ko Thet | com.futurecode.kothetfamilyjournal | 2 | 1.0.1 | 4ecafa18303da822d13c6cd21722a9116d0e3f26bfffdc8eb1bc80d88efc84c9 |
| KMM | com.futurecode.kmmsporthub | 1 | 1.0.0 | 38403cbba83ccb921f30107f212ac63793c5e7c3311706be96d391e8c18e2659 |
| BCF (published GitHub Release) | mm.futurecode.betcityfamily | 1 | 1.0.0 | 064c09d10cf21740754221680a85079acea50daa84c0ec9b16d8165c095904d7 |

## Owner-keystore backup match check (private material never committed)
Local-only inspection of three Library backup ZIPs, matched by public signer fingerprint:
- FutureCode_Sports_Journal_Private_Signing_Backup.zip signer **MATCHES** the published Goal Zone v1.0.1 signer.
- BCF_Journal_Signing_Backup_Private.zip signer 2097d233... matches the *separate Library* BCF-Journal-v1.0.0.apk (NOT the currently published BCF GitHub Release).
- BCF_Owner_Signing_Backup_PRIVATE.zip signer 341f9de7... matches the *separate Library* BCF_Bet_City_Family_v1.0.0.apk (NOT the currently published BCF GitHub Release).
- **Important:** NO matching private key for the currently published BCF GitHub Release SHA256 064c09d1... has been confirmed. Do not use either backup to overwrite that public release, or Android will reject the update.
- YKZ and BW public APKs are Android Debug signed. The original per-build debug keystore must be recovered to update in place; merely generating a new debug key does NOT preserve compatibility.
- Ko Thet and KMM certificate fingerprints were verified, but matching owner private signing keys have NOT been verified.

## GitHub Secrets readiness results
The read-only GitHub Actions preflight run 40804459048 showed that these exact GitHub Actions secrets were **not configured**:
- FC_FIREBASE_APP_ID, FC_FIREBASE_API_KEY, FC_FIREBASE_PROJECT_ID, FC_FIREBASE_SENDER_ID, FIREBASE_SERVICE_ACCOUNT_JSON.
- BCF_RELEASE_KEYSTORE_B64, BCF_RELEASE_STOREPASS, BCF_RELEASE_ALIAS, BCF_RELEASE_KEYPASS.

This does **not** prove credentials are missing in Cloudflare, Firebase Console, another repository, or a private owner computer. It proves only the checked GitHub Actions Secrets are missing.

## Safety protections
- Staging PR #50 changes BCF release workflow to FAIL CLOSED on missing original keystore or mismatched signer instead of generating a disposable key.
- Old release tag v1.0.0 must never be overwritten or clobbered; future release requires higher versionCode and new tag.
- Do not put owner private signing ZIP, keystore, password, service account JSON or Firebase access tokens into GitHub source, docs, chat, or client APK. Store secrets only in approved secret stores.
- Keep production FCM disabled until Firebase account/plugin connected, actual project and device registration verified, Cloudflare Worker bound, D1 migration applied, and physical Android device tests completed.
- Nothing in staging repairs an already installed APK whose original signer key has been lost. For those installations, preserve the old app and arrange a clearly communicated opt-in migration route only if needed.

## Relevant checks
- GitHub Actions run 40802893230: bundled FCM staging worker and Android build QA passed.
- GitHub Actions run 40804726390: Firebase/BCF secret-presence and public release signature audit passed.
- Existing unrelated 'Football Engine Migration Checks' failed expected hash validation for docs/football/DAILY_UPDATE_WORKFLOW.md; do not work around this by silently changing unrelated files.
