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

## Private key usability re-verification (2026-10-29, read-only)
A local-only JDK keytool + jarsigner check independently opened the 3 owner-provided Library backup archives, confirmed that each keystore has a PrivateKeyEntry, signed a *temporary dummy JAR*, then verified that JAR with jarsigner. **All three passed**. The temporary files were discarded, and no private keys/passwords were committed, uploaded, published, or included in logs.

| Owner archive | PrivateKeyEntry | Test signature validated | Certificate digest matches |
|---|---|---|---|
| FutureCode_Sports_Journal_Private_Signing_Backup.zip | yes | yes | public Goal Zone v1.0.1 (98407044...) |
| BCF_Journal_Signing_Backup_Private.zip | yes | yes | Library BCF-Journal-v1.0.0.apk (2097d233...), **NOT GitHub live BCF** |
| BCF_Owner_Signing_Backup_PRIVATE.zip | yes | yes | Library BCF_Bet_City_Family_v1.0.0.apk (341f9de7...), **NOT GitHub live BCF** |

Source archive YKZ_Soccer_Tips_Android_Source.zip was inspected: it contains no signing keystore. No owner matching signing private key for YKZ, BW, Ko Thet or KMM has been independently verified.

**Important distinction:** validating a temporary JAR proves cryptographic key usability; it is not an owner-signed Android APK build nor an actual device upgrade test. An installable update additionally needs identical Android package, higher versionCode, compatible signer and a complete valid APK build.

## Original signing-key recovery search — October 29, 2026

**Scope searched (without exfiltrating secrets):** owner's ChatGPT file Library (243 ZIP archives listed, including 15 archives holding keystores), two GitHub source trees `futurecode064-cyber/AI-Recap-GitHub` and `futurecode064-cyber/future-code-football-daily`, Google Drive filename searches for signing/keystore/YKZ/BCF/KMM/debug.keystore, and Gmail attachment/subject searches for JKS/keystore/P12/signing. No new matching original signing key for YKZ/BW/Ko Thet/KMM/BCF-Live was recovered.

**Local-only certificate comparison:** 15 available signing-backup ZIPs with keystore-named entries were inspected; 14 could be opened with credentials supplied in those same archives, and their public SHA-256 certificate fingerprints compared with every current football release signer. One (English Academy) could not be unlocked in this check and does not establish a match or mismatch. No recovered key among the 14 matches the YKZ, BW, Ko Thet, KMM or BCF-Live certificate. Goal Zone key matches. BCF owner and journal private backups match **different older library-distributed APKs** but not the public GitHub release.

**Important workflow cause:** `AI-Recap-GitHub/.github/workflows/ykz-soccer-tips-apk.yml` builds `gradle --no-daemon :app:assembleDebug` and uploads only `app-debug.apk`. The BW, Ko Thet and KMM workflows generate their builds from this YKZ implementation and also upload APK only. The transient GitHub-hosted runner's `~/.android/debug.keystore` was not preserved in those workflows. **An Android APK contains public signing certificate, NOT the original private signing key; it cannot be recovered from the certificate.** A matching local debug keystore might exist on an owner's original build computer, or in a private backup not present in the searched sources. We have not proven its absence outside the searched sources.

**BCF-Live:** `future-code-football-daily/.github/workflows/bcf-journal-build.yml` contains a fallback to generate a *new PKCS12 key* if owner secrets are unset. This is incompatible with reliable updates; PR #50 now stages a fail-closed protective change. Current public BCF v1.0.0 certificate SHA-256 is `064c09d10cf21740754221680a85079acea50daa84c0ec9b16d8165c095904d7`. That certificate does not match either of the saved BCF private signing backups. The initial signing-key path cannot be conclusively attributed to fallback without reviewing the actual original build run logs or the recovered original keystore.

**Update compatibility gate:** Original package name + strictly higher versionCode + verified original signing key (or Android-recognized signing lineage). Never use a newly generated debug key or overwrite old APK links under the same release tag. Losing a signing key cannot be repaired by downloading the already-signed APK. On each affected user's device, a different key cannot update the installed app in place.
