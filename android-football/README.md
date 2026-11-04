# Fresh Football Android builds

Each brand has its own package, Firebase client and FCM topic. `prepare.py` copies the established native WebView, Gallery save and update UI, then disables the old local content polling so only two server-verified data-only FCM publication slots display per Yangon date. Build with `gradle -PfcPackage=... -PfcVersionCode=... -PfcVersionName=... :app:assembleRelease` after preparation. A release must pass package, signature and Firebase resource checks before replacing any live download link.

The Firebase Android configuration is public client configuration (not a server credential). Never put a Firebase service-account private key, FCM server key or signing keystore in this repository.

Manual campaign client support (pending new owner-signed APK builds): accepts slot `manual` with UUID `id` and a brand-restricted `route`, deduplicates by UUID, and supports foreground display; notification+data payload displays through FCM in the background. Versions are incremented in `prepare.py` but public APK download links must NOT change until release APKs are signed with owner certificate and tested on physical Android phones.
