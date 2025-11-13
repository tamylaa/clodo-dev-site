# Analytics Setup & Validation

This document covers the analytics setup for the Clodo Framework website, which uses Cloudflare Web Analytics instead of Google Analytics.

## Current Setup

- **Analytics Provider**: Cloudflare Web Analytics (beacon)
- **Implementation**: Lightweight JavaScript beacon in `public/analytics.html`
- **Privacy**: IP anonymization enabled by default, no ad tracking
- **Data Collection**: Page views, user agents, referrers (anonymized)

## Setup Instructions

### 1. Get Cloudflare Beacon Token

1. Log into your Cloudflare dashboard
2. Navigate to **Analytics & Logs** → **Web Analytics**
3. Click **Add Site** or select existing site
4. Copy the **Beacon Token** (looks like: `abc123def456`)

### 2. Configure the Beacon

Edit `public/analytics.html` and replace `YOUR_CLOUDFLARE_BEACON_TOKEN` with your actual token:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"YOUR_ACTUAL_TOKEN","spa":true}' nonce="N0Nc3Cl0d0"></script>
```

### 3. Validate Setup

Run the validation script to check your Cloudflare analytics provisions. The script can auto-discover your zone and account information:

```bash
# Auto-discovery mode (recommended)
node scripts/validate-cloudflare-analytics.js YOUR_API_TOKEN

# Or specify domain if multiple zones
node scripts/validate-cloudflare-analytics.js YOUR_API_TOKEN clodo.dev
```

**Prerequisites for validation:**
- Cloudflare API token with `Zone Analytics:Read`, `Zone:Read`, and `Account:Read` permissions
- Wrangler CLI authenticated (optional, for enhanced detection)

**What the script checks:**
- ✅ **Account & Zone Discovery**: Auto-finds your account ID and zone using API
- ✅ **Web Analytics Status**: Configuration, rulesets, and installation status
- 📊 **Logpush Jobs**: Data export destinations and last successful pushes
- 📈 **Zone Settings**: Security, privacy, and HTTPS configurations
- 🚀 **Pages Deployment**: Latest deployment status and URLs

## Data Collection Details

### Web Analytics (Default)
- **What it collects**: Page views, unique visitors, referrers, user agents
- **Privacy**: IPs are anonymized, no personal data stored
- **Retention**: 30 days (configurable)
- **Cost**: Free up to 10M page views/month

### Logpush (Enterprise)
For advanced analytics, configure Logpush to send data to:
- **BigQuery**: Structured query analytics
- **S3/R2**: Raw log storage
- **Datadog/Splunk**: Third-party analytics platforms

**Logpush Fields** (configurable):
- Request/response headers
- Performance metrics (TTFB, response time)
- Security events (WAF blocks, rate limiting)
- Bot management data

## Verification Steps

1. **Deploy to staging** and visit a few pages
2. **Check Cloudflare dashboard** → Analytics → Web Analytics for real-time data
3. **Run validation script** to confirm API configuration
4. **Test in multiple browsers** (Chrome, Firefox, Safari)
5. **Verify privacy compliance** (GDPR, CCPA)

## Rollback Plan

If you need to revert to Google Analytics:

1. Replace `public/analytics.html` content with GA snippet
2. Update `docs/ANALYTICS.md` to reflect the change
3. Re-deploy and verify GA dashboard receives data

## Enterprise Analytics

For advanced use cases:

1. **Enable Logpush** to BigQuery:
   - Cost: ~$0.01/GB processed
   - Schema: Standard Cloudflare logs + custom fields

2. **Configure data retention**:
   - Analytics: 30-90 days
   - Logs: 7-365 days (based on compliance needs)

3. **Set up alerts**:
   - Traffic anomalies
   - Performance degradation
   - Security events

### Troubleshooting

#### Permission Errors
If you see "Unauthorized" or "Authentication error":
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create a new token or edit existing one
3. Add these permissions:
   - Account: Read
   - Zone: Read
   - Zone Analytics: Read
   - Zone Logs: Read
   - Zone Settings: Read

#### Web Analytics Not Available
- Web Analytics API may not be fully available yet
- Check status in Cloudflare Dashboard → Analytics & Logs → Web Analytics
- Data may take 5-10 minutes to appear after enabling

#### Wrangler Authentication
- Run `npx wrangler auth login` to authenticate Wrangler CLI
- This enables enhanced account/zone discovery

---

**Last Updated**: November 13, 2025
**Analytics Provider**: Cloudflare Web Analytics