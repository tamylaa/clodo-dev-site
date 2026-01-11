# Download System - Quick Deployment Checklist

## Pre-Deployment (5 minutes)

- [ ] Read `DOWNLOAD_SYSTEM.md` architecture section
- [ ] Review environment variables needed
- [ ] Have Brevo, Cloudflare, and Turnstile credentials ready

## Step 1: Prepare Credentials (10 minutes)

### Brevo Setup
- [ ] Login to [Brevo.com](https://www.brevo.com)
- [ ] Go to Settings → SMTP & API
- [ ] Copy API Key → save as `BREVO_API_KEY`
- [ ] Go to Contacts → Manage Lists
- [ ] Create list named "Download Validators" (or use existing)
- [ ] Copy List ID → save as `BREVO_DOWNLOAD_LIST_ID`

### Cloudflare Turnstile Setup
- [ ] Login to [Cloudflare Dashboard](https://dash.cloudflare.com)
- [ ] Go to Workers & Pages → Turnstile
- [ ] Create new site:
  - Name: "Clodo Download Validators"
  - Domains: `clodo.dev`, `www.clodo.dev`
  - Mode: Managed Challenge
  - Bot Fight Mode: Definitely automated
- [ ] Copy Site Key → keep in template (already set)
- [ ] Copy Secret Key → save as `TURNSTILE_SECRET_KEY`

### Generate Token Secret
- [ ] Create random string (e.g., using `openssl rand -base64 32`)
- [ ] Save as `DOWNLOAD_TOKEN_SECRET`

## Step 2: Configure Workers (10 minutes)

### Update wrangler.toml

```toml
[env.production]
vars = {
    BREVO_API_KEY = "your_key_here",
    BREVO_DOWNLOAD_LIST_ID = "12345",
    TURNSTILE_SECRET_KEY = "your_secret_here",
    DOWNLOAD_TOKEN_SECRET = "your_random_secret_here"
}

[[env.production.kv_namespaces]]
binding = "DOWNLOADS_KV"
id = "your_kv_namespace_id"
```

- [ ] Replace placeholder values with your credentials
- [ ] Save file

### Create KV Namespace

```bash
wrangler kv:namespace create downloads --preview false
```

- [ ] Copy returned namespace ID
- [ ] Add to `wrangler.toml` as shown above
- [ ] Verify: `wrangler kv:namespace list`

## Step 3: Deploy Functions (5 minutes)

```bash
# Verify functions exist
ls functions/download-*.js

# Deploy to production
wrangler deploy --env production

# Or deploy locally first
wrangler dev
```

- [ ] Both functions deployed without errors
- [ ] No warnings about missing environment variables

## Step 4: Add CTA to Guide (2 minutes)

### Option A: Using Include (Recommended)
In `public/cloudflare-workers-development-guide.html`, find line ~497 (before FAQ section):

```html
<!-- Add this line before the FAQ section -->
<!--#include file="templates/download-cta-section.html" -->

<!-- FAQ Section -->
<section id="faq" class="faq-section">
```

- [ ] Include statement added
- [ ] File path is correct (`templates/download-cta-section.html`)

### Option B: Manual Copy
Copy all contents of `templates/download-cta-section.html` directly into the HTML.

- [ ] HTML copied
- [ ] Placed before FAQ section

## Step 5: Test Locally (15 minutes)

### Start Dev Server
```bash
wrangler dev
```

- [ ] Dev server running on `http://localhost:8787`

### Test Form Submission
- [ ] Navigate to guide in dev environment
- [ ] Scroll to "Download & Verify" section
- [ ] Enter valid email
- [ ] Click "Download Scripts"
- [ ] See "Check your email!" message
- [ ] Verify email arrives in inbox

### Test Spam Prevention
**Honeypot Test:**
```bash
# Try to fill honeypot field (not visible in browser)
# Use dev tools to set it
```
- [ ] Honeypot field rejection works

**Turnstile Test:**
- [ ] Turnstile appears when form loads
- [ ] Completion required to submit
- [ ] Fails if secret key wrong

**Rate Limit Test:**
- [ ] Submit form twice with same email
- [ ] Second request returns 429 error
- [ ] Error message: "requested this recently"

### Test Token Expiry
- [ ] Extract token from download link
- [ ] Manually modify token (change 1 character)
- [ ] Try to download → 400 error
- [ ] Token should fail when 25+ hours old (can't easily test, see instructions)

## Step 6: Deploy to Production (5 minutes)

```bash
# Final deployment
wrangler deploy --env production

# Monitor deployment
wrangler tail --env production
```

- [ ] Functions deployed to production
- [ ] No errors in deployment logs
- [ ] Workers listed in Cloudflare dashboard

## Step 7: Verify Production (10 minutes)

### Test With Real Email
On production site:
- [ ] Navigate to guide
- [ ] Scroll to "Download & Verify" section
- [ ] Enter real email address
- [ ] Complete form and CAPTCHA
- [ ] See success message
- [ ] Email arrives in inbox (1-5 minutes)
- [ ] Click download link
- [ ] ZIP file downloads successfully

### Check Analytics
```bash
wrangler kv:key list --env production --prefix=download-log:
wrangler kv:key list --env production --prefix=download-delivered:
```

- [ ] Request logs appear in KV
- [ ] Delivery logs appear in KV
- [ ] Timestamps are correct

## Step 8: Monitor & Optimize (Ongoing)

### Daily
- [ ] Check error logs: `wrangler tail --env production`
- [ ] Review failed requests
- [ ] Watch for Brevo API errors

### Weekly
- [ ] Analyze download metrics
- [ ] Count new sign-ups
- [ ] Review spam prevention effectiveness
- [ ] Check email delivery status in Brevo

### Monthly
- [ ] Export KV analytics
- [ ] Review A/B test results
- [ ] Update documentation if needed
- [ ] Test complete flow end-to-end

## Troubleshooting During Testing

| Problem | Check |
|---------|-------|
| "Error submitting form" | Check browser console for CORS errors |
| Email not arriving | Verify Brevo API key and list ID |
| 500 error on form submit | Check wrangler logs, missing env vars |
| Turnstile not showing | Check site key in template and browser security |
| Rate limit not working | Verify KV namespace is bound correctly |
| Token validation fails | Check DOWNLOAD_TOKEN_SECRET consistency |

## Rollback Plan

If issues occur:

```bash
# Revert functions
git revert <commit-hash>
wrangler deploy --env production

# Keep form/pages live but hide download CTA
# Remove include or comment out
# Or redirect download requests to error page
```

## Success Criteria

✅ Form appears on guide
✅ Email submits without errors
✅ Download link arrives in email
✅ Clicking link downloads ZIP file
✅ Expired link shows error page
✅ KV analytics logs requests
✅ Brevo list grows with new contacts
✅ No spam emails received

## Next Steps After Deployment

1. **Monitor for 24 hours** - Watch error logs
2. **Send test to team** - Get feedback on UX
3. **Publicize** - Add blog post about validator availability
4. **Collect feedback** - Ask users what they think of validators
5. **Iterate** - A/B test CTA variations, optimize conversion

## Support Contacts

- **Brevo Issues:** support@brevo.com
- **Cloudflare Issues:** support@cloudflare.com
- **Turnstile Issues:** Check [Docs](https://developers.cloudflare.com/turnstile/)
- **Workers Issues:** Check [Workers Docs](https://developers.cloudflare.com/workers/)

## Time Estimates

| Task | Time | Status |
|------|------|--------|
| Pre-deployment prep | 5 min | |
| Get credentials | 10 min | |
| Configure wrangler.toml | 5 min | |
| Deploy functions | 5 min | |
| Add CTA to guide | 2 min | |
| Local testing | 15 min | |
| Production deployment | 5 min | |
| Production verification | 10 min | |
| **TOTAL** | **~57 minutes** | |

## Quick Reference

### Environment Variables
```
BREVO_API_KEY = "API key from Brevo settings"
BREVO_DOWNLOAD_LIST_ID = "List ID from Brevo contacts"
TURNSTILE_SECRET_KEY = "Secret from Cloudflare Turnstile"
DOWNLOAD_TOKEN_SECRET = "Random strong secret string"
```

### Routes Created
```
POST /download-validator-scripts      → Email handler
GET  /download/scripts?token=XXX      → Download delivery
GET  /download/thanks                 → Success page
GET  /download                        → Error/request page
```

### Files Modified/Created
```
functions/download-validator-scripts.js
functions/download-delivery.js
public/download/index.html
public/download/thanks/index.html
templates/download-cta-section.html
wrangler.toml (env vars added)
```

---

**Ready to deploy? Start with Step 1!** 🚀
