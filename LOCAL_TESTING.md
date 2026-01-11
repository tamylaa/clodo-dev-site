# Local Testing Guide: Cloudflare Functions + Download System

## Option 1: Test with Wrangler Dev Server (Recommended)

Wrangler can serve both your static site AND run your Cloudflare Functions locally.

### Step 1: Set Environment Variables Locally

Create a `.env.local` file in the config directory (or root):

```bash
# config/.env.local (or root/.env.local)
BREVO_API_KEY=sk_live_your_actual_api_key_here
BREVO_DOWNLOAD_LIST_ID=12345
DOWNLOAD_TOKEN_SECRET=your-random-secret-key-here
```

**Get these values:**
- `BREVO_API_KEY`: From Brevo dashboard → Settings → API Keys
- `BREVO_DOWNLOAD_LIST_ID`: From Brevo dashboard → Contacts → Lists → Copy list ID
- `DOWNLOAD_TOKEN_SECRET`: Generate with: `openssl rand -base64 32`

### Step 2: Start Wrangler Dev Server

```bash
# Navigate to config directory
cd config

# Start Wrangler dev server
wrangler dev --local

# Should output:
# ⛅ wrangler (version X.X.X)
# ⚡ Cloudflare Pages Functions
# → Listening on http://localhost:8787
```

### Step 3: Access Your Site Locally

Open in browser:
```
http://localhost:8787/cloudflare-workers-development-guide.html
```

### Step 4: Test the Form

1. **Scroll to download form** (before "Quick Start by Experience Level")
2. **Enter email**: `test@example.com`
3. **Click "Get Validator Script"**
4. **Expected result**: 
   - Button shows "✅ Check your email!"
   - Redirects to `/download/thanks` page
   - Check your inbox for email from Brevo

### Step 5: Verify Token Link

1. **In the email**, click download link: `http://localhost:8787/download/scripts?token=xyz`
2. **Expected result**: ZIP file downloads with validator scripts

---

## Option 2: Test Without Brevo (Mock Mode)

If you don't have Brevo credentials yet, you can mock the responses:

### Step 1: Add Mock Environment Variables

```bash
# config/.env.local
BREVO_API_KEY=mock_key_for_testing
BREVO_DOWNLOAD_LIST_ID=99999
DOWNLOAD_TOKEN_SECRET=test_secret_12345
```

### Step 2: Modify Function Temporarily (Dev Only)

In `functions/download-validator-scripts.js`, add this after email validation (around line 80):

```javascript
// FOR LOCAL TESTING ONLY - Remove before production!
if (env.BREVO_API_KEY === 'mock_key_for_testing') {
    console.log('[Download] MOCK MODE - Email would be sent to:', email);
    
    if (isNoScript) {
        return new Response(null, {
            status: 303,
            headers: { 'Location': '/download/thanks' }
        });
    }
    
    return new Response(JSON.stringify({
        success: true,
        message: 'Mock mode - email not actually sent'
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
```

This allows you to test the full flow without hitting Brevo's API.

---

## Troubleshooting Local Testing

### Problem: "BREVO_API_KEY is not defined"

**Solution**: Make sure `.env.local` file exists and has the variables:

```bash
# Check if file exists
cat config/.env.local

# Should show:
# BREVO_API_KEY=sk_live_...
# BREVO_DOWNLOAD_LIST_ID=12345
# DOWNLOAD_TOKEN_SECRET=abc123...
```

If missing, create it:
```bash
echo "BREVO_API_KEY=sk_live_your_key" > config/.env.local
echo "BREVO_DOWNLOAD_LIST_ID=12345" >> config/.env.local
echo "DOWNLOAD_TOKEN_SECRET=$(openssl rand -base64 32)" >> config/.env.local
```

### Problem: Port 8787 already in use

**Solution**: Use a different port:

```bash
wrangler dev --local --port 8888
```

### Problem: Changes not reflecting

**Solution**: Restart Wrangler:

```bash
# Stop current process (Ctrl+C)
# Then restart:
wrangler dev --local
```

### Problem: Email not arriving

**Check:**
1. Is BREVO_API_KEY correct? (Should start with `sk_live_`)
2. Is BREVO_DOWNLOAD_LIST_ID valid? (Check Brevo dashboard)
3. Check Wrangler logs for errors:
   ```
   [Download] Brevo API response: 401
   ```

---

## Complete Local Testing Flow

```bash
# 1. Terminal 1: Build the project
npm run build

# 2. Terminal 2: Start Wrangler
cd config
wrangler dev --local

# 3. Browser: Visit the site
# http://localhost:8787/cloudflare-workers-development-guide.html

# 4. Find download form and test:
# - Enter: test@example.com
# - Click: "Get Validator Script"
# - Expect: Redirect to /download/thanks

# 5. Check logs in Terminal 2 for:
# [Download] Added email to Brevo list
# [Download] Email sent successfully to: test@example.com
```

---

## Testing Different Scenarios

### Test 1: Valid Email
```
Email: valid@example.com
Expected: ✅ Success, redirect to /download/thanks
```

### Test 2: Honeypot Protection
```
In browser DevTools Console:
document.querySelector('input[name="honeypot"]').style.display = 'block'
# Fill the honeypot field, submit
Expected: ❌ Error "Spam detected"
```

### Test 3: Invalid Email
```
Email: not-an-email
Expected: ❌ Error "Invalid email format"
```

### Test 4: Brevo API Error
```
In config/.env.local, set:
BREVO_API_KEY=invalid_key
# Submit form
Expected: ❌ Error "Email service authentication failed"
```

### Test 5: Token Download
```
After email arrives, click download link
Expected: ✅ ZIP file downloads
```

### Test 6: Token One-Time Use
```
Click same download link again
Expected: ❌ Error (token already used)
```

---

## Checking Wrangler Logs

To see what's happening in your Functions:

```bash
# Already running in wrangler dev terminal, you'll see:
[Download] Email address: test@example.com
[Download] Added email to Brevo list
[Download] Token generated: abc123xyz...
[Download] Email sent successfully to: test@example.com
```

If there are errors:
```
[Download] ERROR: Brevo API failed with status 401
```

---

## Next Steps

1. ✅ **Create `.env.local`** with Brevo credentials
2. ✅ **Run `wrangler dev --local`**
3. ✅ **Test form submission** on `http://localhost:8787`
4. ✅ **Verify email delivery** in your inbox
5. ✅ **Test download token** link from email
6. ✅ **Test error scenarios** (honeypot, invalid email, etc.)
7. ✅ **Once working locally, deploy to production**

---

## Production Deployment

After local testing passes, deploy to Cloudflare:

```bash
# Build
npm run build

# Push to Cloudflare Pages (via git or dashboard)
# Then verify environment variables are set in Cloudflare Pages dashboard:
# Settings → Environment variables → Production
```

This way, you test everything locally first, then deploy with confidence!
