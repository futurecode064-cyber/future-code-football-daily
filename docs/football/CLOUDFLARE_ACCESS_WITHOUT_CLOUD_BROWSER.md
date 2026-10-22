# Access through the owner's browser and GitHub Secrets

Cloud Browser authentication has not succeeded. This path uses the owner's working browser and
Cloudflare's supported API-token/GitHub Actions mechanism. It does not transfer their browser session.
No password, OTP or API token should be sent through ChatGPT chat or committed to a file.

## Owner setup (one secret)
1. In the owner's browser, open https://dash.cloudflare.com/profile/api-tokens and create a custom
   USER API token named Future Code Football Migration. Permission rows for the migration:
   Account / Workers Scripts / Edit; Account / D1 / Edit; Account / Account Settings / Read.
   Limit Account Resources to the account containing future-code-football-daily. Use a limited
   expiry appropriate to the migration. Do not add Billing, DNS, user-management or unrelated scopes.
   These permissions allow Workers/D1 changes within that account; the first verification is read-only.
2. Open this repository's Settings > Secrets and variables > Actions > New repository secret:
   https://github.com/futurecode064-cyber/future-code-football-daily/settings/secrets/actions
   Name: FOOTBALL_STAGING_CF_API_TOKEN
   Secret: paste the new Cloudflare API token directly into GitHub and save.
   This is a new migration-specific name, so existing production secrets remain untouched.
3. Tell Work the secret has been saved, without sharing its value. Work can add the exact label
   football-cloudflare-access-check to Draft PR #36 to run the read-only check. It is deliberately
   label-triggered because a new workflow need not be merged into main merely to expose a Run button.
   A retry removes/re-adds the label only after checking the first result and resolving the cause.

## Verification behavior
.github/workflows/football-cloudflare-access.yml only runs for a same-repository PR #36 on the
migration branch and that exact label. It has read-only GitHub permissions. The script performs two
GET requests to api.cloudflare.com for Workers/D1 metadata under the expected account ID observed in
an existing Cloudflare check link. It emits a minimal non-secret result, not resource inventories.
No deployments, database queries/writes, publication, production mirror or billing changes occur.
A missing, expired, incorrectly scoped or wrong-account token causes failure without printing it.
The non-secret artifact can be inspected by Work to verify real API access before staging operations.
Do not mark the runtime registry authenticated until this check actually passes.

The workflow is NOT a daily publishing path. Daily content after cutover still uses the Worker API
without GitHub Actions or builds. Staging provisioning/deployment must be separately implemented and
reviewed in the same branch after access succeeds; this verification alone does not deploy the engine.

Official references checked 2026-10-22:
https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
https://developers.cloudflare.com/d1/tutorials/import-to-d1-with-rest-api/
