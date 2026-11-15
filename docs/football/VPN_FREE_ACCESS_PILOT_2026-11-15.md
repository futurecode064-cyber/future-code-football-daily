# Future Code — VPN-Free Access Pilot (2026-11-15)

Status: **READ-ONLY PILOT PREPARED; PRODUCTION UNCHANGED.**

## Confirmed evidence

- User reported ERR_CONNECTION_RESET and ERR_QUIC_PROTOCOL_ERROR on Myanmar Kyar.
- Disabling Experimental QUIC in Windows Chrome let the user access websites without VPN.
- User subsequently reported APKs also became reachable. Changing Chrome settings does **not** directly change Android WebView's HTTP/3 behavior; do not infer a confirmed APK root cause.
- External probes returned page content for the Football Pages site and Myanmar Kyar download page, and 'ok' from the Myanmar Kyar Worker /health endpoint. This does NOT prove access from any specific Myanmar ISP.
- Cloudflare documentation says Chrome QUIC issues can cause ERR_QUIC_PROTOCOL_ERROR; a zone-level HTTP/3 Off test can isolate the problem.

## Current production entrypoints (do not change until proven)

| Surface | URL / prefix | Notes |
| --- | --- | --- |
| Football Main + brands | https://future-code-football-daily.pages.dev/ | Main plus /future-code-journal/, /bw-sport/, /ykz-family/, /ko-thet-family/ |
| Football Worker | https://future-code-football-engine.futurecode-dubai-86851bf2.workers.dev | Separate API origin; verify its public path and whether frontend actually uses it before migration |
| Myanmar Kyar online | https://myanmar-kyar.futurecode-dubai-86851bf2.workers.dev/ | /health answered ok externally |
| Myanmar Kyar download | https://futurecode064-cyber.github.io/AI-Recap-GitHub/myanmar-kyar/ | GitHub Pages hosted; separate platform |

Repository source config: config/football/project.json. The public football-engine-config.js in the source branch currently has enabled:false; do not assume that the latest site calls the Worker without inspecting the runtime.

## Safe rollout sequence

1. Run the read-only script: node scripts/football/vpn-free-network-preflight.mjs. Save vpn-free-preflight-results.json; this proves only the machine's own connectivity. GitHub Actions runners are not in Myanmar.
2. Identify an **actual domain owned/controlled by Future Code** and its Cloudflare account/zone. No domain name has been assumed or purchased by this change.
3. For the first trial, attach an **unused pilot subdomain** to the existing Pages project through Cloudflare Dashboard > Workers & Pages > future-code-football-daily > Custom domains > Set up a domain. Verify HTTPS certificate and DNS. Keep original pages.dev URL active. Cloudflare Pages docs: https://developers.cloudflare.com/pages/configuration/custom-domains/
4. In the pilot's Cloudflare zone, temporarily disable Speed > Settings > Protocol Optimization > HTTP/3. This is a **zone-level** setting and may affect other hostnames in that zone; review the impact first. Docs: https://developers.cloudflare.com/speed/optimization/protocol/http3/ and https://developers.cloudflare.com/speed/optimization/protocol/troubleshooting/protocol-troubleshooting/
5. On an affected Myanmar connection with VPN OFF, test the new pilot hostname in Chrome with QUIC **Default/Enabled**, not only the browser with the workaround applied. Test another browser and Android phone as well. Record ISP (MPT / ATOM / U9 / Mytel / Wi-Fi), date, URL, error or success.
6. Validate Main and all shared brand paths, page navigation, images, football results/odds, login, and download PNG/ZIP operations. Then check whether frontend data is coming from Workers or static JSON. Test the exact dependency hostname(s) in addition to the UI hostname.
7. If the pilot is reliable across multiple networks, attach the approved public hostname, update published links gradually, and monitor. Keep the legacy pages.dev URL working; do not force redirects until verified. Rollback means remove the new link/route or restore HTTP/3 to previous value.
8. Separately pilot Myanmar Kyar Worker on a Cloudflare **Workers Custom Domain** in a zone you own; do not migrate accounts, games, ratings or database. Docs: https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
9. If APKs contain hardcoded server URLs, rebuild and sign with the **existing signing certificate** and increment version only after network tests pass; never break old users' updates.
10. For GitHub Pages downloads, first validate access independently. An alternative download mirror can be added after file signature and SHA-256 verification; changing the football hostname does not fix a separate github.io hostname.

## Manual acceptance matrix — required before rollout

| Test | Existing hostname VPN OFF | Pilot hostname VPN OFF (QUIC Default) | Pilot hostname VPN OFF (QUIC Disabled) |
| --- | --- | --- | --- |
| Chrome Windows, affected ISP | Record | Record | Record |
| Android Chrome, affected ISP | Record | Record | Record |
| Android APK Online | Record | Record | Not controlled by Windows Chrome |
| Second ISP/mobile-data network | Record | Record | Record |
| Football page + API + real image/ZIP download | Record | Record | Record |

PASS requires two independent Myanmar networks including one that previously failed; UI and backend both work without VPN; no regression in downloadable files or APK online play. The site owner may set a higher coverage threshold.

## Protocol and risk notes

- HTTP/3/QUIC uses UDP/443. Connection failure can originate from local router, ISP, network path, or browser behavior. Disabling HTTP/3 in one browser is an experimental clue, not a fleet-wide fix.
- Removing an Alt-Svc response header for only an affected host is a narrower temporary workaround, but browsers can cache Alt-Svc and HTTPS DNS records can still advertise HTTP/3. A controlled zone-level HTTP/3-off test is clearer.
- Disabling HTTP/3 does **not** disable HTTPS or HTTP/2.
- Default workers.dev and pages.dev hostnames are managed by Cloudflare; you cannot depend on a custom zone HTTP/3 switch to change those default hostnames.
- Avoid touching production Workers, D1, secrets, APK signatures, or DNS until the pilot has documented cross-ISP results.
- Do not treat a successful GitHub Actions preflight as a Myanmar VPN-free guarantee.

## Action still requiring account access

The linked tools can edit GitHub, but there is no verified authenticated Cloudflare dashboard connection for this task. After an owner-controlled Cloudflare session and the owned domain/zone are confirmed, pilot DNS/domain/HTTP3 can be configured. Do not request API tokens or passwords in chat.

## References

- https://developers.cloudflare.com/speed/optimization/protocol/troubleshooting/protocol-troubleshooting/
- https://developers.cloudflare.com/speed/optimization/protocol/http3/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
