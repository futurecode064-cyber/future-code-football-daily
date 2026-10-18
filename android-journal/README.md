# ဂိုးဇုံ အားကစား ဂျာနယ် Android
Native Java / Android SDK 35, Android 8+ (API 26), no paid services or embedded API keys.

- Live website: https://future-code-football-daily.pages.dev/future-code-journal/
- Native Gallery PNG handling intercepts Blob URLs, data URLs and same-origin image downloads.
- POST_NOTIFICATIONS permission on Android 13+; separate report and APK-update channels.
- Native JobScheduler checks every 15 minutes at minimum, plus foreground checks. Android battery optimization, force-stop and network restrictions can delay/prevent background checks; this is periodic polling, not an instant push service.
- Current Myanmar date only; published preview content and morning/current price fingerprints suppress duplicate alerts. Changed report text or prices cause a new alert. Initial installation alerts for currently available daily content.
- Version manifest: /future-code-journal/android/latest.json. New version prompts and downloads after user action; Android requires user confirmation of installation. Downloads require matching SHA-256, package ID, higher version and the same APK signing certificate.
- Signing keys are kept outside Git. Unsigned CI output must be signed with the same private owner key for every release. Never distribute the emulator-only debug APK.
- Build: `ANDROID_HOME=/path/to/sdk python3 android-journal/build.py`. CI compiles and runs on Android API 30 emulator with notification and Gallery smoke tests.
