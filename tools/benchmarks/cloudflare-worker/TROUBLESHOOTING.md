Cloudflare Worker deploy troubleshooting

Scenario: `wrangler` fails in CI with "You are not authenticated" or `wrangler deploy` fails.

Quick diagnostic (already added to workflow):
- The GitHub Action runs a token verify call:
  curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" -o /tmp/token_verify.json
- It also calls the accounts endpoint:
  curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -o /tmp/account.json

If deploy failed with authentication errors:
1. Regenerate your API token in the Cloudflare dashboard (My Profile → API Tokens) and give it the following minimal scopes:
   - Account: Read (allow: Account)  
   - Workers: Edit (allow: Zone & Workers — depending on the UI, permit editing/deploying Workers)
   Optionally include Zone: Read if you plan to read zone-level info.

2. Locally verify the token before updating the secret (safe quick check):
   curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "Authorization: Bearer <YOUR_TOKEN_HERE>" \
     -H "Content-Type: application/json" | jq
   - Look for "success": true and for scopes that include the ones above.

3. Update repository secrets (Organization / Repo → Settings → Secrets — Actions):
   - Secret name: `CLOUDFLARE_API_TOKEN` (value = your token)
   - Secret name: `CLOUDFLARE_ACCOUNT_ID` (value = your Cloudflare account id)

4. Re-dispatch the GitHub workflow (Actions → Deploy Cloudflare Worker → Run workflow) or ask me to re-run it. I will re-dispatch and confirm logs.

If you want me to re-run the workflow after you update the token, reply with **re-run** and I will kick it off and confirm success and capture the published worker URL and a first per-colo sweep.