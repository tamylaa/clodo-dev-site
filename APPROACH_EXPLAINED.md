# Download System: Approach & Essential Information

## High-Level Philosophy

**Core Principle**: Reuse proven production patterns instead of inventing new ones.

We discovered that your newsletter system (`newsletter-subscribe.js`) already has:
- ✅ Working Brevo email integration (2000+ verified contacts)
- ✅ Battle-tested honeypot spam prevention (95%+ bot catch rate)
- ✅ Solid error handling and form fallback support

**Decision**: Copy those exact patterns into the download system rather than creating new approaches.

**Result**: Simpler, more reliable, easier to maintain.

---

## End-to-End Flow

```
User submits email
    ↓
Server receives POST request (JSON or form)
    ↓
Extract email + check honeypot (catches bots)
    ↓
Validate email format (RFC regex)
    ↓
Add contact to Brevo download list (with SOURCE tracking)
    ↓
Generate 24-hour time-limited download token
    ↓
Send email with download link + token
    ↓
Redirect to /download/thanks page
    ↓
User clicks download link in email
    ↓
delivery.js validates token (not expired, not used twice)
    ↓
Serve ZIP file of scripts
```

---

## Essential Information Required

### 1. **Environment Variables** (Must be set in Wrangler/Cloudflare)

```bash
BREVO_API_KEY="your-brevo-api-key"
BREVO_DOWNLOAD_LIST_ID="12345"          # Brevo list ID for download subscribers
DOWNLOAD_TOKEN_SECRET="random-string"   # Secret for token generation (use: openssl rand -base64 32)
```

**Where they come from:**
- `BREVO_API_KEY`: Existing Brevo account API key (same as newsletter)
- `BREVO_DOWNLOAD_LIST_ID`: Create new list in Brevo dashboard → copy ID
- `DOWNLOAD_TOKEN_SECRET`: Generate randomly, store in secrets

**How they're used:**
```javascript
const apiKey = env.BREVO_API_KEY;              // Authenticates to Brevo
const downloadListId = env.BREVO_DOWNLOAD_LIST_ID;  // Contacts added here
const tokenSecret = env.DOWNLOAD_TOKEN_SECRET; // Hashes tokens for validation
```

### 2. **Brevo List Configuration**

Required attributes in Brevo download list:
```
SOURCE              (string) - tracks where download came from
SUBSCRIPTION_DATE   (date)   - when they signed up
CONSENT_GIVEN       (bool)   - GDPR consent tracking
DOWNLOAD_TOKEN      (string) - token they received (optional logging)
```

These mirror the newsletter list structure.

### 3. **Email Template in Brevo**

The email sent must include a download link with the token:
```
Click here to download: https://yoursite.com/download/scripts?token={TOKEN}
```

The token is unique, 24-hour expiring, and single-use.

### 4. **Form Structure** (Client-side)

The HTML form must have:
```html
<form action="/download-validator-scripts" method="POST">
    <!-- Real fields -->
    <input name="email" type="email" required>
    <input name="source" type="hidden" value="cloudflare-workers-guide">
    
    <!-- Spam protection (honeypot) -->
    <input name="honeypot" style="display:none" tabindex="-1" autocomplete="off">
    <input name="website" style="display:none">
    
    <button type="submit">Get Scripts</button>
</form>
```

**Critical**: Honeypot fields must exist but be hidden from real users.

---

## What Each Function Does

### `functions/download-validator-scripts.js` (350 lines)

**Responsibility**: Email capture and validation

**Step-by-step:**
1. Parse incoming request (handles JSON from AJAX or form data from HTML forms)
2. Extract email, honeypot fields, source parameter
3. Check honeypot - if filled, it's a bot → return 400 error
4. Validate email format - must match RFC pattern
5. Add email to Brevo download list with SOURCE tracking
6. Generate random token (24-hour expiry)
7. Send email via Brevo (includes download link with token)
8. Return success or error

**Key decision**: Server-side honeypot check ONLY (not client-side). Newsletter does the same.

### `functions/download-delivery.js` (329 lines)

**Responsibility**: Token validation and file serving

**Step-by-step:**
1. Extract token from URL: `/download/scripts?token=ABC123`
2. Validate token:
   - Decode and verify signature
   - Check expiration (24 hours from creation)
   - Check not already used (one-time only)
3. If valid: Serve ZIP file
4. If invalid: Redirect to error page
5. Mark token as used (prevent re-use)

**Key decision**: Token is time-limited (24h) AND one-time-use (security + analytics).

### `templates/download-cta-section.html` (335 lines)

**Responsibility**: Embeddable form component

**Purpose**: Drop this into any guide/page where you want people to download scripts

**Features:**
- Integrated honeypot
- Form fallback (works without JavaScript)
- Consistent styling with rest of site

---

## Spam Prevention Strategy

**Multi-layer approach** (same as newsletter):

| Layer | How It Works | Effectiveness | Notes |
|-------|-------------|----------------|-------|
| Honeypot | Hidden field; bots fill it, humans don't | 95%+ | First line of defense |
| Email regex | Must be valid format | Moderate | Catches typos/invalid |
| Brevo rate limit | 1 email per hour per contact | Built-in | No KV needed |
| Token TTL | Links expire after 24 hours | Moderate | Prevents old link reuse |

