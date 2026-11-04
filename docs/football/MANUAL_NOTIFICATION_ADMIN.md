# Future Code manual notification console

Owner URL: https://future-code-football-daily.pages.dev/editor/notifications.html

Existing Cloudflare owner session protects both the static editor page and
\`/api/editor/notifications/send\` and \`/api/editor/notifications/status\`.
The Pages Worker dispatches this workflow with an encrypted Cloudflare
\`FCD_EDITOR_GITHUB_TOKEN\`. This GitHub repository holds the encrypted
\`FCM_SERVICE_ACCOUNT_JSON\` service account already used for daily FCM.

The form supports one or more of five FCM topics and optional per-brand URL
when exactly one app is selected. Never include a Firebase private key,
GitHub token or Android signing key in the frontend or Git history.

Manual notifications use Firebase notification+data payload for existing
4 Nov APKs (background delivery); current shipped client handles only
morning/evening in onMessageReceived so manual foreground/deep-link behavior
needs a new signed APK and physical-device QA. Do not mistake Firebase ACK for
handset confirmation. A GitHub dry_run validates each FCM topic without
sending messages. Never run a real send as a test without owner consent.
