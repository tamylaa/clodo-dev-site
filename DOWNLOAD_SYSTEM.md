# Download System Implementation Guide

## Overview

Complete email-based download system for validator scripts using Cloudflare Workers, Brevo email service, and Turnstile CAPTCHA spam prevention. This system enables secure, time-limited script distribution while collecting qualified leads.

## Architecture

### Component Flow

```
User Request
    ↓
Email Capture Form (honeypot + Turnstile)
    ↓
/download-validator-scripts Function
    ├─ Honeypot detection
    ├─ Turnstile verification
    ├─ Email validation
    ├─ Rate limiting
    └─ Token generation (24-hour expiry)
    ↓
Brevo Email Service (API call)
    └─ Send download link + token
    ↓
User clicks email link
    ↓
/download/scripts Route (token validation)
    ├─ Decode token
    ├─ Verify hash
    ├─ Check expiry
    └─ Serve ZIP file
```

## Implementation Details

### 1. Email Capture Form Component

**File:** `templates/download-cta-section.html`

**Features:**
- Embedded in guide before FAQ section
- Honeypot fields (visible + hidden for bot detection)
- Cloudflare Turnstile CAPTCHA (invisible to users)
- Consent checkbox for GDPR compliance
- Real-time form validation
- AJAX submission (no page reload)

**Form Fields:**
```html
<input type="email" name="email" required>
<input type="text" name="honeypot" style="display: none;"> <!-- Spam trap -->
<input type="text" name="website" style="display: none;"> <!-- Spam trap -->
<input type="hidden" name="source" value="cloudflare-workers-guide">
<input type="checkbox" name="consent" required>
```

### 2. Email Handler Function

**File:** `functions/download-validator-scripts.js` (454 lines)

**Key Functions:**

#### `onRequestPost()`
Main handler that orchestrates the download request workflow.

**Spam Prevention Layers:**
1. **Honeypot Detection** - If visible honeypot field has value, reject immediately
2. **Email Validation** - RFC-compliant regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. **Turnstile CAPTCHA** - Cloudflare's invisible bot detection (better than reCAPTCHA)
4. **Rate Limiting** - Max 1 request per email per hour (via KV)

#### `generateDownloadToken(email, env)`
Creates secure 24-hour time-limited token using:
```
Token Format: base64(email:timestamp:expiry:hash)
├─ email: User's email address
├─ timestamp: Creation time (Date.now())
├─ expiry: Expiry time (timestamp + 24 hours)
└─ hash: HMAC-like signature to prevent tampering
```

#### `verifyTurnstile(token, env)`
Validates CAPTCHA token against Cloudflare servers.

#### `sendDownloadEmail(email, token, downloadUrl, listId, apiKey, source, env)`
Sends HTML email via Brevo API with:
- Download link (includes token)
- 24-hour expiry notice
- Instructions
- Unsubscribe link

### 3. Download Delivery Handler

**File:** `functions/download-delivery.js` (329 lines)

**Key Functions:**

#### `onRequestGet()`
Validates token and serves ZIP file.

**Validation Steps:**
1. Extract token from query parameter
2. Decode base64 token
3. Verify token signature (prevents tampering)
4. Check expiry time (must be within 24 hours)
5. Verify one-time use (mark as used after first download)
6. Log delivery for analytics
7. Serve ZIP with validator scripts

#### `validateDownloadToken(token, env)`
Decodes and validates token cryptographically.

```javascript
// Token structure after decoding
{
    email: "user@example.com",
    timestamp: 1704067200000,
    expiry: 1704153600000, // +24 hours
    hash: "a1b2c3d4" // Signature
}
```

### 4. Download Pages

#### Thank You Page
**File:** `public/download/thanks/index.html`

Shown after successful email capture.

**Includes:**
- Success message
- Step-by-step guide (4 steps)
- Feature overview
- Bonus content links
- Unsubscribe option