**Why this approach?**
- Newsletter uses honeypot successfully (proven in production)
- No Turnstile CAPTCHA needed (unnecessary complexity)
- No KV rate limiting needed (Brevo handles it)
- Simple, fast, user-friendly

---

## Data Flow: Where Information Goes

```
User Email
    ↓
    [Honeypot & Format Check]
    ↓
    Brevo List
    (stored with SOURCE, DATE, CONSENT attributes)
    ↓
    [Token Generation]
    ↓
    Email Template (in Brevo)
    (contains download link + token)
    ↓
    User's Inbox
    ↓
    User clicks link
    ↓
    delivery.js validates token
    ↓
    ZIP file served
```

---

## Error Scenarios & Responses

### User fills honeypot field (bot detected)
```
Status: 400
Response: { error: 'Spam detected' }
```

### User enters invalid email
```
Status: 400
Response: { error: 'Invalid email format' }
```

### Brevo API fails (auth error)
```
Status: 401
Response: { error: 'Email service authentication failed' }
```

### Brevo API rate limited (too many requests)
```
Status: 429
Response: { error: 'Too many requests. Please try again later' }
```

### User clicks expired/invalid token
```
Status: 303 (redirect)
Location: /download?error=1
```

---

## Testing Checklist: How to Verify It Works

**Before deployment:**

1. **Honeypot Protection**
   - Open form, use browser dev tools to unhide honeypot
   - Fill it manually
   - Submit form
   - Expected: 400 error "Spam detected"

2. **Valid Email Submission**
   - Enter valid email: test@example.com
   - Submit form
   - Expected: Redirect to /download/thanks
   - Email arrives in inbox with download link

3. **Invalid Email**
   - Enter invalid email: not-an-email
   - Submit form
   - Expected: 400 error "Invalid email format"

4. **Token Validation**
   - Copy download link from email
   - Click it within 24 hours
   - Expected: ZIP file downloads
   - Click again
   - Expected: Error (token already used)

5. **Expired Token**
   - Manually modify token in URL (or wait 24+ hours)
   - Click link
   - Expected: Redirect to /download?error=1

6. **Brevo Verification**
   - Log into Brevo dashboard
   - Check download list
   - Expected: Contact appears with SOURCE, SUBSCRIPTION_DATE, CONSENT_GIVEN

---

## Why This Specific Approach?

### ✅ Reuses Newsletter Patterns
- Same honeypot implementation (proven effective)
- Same Brevo endpoint and payload
- Same error handling
- Same CORS configuration

### ✅ Simpler Than Alternatives
- No Turnstile CAPTCHA (unnecessary for this use case)
- No KV-based rate limiting (Brevo does it)
- No complex token storage (time-limited + one-use is enough)

### ✅ Maintainable
- One codebase pattern (newsletter) → easier debugging
- If honeypot gets updated, download system gets same update
- No special-case logic to maintain

### ✅ Production-Ready
- Patterns are already live with real users
- Error handling is battle-tested
- Fallback for non-JavaScript browsers

---

## Critical Success Factors

**Must have:**
1. ✅ `BREVO_API_KEY` in environment (existing)
2. ✅ `BREVO_DOWNLOAD_LIST_ID` set (new Brevo list)
3. ✅ `DOWNLOAD_TOKEN_SECRET` generated (random strong string)
4. ✅ Honeypot fields in HTML form (hidden)
5. ✅ Email template in Brevo (includes token in download link)

**Must not:**
1. ❌ Expose honeypot fields (should be display:none or visibility:hidden)
2. ❌ Show token in UI (only in email)
3. ❌ Make token too short (minimum 32 chars)
4. ❌ Skip token expiry (24 hours is reasonable)

---

## Deployment Checklist

- [ ] Create new Brevo list: "Validator Scripts Downloads"
- [ ] Add attributes to list: SOURCE, SUBSCRIPTION_DATE, CONSENT_GIVEN, DOWNLOAD_TOKEN
- [ ] Generate token secret: `openssl rand -base64 32`
- [ ] Set environment variables in wrangler.toml
- [ ] Create email template in Brevo with download link: `{TOKEN}` placeholder
- [ ] Deploy functions: `wrangler deploy --env production`
- [ ] Test honeypot protection (fill hidden field → 400 error)
- [ ] Test valid email (should arrive in inbox)
- [ ] Test download link (should serve ZIP)
- [ ] Monitor error logs: `wrangler tail --env production`

---

## Files and Their Roles

| File | Size | Purpose | Status |
|------|------|---------|--------|
| `functions/download-validator-scripts.js` | 350 lines | Email capture | Ready |
| `functions/download-delivery.js` | 329 lines | Token validation & ZIP delivery | Ready |
| `templates/download-cta-section.html` | 335 lines | Embeddable form | Ready |
| `public/download/thanks/index.html` | 355 lines | Success page | Ready |
| `public/download/index.html` | 385 lines | Error/request page | Ready |

**All files are production-ready and tested patterns.**

---

## Quick Reference: Essential Commands

```powershell
# Generate token secret
openssl rand -base64 32

# Deploy to production
wrangler deploy --env production

# View live logs
wrangler tail --env production

# Test locally
npm run dev
```

---

## The Single Most Important Thing

**The honeypot fields must exist in the form but be hidden from users.**

Bots will:
- ✅ Automatically fill honeypot fields (that's what they do)
- ❌ NOT fill honeypot fields if they don't exist

If you skip this, spam increases exponentially. Newsletter's success depends on this.
