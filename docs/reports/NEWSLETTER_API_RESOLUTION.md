# Newsletter API Resolution

## Problem Summary
The newsletter subscription API was returning HTML instead of JSON responses.

## Root Causes Identified

### 1. ✅ Pages Functions ARE Working
**Discovery**: Testing with curl revealed that Pages Functions ARE enabled and executing correctly.

**Evidence**:
- OPTIONS request to `/newsletter-subscribe` returns correct CORS headers
- POST request to `https://www.clodo.dev/newsletter-subscribe` returns:
  - Status: `201 Created`
  - Content-Type: `application/json`
  - Response: `{"error":"Internal server error"}`

The "Internal server error" is expected because environment variables aren't configured yet.

### 2. URL Redirect Issue
**Problem**: The site has a 301 redirect from `clodo.dev` → `www.clodo.dev`

**Impact**: When POST requests are redirected, they can:
- Lose their request body
- Get converted to GET requests
- Return HTML instead of JSON

**Evidence**:
```bash
curl -X POST https://clodo.dev/newsletter-subscribe
# Returns: 301 Moved Permanently
# Location: https://www.clodo.dev/newsletter-subscribe
```

### 3. Incorrect API Path in Frontend
**Problem**: `script.js` was using `/functions/newsletter-subscribe` instead of `/newsletter-subscribe`

**Pages Functions Routing**:
- File: `functions/newsletter-subscribe.js`
- Route: `/newsletter-subscribe` (NOT `/functions/newsletter-subscribe`)
- The `/functions/` prefix is only used for the directory structure, not the URL path

**Fix Applied**: Changed fetch URL from `/functions/newsletter-subscribe` to `/newsletter-subscribe`

## Required Actions

### 1. Set Environment Variables in Cloudflare Dashboard
Navigate to: Cloudflare Pages → clodo-dev-site → Settings → Environment Variables

Add the following variables for **Production**:
- `BREVO_API_KEY`: Your Brevo API key
- `BREVO_LIST_ID`: Your Brevo list ID (e.g., `2`)

### 2. Deploy Updated Frontend
The `script.js` file has been updated with the correct API path. Deploy to push this change.

### 3. Optional: Fix WWW Redirect for APIs
Consider one of these approaches:

**Option A**: Update frontend to always use `www.clodo.dev`:
```javascript
const response = await fetch('https://www.clodo.dev/newsletter-subscribe', {
```

**Option B**: Exclude API paths from redirect (in Cloudflare Page Rules or Bulk Redirects):
```
If URL path starts with /newsletter-subscribe
Then: Do not redirect
```

**Option C**: Make redirect preserve POST method (in _redirects file or Page Rules):
```
/newsletter-subscribe  https://www.clodo.dev/newsletter-subscribe  308
```

## Testing Results

### OPTIONS Request (CORS Preflight)
```bash
curl -X OPTIONS https://www.clodo.dev/newsletter-subscribe
# Status: 200 OK
# Headers:
#   Access-Control-Allow-Origin: *
#   Access-Control-Allow-Methods: POST, OPTIONS
#   Access-Control-Allow-Headers: Content-Type
```

### POST Request
```bash
curl -X POST https://www.clodo.dev/newsletter-subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","honeypot":""}'
# Status: 201 Created
# Content-Type: application/json
# Response: {"error":"Internal server error"}
```

The error is expected without environment variables configured.

## Verification Checklist

Once environment variables are set:

1. ✅ Pages Functions enabled (confirmed working)
2. ✅ Function file structure correct
3. ✅ Frontend API path corrected
4. ⏳ Environment variables configured (pending)
5. ⏳ Test POST to `www.clodo.dev/newsletter-subscribe` (pending)
6. ⏳ Test form submission from website (pending)

## Next Steps

1. Add `BREVO_API_KEY` and `BREVO_LIST_ID` to Cloudflare Pages environment variables
2. Deploy the updated `script.js`
3. Test newsletter subscription from the live site at `https://www.clodo.dev`
4. Monitor for successful Brevo API responses

## Key Learnings

1. **Pages Functions Routing**: Functions in `functions/name.js` are routed to `/name`, not `/functions/name`
2. **Redirects Break APIs**: 301/302 redirects can break POST requests by stripping body data
3. **Always Test with www and non-www**: Domain redirects can cause subtle API failures
4. **OPTIONS Works, POST Fails**: This pattern indicates routing or redirect issues, not disabled functions