#### Error/Request Page
**File:** `public/download/index.html`

Used for:
- Link expired
- Link already used
- User wants new link

**Features:**
- Request new download link form
- Same spam prevention as main form
- Explanations of why links expire

## Environment Variables Required

```env
# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key
BREVO_DOWNLOAD_LIST_ID=12345

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_turnstile_secret

# Token Security
DOWNLOAD_TOKEN_SECRET=your-secret-key-change-me

# Optional: R2 Bucket for ZIP caching
DOWNLOADS_R2=your-r2-bucket

# KV Namespace for tokens + rate limiting + analytics
DOWNLOADS_KV=your-kv-namespace
```

## Email Template

**Subject:** `✅ Download Validator Scripts - Cloudflare Workers Guide`

**Content Structure:**
1. Header with success badge
2. Main CTA button (download link with token)
3. Features list (what's included)
4. Quick start guide
5. FAQ about validators
6. Pro tips
7. Footer with unsubscribe + privacy

**Key Elements:**
- Download link: `https://example.com/download/scripts?token=XXX`
- Expiry notice: "Valid for 24 hours"
- Brand colors: Purple gradient (#667eea → #764ba2)

## Security Measures

### Token Security

**One-Time Use:**
```javascript
// After download, mark token as used
await kv.put(`download-used:${token}`, true, { expirationTtl: 86400 })
```

**Time-Limited (24 hours):**
```javascript
const expiryTime = timestamp + (24 * 60 * 60 * 1000)
if (Date.now() > expiryTime) return null
```

**HMAC-Protected:**
```javascript
const hash = simpleHash(`${email}:${timestamp}:${expiry}:${secret}`)
// Prevent token tampering/forgery
```

### Spam Prevention

**Layer 1 - Honeypot:**
- Hidden form fields that humans ignore but bots fill
- If populated, immediate rejection
- Name: `honeypot`, `website`
- CSS: `display: none;`, `tabindex: -1;`

**Layer 2 - Turnstile CAPTCHA:**
- Cloudflare's invisible bot detection
- No user interaction needed
- Site key: `0x4AAAAAAABqbhp3gSEsL_Kq`
- Theme: `light`

**Layer 3 - Email Validation:**
- RFC-compliant regex pattern
- Prevents invalid email addresses
- Reduces bounce rate

**Layer 4 - Rate Limiting:**
- 1 request per email per hour (via Brevo)
- Prevents spam signup attempts
- Tracked in KV: `download-rate:${email}`

### CORS & Content Security

```javascript
// CORS Headers
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type'

// Security Headers
'Cache-Control': 'no-cache, no-store, must-revalidate'
'X-Content-Type-Options': 'nosniff'
```

## Brevo Integration

### API Endpoint
```
POST https://api.brevo.com/v3/contacts (add contact)
POST https://api.brevo.com/v3/smtp/email (send transactional email)
```

### Contact Attributes
```javascript
{
    email: "user@example.com",
    listIds: [12345], // BREVO_DOWNLOAD_LIST_ID
    attributes: {
        SOURCE: "download-cloudflare-workers-guide",
        DOWNLOAD_DATE: "2025-01-09T...",
        DOWNLOAD_TOKEN: "base64token...",
        CONSENT_GIVEN: true
    }
}
```

### Error Handling
- 401: Invalid API key
- 429: Rate limit exceeded
- 400: Contact already exists (acceptable)
- 500+: Server error (retry with backoff)

## Analytics Logging

### What Gets Logged

**Download Request:**
```
[Download] Sent to: user@example.com | Source: cloudflare-workers-guide
```

**Download Delivery:**
```
[Download] Delivered to: user@example.com | Timestamp: 2025-01-09T...
```

### Storage Format (KV)

```javascript
// Request logs (90-day retention)
download-log:2025-01-09T12:34:56Z:user@example.com
{
    email: "user@example.com",
    source: "cloudflare-workers-guide",
    timestamp: "2025-01-09T12:34:56Z"
}

// Delivery logs (90-day retention)
download-delivered:2025-01-09T12:35:10Z:user@example.com
{
    email: "user@example.com",
    timestamp: "2025-01-09T12:35:10Z",
    token: "base64token..." (truncated for privacy)
}
```

### Accessing Analytics

Query KV namespace:
```bash
# All requests from January
wrangler kv:key list --namespace-id=<id> --prefix=download-log:2025-01-

# All deliveries to a specific email
wrangler kv:key list --namespace-id=<id> --prefix=download-delivered: | grep user@email
```

## Deployment Checklist

- [ ] Set environment variables in `wrangler.toml`
- [ ] Deploy functions: `wrangler deploy`
- [ ] Configure Turnstile site key (get from Cloudflare dashboard)
- [ ] Add Brevo API key (get from Brevo account settings)
- [ ] Create KV namespace: `wrangler kv:namespace create downloads`
- [ ] Test form submission locally: `npm run dev`
- [ ] Verify email arrives in inbox
- [ ] Click download link and verify ZIP delivery
- [ ] Check token expiry (wait 25 hours, link should fail)
- [ ] Test spam prevention (fill honeypot field)
- [ ] Monitor error logs for any issues

## Configuration in wrangler.toml

```toml
[[env.production.services]]
binding = "DOWNLOADS_KV"
service = "downloads"

[env.production]
vars = { BREVO_DOWNLOAD_LIST_ID = "12345" }

[env.production.env_overrides]

[[env.production.env_overrides.triggers.routes]]
pattern = "example.com/download*"
zone_name = "example.com"

[[env.production.env_overrides.triggers.routes]]
pattern = "example.com/download-validator-scripts"
zone_name = "example.com"
```

## Troubleshooting

### Issue: Email not arriving

**Causes:**
- Brevo API key invalid
- List ID incorrect
- Email marked as spam
- Rate limit exceeded

**Fix:**
1. Verify `BREVO_API_KEY` and `BREVO_DOWNLOAD_LIST_ID`
2. Check Brevo dashboard for bounce/complaint
3. Ask user to check spam folder
4. Wait 1 hour and try again

### Issue: Download link expired

**Expected behavior** - Links are intentionally 24-hour limited.

**Fix:**
1. User visits `/download/` page
2. Enters email again
3. Receives new link

### Issue: Token validation fails

**Causes:**
- Token corrupted/modified
- Secret key changed
- Server time out of sync

**Debug:**
```javascript
// Enable debug logging
console.log(`Token parts: ${parts}`)
console.log(`Provided hash: ${providedHash}`)
console.log(`Expected hash: ${expectedHash}`)
```

### Issue: Honeypot not preventing bots

**Possible reasons:**
- Bot not filling hidden fields
- CSS `display: none` being ignored

**Fix:**
1. Test with manual honeypot population
2. Check browser console for CSS conflicts
3. Combine with Turnstile (defense-in-depth)

## Future Enhancements

1. **ZIP on-demand generation** - Generate ZIP dynamically instead of pre-built
2. **Analytics dashboard** - Real-time view of download metrics
3. **A/B testing** - Test different CTA placements/copy
4. **Segmentation** - Track which sections users validate most
5. **Follow-up emails** - Send tips after download (24hr delay)
6. **Referral tracking** - Track who shared links with others
7. **Webhook integration** - Send download events to marketing platform
8. **Custom scripts** - Allow users to generate custom validation configs

## References

- [Cloudflare Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Brevo API Docs](https://developers.brevo.com/)
- [Cloudflare Workers Functions](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [KV Storage](https://developers.cloudflare.com/workers/runtime-apis/kv/)

## Version History

- **v1.0** (Jan 2025) - Initial implementation
  - Email capture with spam prevention
  - 24-hour time-limited tokens
  - Brevo integration
  - One-time download links
  - Analytics logging
